from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/automations", tags=["Automations"])

@router.get("", response_model=List[schemas.AutomationOut])
def get_automations(
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Automation).filter(models.Automation.user_id == current_user.id)
    
    if status:
        query = query.filter(models.Automation.status == status)
        
    if keyword:
        query = query.join(models.AutomationKeyword).filter(
            models.AutomationKeyword.keyword.ilike(f"%{keyword}%")
        )
        
    if search:
        query = query.filter(
            models.Automation.name.ilike(f"%{search}%") | 
            models.Automation.message_template.ilike(f"%{search}%")
        )
        
    return query.order_by(models.Automation.created_at.desc()).all()

@router.get("/{automation_id}", response_model=schemas.AutomationOut)
def get_automation(
    automation_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    automation = db.query(models.Automation).filter(
        models.Automation.id == automation_id,
        models.Automation.user_id == current_user.id
    ).first()
    
    if not automation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation not found"
        )
    return automation

@router.post("", response_model=schemas.AutomationOut, status_code=status.HTTP_201_CREATED)
def create_automation(
    payload: schemas.AutomationCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify account ownership
    account = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.id == payload.instagram_account_id,
        models.InstagramAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected Instagram account not connected to this user profile"
        )
        
    # Create automation core
    new_auto = models.Automation(
        user_id=current_user.id,
        instagram_account_id=payload.instagram_account_id,
        name=payload.name,
        status=payload.status,
        trigger_type=payload.trigger_type,
        scope_type=payload.scope_type,
        comment_filter_type=payload.comment_filter_type,
        message_template=payload.message_template,
        follow_ups=payload.follow_ups,
        attachments=payload.attachments
    )
    
    db.add(new_auto)
    db.commit()
    db.refresh(new_auto)
    
    # Add keywords
    if payload.keywords:
        for kw in payload.keywords:
            if kw.strip():
                db.add(models.AutomationKeyword(automation_id=new_auto.id, keyword=kw.strip()))
                
    # Add posts
    if payload.posts:
        for post in payload.posts:
            db.add(models.AutomationPost(
                automation_id=new_auto.id,
                media_id=post.media_id,
                thumbnail_url=post.thumbnail_url,
                caption=post.caption,
                permalink=post.permalink,
                media_type=post.media_type,
                publish_date=post.publish_date
            ))
            
    db.commit()
    db.refresh(new_auto)
    return new_auto

@router.put("/{automation_id}", response_model=schemas.AutomationOut)
def update_automation(
    automation_id: str,
    payload: schemas.AutomationUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auto = db.query(models.Automation).filter(
        models.Automation.id == automation_id,
        models.Automation.user_id == current_user.id
    ).first()
    
    if not auto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation not found"
        )
        
    # Update fields
    for field, val in payload.model_dump(exclude_unset=True).items():
        if field not in ["keywords", "posts"]:
            setattr(auto, field, val)
            
    # Process keywords update
    if payload.keywords is not None:
        # Delete old
        db.query(models.AutomationKeyword).filter(
            models.AutomationKeyword.automation_id == auto.id
        ).delete()
        # Add new
        for kw in payload.keywords:
            if kw.strip():
                db.add(models.AutomationKeyword(automation_id=auto.id, keyword=kw.strip()))
                
    # Process posts scope update
    if payload.posts is not None:
        db.query(models.AutomationPost).filter(
            models.AutomationPost.automation_id == auto.id
        ).delete()
        for post in payload.posts:
            db.add(models.AutomationPost(
                automation_id=auto.id,
                media_id=post.media_id,
                thumbnail_url=post.thumbnail_url,
                caption=post.caption,
                permalink=post.permalink,
                media_type=post.media_type,
                publish_date=post.publish_date
            ))
            
    db.commit()
    db.refresh(auto)
    return auto

@router.delete("/{automation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_automation(
    automation_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auto = db.query(models.Automation).filter(
        models.Automation.id == automation_id,
        models.Automation.user_id == current_user.id
    ).first()
    
    if not auto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation not found"
        )
        
    db.delete(auto)
    db.commit()
    return None

@router.post("/{automation_id}/duplicate", response_model=schemas.AutomationOut)
def duplicate_automation(
    automation_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    auto = db.query(models.Automation).filter(
        models.Automation.id == automation_id,
        models.Automation.user_id == current_user.id
    ).first()
    
    if not auto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation not found"
        )
        
    # Copy core properties
    cloned = models.Automation(
        user_id=current_user.id,
        instagram_account_id=auto.instagram_account_id,
        name=f"{auto.name} (Copy)",
        status="paused",  # Copy defaults to paused
        trigger_type=auto.trigger_type,
        scope_type=auto.scope_type,
        comment_filter_type=auto.comment_filter_type,
        message_template=auto.message_template,
        follow_ups=auto.follow_ups,
        attachments=auto.attachments
    )
    
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    
    # Copy keywords
    for kw in auto.keywords:
        db.add(models.AutomationKeyword(automation_id=cloned.id, keyword=kw.keyword))
        
    # Copy posts
    for post in auto.posts:
        db.add(models.AutomationPost(
            automation_id=cloned.id,
            media_id=post.media_id,
            thumbnail_url=post.thumbnail_url,
            caption=post.caption,
            permalink=post.permalink,
            media_type=post.media_type,
            publish_date=post.publish_date
        ))
        
    db.commit()
    db.refresh(cloned)
    return cloned
