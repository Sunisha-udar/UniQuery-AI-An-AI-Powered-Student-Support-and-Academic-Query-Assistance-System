"""
Debug router for testing Render deployment
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging

from app.services.qdrant_service import get_qdrant_service
from app.services.voyage_embedding_service import get_voyage_embedding_service
from app.config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)

class DebugResponse(BaseModel):
    status: str
    details: Dict[str, Any]


@router.get("/embedding-test", response_model=DebugResponse)
async def test_embedding():
    """Test if Voyage AI embedding is working"""
    try:
        # Get the embedding service
        voyage_service = get_voyage_embedding_service()
        
        # Try to generate an embedding for a simple query
        test_query = "attendance policy"
        logger.info(f"Testing embedding generation for: '{test_query}'")
        
        embedding = voyage_service.embed_query(test_query)
        
        return DebugResponse(
            status="success",
            details={
                "test_query": test_query,
                "embedding_dimension": len(embedding),
                "embedding_sample": embedding[:5],  # First 5 values
                "voyage_model": voyage_service.model,
                "expected_dimension": voyage_service.dimension
            }
        )
        
    except Exception as e:
        logger.error(f"Embedding test failed: {e}")
        return DebugResponse(
            status="failed",
            details={
                "error": str(e),
                "error_type": type(e).__name__
            }
        )


@router.get("/qdrant-test", response_model=DebugResponse)
async def test_qdrant():
    """Test Qdrant search functionality"""
    try:
        # Get the Qdrant service
        qdrant_service = get_qdrant_service()
        
        # Test search with a known query
        test_query = "attendance"
        logger.info(f"Testing Qdrant search for: '{test_query}'")
        
        results = qdrant_service.search(query=test_query, limit=3)
        
        return DebugResponse(
            status="success",
            details={
                "test_query": test_query,
                "results_count": len(results),
                "collection_name": qdrant_service.collection_name,
                "sample_results": [
                    {
                        "title": r.get("title"),
                        "score": r.get("score"),
                        "text_preview": r.get("text", "")[:100]
                    }
                    for r in results[:2]
                ] if results else []
            }
        )
        
    except Exception as e:
        logger.error(f"Qdrant test failed: {e}")
        return DebugResponse(
            status="failed",
            details={
                "error": str(e),
                "error_type": type(e).__name__
            }
        )


@router.get("/env-check", response_model=DebugResponse)
async def check_environment():
    """Check critical environment variables"""
    settings = get_settings()
    
    return DebugResponse(
        status="success",
        details={
            "qdrant_url": settings.qdrant_url[:50] + "..." if settings.qdrant_url else "NOT SET",
            "qdrant_collection": settings.qdrant_collection_name,
            "qdrant_api_key": "SET" if settings.qdrant_api_key else "NOT SET",
            "voyage_api_key": "SET" if settings.voyage_api_key else "NOT SET",
            "groq_api_key": "SET" if settings.groq_api_key else "NOT SET",
            "embedding_dimension": settings.embedding_dimension,
            "groq_model": settings.groq_model
        }
    )
