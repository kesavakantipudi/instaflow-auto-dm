from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )
        
    hashed_pwd = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Initialize default settings for user
    default_settings = models.SystemSettings(user_id=new_user.id)
    db.add(default_settings)
    db.commit()
    
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.full_name or user.email.split("@")[0]
    }

import requests
from app.config import settings

@router.post("/google", response_model=schemas.Token)
def google_login(google_payload: schemas.UserGoogleLogin, db: Session = Depends(get_db)):
    """
    Real Google authentication callback. Verifies the Google Client ID token.
    For local sandbox runs, it falls back to mock_google_token only if GOOGLE_CLIENT_ID is not configured.
    """
    token_str = google_payload.token
    
    if token_str == "mock_google_token":
        # Allow mock validation ONLY in local sandbox mode where GOOGLE_CLIENT_ID is not set
        if settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mock Google login is disabled in production."
            )
        email = "kesava_google_user@gmail.com"
        google_id = "mock_google_id_12345"
        name = "Kesava Mock User"
    else:
        # Verify the ID token via Google Tokeninfo API
        try:
            res = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={token_str}",
                timeout=5
            )
            if res.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired Google ID token."
                )
            
            token_info = res.json()
            
            # Verify the audience matches our GOOGLE_CLIENT_ID if it is set
            if settings.GOOGLE_CLIENT_ID:
                aud = token_info.get("aud")
                if aud != settings.GOOGLE_CLIENT_ID:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google token audience mismatch. Unauthorized client application."
                    )
            
            # Ensure the email is verified
            if token_info.get("email_verified") not in ["true", True]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google account email is not verified."
                )
                
            email = token_info.get("email")
            google_id = token_info.get("sub")
            name = token_info.get("name") or email.split("@")[0].replace("_", " ").title()
            
            if not email or not google_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Incomplete Google token information."
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google OAuth verification failed: {str(e)}"
            )

    # Search for user by email
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Create Google authenticated user
        user = models.User(
            email=email,
            full_name=name,
            google_id=google_id,
            role="creator"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Initialize default settings
        default_settings = models.SystemSettings(user_id=user.id)
        db.add(default_settings)
        db.commit()
    else:
        # If the user exists but didn't have Google login linked yet, link it
        if not user.google_id:
            user.google_id = google_id
            db.commit()
            db.refresh(user)
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.full_name or user.email.split("@")[0]
    }
