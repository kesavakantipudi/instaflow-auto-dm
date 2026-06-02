import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "creator"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserGoogleLogin(BaseModel):
    token: str  # Google ID token

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# Instagram Account Schemas
class InstagramAccountBase(BaseModel):
    id: str
    username: str
    account_type: str = "business"
    webhook_status: bool = True
    is_connected: bool = True

class InstagramAccountCreate(InstagramAccountBase):
    access_token: str
    page_id: Optional[str] = None
    page_access_token: Optional[str] = None

class InstagramAccountOut(InstagramAccountBase):
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# Automation Keyword Schemas
class AutomationKeywordBase(BaseModel):
    keyword: str

class AutomationKeywordOut(AutomationKeywordBase):
    id: int
    automation_id: str
    
    class Config:
        from_attributes = True

# Automation Post Schemas
class AutomationPostBase(BaseModel):
    media_id: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    permalink: Optional[str] = None
    media_type: Optional[str] = None
    publish_date: Optional[datetime.datetime] = None

class AutomationPostOut(AutomationPostBase):
    id: int
    automation_id: str
    
    class Config:
        from_attributes = True

# Automation Schemas
class AutomationBase(BaseModel):
    name: str
    instagram_account_id: str
    status: str = "active"
    trigger_type: str = "keyword"
    scope_type: str = "all_posts"
    comment_filter_type: str = "exact"
    message_template: str
    follow_ups: List[Dict[str, Any]] = []
    attachments: List[Dict[str, Any]] = []

class AutomationCreate(AutomationBase):
    keywords: List[str] = []
    posts: List[AutomationPostBase] = []

class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    trigger_type: Optional[str] = None
    scope_type: Optional[str] = None
    comment_filter_type: Optional[str] = None
    message_template: Optional[str] = None
    follow_ups: Optional[List[Dict[str, Any]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    keywords: Optional[List[str]] = None
    posts: Optional[List[AutomationPostBase]] = None

class AutomationOut(AutomationBase):
    id: str
    user_id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    keywords: List[AutomationKeywordOut] = []
    posts: List[AutomationPostOut] = []
    
    class Config:
        from_attributes = True

# System Settings Schemas
class SystemSettingsBase(BaseModel):
    verify_token: str
    access_token: str
    app_id: str
    app_secret: str
    default_dm_message: str
    timezone: str

class SystemSettingsOut(SystemSettingsBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True

class SystemSettingsUpdate(BaseModel):
    verify_token: Optional[str] = None
    access_token: Optional[str] = None
    app_id: Optional[str] = None
    app_secret: Optional[str] = None
    default_dm_message: Optional[str] = None
    timezone: Optional[str] = None

# Activity Log Schemas
class ActivityLogOut(BaseModel):
    id: str
    user_id: int
    instagram_account_id: str
    automation_id: Optional[str] = None
    username: str
    comment_id: str
    comment_text: str
    trigger_matched: Optional[str] = None
    dm_sent: str
    status: str
    error_detail: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# Webhook Log Schemas
class WebhookLogOut(BaseModel):
    id: str
    payload: Dict[str, Any]
    status: str
    error_message: Optional[str] = None
    created_at: datetime.datetime
    
    class Config:
        from_attributes = True

# Simulation input
class WebhookSimulateInput(BaseModel):
    username: str
    comment_text: str
    media_id: str
    instagram_account_id: str
    automation_id: Optional[str] = None

# AI Helper inputs
class AIKeywordSuggestionInput(BaseModel):
    automation_name: str
    description: Optional[str] = ""

class AIAutoReplyInput(BaseModel):
    prompt: str
    tone: Optional[str] = "friendly"  # friendly, professional, casual, exciting
    resource_type: Optional[str] = "playlist"  # playlist, pdf, notions, link
