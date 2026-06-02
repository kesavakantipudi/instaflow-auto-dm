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
        background_tasks: Any,
        comment_id: str = None
    ) -> Dict[str, Any]:
        """
        Main entry point for incoming comments (webhooks and simulator).
        Evaluates triggers, builds templates, fires immediate DMs, and schedules follow-ups.
        """
        # Check for duplicate comment processing (replay protection)
        if comment_id:
            existing = db.query(models.ActivityLog).filter(
                models.ActivityLog.comment_id == comment_id
            ).first()
            if existing:
                logger.info(f"Ignoring duplicate comment webhook event: {comment_id}")
                return {"status": "ignored", "message": "Duplicate comment_id. Already processed."}

        # Fetch connected account
        logger.info("=== AUTOMATION_LOOKUP_STARTED ===")
        logger.info(f"AUTOMATION_LOOKUP_STARTED: instagram_account_id={instagram_account_id}")
        
        account = db.query(models.InstagramAccount).filter(
            (models.InstagramAccount.id == instagram_account_id) |
            (models.InstagramAccount.page_id == instagram_account_id)
        ).first()
        
        if not account:
            logger.error(f"DM Service: Instagram account not found for ID '{instagram_account_id}' in database. Aborting.")
            return {"status": "error", "message": "Instagram account not found"}
            
        # Fetch active automations for this account
        automations = db.query(models.Automation).filter(
            models.Automation.instagram_account_id == account.id,
            models.Automation.status == "active"
        ).all()
        
        logger.info("=== AUTOMATIONS_FOUND_COUNT ===")
        logger.info(f"AUTOMATIONS_FOUND_COUNT: count={len(automations)} active automations found for account.id={account.id}")
        
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
        logger.info(f"DM Service: AI classification matched ID: {ai_matched_id}")
        
        for auto in automations:
            logger.info(f"DM Service: Evaluating automation '{auto.name}' (ID: {auto.id})")
            
            # Check Post Scope
            if auto.scope_type == "selected_posts":
                post_matched = any(p.media_id == media_id for p in auto.posts)
                logger.info(f"DM Service: Scope check (selected_posts). Received media_id: {media_id}. Connected posts: {[p.media_id for p in auto.posts]}. Matched: {post_matched}")
                if not post_matched:
                    continue
            elif auto.scope_type == "latest_post":
                # Match only if it is the latest post of the account
                latest_post = db.query(models.AutomationPost).filter(
                    models.AutomationPost.automation_id == auto.id
                ).order_by(models.AutomationPost.publish_date.desc()).first()
                latest_matched = latest_post and latest_post.media_id == media_id
                logger.info(f"DM Service: Scope check (latest_post). Received media_id: {media_id}. Latest: {latest_post.media_id if latest_post else 'none'}. Matched: {latest_matched}")
                if not latest_matched:
                    continue
            else:
                logger.info(f"DM Service: Scope check ({auto.scope_type}) automatically matched.")
                    
            # Check Trigger Type
            comment_clean = comment_text.lower().strip()
            
            if auto.trigger_type == "all":
                matched_auto = auto
                match_keyword = "All Comments"
                logger.info("DM Service: Trigger check ('all') matched.")
                break
                
            elif auto.trigger_type == "ai_intent" and ai_matched_id == auto.id:
                matched_auto = auto
                match_keyword = "AI Intent Detected"
                logger.info("DM Service: Trigger check ('ai_intent') matched.")
                break
                
            elif auto.trigger_type in ["keyword", "contains_any"]:
                keywords = [k.keyword.lower().strip() for k in auto.keywords]
                logger.info(f"DM Service: Trigger check ({auto.trigger_type}). Filter: {auto.comment_filter_type}. Comment: '{comment_clean}'. Keywords: {keywords}")
                
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
                    logger.info(f"DM Service: Trigger check matched keyword: '{matched_kw}'")
                    break
                else:
                    logger.info("DM Service: Trigger check did not match keywords.")
                    
        if not matched_auto:
            logger.warning(f"DM Service: No active automation triggers matched comment: '{comment_text}' on media: {media_id}")
            return {"status": "ignored", "message": "No active automation triggers matched this comment"}
            
        logger.info("=== AUTOMATION_MATCHED ===")
        logger.info(f"AUTOMATION_MATCHED: id={matched_auto.id}, name={matched_auto.name}, trigger={matched_auto.trigger_type}, keyword={match_keyword}")
            
        # Compile messages
        # DM message compilation
        raw_dm_msg = matched_auto.dm_template if matched_auto.dm_template else matched_auto.message_template
        final_dm_msg = cls.interpolate_template(
            template=raw_dm_msg,
            username=username,
            comment=comment_text,
            post_name=post_caption
        )
        final_dm_msg = cls.format_message_with_attachments(final_dm_msg, matched_auto.attachments)
        
        # Comment reply message compilation
        raw_comment_reply = matched_auto.comment_reply_template if matched_auto.comment_reply_template else "Thanks for commenting! Check your DMs 🚀"
        final_comment_reply = cls.interpolate_template(
            template=raw_comment_reply,
            username=username,
            comment=comment_text,
            post_name=post_caption
        )
        
        logger.info("=== REPLY TEMPLATE COMPILED ===")
        logger.info(f"DM Content: {final_dm_msg}")
        logger.info(f"Comment Reply Content: {final_comment_reply}")
        
        logger.info("=== REPLY_PIPELINE_STARTED ===")
        logger.info(f"REPLY_PIPELINE_STARTED: comment_id={comment_id}")
        
        success = True
        error_msgs = []
        
        # 1. Public Comment Reply
        if comment_id and getattr(matched_auto, "comment_reply_enabled", True):
            logger.info("=== COMMENT_REPLY_STARTED ===")
            logger.info(f"COMMENT_REPLY_STARTED: comment_id={comment_id}")
            try:
                instagram_service.send_comment_reply(
                    access_token=account.access_token,
                    comment_id=comment_id,
                    message=final_comment_reply,
                    media_id=media_id,
                    account_id=account.id,
                    page_access_token=account.page_access_token
                )
                logger.info("=== COMMENT_REPLY_SUCCESS ===")
            except Exception as e:
                logger.error("=== COMMENT_REPLY_FAILED ===")
                logger.info(f"META_RESPONSE_BODY: {str(e)}")
                error_msgs.append(f"Comment Reply failed: {str(e)}")
                
        # 2. Private DM
        if getattr(matched_auto, "dm_enabled", True):
            logger.info("=== DM_STARTED ===")
            logger.info(f"DM_STARTED: recipient={username}")
            try:
                instagram_service.send_dm(
                    access_token=account.access_token,
                    recipient_id=f"user_{username}",
                    message=final_dm_msg,
                    comment_id=comment_id,
                    media_id=media_id,
                    account_id=account.id,
                    page_access_token=account.page_access_token
                )
                logger.info("=== DM_SUCCESS ===")
            except Exception as e:
                logger.error("=== DM_FAILED ===")
                logger.info(f"META_RESPONSE_BODY: {str(e)}")
                error_msgs.append(f"DM failed: {str(e)}")
                success = False
                
        error_msg = "; ".join(error_msgs) if error_msgs else None
            
        # Save Activity Log
        log = models.ActivityLog(
            user_id=account.user_id,
            instagram_account_id=account.id,
            automation_id=matched_auto.id,
            username=username,
            comment_id=comment_id or f"comment_{int(datetime.datetime.utcnow().timestamp())}",
            comment_text=comment_text,
            trigger_matched=f"{matched_auto.trigger_type.upper()}: {match_keyword}",
            dm_sent=final_dm_msg,
            status="success" if success else "failed",
            error_detail=error_msg
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        logger.info("=== ACTIVITY_LOG_INSERTED ===")
        logger.info(f"ACTIVITY_LOG_INSERTED: log_id={log.id}, status={log.status}")
        
        # Trigger Follow-up sequences in background
        if success and matched_auto.follow_ups:
            logger.info(f"DM Service: Scheduling follow-up sequences. Count: {len(matched_auto.follow_ups)}")
            background_tasks.add_task(
                cls.process_follow_ups,
                user_id=account.user_id,
                account_id=account.id,
                access_token=account.access_token,
                automation_id=matched_auto.id,
                username=username,
                comment_text=comment_text,
                post_name=post_caption,
                follow_ups=matched_auto.follow_ups,
                page_access_token=account.page_access_token
            )
            
        if not success:
            raise Exception(f"Failed to deliver Instagram DM: {error_msg}")
            
        return {
            "status": "success",
            "log_id": log.id,
            "matched_automation": matched_auto.name,
            "message_sent": final_msg,
            "error": None
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
        follow_ups: List[Dict[str, Any]],
        page_access_token: str = None
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
                        message=raw_follow_msg,
                        page_access_token=page_access_token,
                        account_id=account_id
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
                logger.exception("Failed to execute follow-up")
            finally:
                db.close()
                
    @classmethod
    def match_and_process_comment_async(
        cls,
        username: str,
        comment_text: str,
        media_id: str,
        instagram_account_id: str,
        comment_id: str = None
    ):
        """
        Wrapper to run match_and_process_comment in a background task with its own DB session.
        """
        from app.database import SessionLocal
        from fastapi import BackgroundTasks
        
        logger.info(f"=== PROCESS_COMMENT_EVENT_STARTED ===")
        logger.info(f"PROCESS_COMMENT_EVENT_STARTED: comment_id={comment_id}, media_id={media_id}, username={username}")
        
        db = SessionLocal()
        bg_tasks = BackgroundTasks()
        try:
            cls.match_and_process_comment(
                db=db,
                username=username,
                comment_text=comment_text,
                media_id=media_id,
                instagram_account_id=instagram_account_id,
                background_tasks=bg_tasks,
                comment_id=comment_id
            )
        except Exception as e:
            logger.exception("Error in match_and_process_comment_async")
        finally:
            db.close()

dm_service = DMService()
