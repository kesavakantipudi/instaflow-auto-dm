import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth
from app.services.instagram import instagram_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accounts", tags=["Instagram Accounts"])

@router.get("", response_model=List[schemas.InstagramAccountOut])
def get_accounts(
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    accounts = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.user_id == current_user.id
    ).all()
    return accounts

def _log_connection_diagnostics(access_token: str, info: dict):
    logger.info("=== CONNECT ACCOUNT WEBHOOK DIAGNOSTIC ===")
    logger.info(f"Instagram ID: {info.get('id')}")
    logger.info(f"Username: {info.get('username')}")
    
    # Run subscription
    sub_res = None
    try:
        sub_res = instagram_service.subscribe_account(access_token, info["id"])
        logger.info(f"Subscription API Response: {sub_res}")
    except Exception as sub_err:
        logger.error(f"Subscription API Response (Failed): {sub_err}")
        
    # Get permissions
    import requests
    permissions = []
    if not access_token.startswith("mock_") and access_token:
        try:
            res = requests.get("https://graph.instagram.com/me/permissions", params={"access_token": access_token}, timeout=10)
            perm_data = res.json()
            if "error" in perm_data:
                res = requests.get("https://graph.facebook.com/me/permissions", params={"access_token": access_token}, timeout=10)
                perm_data = res.json()
            permissions = perm_data.get("data", [])
        except Exception as perm_ex:
            logger.warning(f"Failed to fetch permissions during connect: {perm_ex}")
    else:
        permissions = [{"permission": "instagram_basic", "status": "granted"}]
        
    logger.info(f"Granted Permissions: {permissions}")
    logger.info("==========================================")
    return sub_res

class ConnectAccountPayload(schemas.BaseModel):
    access_token: str = None
    code: str = None
    redirect_uri: str = None

@router.post("/connect", response_model=schemas.InstagramAccountOut)
def connect_account(
    payload: ConnectAccountPayload,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    logger.info(f"Connect account request received for User ID: {current_user.id}")
    if not payload.access_token and not payload.code:
        logger.error("Connect account request failed: Neither access_token nor code was provided.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either access_token or code is required"
        )
        
    access_token = payload.access_token
    if payload.code:
        if not payload.redirect_uri:
            logger.error("Connect account request failed: Redirect URI missing for authorization code exchange.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="redirect_uri is required for authorization code exchange"
            )
        try:
            logger.info("Exchanging authorization code for access token...")
            access_token = instagram_service.exchange_code_for_token(payload.code, payload.redirect_uri)
            logger.info("Authorization code exchanged successfully.")
        except Exception as e:
            logger.error(f"Authorization code exchange failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
    try:
        logger.info("Fetching Instagram user profile info...")
        info = instagram_service.get_account_info(access_token)
        logger.info(f"Instagram profile info fetched successfully: {info.get('username')} ({info.get('id')})")
        
        # Check if already connected by someone else
        existing = db.query(models.InstagramAccount).filter(
            models.InstagramAccount.id == info["id"]
        ).first()
        
        if existing:
            logger.info(f"Account {info['username']} is already registered. Updating connection and taking ownership.")
            existing.user_id = current_user.id
            existing.username = info["username"]
            existing.access_token = access_token
            existing.page_id = info.get("page_id")
            existing.page_access_token = info.get("page_access_token")
            existing.is_connected = True
            
            # Subscribe & Log Diagnostics
            _log_connection_diagnostics(access_token, info)
                
            db.commit()
            db.refresh(existing)
            logger.info("Account connection updated successfully.")
            return existing
            
        logger.info(f"Registering new Instagram account: {info['username']}")
        new_account = models.InstagramAccount(
            id=info["id"],
            user_id=current_user.id,
            username=info["username"],
            access_token=access_token,
            page_id=info.get("page_id"),
            page_access_token=info.get("page_access_token"),
            account_type=info.get("account_type", "business"),
            is_connected=True,
            webhook_status=True
        )
        
        # Subscribe & Log Diagnostics
        _log_connection_diagnostics(access_token, info)
            
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        logger.info("New account registered successfully.")
        return new_account
    except Exception as e:
        logger.error(f"Failed to connect Instagram account: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect Instagram account: {str(e)}"
        )

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_account(
    account_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.id == account_id,
        models.InstagramAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instagram account not found"
        )
        
    db.delete(account)
    db.commit()
    return None

@router.get("/{account_id}/posts")
def get_account_posts(
    account_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the latest media (posts/reels) for the linked Instagram Account.
    """
    account = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.id == account_id,
        models.InstagramAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instagram account not found"
        )
        
    try:
        posts = instagram_service.get_posts(account.access_token, account.id)
        return posts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{account_id}/diagnostics")
def get_account_diagnostics(
    account_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Diagnostic route checking Meta/Instagram account webhooks subscription, permissions, and status.
    """
    account = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.id == account_id,
        models.InstagramAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instagram account not found"
        )
        
    import requests
    # 1. Fetch subscription status from Meta
    subscription = instagram_service.get_subscription_status(account.access_token, account.id)
    
    # 2. Fetch token permissions from Meta
    permissions = []
    if not account.access_token.startswith("mock_") and account.access_token:
        try:
            perm_url = "https://graph.instagram.com/me/permissions"
            res = requests.get(perm_url, params={"access_token": account.access_token}, timeout=10)
            perm_data = res.json()
            if "error" in perm_data:
                # Try fallback to graph.facebook.com
                fb_perm_url = "https://graph.facebook.com/me/permissions"
                res = requests.get(fb_perm_url, params={"access_token": account.access_token}, timeout=10)
                perm_data = res.json()
            permissions = perm_data.get("data", [])
        except Exception as e:
            logger.warning(f"Could not fetch token permissions: {e}")
            permissions = [{"error": str(e)}]
    else:
        permissions = [
            {"permission": "instagram_basic", "status": "granted"},
            {"permission": "instagram_manage_comments", "status": "granted"},
            {"permission": "instagram_manage_messages", "status": "granted"}
        ]
        
    # Check if subscription contains comments or messages or is active
    sub_data = subscription.get("data", [])
    has_comments = False
    subscribed_fields_list = []
    
    if sub_data and isinstance(sub_data, list):
        for app_sub in sub_data:
            fields = app_sub.get("subscribed_fields", [])
            subscribed_fields_list.extend(fields)
            if "comments" in fields:
                has_comments = True
                
    webhook_configured = "not_configured"
    if has_comments:
        webhook_configured = "active"
    elif "error" in subscription:
        webhook_configured = "error"
        
    return {
        "instagram_account_id": account.id,
        "username": account.username,
        "subscription_status": subscription,
        "subscribed_fields": list(set(subscribed_fields_list)),
        "available_permissions": permissions,
        "webhook_configuration_status": webhook_configured
    }
