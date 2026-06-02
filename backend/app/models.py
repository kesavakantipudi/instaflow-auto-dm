import datetime
import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth accounts
    full_name = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    role = Column(String, default="creator")  # "admin" or "creator"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    accounts = relationship("InstagramAccount", back_populates="user", cascade="all, delete-orphan")
    automations = relationship("Automation", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("SystemSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

class InstagramAccount(Base):
    __tablename__ = "instagram_accounts"
    
    id = Column(String, primary_key=True, index=True)  # Instagram User ID
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    username = Column(String, nullable=False)
    account_type = Column(String, default="business")  # business / creator
    access_token = Column(String, nullable=False)
    page_id = Column(String, nullable=True)  # Connected Facebook Page ID
    page_access_token = Column(String, nullable=True)
    webhook_status = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    automations = relationship("Automation", back_populates="account", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="account", cascade="all, delete-orphan")

class Automation(Base):
    __tablename__ = "automations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    instagram_account_id = Column(String, ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="active")  # active, paused, disabled
    
    # Trigger parameters
    trigger_type = Column(String, default="keyword")  # keyword, all, contains_any, regex, ai_intent
    scope_type = Column(String, default="all_posts")  # all_posts, selected_posts, selected_reels, latest_post
    comment_filter_type = Column(String, default="exact")  # exact, case_insensitive, starts_with, ends_with, contains, ai_semantic
    
    # Response details
    message_template = Column(Text, nullable=False)
    follow_ups = Column(JSON, default=list)  # List of follow-ups: [{"delay_hours": 24, "message": "..."}]
    attachments = Column(JSON, default=list)  # List of links/resources: [{"type": "pdf", "url": "..."}]
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="automations")
    account = relationship("InstagramAccount", back_populates="automations")
    keywords = relationship("AutomationKeyword", back_populates="automation", cascade="all, delete-orphan")
    posts = relationship("AutomationPost", back_populates="automation", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="automation")

class AutomationKeyword(Base):
    __tablename__ = "automation_keywords"
    
    id = Column(Integer, primary_key=True, index=True)
    automation_id = Column(String, ForeignKey("automations.id", ondelete="CASCADE"), nullable=False, index=True)
    keyword = Column(String, index=True, nullable=False)
    
    # Relationships
    automation = relationship("Automation", back_populates="keywords")

class AutomationPost(Base):
    __tablename__ = "automation_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    automation_id = Column(String, ForeignKey("automations.id", ondelete="CASCADE"), nullable=False, index=True)
    media_id = Column(String, index=True, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    caption = Column(Text, nullable=True)
    permalink = Column(Text, nullable=True)
    media_type = Column(String, nullable=True)  # IMAGE, VIDEO, CAROUSEL_ALBUM
    publish_date = Column(DateTime, nullable=True)
    
    # Relationships
    automation = relationship("Automation", back_populates="posts")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    instagram_account_id = Column(String, ForeignKey("instagram_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    automation_id = Column(String, ForeignKey("automations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    username = Column(String, nullable=False)  # Commenter's username
    comment_id = Column(String, unique=True, index=True, nullable=False)
    comment_text = Column(Text, nullable=False)
    trigger_matched = Column(String, nullable=True)  # Keyword or trigger type that matched
    dm_sent = Column(Text, nullable=False)  # The generated message that was sent
    status = Column(String, default="success")  # success, failed
    error_detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    account = relationship("InstagramAccount", back_populates="activity_logs")
    automation = relationship("Automation", back_populates="activity_logs")

class WebhookLog(Base):
    __tablename__ = "webhook_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    payload = Column(JSON, nullable=False)
    status = Column(String, default="success")  # success, ignored, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    verify_token = Column(String, default="instaflow_verify_token")
    access_token = Column(String, default="")
    app_id = Column(String, default="")
    app_secret = Column(String, default="")
    default_dm_message = Column(Text, default="Hey {username}! Thanks for commenting. Here is your resource!")
    timezone = Column(String, default="UTC")
    
    # Relationships
    user = relationship("User", back_populates="settings")
