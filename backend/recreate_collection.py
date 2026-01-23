"""
Script to recreate Qdrant collection with new embedding dimensions
WARNING: This will DELETE all existing vectors and recreate the collection
"""

import asyncio
import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


def recreate_collection():
    """Recreate the Qdrant collection with correct dimensions"""
    try:
        # Initialize Qdrant client
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=120
        )
        
        collection_name = settings.qdrant_collection_name
        embedding_dim = settings.embedding_dimension
        
        logger.info(f"🔍 Checking collection: {collection_name}")
        
        # Check if collection exists
        collections = client.get_collections().collections
        collection_names = [col.name for col in collections]
        
        if collection_name in collections:
            # Get current collection info
            info = client.get_collection(collection_name)
            current_dim = info.config.params.vectors.size
            
            logger.warning(f"⚠️  Collection exists with {current_dim} dimensions")
            logger.warning(f"⚠️  Need to recreate with {embedding_dim} dimensions")
            
            # Delete existing collection
            logger.info(f"🗑️  Deleting collection '{collection_name}'...")
            client.delete_collection(collection_name)
            logger.info(f"✅ Collection deleted")
        else:
            logger.info(f"📦 Collection '{collection_name}' does not exist")
        
        # Create new collection with correct dimensions
        logger.info(f"🔨 Creating collection with {embedding_dim} dimensions...")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=embedding_dim,
                distance=Distance.COSINE
            )
        )
        
        # Create indices for fast filtering
        logger.info("📑 Creating payload indices...")
        
        # Keyword indices
        for field in ["doc_id", "program", "department", "category", "title"]:
            client.create_payload_index(
                collection_name=collection_name,
                field_name=field,
                field_schema="keyword"
            )
            logger.debug(f"  ✓ Created index for: {field}")
        
        # Integer indices
        for field in ["semester", "version", "page"]:
            client.create_payload_index(
                collection_name=collection_name,
                field_name=field,
                field_schema="integer"
            )
            logger.debug(f"  ✓ Created index for: {field}")
        
        # Verify collection
        info = client.get_collection(collection_name)
        logger.info(f"\n✅ Collection recreated successfully!")
        logger.info(f"   Name: {collection_name}")
        logger.info(f"   Vector dimension: {info.config.params.vectors.size}")
        logger.info(f"   Distance: {info.config.params.vectors.distance}")
        logger.info(f"   Points count: {info.points_count}")
        
        logger.warning("\n⚠️  IMPORTANT: You need to re-upload all documents!")
        logger.info("   Use the admin panel to upload PDFs again.")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error recreating collection: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("🔄 Qdrant Collection Recreation Script")
    logger.info("=" * 60)
    
    success = recreate_collection()
    
    if success:
        logger.info("\n✅ Done! Collection is ready for new documents.")
    else:
        logger.error("\n❌ Failed to recreate collection.")
