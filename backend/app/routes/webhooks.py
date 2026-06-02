import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
from app.services.dm_service import dm_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

@router.get("/instagram")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    db: Session = Depends(get_db)
):
    """
    Webhook Verification for Facebook/Meta developer dashboard.
    """
    # Fetch configured verify token from DB (or config file)
    system_set = db.query(models.SystemSettings).first()
    expected_token = system_set.verify_token if system_set else settings.META_VERIFY_TOKEN
    
    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        logger.info("Webhook successfully verified by Meta.")
        # Return the challenge as plain text, per Meta's requirements
        from fastapi.responses import Response
        return Response(content=hub_challenge, media_type="text/plain")
        
    logger.warning("Failed webhook verification attempt.")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Verification token mismatch"
    )

@router.post("/instagram")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Receives incoming comments and events from Meta Instagram Graph Webhook subscription.
    """
    try:
        payload = await request.json()
        
        # Log webhook payload in DB
        webhook_log = models.WebhookLog(payload=payload, status="success")
        db.add(webhook_log)
        db.commit()
        db.refresh(webhook_log)
        
        # Check standard Meta comment payloads
        if payload.get("object") == "instagram":
            for entry in payload.get("entry", []):
                ig_acct_id = entry.get("id")
                
                # Check for comment changes
                for change in entry.get("changes", []):
                    if change.get("field") == "comments":
                        val = change.get("value", {})
                        comment_id = val.get("id")
                        comment_text = val.get("text")
                        username = val.get("from", {}).get("username")
                        media_id = val.get("media", {}).get("id")
                        
                        if ig_acct_id and username and comment_text and media_id:
                            # Trigger direct message match matching on background worker thread
                            background_tasks.add_task(
                                dm_service.match_and_process_comment,
                                db=db,
                                username=username,
                                comment_text=comment_text,
                                media_id=media_id,
                                instagram_account_id=ig_acct_id,
                                background_tasks=background_tasks
                            )
                            
        return {"status": "event_received"}
    except Exception as e:
        logger.error(f"Error handling incoming webhook: {e}")
        # Return success/ok to Meta anyway to avoid retries clogging the server
        return {"status": "error_logged", "detail": str(e)}

@router.post("/simulate")
def simulate_webhook(
    payload: schemas.WebhookSimulateInput,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sandbox route to test Instagram comments and automations without linking Meta developer accounts.
    Runs the process synchronously or schedules background tasks to simulate immediate DM processing.
    """
    # Verify account ownership
    account = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.id == payload.instagram_account_id,
        models.InstagramAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked Instagram account not found"
        )
        
    try:
        # Run comment match and process flow
        result = dm_service.match_and_process_comment(
            db=db,
            username=payload.username,
            comment_text=payload.comment_text,
            media_id=payload.media_id,
            instagram_account_id=payload.instagram_account_id,
            background_tasks=background_tasks
        )
        
        # Log webhook simulator payload
        simulated_payload = {
            "object": "instagram_simulator",
            "entry": [{
                "id": payload.instagram_account_id,
                "changes": [{
                    "field": "comments",
                    "value": {
                        "id": f"comment_{payload.username}",
                        "text": payload.comment_text,
                        "from": {"username": payload.username},
                        "media": {"id": payload.media_id}
                    }
                }]
            }]
        }
        
        webhook_log = models.WebhookLog(
            payload=simulated_payload,
            status=result["status"],
            error_message=result.get("error")
        )
        db.add(webhook_log)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation processing failed: {str(e)}"
        )
