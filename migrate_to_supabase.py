"""
Migration Script: Upload local PDFs to Supabase Storage and sync with Qdrant document IDs
This script uses the existing PDFs from the local krmu folder instead of downloading from Cloudinary.
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from app.services.supabase_storage_service import get_supabase_storage_service
from app.services.supabase_db_service import get_supabase_db_service
from app.services.qdrant_service import get_qdrant_service
from app.config import get_settings

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Mapping of local PDF files to their Qdrant doc_ids
# This mapping needs to be created based on how the doc_ids were generated
PDF_FOLDER = Path("F:/Uni-Query-AI/krmu")


def get_qdrant_doc_ids():
    """Fetch all unique doc_ids from Qdrant"""
    qdrant = get_qdrant_service()
    
    doc_ids = set()
    offset = None
    
    while True:
        result = qdrant.client.scroll(
            collection_name='uniquery',
            limit=100,
            with_payload=True,
            with_vectors=False,
            offset=offset
        )
        
        batch_points, next_offset = result
        
        for point in batch_points:
            doc_id = point.payload.get('doc_id')
            title = point.payload.get('title', 'Unknown')
            if doc_id:
                doc_ids.add((doc_id, title))
        
        if next_offset is None:
            break
        offset = next_offset
    
    return list(doc_ids)


def find_matching_pdf(doc_id: str, title: str, pdf_folder: Path) -> Path | None:
    """
    Try to find a matching PDF file for a given doc_id or title.
    Uses fuzzy matching based on filename similarities.
    """
    pdf_files = list(pdf_folder.glob("*.pdf"))
    
    # First, try exact match with doc_id in filename
    for pdf_path in pdf_files:
        if doc_id in pdf_path.stem:
            return pdf_path
    
    # Try matching by title keywords
    title_words = set(title.lower().replace('_', ' ').replace('-', ' ').split())
    
    best_match = None
    best_score = 0
    
    for pdf_path in pdf_files:
        filename_words = set(pdf_path.stem.lower().replace('_', ' ').replace('-', ' ').split())
        
        # Count matching words
        match_score = len(title_words & filename_words)
        
        if match_score > best_score:
            best_score = match_score
            best_match = pdf_path
    
    # Require at least 2 matching words to consider it a match
    if best_score >= 2:
        return best_match
    
    return None


def migrate_documents():
    """Main migration function"""
    logger.info("=" * 60)
    logger.info("Starting Supabase Migration")
    logger.info("=" * 60)
    
    storage_service = get_supabase_storage_service()
    db_service = get_supabase_db_service()
    
    # Get documents from Qdrant
    logger.info("Fetching document IDs from Qdrant...")
    qdrant_docs = get_qdrant_doc_ids()
    logger.info(f"Found {len(qdrant_docs)} unique documents in Qdrant")
    
    # List available PDFs
    pdf_files = list(PDF_FOLDER.glob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files in {PDF_FOLDER}")
    
    for pdf_path in pdf_files:
        logger.info(f"  - {pdf_path.name}")
    
    logger.info("-" * 60)
    
    # Process each document
    success_count = 0
    failed_count = 0
    
    for doc_id, title in qdrant_docs:
        logger.info(f"\nProcessing: {doc_id}")
        logger.info(f"  Title: {title}")
        
        # Find matching PDF
        pdf_path = find_matching_pdf(doc_id, title, PDF_FOLDER)
        
        if not pdf_path:
            logger.warning(f"  ❌ No matching PDF found for: {title}")
            failed_count += 1
            continue
        
        logger.info(f"  📄 Matched to: {pdf_path.name}")
        
        try:
            # Upload PDF to Supabase Storage
            logger.info(f"  ⬆️ Uploading to Supabase Storage...")
            upload_result = storage_service.upload_pdf(
                str(pdf_path), 
                doc_id, 
                {'title': title}
            )
            
            if not upload_result:
                logger.error(f"  ❌ Failed to upload PDF")
                failed_count += 1
                continue
            
            pdf_url = upload_result['url']
            logger.info(f"  ✅ Uploaded: {pdf_url[:60]}...")
            
            # Create document metadata in Supabase DB
            logger.info(f"  📝 Creating database record...")
            db_data = {
                'doc_id': doc_id,
                'title': title,
                'category': 'general',  # Default category
                'program': 'All',
                'department': 'All',
                'semester': 0,
                'version': 1,
                'chunk_count': 0,  # Will be updated if needed
                'storage_path': pdf_url,
                'uploaded_by': 'migration',
            }
            
            db_result = db_service.create_document_metadata(db_data)
            
            if db_result:
                logger.info(f"  ✅ Database record created")
                success_count += 1
            else:
                logger.error(f"  ❌ Failed to create database record")
                failed_count += 1
                
        except Exception as e:
            logger.error(f"  ❌ Error: {e}")
            failed_count += 1
    
    logger.info("\n" + "=" * 60)
    logger.info("Migration Complete!")
    logger.info(f"  ✅ Successful: {success_count}")
    logger.info(f"  ❌ Failed: {failed_count}")
    logger.info("=" * 60)


if __name__ == "__main__":
    migrate_documents()
