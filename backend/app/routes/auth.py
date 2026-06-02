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

@router.post("/google", response_model=schemas.Token)
def google_login(google_payload: schemas.UserGoogleLogin, db: Session = Depends(get_db)):
    """
    Mock Google authentication callback. In production, this verifies the Google Client ID token.
    For local runs, it signs in/registers the user immediately.
    """
    token_str = google_payload.token
    # In production, we'd call google.oauth2.id_token.verify_oauth2_token(token_str, requests.Request(), GOOGLE_CLIENT_ID)
    # We will simulate Google validation here by extracting the mock email
    simulated_email = "kesava_google_user@gmail.com" if token_str == "mock_google_token" else token_str
    if "@" not in simulated_email:
        simulated_email = f"{simulated_email}@gmail.com"
        
    user = db.query(models.User).filter(models.User.email == simulated_email).first()
    if not user:
        # Create Google authenticated user
        user = models.User(
            email=simulated_email,
            full_name=simulated_email.split("@")[0].replace("_", " ").title(),
            google_id=f"g_{int(datetime.now().timestamp())}",
            role="creator"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Initialize default settings
        default_settings = models.SystemSettings(user_id=user.id)
        db.add(default_settings)
        db.commit()
        
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
