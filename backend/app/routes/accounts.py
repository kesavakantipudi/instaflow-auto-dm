from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth
from app.services.instagram import instagram_service

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

class ConnectAccountPayload(schemas.BaseModel):
    access_token: str

@router.post("/connect", response_model=schemas.InstagramAccountOut)
def connect_account(
    payload: ConnectAccountPayload,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    if not payload.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access token is required"
        )
        
    try:
        # Fetch account info via Meta Graph API
        info = instagram_service.get_account_info(payload.access_token)
        
        # Check if already connected by someone else
        existing = db.query(models.InstagramAccount).filter(
            models.InstagramAccount.id == info["id"]
        ).first()
        
        if existing:
            # Reconnect or take ownership
            existing.user_id = current_user.id
            existing.username = info["username"]
            existing.access_token = payload.access_token
            existing.page_id = info.get("page_id")
            existing.page_access_token = info.get("page_access_token")
            existing.is_connected = True
            db.commit()
            db.refresh(existing)
            return existing
            
        new_account = models.InstagramAccount(
            id=info["id"],
            user_id=current_user.id,
            username=info["username"],
            access_token=payload.access_token,
            page_id=info.get("page_id"),
            page_access_token=info.get("page_access_token"),
            account_type=info.get("account_type", "business"),
            is_connected=True,
            webhook_status=True
        )
        db.add(new_account)
        db.commit()
        db.refresh(new_account)
        return new_account
    except Exception as e:
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
