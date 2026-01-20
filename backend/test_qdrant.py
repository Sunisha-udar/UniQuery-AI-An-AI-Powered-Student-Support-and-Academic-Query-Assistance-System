"""
Test script for Qdrant Cloud connection
Run this to verify your Qdrant setup is working correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.qdrant_service import get_qdrant_service
from app.config import get_settings


def test_qdrant_connection():
    """Test Qdrant Cloud connection and basic operations"""
    
    print("=" * 60)
    print("UniQuery AI - Qdrant Connection Test")
    print("=" * 60)
    
    # Load settings
    settings = get_settings()
    print(f"\n✓ Settings loaded")
    print(f"  - Qdrant URL: {settings.qdrant_url}")
    print(f"  - Collection: {settings.qdrant_collection_name}")
    print(f"  - Embedding Model: {settings.embedding_model}")
    
    # Initialize service
    print(f"\n⏳ Initializing Qdrant service...")
    try:
        qdrant = get_qdrant_service()
        print(f"✓ Qdrant service initialized")
    except Exception as e:
        print(f"✗ Failed to initialize Qdrant service: {e}")
        return False
    
    # Health check
    print(f"\n⏳ Checking Qdrant connection...")
    if qdrant.health_check():
        print(f"✓ Qdrant connection healthy")
    else:
        print(f"✗ Qdrant connection failed")
        return False
    
    # Create collection
    print(f"\n⏳ Creating/verifying collection...")
    if qdrant.create_collection():
        print(f"✓ Collection ready")
    else:
        print(f"✗ Failed to create collection")
        return False
    
    # Get collection info
    print(f"\n⏳ Fetching collection info...")
    info = qdrant.get_collection_info()
    if info:
        print(f"✓ Collection info:")
        print(f"  - Name: {info['name']}")
        print(f"  - Points: {info['points_count']}")
        print(f"  - Vectors: {info['vectors_count']}")
        print(f"  - Status: {info['status']}")
    else:
        print(f"✗ Failed to get collection info")
        return False
    
    # Test embedding
    print(f"\n⏳ Testing text embedding...")
    try:
        test_text = "What is the minimum attendance requirement?"
        embedding = qdrant.embed_text(test_text)
        print(f"✓ Embedding generated")
        print(f"  - Text: '{test_text}'")
        print(f"  - Dimension: {len(embedding)}")
        print(f"  - First 5 values: {embedding[:5]}")
    except Exception as e:
        print(f"✗ Embedding failed: {e}")
        return False
    
    # Test insertion (sample data)
    print(f"\n⏳ Testing document insertion...")
    try:
        sample_chunks = [
            "The minimum attendance requirement is 75% for all courses.",
            "Students with less than 75% attendance will not be permitted to appear for exams."
        ]
        sample_metadata = [
            {
                "id": 1,  # Use integer ID
                "program": "B.Tech",
                "department": "CSE",
                "semester": 3,
                "category": "attendance",
                "doc_id": "test_doc_001",
                "page": 1,
                "title": "Test Attendance Policy",
                "version": 1
            },
            {
                "id": 2,  # Use integer ID
                "program": "B.Tech",
                "department": "CSE",
                "semester": 3,
                "category": "attendance",
                "doc_id": "test_doc_001",
                "page": 1,
                "title": "Test Attendance Policy",
                "version": 1
            }
        ]
        
        if qdrant.insert_documents(sample_chunks, sample_metadata):
            print(f"✓ Sample documents inserted")
        else:
            print(f"✗ Failed to insert documents")
            return False
    except Exception as e:
        print(f"✗ Insertion failed: {e}")
        return False
    
    # Test search
    print(f"\n⏳ Testing semantic search...")
    try:
        query = "What is the attendance policy?"
        results = qdrant.search(
            query=query,
            limit=2
        )
        
        print(f"✓ Search completed")
        print(f"  - Query: '{query}'")
        print(f"  - Results found: {len(results)}")
        
        for i, result in enumerate(results, 1):
            print(f"\n  Result {i}:")
            print(f"    - Score: {result['score']:.4f}")
            print(f"    - Text: {result['text'][:80]}...")
            print(f"    - Page: {result['page']}")
    except Exception as e:
        print(f"✗ Search failed: {e}")
        return False
    
    # Cleanup test data
    print(f"\n⏳ Cleaning up test data...")
    try:
        if qdrant.delete_by_doc_id("test_doc_001"):
            print(f"✓ Test data cleaned up")
        else:
            print(f"⚠ Failed to cleanup (not critical)")
    except Exception as e:
        print(f"⚠ Cleanup warning: {e}")
    
    print("\n" + "=" * 60)
    print("✓ All tests passed! Qdrant is ready to use.")
    print("=" * 60)
    return True


if __name__ == "__main__":
    try:
        success = test_qdrant_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
