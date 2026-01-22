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
            timeout=120  # Increased for large document uploads
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
                logger.debug(f"Collection '{self.collection_name}' already exists")
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
            for field in ["program", "department", "category", "title"]:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema="keyword"
                )
            
            # Create integer indices
            for field in ["semester", "version", "page"]:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema="integer"
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
            for field in ["program", "department", "category", "title"]:
                 self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema="keyword"
                )
            
            for field in ["semester", "version", "page"]:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema="integer"
                )
                
            logger.debug(f"Ensured indices exist on collection '{self.collection_name}'")
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
            if not chunks or not metadata:
                logger.error("Empty chunks or metadata provided")
                return False
                
            if len(chunks) != len(metadata):
                logger.error(f"Chunks ({len(chunks)}) and metadata ({len(metadata)}) length mismatch")
                return False
            
            logger.info(f"Starting to embed {len(chunks)} chunks...")
            
            # Generate embeddings for all chunks
            embeddings = self.embed_batch(chunks)
            
            logger.debug(f"Generated {len(embeddings)} embeddings")
            
            # Create points for Qdrant
            points = []
            for idx, (chunk, embedding, meta) in enumerate(zip(chunks, embeddings, metadata)):
                # Ensure all required fields are present and properly typed
                point_id = meta.get("id", f"chunk_{idx}")
                
                # Clean and validate metadata
                payload = {
                    "text": str(chunk) if chunk else "",
                    "program": str(meta.get("program", "Unknown")),
                    "department": str(meta.get("department", "Unknown")),
                    "semester": int(meta.get("semester", 0)),
                    "category": str(meta.get("category", "Unknown")),
                    "doc_id": str(meta.get("doc_id", "unknown")),
                    "page": int(meta.get("page", 1)),
                    "title": str(meta.get("title", "Untitled")),
                    "version": int(meta.get("version", 1))
                }
                
                point = PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                )
                points.append(point)
            
            logger.debug(f"Created {len(points)} points for insertion")
            
            # Upload to Qdrant in batches with retry logic
            batch_size = 100
            max_retries = 3
            
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                batch_num = i//batch_size + 1
                total_batches = (len(points) + batch_size - 1)//batch_size
                
                # Retry logic for each batch
                for attempt in range(max_retries):
                    try:
                        logger.debug(f"Inserting batch {batch_num}/{total_batches} ({len(batch)} points) - Attempt {attempt + 1}/{max_retries}")
                        
                        self.client.upsert(
                            collection_name=self.collection_name,
                            points=batch
                        )
                        logger.info(f"✓ Batch {batch_num}/{total_batches} uploaded successfully")
                        break  # Success, exit retry loop
                        
                    except Exception as batch_error:
                        if attempt < max_retries - 1:
                            import time
                            wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                            logger.warning(f"Batch {batch_num} failed (attempt {attempt + 1}), retrying in {wait_time}s... Error: {batch_error}")
                            time.sleep(wait_time)
                        else:
                            logger.error(f"Batch {batch_num} failed after {max_retries} attempts: {batch_error}")
                            raise  # Re-raise on final attempt
            
            logger.info(f"Successfully inserted {len(points)} chunks into Qdrant")
            return True
            
        except Exception as e:
            logger.error(f"Error inserting documents: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    def search(
        self,
        query: str,
        limit: int = 5,
        program: Optional[str] = None,
        department: Optional[str] = None,
        semester: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Semantic search with optional metadata filtering.
        Documents with "ALL" in metadata fields match any filter.
        
        Args:
            query: Natural language query
            limit: Maximum number of results
            program: Filter by academic program
            department: Filter by department
            semester: Filter by semester
            
        Returns:
            List of search results with text and metadata
        """
        try:
            # Embed the query
            query_vector = self.embed_text(query)
            
            # Build filter conditions - "ALL" acts as wildcard using should (OR)
            must_conditions = []
            
            if program and program != "All":
                # Match either the specific program OR "All"
                must_conditions.append(
                    Filter(
                        should=[
                            FieldCondition(key="program", match=MatchValue(value=program)),
                            FieldCondition(key="program", match=MatchValue(value="All"))
                        ]
                    )
                )
            
            if department and department != "All":
                must_conditions.append(
                    Filter(
                        should=[
                            FieldCondition(key="department", match=MatchValue(value=department)),
                            FieldCondition(key="department", match=MatchValue(value="All"))
                        ]
                    )
                )
            
            if semester and semester != 0:
                must_conditions.append(
                    Filter(
                        should=[
                            FieldCondition(key="semester", match=MatchValue(value=semester)),
                            FieldCondition(key="semester", match=MatchValue(value=0))
                        ]
                    )
                )
            
            # Create Qdrant filter if we have conditions
            qdrant_filter = None
            if must_conditions:
                qdrant_filter = Filter(must=must_conditions)
                logger.info(f"Applying filters: program={program}, dept={department}, sem={semester}")
            
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
