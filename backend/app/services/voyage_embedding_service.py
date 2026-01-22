"""
Voyage AI Embedding Service
Cloud-based embeddings to replace local sentence-transformers
"""

import httpx
import logging
from typing import List, Optional
from functools import lru_cache

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Voyage AI API configuration
VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
VOYAGE_MODEL = "voyage-3-lite"  # 512 dimensions, good balance of speed/quality
VOYAGE_DIMENSION = 512
MAX_BATCH_SIZE = 128  # Voyage AI limit


class VoyageEmbeddingService:
    """Service for generating embeddings via Voyage AI API"""
    
    def __init__(self):
        """Initialize the Voyage AI client"""
        self.api_key = settings.voyage_api_key
        if not self.api_key:
            raise ValueError("VOYAGE_API_KEY environment variable is not set")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.model = VOYAGE_MODEL
        self.dimension = VOYAGE_DIMENSION
        
        logger.info(f"Voyage AI embedding service initialized (model: {self.model}, dim: {self.dimension})")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector (1024 dimensions)
        """
        embeddings = self.embed_batch([text])
        return embeddings[0]
    
    def embed_batch(self, texts: List[str], show_progress: bool = False) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in batch.
        
        Args:
            texts: List of texts to embed
            show_progress: Whether to log progress (for large batches)
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        all_embeddings = []
        total_batches = (len(texts) + MAX_BATCH_SIZE - 1) // MAX_BATCH_SIZE
        
        for batch_idx in range(0, len(texts), MAX_BATCH_SIZE):
            batch = texts[batch_idx:batch_idx + MAX_BATCH_SIZE]
            batch_num = batch_idx // MAX_BATCH_SIZE + 1
            
            if show_progress or len(texts) > MAX_BATCH_SIZE:
                logger.info(f"Embedding batch {batch_num}/{total_batches} ({len(batch)} texts)")
            
            try:
                with httpx.Client(timeout=60.0) as client:
                    response = client.post(
                        VOYAGE_API_URL,
                        headers=self.headers,
                        json={
                            "model": self.model,
                            "input": batch,
                            "input_type": "document"  # Use "query" for search queries
                        }
                    )
                    response.raise_for_status()
                    
                    data = response.json()
                    batch_embeddings = [item["embedding"] for item in data["data"]]
                    all_embeddings.extend(batch_embeddings)
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"Voyage AI API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Error calling Voyage AI: {e}")
                raise
        
        return all_embeddings
    
    def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a search query.
        Uses input_type="query" for better search performance.
        
        Args:
            query: Search query text
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    VOYAGE_API_URL,
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "input": [query],
                        "input_type": "query"  # Optimized for search queries
                    }
                )
                response.raise_for_status()
                
                data = response.json()
                return data["data"][0]["embedding"]
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Voyage AI API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error calling Voyage AI: {e}")
            raise


# Singleton instance
_voyage_service: Optional[VoyageEmbeddingService] = None


def get_voyage_embedding_service() -> VoyageEmbeddingService:
    """Get or create Voyage embedding service singleton"""
    global _voyage_service
    if _voyage_service is None:
        _voyage_service = VoyageEmbeddingService()
    return _voyage_service
