"""
main.py — FastAPI entry point
Run with:  uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI(
    title="CRUD Architect API",
    description="Prompt-Based Web Application Generator for CRUD Systems",
    version="1.0.0",
)

# Allow requests from the frontend (adjust origin in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes from routes.py
app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "CRUD Architect API is running",
        "docs":    "/docs",
        "redoc":   "/redoc",
    }
