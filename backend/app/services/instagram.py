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
            return "mock_kesava_creator_token"
            
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
                raise Exception(error_msg)
                
            short_lived_token = data["access_token"]
            
            # Step 2: Exchange short-lived token for long-lived (60 days) token
            long_lived_url = "https://graph.instagram.com/access_token"
            params = {
                "grant_type": "ig_exchange_token",
                "client_secret": settings.META_CLIENT_SECRET,
                "access_token": short_lived_token
            }
            ll_response = requests.get(long_lived_url, params=params, timeout=10)
            ll_data = ll_response.json()
            if "error" in ll_data:
                # Fallback to short-lived token
                return short_lived_token
                
            return ll_data.get("access_token") or short_lived_token
        except Exception as e:
            logger.error(f"Error exchanging authorization code: {e}")
            raise Exception(f"OAuth code exchange failed: {str(e)}")

    @staticmethod
    def get_account_info(access_token: str) -> Dict[str, Any]:
        """
        Gets details of connected business account. Falls back to mock data if it is a mock token.
        """
        if access_token.startswith("mock_") or not access_token:
            return {
                "id": "ig_creator_12345",
                "username": "kesava_ai_creator",
                "account_type": "business",
                "name": "Kesava | AI Engineering",
                "profile_picture_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
        
        try:
            # Meta Graph API query
            url = f"https://graph.facebook.com/v19.0/me?fields=id,name,accounts{{instagram_business_account{{id,username,name,profile_picture_url}}}}&access_token={access_token}"
            response = requests.get(url, timeout=10)
            data = response.json()
            if "error" in data:
                raise Exception(data["error"]["message"])
            
            # Extract Instagram Business Account details
            pages = data.get("accounts", {}).get("data", [])
            if not pages:
                raise Exception("No connected Facebook Pages found.")
                
            for page in pages:
                ig_acct = page.get("instagram_business_account")
                if ig_acct:
                    return {
                        "id": ig_acct["id"],
                        "username": ig_acct.get("username", "instagram_user"),
                        "name": ig_acct.get("name", "Creator Account"),
                        "page_id": page["id"],
                        "page_access_token": page.get("access_token"),
                        "profile_picture_url": ig_acct.get("profile_picture_url")
                    }
            raise Exception("No Instagram Business Accounts linked to your Facebook Pages.")
        except Exception as e:
            logger.error(f"Error fetching Instagram account info: {e}")
            raise Exception(f"Meta Graph API connection failed: {str(e)}")

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
            url = f"https://graph.facebook.com/v19.0/{instagram_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&access_token={access_token}&limit=20"
            response = requests.get(url, timeout=10)
            data = response.json()
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
            logger.error(f"Error fetching media posts: {e}")
            return []

    @staticmethod
    def send_dm(access_token: str, recipient_id: str, message: str) -> Dict[str, Any]:
        """
        Sends message to user's Instagram DM inbox via Graph API.
        """
        if access_token.startswith("mock_") or not access_token:
            logger.info(f"[SIMULATED DM] Sent to recipient {recipient_id}: {message}")
            return {"recipient_id": recipient_id, "message_id": "mid.mock_dm_msg_id_123456789"}
            
        try:
            url = f"https://graph.facebook.com/v19.0/me/messages?access_token={access_token}"
            payload = {
                "recipient": {"id": recipient_id},
                "message": {"text": message}
            }
            response = requests.post(url, json=payload, timeout=10)
            data = response.json()
            if "error" in data:
                raise Exception(data["error"]["message"])
            return data
        except Exception as e:
            logger.error(f"Error sending DM: {e}")
            raise Exception(f"Failed to deliver Instagram DM: {str(e)}")

instagram_service = InstagramService()
