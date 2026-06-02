from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=schemas.SystemSettingsOut)
def get_settings(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    settings_rec = db.query(models.SystemSettings).filter(
        models.SystemSettings.user_id == current_user.id
    ).first()
    
    if not settings_rec:
        # Initialize default settings record
        settings_rec = models.SystemSettings(user_id=current_user.id)
        db.add(settings_rec)
        db.commit()
        db.refresh(settings_rec)
        
    return settings_rec

@router.put("", response_model=schemas.SystemSettingsOut)
def update_settings(
    payload: schemas.SystemSettingsUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    settings_rec = db.query(models.SystemSettings).filter(
        models.SystemSettings.user_id == current_user.id
    ).first()
    
    if not settings_rec:
        settings_rec = models.SystemSettings(user_id=current_user.id)
        db.add(settings_rec)
        db.commit()
        db.refresh(settings_rec)
        
    # Update fields
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(settings_rec, field, val)
        
    db.commit()
    db.refresh(settings_rec)
    return settings_rec
