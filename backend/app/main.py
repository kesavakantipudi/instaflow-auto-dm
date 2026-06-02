import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth, accounts, automations, webhooks, analytics, logs, settings as settings_route, ai

# Initialize Database tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing database: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API and comment-to-DM automation webhook triggers for Instagram.",
    version="1.0.0"
)

# Enable CORS for localhost frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify front-end domain e.g. ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach router packages
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(automations.router)
app.include_router(webhooks.router)
app.include_router(analytics.router)
app.include_router(logs.router)
app.include_router(settings_route.router)
app.include_router(ai.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "database": settings.DATABASE_URL.split("///")[-1]  # Mask connection secrets
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
