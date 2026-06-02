import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.database import get_db
from app import models, auth

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
def get_dashboard_summary(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregate stats for top cards in the Dashboard.
    """
    user_id = current_user.id
    
    # 1. Connected Instagram Accounts
    total_accounts = db.query(models.InstagramAccount).filter(
        models.InstagramAccount.user_id == user_id,
        models.InstagramAccount.is_connected == True
    ).count()
    
    # 2. Total Automations
    total_automations = db.query(models.Automation).filter(
        models.Automation.user_id == user_id
    ).count()
    
    # 3. Total Comments Processed
    total_processed = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == user_id
    ).count()
    
    # 4. Total DMs Sent
    total_dms = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == user_id,
        models.ActivityLog.status == "success"
    ).count()
    
    # 5. Conversion Rate
    conversion_rate = 0.0
    if total_processed > 0:
        conversion_rate = round((total_dms / total_processed) * 100, 1)
        
    # 6. Top Performing Keyword
    top_keyword_query = db.query(
        models.ActivityLog.trigger_matched, 
        func.count(models.ActivityLog.id).label("count")
    ).filter(
        models.ActivityLog.user_id == user_id,
        models.ActivityLog.status == "success"
    ).group_by(
        models.ActivityLog.trigger_matched
    ).order_by(
        func.count(models.ActivityLog.id).desc()
    ).first()
    
    top_keyword = "N/A"
    if top_keyword_query and top_keyword_query[0]:
        # Extract keyword from "KEYWORD: keyword" format
        raw_kw = top_keyword_query[0]
        if ":" in raw_kw:
            top_keyword = raw_kw.split(":")[-1].strip()
        else:
            top_keyword = raw_kw
            
    # 7. Recent Activities
    recent_logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == user_id
    ).order_by(
        models.ActivityLog.created_at.desc()
    ).limit(6).all()
    
    recent_feed = []
    for log in recent_logs:
        recent_feed.append({
            "id": log.id,
            "username": log.username,
            "comment_text": log.comment_text,
            "trigger_matched": log.trigger_matched,
            "status": log.status,
            "timestamp": log.created_at
        })
        
    return {
        "total_accounts": total_accounts,
        "total_automations": total_automations,
        "total_comments_processed": total_processed,
        "total_dms_sent": total_dms,
        "conversion_rate": conversion_rate,
        "top_performing_keyword": top_keyword,
        "recent_activity": recent_feed
    }

@router.get("/charts")
def get_charts_data(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns Daily timeseries details for Recharts dashboard chart (past 7 days).
    """
    user_id = current_user.id
    chart_data = []
    
    # Generate past 7 days
    today = datetime.date.today()
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_start = datetime.datetime.combine(day, datetime.time.min)
        day_end = datetime.datetime.combine(day, datetime.time.max)
        
        # Count processed comments
        processed_count = db.query(models.ActivityLog).filter(
            models.ActivityLog.user_id == user_id,
            models.ActivityLog.created_at >= day_start,
            models.ActivityLog.created_at <= day_end
        ).count()
        
        # Count successful DMs
        success_count = db.query(models.ActivityLog).filter(
            models.ActivityLog.user_id == user_id,
            models.ActivityLog.status == "success",
            models.ActivityLog.created_at >= day_start,
            models.ActivityLog.created_at <= day_end
        ).count()
        
        # Count failed DMs
        failed_count = db.query(models.ActivityLog).filter(
            models.ActivityLog.user_id == user_id,
            models.ActivityLog.status == "failed",
            models.ActivityLog.created_at >= day_start,
            models.ActivityLog.created_at <= day_end
        ).count()
        
        chart_data.append({
            "date": day.strftime("%a %d"),
            "processed": processed_count,
            "sent": success_count,
            "failed": failed_count
        })
        
    return chart_data
