from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/logs", tags=["Activity Logs"])

@router.get("/activity", response_model=List[schemas.ActivityLogOut])
def get_activity_logs(
    status: Optional[str] = None,
    username: Optional[str] = None,
    automation_id: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.ActivityLog).filter(models.ActivityLog.user_id == current_user.id)
    
    if status:
        query = query.filter(models.ActivityLog.status == status)
        
    if username:
        query = query.filter(models.ActivityLog.username.ilike(f"%{username}%"))
        
    if automation_id:
        query = query.filter(models.ActivityLog.automation_id == automation_id)
        
    return query.order_by(models.ActivityLog.created_at.desc()).limit(100).all()

@router.get("/webhooks", response_model=List[schemas.WebhookLogOut])
def get_webhook_logs(
    status: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns lists of raw webhook payload entries (Admin-only auditing, fallback to Creator dashboard viewing).
    """
    query = db.query(models.WebhookLog)
    if status:
        query = query.filter(models.WebhookLog.status == status)
    return query.order_by(models.WebhookLog.created_at.desc()).limit(50).all()
