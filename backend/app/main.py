"""
UniQuery AI - FastAPI Backend
Main entry point for the API server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, query, documents

app = FastAPI(
    title="UniQuery AI API",
    description="AI-powered academic assistant backend",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])


@app.get("/")
async def root():
    return {
        "name": "UniQuery AI API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
