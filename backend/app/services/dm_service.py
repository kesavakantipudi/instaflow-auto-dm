import datetime
import logging
import asyncio
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.services.instagram import instagram_service
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

class DMService:
    @staticmethod
    def interpolate_template(template: str, username: str, comment: str, post_name: str) -> str:
        """
        Replaces variables in message templates: {username}, {comment}, {post_name}, {date}
        """
        now_str = datetime.datetime.utcnow().strftime("%B %d, %Y")
        msg = template
        msg = msg.replace("{username}", username)
        msg = msg.replace("{comment}", comment)
        msg = msg.replace("{post_name}", post_name)
        msg = msg.replace("{date}", now_str)
        return msg

    @classmethod
    def format_message_with_attachments(cls, text: str, attachments: List[Dict[str, Any]]) -> str:
        """
        Appends any attached resources/links to the end of the text message.
        """
        if not attachments:
            return text
            
        attached_links = []
        for att in attachments:
            name = att.get("name") or att.get("type", "Resource").capitalize()
            url = att.get("url", "")
            if url:
                attached_links.append(f"🔗 {name}: {url}")
                
        if attached_links:
            return f"{text}\n\nHere are your resources:\n" + "\n".join(attached_links)
        return text

    @classmethod
    def match_and_process_comment(
        cls, 
        db: Session, 
        username: str, 
        comment_text: str, 
        media_id: str, 
        instagram_account_id: str,
        background_tasks: Any
    ) -> Dict[str, Any]:
        """
        Main entry point for incoming comments (webhooks and simulator).
        Evaluates triggers, builds templates, fires immediate DMs, and schedules follow-ups.
        """
        # Fetch connected account
        account = db.query(models.InstagramAccount).filter(
            models.InstagramAccount.id == instagram_account_id
        ).first()
        if not account:
            return {"status": "error", "message": "Instagram account not found"}
            
        # Fetch active automations for this account
        automations = db.query(models.Automation).filter(
            models.Automation.instagram_account_id == instagram_account_id,
            models.Automation.status == "active"
        ).all()
        
        matched_auto = None
        match_keyword = None
        
        # Build automation dictionaries for AI Classification if needed
        auto_list_dict = []
        for auto in automations:
            keywords = [k.keyword for k in auto.keywords]
            auto_list_dict.append({
                "id": auto.id,
                "name": auto.name,
                "keywords": keywords
            })
            
        # 1. First, check if "AI Intent Detection" fits
        ai_matched_id = ai_service.classify_intent(comment_text, auto_list_dict)
        
        for auto in automations:
            # Check Post Scope
            if auto.scope_type == "selected_posts":
                post_matched = any(p.media_id == media_id for p in auto.posts)
                if not post_matched:
                    continue
            elif auto.scope_type == "latest_post":
                # Match only if it is the latest post of the account
                latest_post = db.query(models.AutomationPost).filter(
                    models.AutomationPost.automation_id == auto.id
                ).order_by(models.AutomationPost.publish_date.desc()).first()
                if latest_post and latest_post.media_id != media_id:
                    continue
                    
            # Check Trigger Type
            comment_clean = comment_text.lower().strip()
            
            if auto.trigger_type == "all":
                matched_auto = auto
                match_keyword = "All Comments"
                break
                
            elif auto.trigger_type == "ai_intent" and ai_matched_id == auto.id:
                matched_auto = auto
                match_keyword = "AI Intent Detected"
                break
                
            elif auto.trigger_type in ["keyword", "contains_any"]:
                keywords = [k.keyword.lower().strip() for k in auto.keywords]
                
                # Check filter type matching
                is_match = False
                matched_kw = ""
                
                for kw in keywords:
                    if auto.comment_filter_type == "exact" and comment_clean == kw:
                        is_match = True
                        matched_kw = kw
                        break
                    elif auto.comment_filter_type == "case_insensitive" and comment_clean == kw:
                        is_match = True
                        matched_kw = kw
                        break
                    elif auto.comment_filter_type == "starts_with" and comment_clean.startswith(kw):
                        is_match = True
                        matched_kw = kw
                        break
                    elif auto.comment_filter_type == "ends_with" and comment_clean.endswith(kw):
                        is_match = True
                        matched_kw = kw
                        break
                    elif auto.comment_filter_type == "contains" and kw in comment_clean:
                        is_match = True
                        matched_kw = kw
                        break
                        
                if is_match:
                    matched_auto = auto
                    match_keyword = matched_kw
                    break
                    
        if not matched_auto:
            return {"status": "ignored", "message": "No active automation triggers matched this comment"}
            
        # Compile direct message
        post_caption = "Simulated Post"
        post_record = db.query(models.AutomationPost).filter(models.AutomationPost.media_id == media_id).first()
        if post_record and post_record.caption:
            post_caption = post_record.caption[:30] + "..."
            
        raw_msg = cls.interpolate_template(
            template=matched_auto.message_template,
            username=username,
            comment=comment_text,
            post_name=post_caption
        )
        
        final_msg = cls.format_message_with_attachments(raw_msg, matched_auto.attachments)
        
        # Send immediate DM
        success = True
        error_msg = None
        try:
            instagram_service.send_dm(
                access_token=account.access_token,
                recipient_id=f"user_{username}",
                message=final_msg
            )
        except Exception as e:
            success = False
            error_msg = str(e)
            
        # Save Activity Log
        log = models.ActivityLog(
            user_id=account.user_id,
            instagram_account_id=account.id,
            automation_id=matched_auto.id,
            username=username,
            comment_id=f"comment_{int(datetime.datetime.utcnow().timestamp())}",
            comment_text=comment_text,
            trigger_matched=f"{matched_auto.trigger_type.upper()}: {match_keyword}",
            dm_sent=final_msg,
            status="success" if success else "failed",
            error_detail=error_msg
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        
        # Trigger Follow-up sequences in background
        if success and matched_auto.follow_ups:
            background_tasks.add_task(
                cls.process_follow_ups,
                user_id=account.user_id,
                account_id=account.id,
                access_token=account.access_token,
                automation_id=matched_auto.id,
                username=username,
                comment_text=comment_text,
                post_name=post_caption,
                follow_ups=matched_auto.follow_ups
            )
            
        return {
            "status": "success" if success else "failed",
            "log_id": log.id,
            "matched_automation": matched_auto.name,
            "message_sent": final_msg,
            "error": error_msg
        }

    @classmethod
    async def process_follow_ups(
        cls,
        user_id: int,
        account_id: str,
        access_token: str,
        automation_id: str,
        username: str,
        comment_text: str,
        post_name: str,
        follow_ups: List[Dict[str, Any]]
    ):
        """
        Processes multi-step follow-up triggers asynchronously.
        For demonstration/simulations, we convert delay hours to seconds (e.g. 1 hour = 1 second)
        so they are visible instantly in the dashboard logs!
        """
        from app.database import SessionLocal  # Import here to avoid circular dependencies
        
        for index, follow in enumerate(follow_ups):
            delay_hours = float(follow.get("delay_hours", 24))
            # Simulator speed-up: if delay is small or we want to demonstrate live, sleep for seconds instead of hours
            # Let's map: 1 hour = 2 seconds for sandbox demo
            sleep_time = max(delay_hours * 2, 2.0)
            
            logger.info(f"Scheduling follow-up {index+1} for {username} in {sleep_time}s")
            await asyncio.sleep(sleep_time)
            
            # Create fresh database session
            db = SessionLocal()
            try:
                # Interpolate the message
                raw_follow_msg = cls.interpolate_template(
                    template=follow.get("message", ""),
                    username=username,
                    comment=comment_text,
                    post_name=post_name
                )
                
                success = True
                error_msg = None
                try:
                    instagram_service.send_dm(
                        access_token=access_token,
                        recipient_id=f"user_{username}",
                        message=raw_follow_msg
                    )
                except Exception as e:
                    success = False
                    error_msg = str(e)
                    
                # Save Activity Log
                log = models.ActivityLog(
                    user_id=user_id,
                    instagram_account_id=account_id,
                    automation_id=automation_id,
                    username=username,
                    comment_id=f"comment_followup_{int(datetime.datetime.utcnow().timestamp())}",
                    comment_text=f"[Follow-up Trigger] {comment_text}",
                    trigger_matched=f"FOLLOW_UP_{index + 1} (after {delay_hours} hrs)",
                    dm_sent=raw_follow_msg,
                    status="success" if success else "failed",
                    error_detail=error_msg
                )
                db.add(log)
                db.commit()
                logger.info(f"Sent follow-up {index+1} to {username}: status={log.status}")
            except Exception as ex:
                logger.error(f"Failed to execute follow-up: {ex}")
            finally:
                db.close()
                
dm_service = DMService()
