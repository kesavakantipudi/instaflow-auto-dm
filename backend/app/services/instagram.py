import datetime
import logging
import requests
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class InstagramService:
    @staticmethod
    def exchange_code_for_token(code: str, redirect_uri: str) -> str:
        """
        Exchanges Instagram OAuth authorization code for an access token.
        """
        from app.config import settings
        
        # Sandbox / local simulation support
        if code.startswith("mock_"):
            logger.info("Instagram OAuth: Using sandbox simulation mode.")
            return "mock_kesava_creator_token"
            
        logger.info(f"Instagram OAuth: Starting code exchange. Redirect URI: {redirect_uri}")
        try:
            # Step 1: Exchange code for short-lived token
            url = "https://api.instagram.com/oauth/access_token"
            payload = {
                "client_id": settings.META_CLIENT_ID,
                "client_secret": settings.META_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code
            }
            
            response = requests.post(url, data=payload, timeout=10)
            data = response.json()
            
            if "error" in data:
                error_msg = data.get("error_message") or (data["error"].get("message") if isinstance(data.get("error"), dict) else "Unknown error")
                logger.error(f"Instagram OAuth: Code exchange failed. Error: {error_msg}")
                raise Exception(error_msg)
                
            short_lived_token = data.get("access_token")
            if not short_lived_token:
                logger.error("Instagram OAuth: Code exchange succeeded but access_token is missing from response.")
                raise Exception("Access token missing in OAuth response")
                
            logger.info("Instagram OAuth: Short-lived access token retrieved successfully.")
            
            # Step 2: Exchange short-lived token for long-lived (60 days) token
            logger.info("Instagram OAuth: Requesting long-lived access token.")
            long_lived_url = "https://graph.instagram.com/access_token"
            params = {
                "grant_type": "ig_exchange_token",
                "client_secret": settings.META_CLIENT_SECRET,
                "access_token": short_lived_token
            }
            ll_response = requests.get(long_lived_url, params=params, timeout=10)
            ll_data = ll_response.json()
            
            if "error" in ll_data:
                ll_error = ll_data["error"].get("message") if isinstance(ll_data.get("error"), dict) else "Unknown error"
                logger.warning(f"Instagram OAuth: Long-lived token promotion failed. Falling back to short-lived token. Detail: {ll_error}")
                return short_lived_token
                
            long_lived_token = ll_data.get("access_token")
            if long_lived_token:
                logger.info("Instagram OAuth: Long-lived access token retrieved successfully.")
                return long_lived_token
                
            logger.warning("Instagram OAuth: Long-lived promotion returned empty token. Falling back to short-lived token.")
            return short_lived_token
        except Exception as e:
            logger.error(f"Instagram OAuth: Critical error during code exchange process: {e}")
            raise Exception(f"OAuth code exchange failed: {str(e)}")

    @staticmethod
    def get_account_info(access_token: str) -> Dict[str, Any]:
        """
        Gets details of connected professional Instagram account. Falls back to mock data for simulated logins.
        """
        if access_token.startswith("mock_") or not access_token:
            logger.info("Instagram Profile API: Utilizing simulated sandbox account profile.")
            return {
                "id": "ig_creator_12345",
                "username": "kesava_ai_creator",
                "account_type": "business",
                "name": "Kesava | AI Engineering",
                "profile_picture_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
        
        logger.info("Instagram Profile API: Querying user account metadata from graph.instagram.com/me")
        try:
            # Query the Instagram Graph User Endpoint directly
            url = "https://graph.instagram.com/me"
            params = {
                "fields": "id,username,name,profile_picture_url,account_type",
                "access_token": access_token
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if "error" in data:
                error_msg = data["error"].get("message") or "Unknown API error"
                logger.error(f"Instagram Profile API: Account lookup failed. Detail: {error_msg}")
                raise Exception(error_msg)
            
            account_id = data.get("id")
            username = data.get("username")
            if not account_id or not username:
                logger.error("Instagram Profile API: Account lookup succeeded but required identifier fields are missing.")
                raise Exception("Profile response is missing user id or username")
                
            logger.info(f"Instagram Profile API: Account lookup succeeded for user {username} ({account_id}).")
            
            return {
                "id": account_id,
                "username": username,
                "name": data.get("name") or username,
                "account_type": (data.get("account_type") or "business").lower(),
                "profile_picture_url": data.get("profile_picture_url")
            }
        except Exception as e:
            logger.error(f"Instagram Profile API: Critical error fetching Instagram account info: {e}")
            raise Exception(f"Instagram Graph API connection failed: {str(e)}")

    @staticmethod
    def get_posts(access_token: str, instagram_id: str) -> List[Dict[str, Any]]:
        """
        Fetches media files (posts and reels) from Instagram.
        """
        if access_token.startswith("mock_") or not access_token:
            return [
                {
                    "media_id": "media_post_1",
                    "thumbnail_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300",
                    "caption": "🔥 Python Programming Playlist is live! Comment PLAYLIST to get it directly in your DMs!",
                    "permalink": "https://instagram.com/p/mock1",
                    "media_type": "IMAGE",
                    "publish_date": datetime.datetime.now() - datetime.timedelta(days=1)
                },
                {
                    "media_id": "media_post_2",
                    "thumbnail_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300",
                    "caption": "🚀 Complete AI/ML Engineer Roadmap for 2026. Comment ROADMAP to download the high-res PDF roadmap!",
                    "permalink": "https://instagram.com/p/mock2",
                    "media_type": "VIDEO",
                    "publish_date": datetime.datetime.now() - datetime.timedelta(days=3)
                },
                {
                    "media_id": "media_post_3",
                    "thumbnail_url": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=300",
                    "caption": "📝 Standard resume template that got me offers at big tech. Comment RESUME to clone the Notion template.",
                    "permalink": "https://instagram.com/p/mock3",
                    "media_type": "IMAGE",
                    "publish_date": datetime.datetime.now() - datetime.timedelta(days=7)
                },
                {
                    "media_id": "media_post_4",
                    "thumbnail_url": "https://images.unsplash.com/photo-1618401471353-b98aedd07871?w=300",
                    "caption": "🎉 Github Copilot cheat sheet. Comment COPILOT for the files.",
                    "permalink": "https://instagram.com/p/mock4",
                    "media_type": "CAROUSEL_ALBUM",
                    "publish_date": datetime.datetime.now() - datetime.timedelta(days=10)
                }
            ]
            
        try:
            url = "https://graph.instagram.com/me/media"
            
            logger.info(f"Fetching media for {instagram_id}")
            logger.info(f"Token prefix: {access_token[:15]}...")
            logger.info(f"Using endpoint: {url}")
            
            params = {
                "fields": "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp",
                "access_token": access_token
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            logger.info(f"Instagram media response: {data}")
            
            if "error" in data:
                raise Exception(data["error"]["message"])
                
            posts = []
            for item in data.get("data", []):
                # Reels/Videos use thumbnail_url, images use media_url
                thumb = item.get("thumbnail_url") or item.get("media_url")
                pub_date = datetime.datetime.strptime(item.get("timestamp", ""), "%Y-%m-%dT%H:%M:%S%z") if item.get("timestamp") else datetime.datetime.now()
                
                posts.append({
                    "media_id": item["id"],
                    "thumbnail_url": thumb,
                    "caption": item.get("caption", ""),
                    "permalink": item.get("permalink", ""),
                    "media_type": item.get("media_type", "IMAGE"),
                    "publish_date": pub_date
                })
            return posts
        except Exception as e:
            logger.exception("Media fetch failed")
            raise

    @staticmethod
    def send_dm(
        access_token: str, 
        recipient_id: str, 
        message: str, 
        comment_id: str = None,
        media_id: str = None,
        account_id: str = None,
        page_access_token: str = None
    ) -> Dict[str, Any]:
        """
        Sends message to user's Instagram DM inbox via Graph API.
        Can use recipient_id or comment_id (for private replies to comments).
        """
        import json
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED DM] Sent to recipient {recipient_id} (comment {comment_id}): {message}")
            return {"recipient_id": recipient_id, "message_id": "mid.mock_dm_msg_id_123456789"}
            
        try:
            # For private replies to comments, Page Access Token is required. 
            # If page_access_token is provided, use it. Otherwise fall back to access_token.
            token_to_use = page_access_token if (comment_id and page_access_token) else access_token
            token_type = "Page Access Token" if token_to_use == page_access_token else "User Access Token"
            
            url = f"https://graph.facebook.com/v19.0/me/messages?access_token={token_to_use}"
            
            recipient = {}
            if comment_id:
                recipient["comment_id"] = comment_id
            else:
                # Strip user_ prefix if present
                clean_id = recipient_id.replace("user_", "")
                recipient["id"] = clean_id
                
            payload = {
                "recipient": recipient,
                "message": {"text": message}
            }
            
            logger.info(f"=== SEND_DM_CALLED ===")
            logger.info(f"SEND_DM_CALLED: recipient_id={recipient_id}, comment_id={comment_id}, media_id={media_id}, account_id={account_id}")
            logger.info(f"Endpoint: {url.split('?')[0]}")
            logger.info(f"TOKEN_SOURCE: token_type={token_type}, access_token={access_token[:15]}..., page_access_token={page_access_token[:15] if page_access_token else 'NULL'}...")
            logger.info(f"Payload: {json.dumps(payload)}")
            
            response = requests.post(url, json=payload, timeout=10)
            status_code = response.status_code
            data = response.json()
            
            logger.info(f"META_RESPONSE: method=POST, endpoint={url.split('?')[0]}, status_code={status_code}, body={json.dumps(data)}")
            
            if "error" in data:
                logger.error(f"DM Send FAILED: {data['error'].get('message')}")
                raise Exception(data["error"]["message"])
            return data
        except Exception as e:
            logger.exception("Error sending Instagram DM")
            raise Exception(f"Failed to deliver Instagram DM: {str(e)}")

    @staticmethod
    def send_comment_reply(
        access_token: str,
        comment_id: str,
        message: str,
        media_id: str = None,
        account_id: str = None,
        page_access_token: str = None
    ) -> Dict[str, Any]:
        """
        Sends a public reply to a comment using POST /{comment-id}/replies.
        """
        import json
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED COMMENT REPLY] Replied to comment {comment_id}: {message}")
            return {"id": f"mock_reply_{comment_id}"}
            
        try:
            # Comment replies can use User Access Token or Page Access Token.
            # We default to access_token (User Token) but support fallback.
            url = f"https://graph.facebook.com/v19.0/{comment_id}/replies"
            params = {
                "message": message,
                "access_token": access_token
            }
            
            logger.info(f"=== SEND_COMMENT_REPLY_CALLED ===")
            logger.info(f"SEND_COMMENT_REPLY_CALLED: comment_id={comment_id}, media_id={media_id}, account_id={account_id}")
            logger.info(f"Endpoint: {url}")
            logger.info(f"TOKEN_SOURCE: token_type=User Access Token, access_token={access_token[:15]}..., page_access_token={page_access_token[:15] if page_access_token else 'NULL'}...")
            
            response = requests.post(url, params=params, timeout=10)
            status_code = response.status_code
            data = response.json()
            
            logger.info(f"META_RESPONSE: method=POST, endpoint={url}, status_code={status_code}, body={json.dumps(data)}")
            
            if "error" in data and page_access_token:
                logger.warning("Failed with User Access Token. Trying fallback to Page Access Token...")
                params["access_token"] = page_access_token
                logger.info(f"TOKEN_SOURCE: token_type=Page Access Token (Fallback), access_token={access_token[:15]}..., page_access_token={page_access_token[:15]}...")
                response = requests.post(url, params=params, timeout=10)
                status_code = response.status_code
                data = response.json()
                logger.info(f"META_RESPONSE (Fallback): method=POST, endpoint={url}, status_code={status_code}, body={json.dumps(data)}")
                
            if "error" in data:
                logger.error(f"Comment reply status: FAILED. Error: {data['error'].get('message')}")
                raise Exception(data["error"]["message"])
                
            logger.info("Comment reply status: SUCCESS")
            return data
        except Exception as e:
            logger.exception("Error sending Instagram comment reply")
            raise Exception(f"Failed to deliver comment reply: {str(e)}")


    @staticmethod
    def subscribe_account(access_token: str, instagram_id: str) -> Dict[str, Any]:
        """
        Subscribes the Instagram account to the webhook changes (comments).
        """
        import json
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED SUBSCRIBE] Subscribed account {instagram_id} to webhooks.")
            return {"success": True}
            
        try:
            # Let's hit the subscribed_apps endpoint on graph.instagram.com first
            url = f"https://graph.instagram.com/v19.0/{instagram_id}/subscribed_apps"
            params = {
                "subscribed_fields": "comments,messages",
                "access_token": access_token
            }
            logger.info("=== WEBHOOK SUBSCRIPTION ATTEMPT ===")
            logger.info(f"Instagram ID: {instagram_id}")
            logger.info(f"Endpoint: {url}")
            
            response = requests.post(url, params=params, timeout=10)
            status_code = response.status_code
            data = response.json()
            logger.info(f"Subscription Response Code: {status_code}")
            logger.info(f"Subscription Response Body: {json.dumps(data)}")
            
            if "error" in data:
                # If graph.instagram.com fails, try graph.facebook.com as a fallback
                logger.warning("Failed on graph.instagram.com. Trying fallback to graph.facebook.com...")
                fb_url = f"https://graph.facebook.com/v19.0/{instagram_id}/subscribed_apps"
                fb_res = requests.post(fb_url, params=params, timeout=10)
                logger.info(f"Fallback Subscription Response Code: {fb_res.status_code}")
                logger.info(f"Fallback Subscription Response Body: {json.dumps(fb_res.json())}")
                data = fb_res.json()
                if "error" in data:
                    logger.error(f"Subscription status: FAILED. Error: {data['error'].get('message')}")
                    raise Exception(data["error"]["message"])
            
            logger.info("Subscription status: SUCCESS")
            return data
        except Exception as e:
            logger.exception("Failed to subscribe Instagram account to app webhooks")
            raise Exception(f"Failed to configure webhook subscription: {str(e)}")

    @staticmethod
    def get_subscription_status(access_token: str, instagram_id: str) -> Dict[str, Any]:
        """
        Retrieves webhook subscription status (subscribed fields) for this Instagram account.
        """
        if access_token.startswith("mock_") or not access_token:
            return {"data": [{"subscribed_fields": ["comments", "messages"]}], "simulated": True}
            
        try:
            url = f"https://graph.instagram.com/v19.0/{instagram_id}/subscribed_apps"
            params = {"access_token": access_token}
            logger.info(f"Fetching webhook subscription status. URL: {url}")
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            logger.info(f"Subscription status response: {data}")
            
            if "error" in data:
                # Fallback to graph.facebook.com
                fb_url = f"https://graph.facebook.com/v19.0/{instagram_id}/subscribed_apps"
                fb_res = requests.get(fb_url, params=params, timeout=10)
                data = fb_res.json()
                if "error" in data:
                    raise Exception(data["error"]["message"])
            return data
        except Exception as e:
            logger.warning(f"Could not retrieve webhook subscription status: {e}")
            return {"error": str(e), "data": []}

instagram_service = InstagramService()
