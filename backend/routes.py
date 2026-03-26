"""
routes.py — API route definitions
Registers the /generate endpoint that the frontend calls.
"""

from fastapi import APIRouter, HTTPException
from models import GenerateRequest, GenerateResponse
from ai_engine.generator import generate_crud_app

router = APIRouter(prefix="/api", tags=["Generator"])


@router.post("/generate", response_model=GenerateResponse)
def generate_app(request: GenerateRequest):
    """
    Accept a plain-English prompt and return a full CRUD architecture:
      - Entities / models
      - REST API endpoints
      - Database schema
      - Sample FastAPI code
      - AI improvement suggestions
    """
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    result = generate_crud_app(request.prompt.strip())
    return result


@router.get("/health")
def health_check():
    """Simple health-check endpoint."""
    return {"status": "ok"}
