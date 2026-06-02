from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app import models, schemas, auth
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Copilot Utilities"])

@router.post("/suggest-keywords")
def suggest_keywords(
    payload: schemas.AIKeywordSuggestionInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns AI-suggested keywords based on automation name/description.
    """
    try:
        suggestions = ai_service.suggest_keywords(
            automation_name=payload.automation_name,
            description=payload.description
        )
        return {"keywords": suggestions}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/generate-reply")
def generate_reply(
    payload: schemas.AIAutoReplyInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Generates premium and engaging comment reply messages based on a user's style preference.
    """
    try:
        msg = ai_service.generate_auto_reply(
            prompt=payload.prompt,
            tone=payload.tone,
            resource_type=payload.resource_type
        )
        return {"message": msg}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
