"""
Qdrant Vector Database Service
Handles all interactions with Qdrant Cloud
"""

from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    SearchRequest
)
from sentence_transformers import SentenceTransformer
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class QdrantService:
    """Service for managing Qdrant vector database operations"""
    
    def __init__(self):
        """Initialize Qdrant client and embedding model"""
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30
        )
        self.collection_name = settings.qdrant_collection_name
        self.embedding_model = SentenceTransformer(settings.embedding_model)
        self.embedding_dimension = settings.embedding_dimension
        
        logger.info(f"Qdrant service initialized with collection: {self.collection_name}")
    
    def create_collection(self) -> bool:
        """
        Create the Qdrant collection if it doesn't exist.
        Returns True if created or already exists.
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections().collections
            collection_names = [col.name for col in collections]
            
            if self.collection_name in collection_names:
                logger.info(f"Collection '{self.collection_name}' already exists")
                # Ensure index exists on existing collection
                self.ensure_doc_id_index()
                return True
            
            # Create collection with cosine similarity
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dimension,
                    distance=Distance.COSINE
                )
            )
            
            # Create payload index for doc_id to enable fast filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="doc_id",
                field_schema="keyword"
            )
            
            # Create additional indices for filtering
            for field in ["program", "department", "semester", "category", "title", "version"]:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema="keyword"
                )
            
            logger.info(f"Collection '{self.collection_name}' created successfully with doc_id index")
            return True
            
        except Exception as e:
            logger.error(f"Error creating collection: {e}")
            return False
    
    def ensure_doc_id_index(self) -> bool:
        """
        Ensure that the doc_id payload index exists.
        Creates it if it doesn't exist.
        """
        try:
            # Try to create the index - if it already exists, Qdrant will handle it gracefully
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="doc_id",
                field_schema="keyword"
            )
            
            # Ensure other indices exist too
            for field in ["program", "department", "semester", "category", "title", "version"]:
                 self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema="keyword"
                )
                
            logger.info(f"Ensured indices exist on collection '{self.collection_name}'")
            return True
        except Exception as e:
            # Index might already exist, which is fine
            logger.debug(f"Index creation attempted: {e}")
            return True
    
    def get_collection_info(self) -> Optional[Dict[str, Any]]:
        """Get information about the collection"""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "name": self.collection_name,
                "points_count": info.points_count,
                "vectors_count": info.points_count,  # In newer versions, vectors_count = points_count
                "status": info.status
            }
        except Exception as e:
            logger.error(f"Error getting collection info: {e}")
            return None
    
    def embed_text(self, text: str) -> List[float]:
        """
        Convert text to embedding vector using bge-small-en model.
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            embedding = self.embedding_model.encode(text, normalize_embeddings=True)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error embedding text: {e}")
            raise
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embed multiple texts in batch for efficiency.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            embeddings = self.embedding_model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=True
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error batch embedding: {e}")
            raise
    
    def insert_documents(
        self,
        chunks: List[str],
        metadata: List[Dict[str, Any]]
    ) -> bool:
        """
        Insert document chunks with metadata into Qdrant.
        
        Args:
            chunks: List of text chunks
            metadata: List of metadata dicts (one per chunk)
            
        Returns:
            True if successful
        """
        try:
            # Generate embeddings for all chunks
            embeddings = self.embed_batch(chunks)
            
            # Create points for Qdrant
            points = []
            for idx, (chunk, embedding, meta) in enumerate(zip(chunks, embeddings, metadata)):
                point = PointStruct(
                    id=meta.get("id", idx),
                    vector=embedding,
                    payload={
                        "text": chunk,
                        "program": meta.get("program"),
                        "department": meta.get("department"),
                        "semester": meta.get("semester"),
                        "category": meta.get("category"),
                        "doc_id": meta.get("doc_id"),
                        "page": meta.get("page"),
                        "title": meta.get("title"),
                        "version": meta.get("version")
                    }
                )
                points.append(point)
            
            # Upload to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"Inserted {len(points)} chunks into Qdrant")
            return True
            
        except Exception as e:
            logger.error(f"Error inserting documents: {e}")
            return False
    
    def search(
        self,
        query: str,
        limit: int = 5,
        program: Optional[str] = None,
        department: Optional[str] = None,
        semester: Optional[int] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Semantic search with optional metadata filtering.
        
        Args:
            query: Natural language query
            limit: Maximum number of results
            program: Filter by academic program
            department: Filter by department
            semester: Filter by semester
            category: Filter by document category
            
        Returns:
            List of search results with text and metadata
        """
        try:
            # Embed the query
            query_vector = self.embed_text(query)
            
            # Build filter conditions
            filter_conditions = []
            
            if program and program != "All":
                filter_conditions.append(
                    FieldCondition(key="program", match=MatchValue(value=program))
                )
            
            if department and department != "All":
                filter_conditions.append(
                    FieldCondition(key="department", match=MatchValue(value=department))
                )
            
            if semester and semester != 0:
                filter_conditions.append(
                    FieldCondition(key="semester", match=MatchValue(value=semester))
                )
                
            if category and category != "all":
                filter_conditions.append(
                    FieldCondition(key="category", match=MatchValue(value=category))
                )
            
            # Create Qdrant filter if we have conditions
            qdrant_filter = None
            if filter_conditions:
                qdrant_filter = Filter(must=filter_conditions)
                logger.info(f"Applying filters: program={program}, dept={department}, sem={semester}, cat={category}")
            
            # Perform search with filters
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                query_filter=qdrant_filter,
                limit=limit,
                with_payload=True
            )
            results = response.points
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "text": result.payload.get("text"),
                    "score": result.score,
                    "title": result.payload.get("title"),
                    "page": result.payload.get("page"),
                    "category": result.payload.get("category"),
                    "program": result.payload.get("program"),
                    "department": result.payload.get("department"),
                    "semester": result.payload.get("semester"),
                    "doc_id": result.payload.get("doc_id")
                })
            
            logger.info(f"Search returned {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching: {e}")
            return []
    
    def delete_by_doc_id(self, doc_id: str) -> int:
        """
        Delete all chunks belonging to a specific document.
        
        Args:
            doc_id: Document ID to delete
            
        Returns:
            Number of points deleted
        """
        try:
            # First, scroll to get all point IDs for this doc_id
            # This works even without an index
            points = []
            offset = None
            
            while True:
                result = self.client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=None,  # No filter - scan all
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False
                )
                
                batch_points, next_offset = result
                
                # Filter points by doc_id in memory
                for point in batch_points:
                    if point.payload.get('doc_id') == doc_id:
                        points.append(point.id)
                
                if next_offset is None:
                    break
                offset = next_offset
            
            if not points:
                logger.warning(f"No chunks found for document: {doc_id}")
                return 0
            
            # Delete all matching points
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=points
            )
            
            logger.info(f"Deleted {len(points)} chunks for document: {doc_id}")
            return len(points)
            
        except Exception as e:
            logger.error(f"Error deleting document chunks: {e}")
            raise
    
    def health_check(self) -> bool:
        """Check if Qdrant connection is healthy"""
        try:
            collections = self.client.get_collections()
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False


# Singleton instance
_qdrant_service: Optional[QdrantService] = None


def get_qdrant_service() -> QdrantService:
    """Get or create Qdrant service singleton"""
    global _qdrant_service
    if _qdrant_service is None:
        _qdrant_service = QdrantService()
    return _qdrant_service
