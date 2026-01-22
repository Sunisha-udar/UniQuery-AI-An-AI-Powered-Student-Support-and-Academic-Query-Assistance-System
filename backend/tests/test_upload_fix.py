#!/usr/bin/env python3
"""
Test script to verify the upload fix works
"""

import sys
import os
import tempfile
import logging

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.qdrant_service import get_qdrant_service
from app.services.document_processor import get_document_processor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_upload_pipeline():
    """Test the complete upload pipeline"""
    
    # Create a test PDF content
    test_content = """
    Test Document for UniQuery AI
    
    This is a sample document to test the upload functionality.
    It contains multiple paragraphs to test text chunking.
    
    Chapter 1: Introduction
    This chapter introduces the concept of testing.
    
    Chapter 2: Implementation
    This chapter covers the implementation details.
    
    Chapter 3: Conclusion
    This chapter concludes the document.
    """
    
    # Create temporary text file (simulating PDF)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(test_content)
        test_file = f.name
    
    try:
        logger.info("Starting upload pipeline test...")
        
        # Initialize services
        doc_processor = get_document_processor()
        qdrant_service = get_qdrant_service()
        
        # Ensure collection exists
        qdrant_service.create_collection()
        
        # Test document metadata
        doc_metadata = {
            'title': 'Test Document Upload',
            'category': 'test',
            'program': 'CS',
            'department': 'SOET',
            'semester': 1,
            'version': 1,
            'doc_id': 'test_upload_123'
        }
        
        logger.info("Processing document...")
        
        # Process document into chunks
        chunks = doc_processor.process_document(test_file, doc_metadata)
        logger.info(f"Created {len(chunks)} chunks")
        
        # Prepare data for Qdrant
        chunk_texts = [chunk['text'] for chunk in chunks]
        chunk_metadata = [
            {
                'id': chunk['id'],
                'program': chunk['program'],
                'department': chunk['department'],
                'semester': chunk['semester'],
                'category': chunk['category'],
                'doc_id': chunk['doc_id'],
                'page': chunk['page'],
                'title': chunk['title'],
                'version': chunk['version']
            }
            for chunk in chunks
        ]
        
        logger.info("Inserting into Qdrant...")
        
        # Test Qdrant insertion
        success = qdrant_service.insert_documents(chunk_texts, chunk_metadata)
        
        if success:
            logger.info("✓ Upload pipeline test PASSED")
            
            # Test search to verify insertion
            logger.info("Testing search...")
            results = qdrant_service.search("test document", limit=3)
            logger.info(f"Search returned {len(results)} results")
            
            if results:
                logger.info("✓ Search test PASSED")
                return True
            else:
                logger.error("✗ Search test FAILED - no results")
                return False
        else:
            logger.error("✗ Upload pipeline test FAILED")
            return False
            
    except Exception as e:
        logger.error(f"✗ Test failed with error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False
        
    finally:
        # Cleanup
        if os.path.exists(test_file):
            os.unlink(test_file)

if __name__ == "__main__":
    success = test_upload_pipeline()
    sys.exit(0 if success else 1)