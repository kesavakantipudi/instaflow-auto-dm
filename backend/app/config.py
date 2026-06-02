import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "InstaFlow Auto DM"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./instaflow.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-instaflow-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Meta Instagram configuration
    META_CLIENT_ID: str = os.getenv("META_CLIENT_ID", "")
    META_CLIENT_SECRET: str = os.getenv("META_CLIENT_SECRET", "")
    META_VERIFY_TOKEN: str = os.getenv("META_VERIFY_TOKEN", "instaflow_verify_token")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
