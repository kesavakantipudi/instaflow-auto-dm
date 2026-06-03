import datetime
import logging
import requests
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class InstagramService:
    @staticmethod
    def exchange_code_for_token(code: str, redirect_uri: str) -> str:
        """
        Exchanges Facebook OAuth authorization code for a long-lived Facebook User Access Token.
        """
        from app.config import settings
        
        # Sandbox / local simulation support
        if code.startswith("mock_"):
            logger.info("Facebook OAuth: Using sandbox simulation mode.")
            return "mock_kesava_creator_token"
            
        logger.info(f"Facebook OAuth: Starting code exchange. Redirect URI: {redirect_uri}")
        try:
            # Step 1: Exchange code for short-lived user token
            url = "https://graph.facebook.com/v19.0/oauth/access_token"
            params = {
                "client_id": settings.META_CLIENT_ID,
                "client_secret": settings.META_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if "error" in data:
                error_msg = data["error"].get("message") if isinstance(data.get("error"), dict) else "Unknown error"
                logger.error(f"Facebook OAuth: Code exchange failed. Error: {error_msg}")
                raise Exception(error_msg)
                
            short_lived_token = data.get("access_token")
            if not short_lived_token:
                logger.error("Facebook OAuth: Code exchange succeeded but access_token is missing from response.")
                raise Exception("Access token missing in OAuth response")
                
            logger.info("Facebook OAuth: Short-lived user access token retrieved successfully.")
            
            # Step 2: Exchange short-lived token for long-lived (60 days) Facebook User token
            logger.info("Facebook OAuth: Requesting long-lived access token.")
            ll_params = {
                "grant_type": "fb_exchange_token",
                "client_id": settings.META_CLIENT_ID,
                "client_secret": settings.META_CLIENT_SECRET,
                "fb_exchange_token": short_lived_token
            }
            ll_response = requests.get(url, params=ll_params, timeout=10)
            ll_data = ll_response.json()
            
            if "error" in ll_data:
                ll_error = ll_data["error"].get("message") if isinstance(ll_data.get("error"), dict) else "Unknown error"
                logger.warning(f"Facebook OAuth: Long-lived token promotion failed. Falling back to short-lived token. Detail: {ll_error}")
                return short_lived_token
                
            long_lived_token = ll_data.get("access_token")
            if long_lived_token:
                logger.info("Facebook OAuth: Long-lived access token retrieved successfully.")
                return long_lived_token
                
            logger.warning("Facebook OAuth: Long-lived promotion returned empty token. Falling back to short-lived token.")
            return short_lived_token
        except Exception as e:
            logger.error(f"Facebook OAuth: Critical error during code exchange process: {e}")
            raise Exception(f"OAuth code exchange failed: {str(e)}")

    @staticmethod
    def get_account_info(access_token: str) -> Dict[str, Any]:
        """
        Gets details of connected professional Instagram account and its linked Facebook Page.
        """
        if access_token.startswith("mock_") or not access_token:
            logger.info("Instagram Profile API: Utilizing simulated sandbox account profile.")
            return {
                "id": "ig_creator_12345",
                "username": "kesava_ai_creator",
                "account_type": "business",
                "name": "Kesava | AI Engineering",
                "profile_picture_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                "page_id": "mock_page_id_12345",
                "page_access_token": "mock_page_access_token_12345"
            }
        
        logger.info("Instagram Profile API: Querying user's Facebook Pages to find linked Instagram Account")
        try:
            # 1. Fetch user's managed Facebook Pages and Page Access Tokens
            pages_url = "https://graph.facebook.com/v19.0/me/accounts"
            pages_res = requests.get(pages_url, params={"access_token": access_token}, timeout=10)
            pages_data = pages_res.json()
            
            if "error" in pages_data:
                error_msg = pages_data["error"].get("message") or "Failed to retrieve managed Pages"
                logger.error(f"Instagram Profile API: Pages lookup failed: {error_msg}")
                raise Exception(error_msg)
                
            pages = pages_data.get("data", [])
            if not pages:
                logger.error("Instagram Profile API: No managed Facebook Pages found for this user.")
                raise Exception("No managed Facebook Pages found. Make sure your Instagram Business profile is linked to a Facebook Page.")
                
            # 2. Iterate through Pages to find linked Instagram Business/Creator Account
            for page in pages:
                page_id = page.get("id")
                page_access_token = page.get("access_token")
                page_name = page.get("name")
                
                if not page_id or not page_access_token:
                    continue
                    
                # Query page details to get the instagram_business_account relation
                page_details_url = f"https://graph.facebook.com/v19.0/{page_id}"
                params = {
                    "fields": "instagram_business_account",
                    "access_token": page_access_token
                }
                res = requests.get(page_details_url, params=params, timeout=10)
                details = res.json()
                
                ig_account = details.get("instagram_business_account")
                if ig_account and "id" in ig_account:
                    ig_id = ig_account["id"]
                    logger.info(f"Instagram Profile API: Mapped Facebook Page '{page_name}' ({page_id}) to Instagram Account {ig_id}")
                    
                    # 3. Retrieve Instagram Profile details (username, name, profile_picture_url)
                    ig_profile_url = f"https://graph.facebook.com/v19.0/{ig_id}"
                    ig_params = {
                        "fields": "id,username,name,profile_picture_url",
                        "access_token": page_access_token
                    }
                    ig_res = requests.get(ig_profile_url, params=ig_params, timeout=10)
                    ig_data = ig_res.json()
                    
                    if "error" in ig_data:
                        ig_error = ig_data["error"].get("message") or "Failed to retrieve Instagram profile info"
                        logger.error(f"Instagram Profile API: Profile lookup failed: {ig_error}")
                        # Fallback to generic details if profile query fails
                        return {
                            "id": ig_id,
                            "username": f"instagram_user_{ig_id}",
                            "name": f"Instagram Account ({ig_id})",
                            "account_type": "business",
                            "profile_picture_url": None,
                            "page_id": page_id,
                            "page_access_token": page_access_token
                        }
                        
                    return {
                        "id": ig_id,
                        "username": ig_data.get("username") or f"instagram_user_{ig_id}",
                        "name": ig_data.get("name") or ig_data.get("username") or f"Instagram Account ({ig_id})",
                        "account_type": "business",
                        "profile_picture_url": ig_data.get("profile_picture_url"),
                        "page_id": page_id,
                        "page_access_token": page_access_token
                    }
                    
            logger.error("Instagram Profile API: No linked Instagram Business account found among managed Pages.")
            raise Exception("No linked Instagram Business profile was found. Please ensure your Instagram Account is configured as a Professional Account and linked to your Facebook Page.")
            
        except Exception as e:
            logger.error(f"Instagram Profile API: Critical error mapping Instagram account: {e}")
            raise Exception(f"Failed to resolve Instagram Business Profile: {str(e)}")

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
            url = f"https://graph.facebook.com/v19.0/{instagram_id}/media"
            
            logger.info(f"Fetching media for {instagram_id}")
            logger.info(f"Token prefix: {access_token[:15]}...")
            logger.info(f"Using endpoint: {url}")
            
            params = {
                "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
                "access_token": access_token
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if "error" in data:
                logger.error(f"Failed to fetch posts: {data['error'].get('message')}")
                raise Exception(data["error"]["message"])
                
            posts = []
            for item in data.get("data", []):
                publish_date = None
                if item.get("timestamp"):
                    try:
                        publish_date = datetime.datetime.strptime(item["timestamp"], "%Y-%m-%dT%H:%M:%S%z")
                    except Exception:
                        pass
                
                posts.append({
                    "media_id": item.get("id"),
                    "thumbnail_url": item.get("thumbnail_url") or item.get("media_url"),
                    "caption": item.get("caption"),
                    "permalink": item.get("permalink"),
                    "media_type": item.get("media_type"),
                    "publish_date": publish_date
                })
            return posts
        except Exception as e:
            logger.exception("Error getting Instagram posts")
            raise Exception(f"Failed to fetch posts from Instagram: {str(e)}")

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
        Prioritizes page_access_token for direct message delivery.
        """
        import json
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED DM] Sent to recipient {recipient_id} (comment {comment_id}): {message}")
            return {"recipient_id": recipient_id, "message_id": "mid.mock_dm_msg_id_123456789"}
            
        try:
            token_to_use = page_access_token if page_access_token else access_token
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
        Prioritizes page_access_token for comment reply delivery.
        """
        import json
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED COMMENT REPLY] Replied to comment {comment_id}: {message}")
            return {"id": f"mock_reply_{comment_id}"}
            
        try:
            token_to_use = page_access_token if page_access_token else access_token
            token_type = "Page Access Token" if token_to_use == page_access_token else "User Access Token"
            
            url = f"https://graph.facebook.com/v19.0/{comment_id}/replies"
            params = {
                "message": message,
                "access_token": token_to_use
            }
            
            logger.info(f"=== SEND_COMMENT_REPLY_CALLED ===")
            logger.info(f"SEND_COMMENT_REPLY_CALLED: comment_id={comment_id}, media_id={media_id}, account_id={account_id}")
            logger.info(f"Endpoint: {url}")
            logger.info(f"TOKEN_SOURCE: token_type={token_type}, access_token={access_token[:15]}..., page_access_token={page_access_token[:15] if page_access_token else 'NULL'}...")
            
            response = requests.post(url, params=params, timeout=10)
            status_code = response.status_code
            data = response.json()
            
            logger.info(f"META_RESPONSE: method=POST, endpoint={url}, status_code={status_code}, body={json.dumps(data)}")
            
            if "error" in data:
                logger.error(f"Comment reply status: FAILED. Error: {data['error'].get('message')}")
                raise Exception(data["error"]["message"])
                
            logger.info("Comment reply status: SUCCESS")
            return data
        except Exception as e:
            logger.exception("Error sending Instagram comment reply")
            raise Exception(f"Failed to deliver comment reply: {str(e)}")

    @staticmethod
    def subscribe_account(access_token: str, instagram_id: str, page_access_token: str = None) -> Dict[str, Any]:
        """
        Subscribes the Instagram account to the webhook changes (comments).
        """
        import json
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED SUBSCRIBE] Subscribed account {instagram_id} to webhooks.")
            return {"success": True}
            
        try:
            token_to_use = page_access_token if page_access_token else access_token
            url = f"https://graph.facebook.com/v19.0/{instagram_id}/subscribed_apps"
            params = {
                "subscribed_fields": "comments,messages",
                "access_token": token_to_use
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
                logger.error(f"Subscription status: FAILED. Error: {data['error'].get('message')}")
                raise Exception(data["error"]["message"])
            
            logger.info("Subscription status: SUCCESS")
            return data
        except Exception as e:
            logger.exception("Failed to subscribe Instagram account to app webhooks")
            raise Exception(f"Failed to configure webhook subscription: {str(e)}")

    @staticmethod
    def get_subscription_status(access_token: str, instagram_id: str, page_access_token: str = None) -> Dict[str, Any]:
        """
        Retrieves webhook subscription status (subscribed fields) for this Instagram account.
        """
        if access_token.startswith("mock_") or not access_token:
            return {"data": [{"subscribed_fields": ["comments", "messages"]}], "simulated": True}
            
        try:
            token_to_use = page_access_token if page_access_token else access_token
            url = f"https://graph.facebook.com/v19.0/{instagram_id}/subscribed_apps"
            params = {"access_token": token_to_use}
            logger.info(f"Fetching webhook subscription status. URL: {url}")
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            logger.info(f"Subscription status response: {data}")
            
            if "error" in data:
                raise Exception(data["error"]["message"])
            return data
        except Exception as e:
            logger.warning(f"Could not retrieve webhook subscription status: {e}")
            return {"error": str(e), "data": []}

instagram_service = InstagramService()
