"""
UniQuery AI - FastAPI Backend
Main entry point for the API server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import auth, query, documents
from app.services.qdrant_service import get_qdrant_service
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:     %(message)s'
)
# Silence noisy loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting UniQuery AI API...")
    
    try:
        # Initialize Qdrant service
        qdrant = get_qdrant_service()
        
        # Create collection if it doesn't exist
        qdrant.create_collection()
        
        # Log collection info
        info = qdrant.get_collection_info()
        if info:
            logger.info(f"Qdrant collection ready: {info}")
        
        logger.info("✓ All services initialized successfully")
    except Exception as e:
        logger.error(f"✗ Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down UniQuery AI API...")


app = FastAPI(
    title="UniQuery AI API",
    description="AI-powered academic assistant backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(query.router, prefix="/api/query", tags=["Query"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])


@app.get("/")
async def root():
    return {
        "name": "UniQuery AI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint that verifies all services
    """
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check Qdrant
    try:
        qdrant = get_qdrant_service()
        qdrant_healthy = qdrant.health_check()
        collection_info = qdrant.get_collection_info()
        
        health_status["services"]["qdrant"] = {
            "status": "healthy" if qdrant_healthy else "unhealthy",
            "collection": collection_info
        }
    except Exception as e:
        health_status["services"]["qdrant"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status
