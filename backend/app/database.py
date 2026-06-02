from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
# SQLAlchemy 1.4+ requires "postgresql://" instead of the legacy "postgres://" scheme Render sets
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Handle SQLite connection arguments or PostgreSQL pool options
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,       # Auto-reconnect after connection drops
        pool_size=5,               # Prevent exceeding DB connection limits on Render free tiers
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
