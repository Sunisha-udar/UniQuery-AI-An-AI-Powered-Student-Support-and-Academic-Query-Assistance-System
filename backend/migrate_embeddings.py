"""
Automated Re-processing Script for Qdrant Collection Migration
=================================================================

This script:
1. Recreates the Qdrant collection with 512 dimensions
2. Scans local PDF directory (F:/Uni-Query-AI/krmu)
3. Processes each PDF: extracts text, creates chunks, generates embeddings
4. Uploads to the new Qdrant collection with proper metadata

Run this script ONCE to migrate your data to the new embedding model.
"""

import logging
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from app.config import get_settings
from app.services.document_processor import get_document_processor
from app.services.qdrant_service import get_qdrant_service
from app.services.name_extractor import get_name_extractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Local PDF directory
PDF_DIRECTORY = Path("F:/Uni-Query-AI/krmu")


def recreate_qdrant_collection() -> bool:
    """Step 1: Recreate Qdrant collection with new dimensions"""
    try:
        logger.info("=" * 70)
        logger.info("STEP 1: Recreating Qdrant Collection")
        logger.info("=" * 70)
        
        client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=120
        )
        
        collection_name = settings.qdrant_collection_name
        embedding_dim = settings.embedding_dimension
        
        # Check if collection exists
        collections = client.get_collections().collections
        collection_names = [col.name for col in collections]
        
        if collection_name in collection_names:
            info = client.get_collection(collection_name)
            current_dim = info.config.params.vectors.size
            
            logger.warning(f"⚠️  Collection '{collection_name}' exists with {current_dim} dimensions")
            logger.warning(f"⚠️  Deleting to recreate with {embedding_dim} dimensions...")
            
            client.delete_collection(collection_name)
            logger.info(f"✅ Old collection deleted")
        
        # Create new collection
        logger.info(f"🔨 Creating collection with {embedding_dim} dimensions...")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=embedding_dim,
                distance=Distance.COSINE
            )
        )
        
        # Create indices
        logger.info("📑 Creating payload indices...")
        for field in ["doc_id", "program", "department", "category", "title"]:
            client.create_payload_index(
                collection_name=collection_name,
                field_name=field,
                field_schema="keyword"
            )
        
        for field in ["semester", "version", "page"]:
            client.create_payload_index(
                collection_name=collection_name,
                field_name=field,
                field_schema="integer"
            )
        
        logger.info(f"✅ Collection created successfully with {embedding_dim} dimensions\n")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error recreating collection: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def extract_metadata_from_filename(filename: str) -> Dict[str, Any]:
    """
    Extract metadata from standardized filename format.
    
    Format: INSTITUTION_Category_Title_Year.pdf
    Examples:
    - KRMU_Handbook_Student_General_2025-26.pdf
    - SOET_Guidelines_Laptop_Classroom_2025-26.pdf
    """
    parts = filename.replace('.pdf', '').split('_')
    
    metadata = {
        'program': 'All',   # Default to All (applies to all programs)
        'department': 'All', # Default to All
        'semester': 0,       # 0 means all semesters
        'category': 'General',
        'title': filename.replace('.pdf', '')
    }
    
    if len(parts) >= 2:
        institution = parts[0]  # KRMU or SOET
        category = parts[1] if len(parts) > 1 else 'General'
        
        # Map category keywords
        category_map = {
            'Handbook': 'Handbook',
            'Notice': 'Notice',
            'Testimonials': 'General',
            'Guidelines': 'Guidelines',
            'Instructions': 'Instructions',
            'Module': 'Module',
            'Policy': 'Policy',
            'Schedule': 'Schedule',
            'Standards': 'Standards',
            'Syllabus': 'Syllabus'
        }
        
        metadata['category'] = category_map.get(category, 'General')
        
        # Extract program from filename
        filename_lower = filename.lower()
        if 'btech' in filename_lower or 'b.tech' in filename_lower:
            if 'cse' in filename_lower:
                metadata['program'] = 'BTech'
                metadata['department'] = 'CSE'
            elif 'aiml' in filename_lower:
                metadata['program'] = 'BTech'
                metadata['department'] = 'AIML'
        elif 'bsc' in filename_lower or 'b.sc' in filename_lower:
            if 'cs' in filename_lower:
                metadata['program'] = 'BSc'
                metadata['department'] = 'CS'
        elif 'bca' in filename_lower:
            metadata['program'] = 'BCA'
            metadata['department'] = 'CSE'
    
    return metadata


def reprocess_local_pdfs() -> Dict[str, int]:
    """Step 2: Process all PDFs from local directory"""
    try:
        logger.info("=" * 70)
        logger.info("STEP 2: Processing Local PDFs")
        logger.info("=" * 70)
        
        # Check directory exists
        if not PDF_DIRECTORY.exists():
            logger.error(f"❌ Directory not found: {PDF_DIRECTORY}")
            return {'total': 0, 'success': 0, 'failed': 0}
        
        # Get all PDF files
        pdf_files = list(PDF_DIRECTORY.glob("*.pdf"))
        
        if not pdf_files:
            logger.warning(f"⚠️  No PDF files found in {PDF_DIRECTORY}")
            return {'total': 0, 'success': 0, 'failed': 0}
        
        logger.info(f"📄 Found {len(pdf_files)} PDF files to process\n")
        
        doc_processor = get_document_processor()
        qdrant_service = get_qdrant_service()
        name_extractor = get_name_extractor()
        
        stats = {
            'total': len(pdf_files),
            'success': 0,
            'failed': 0
        }
        
        for idx, pdf_path in enumerate(pdf_files, 1):
            filename = pdf_path.name
            
            logger.info(f"\n[{idx}/{len(pdf_files)}] Processing: {filename}")
            
            try:
                # Extract metadata from filename
                metadata = extract_metadata_from_filename(filename)
                
                # Try to extract a better title from PDF content
                extracted_title = name_extractor.extract_document_name(str(pdf_path))
                if extracted_title:
                    metadata['title'] = extracted_title
                
                # Generate doc_id
                doc_id = doc_processor.generate_doc_id(filename, metadata)
                metadata['doc_id'] = doc_id
                metadata['version'] = 1
                
                logger.info(f"  Title: {metadata['title']}")
                logger.info(f"  Category: {metadata['category']}")
                logger.info(f"  Program: {metadata['program']}")
                logger.info(f"  Department: {metadata['department']}")
                
                # Process document into chunks
                logger.info(f"  🔄 Extracting text and creating chunks...")
                chunks = doc_processor.process_document(str(pdf_path), metadata)
                logger.info(f"  ✓ Created {len(chunks)} chunks")
                
                # Prepare for Qdrant insertion
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
                
                # Insert into Qdrant with new 512-dim embeddings
                logger.info(f"  🚀 Generating embeddings and uploading to Qdrant...")
                success = qdrant_service.insert_documents(chunk_texts, chunk_metadata)
                
                if success:
                    logger.info(f"  ✅ Successfully processed ({len(chunks)} chunks)")
                    stats['success'] += 1
                else:
                    logger.error(f"  ❌ Failed to insert into Qdrant")
                    stats['failed'] += 1
                
            except Exception as e:
                logger.error(f"  ❌ Error processing {filename}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                stats['failed'] += 1
        
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error in reprocessing: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {'total': 0, 'success': 0, 'failed': 0}


def main():
    """Main execution function"""
    start_time = datetime.now()
    
    logger.info("\n")
    logger.info("╔" + "=" * 68 + "╗")
    logger.info("║" + " " * 15 + "QDRANT COLLECTION MIGRATION SCRIPT" + " " * 19 + "║")
    logger.info("║" + " " * 68 + "║")
    logger.info("║" + f"  From: 384 dimensions → To: 512 dimensions (voyage-3-lite)".ljust(68) + "║")
    logger.info("║" + f"  Source: {str(PDF_DIRECTORY)}".ljust(68) + "║")
    logger.info("╚" + "=" * 68 + "╝")
    logger.info(f"\nStarted at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Step 1: Recreate collection
    if not recreate_qdrant_collection():
        logger.error("\n❌ Failed to recreate collection. Aborting.")
        return
    
    # Step 2: Reprocess all PDFs
    stats = reprocess_local_pdfs()
    
    # Summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    logger.info("\n")
    logger.info("=" * 70)
    logger.info("MIGRATION SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Total PDFs:         {stats['total']}")
    logger.info(f"✅ Successfully processed: {stats['success']}")
    logger.info(f"❌ Failed:          {stats['failed']}")
    logger.info(f"\nTime taken: {duration:.2f} seconds ({duration/60:.2f} minutes)")
    
    if stats['success'] == stats['total']:
        logger.info("\n🎉 Migration completed successfully! All PDFs re-processed.")
        logger.info("   Your chatbot is now ready to answer questions with 512-dim embeddings!")
    elif stats['success'] > 0:
        logger.warning(f"\n⚠️  Partial success: {stats['success']}/{stats['total']} PDFs processed")
    else:
        logger.error("\n❌ Migration failed. No PDFs were processed.")
    
    logger.info("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("\n\n⚠️  Migration interrupted by user")
    except Exception as e:
        logger.error(f"\n\n❌ Unexpected error: {e}")
        import traceback
        logger.error(traceback.format_exc())
