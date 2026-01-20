"""
Documents router - Document management endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
import logging

from app.services.pdf_service import get_pdf_service
from app.services.qdrant_service import get_qdrant_service
from app.services.cloudinary_service import get_cloudinary_service
from app.services.document_processor import get_document_processor
from app.services.firebase_service import get_firebase_service

router = APIRouter()
logger = logging.getLogger(__name__)


class Document(BaseModel):
    id: str
    title: str
    category: str
    program: str
    department: str
    version: int
    uploaded_at: str
    chunk_count: int
    pdf_url: Optional[str] = None  # Cloudinary URL


@router.get("/", response_model=List[Document])
async def list_documents(
    category: Optional[str] = None,
    program: Optional[str] = None,
    department: Optional[str] = None
):
    """
    List all documents with optional filtering from Firestore.
    """
    try:
        firebase_service = get_firebase_service()
        cloudinary_service = get_cloudinary_service()
        
        # Build filter conditions
        filter_conditions = []
        if category:
            filter_conditions.append({"key": "category", "match": {"value": category}})
        if program:
            filter_conditions.append({"key": "program", "match": {"value": program}})
        if department:
            filter_conditions.append({"key": "department", "match": {"value": department}})
        
        # Get all points from Qdrant with filters
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        
        qdrant_filter = None
        if filter_conditions:
            conditions = [
                FieldCondition(key=cond["key"], match=MatchValue(value=cond["match"]["value"]))
                for cond in filter_conditions
            ]
            qdrant_filter = Filter(must=conditions)
        
        # Scroll through all points to get unique documents
        points = qdrant_service.client.scroll(
            collection_name=qdrant_service.collection_name,
            scroll_filter=qdrant_filter,
            limit=1000,  # Adjust based on your needs
            with_payload=True,
            with_vectors=False
        )[0]
        
        # Group by doc_id to get unique documents
        docs_dict = {}
        for point in points:
            payload = point.payload
            doc_id = payload.get('doc_id')
            
            if doc_id and doc_id not in docs_dict:
                # Get PDF URL from Cloudinary
                pdf_url = cloudinary_service.get_pdf_url(doc_id)
                
                docs_dict[doc_id] = {
                    'id': doc_id,
                    'title': payload.get('title', 'Untitled'),
                    'category': payload.get('category', 'unknown'),
                    'program': payload.get('program', 'unknown'),
                    'department': payload.get('department', 'unknown'),
                    'version': payload.get('version', 1),
                    'uploaded_at': payload.get('uploaded_at', ''),
                    'chunk_count': 0,
                    'pdf_url': pdf_url
                }
            
            # Count chunks for this document
            if doc_id in docs_dict:
                docs_dict[doc_id]['chunk_count'] += 1
        
        # Convert to list and sort by upload date (newest first)
        documents = list(docs_dict.values())
        documents.sort(key=lambda x: x.get('uploaded_at', ''), reverse=True)
        
        return documents
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        # Return empty list instead of error to avoid breaking the UI
        return []


@router.get("/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    """
    Get a specific document by ID from Firestore.
    """
    try:
        firebase_service = get_firebase_service()
        cloudinary_service = get_cloudinary_service()
        
        # Get document metadata from Firestore
        doc = firebase_service.get_document_metadata(doc_id)
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get PDF URL from Cloudinary
        pdf_url = cloudinary_service.get_pdf_url(doc_id)
        
        return Document(
            id=doc_id,
            title=doc.get('title', 'Untitled'),
            category=doc.get('category', 'unknown'),
            program=doc.get('program', 'unknown'),
            department=doc.get('department', 'unknown'),
            version=doc.get('version', 1),
            uploaded_at=doc.get('uploaded_at', ''),
            chunk_count=doc.get('chunk_count', 0),
            pdf_url=pdf_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving document: {str(e)}")


@router.get("/{doc_id}/download")
async def download_document(doc_id: str):
    """
    Get the download URL for a document's PDF.
    """
    cloudinary_service = get_cloudinary_service()
    
    pdf_url = cloudinary_service.get_pdf_url(doc_id)
    
    if pdf_url:
        return {
            "success": True,
            "doc_id": doc_id,
            "pdf_url": pdf_url
        }
    else:
        raise HTTPException(status_code=404, detail="PDF not found in storage")


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """
    Delete a document and its chunks from Qdrant and PDF from Cloudinary.
    """
    try:
        firebase_service = get_firebase_service()
        cloudinary_service = get_cloudinary_service()
        qdrant_service = get_qdrant_service()
        
        # Check if document exists in Firestore
        doc = firebase_service.get_document_metadata(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete all chunks from Qdrant using the service method
        chunks_deleted = qdrant_service.delete_by_doc_id(doc_id)
        logger.info(f"Deleted {chunks_deleted} chunks from Qdrant for doc_id: {doc_id}")
        
        # Delete from Cloudinary
        cloudinary_deleted = cloudinary_service.delete_pdf(doc_id)
        if cloudinary_deleted:
            logger.info(f"Deleted PDF from Cloudinary for doc_id: {doc_id}")
        else:
            logger.warning(f"PDF not found in Cloudinary for doc_id: {doc_id}")
        
        # Delete metadata from Firestore
        firestore_deleted = firebase_service.delete_document_metadata(doc_id)
        if firestore_deleted:
            logger.info(f"Deleted metadata from Firestore for doc_id: {doc_id}")
        
        return {
            "success": True,
            "message": f"Document {doc_id} deleted successfully",
            "chunks_deleted": chunks_deleted,
            "pdf_deleted": cloudinary_deleted,
            "metadata_deleted": firestore_deleted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    program: str = Form("All"),
    department: str = Form("All"),
    semester: int = Form(0)
):
    """
    Upload and process any supported document format.
    
    Supported formats:
    - PDF (.pdf)
    - Word (.docx, .doc)
    - Excel (.xlsx, .xls, .csv)
    - PowerPoint (.pptx, .ppt)
    - Text (.txt, .md)
    
    This endpoint:
    1. Validates the file type
    2. Extracts text from document
    3. Chunks the text
    4. Embeds and stores in Qdrant
    5. Uploads original to Cloudinary
    6. Returns processing results
    """
    # Get services
    doc_processor = get_document_processor()
    qdrant_service = get_qdrant_service()
    cloudinary_service = get_cloudinary_service()
    firebase_service = get_firebase_service()
    
    # Check if file type is supported
    if not doc_processor.is_supported(file.filename):
        supported_formats = []
        for file_type, extensions in doc_processor.SUPPORTED_FORMATS.items():
            supported_formats.extend(extensions)
        
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported formats: {', '.join(supported_formats)}"
        )
    
    tmp_path = None
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        logger.info(f"Processing uploaded file: {file.filename}")
        
        # Detect file type
        file_type = doc_processor.get_file_type(file.filename)
        logger.info(f"Detected file type: {file_type}")
        
        # Generate document ID
        from datetime import datetime
        
        doc_metadata = {
            'title': title,
            'category': category,
            'program': program,
            'department': department,
            'semester': semester,
            'version': 1,
            'uploaded_at': datetime.utcnow().isoformat()
        }
        doc_id = doc_processor.generate_doc_id(file.filename, doc_metadata)
        doc_metadata['doc_id'] = doc_id
        
        logger.info(f"Generated doc_id: {doc_id}")
        
        # Process document into chunks
        chunks = doc_processor.process_document(tmp_path, doc_metadata)
        
        logger.info(f"Created {len(chunks)} chunks")
        
        # Extract text and metadata for Qdrant
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
                'version': chunk['version'],
                'uploaded_at': doc_metadata['uploaded_at']
            }
            for chunk in chunks
        ]
        
        # Insert into Qdrant
        logger.info(f"Inserting {len(chunk_texts)} chunks into Qdrant...")
        success = qdrant_service.insert_documents(chunk_texts, chunk_metadata)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to insert into Qdrant")
        
        # Upload PDF to Cloudinary
        logger.info(f"Uploading PDF to Cloudinary...")
        cloudinary_metadata = {
            'title': title,
            'category': category,
            'program': program,
            'department': department
        }
        upload_result = cloudinary_service.upload_pdf(tmp_path, doc_id, cloudinary_metadata)
        
        pdf_url = None
        if upload_result:
            pdf_url = upload_result['url']
            logger.info(f"PDF uploaded to Cloudinary: {pdf_url}")
        else:
            logger.warning("Failed to upload PDF to Cloudinary, but chunks are in Qdrant")
        
        # Save metadata to Firestore
        logger.info(f"Saving document metadata to Firestore...")
        firestore_data = {
            'doc_id': doc_id,
            'title': title,
            'category': category,
            'program': program,
            'department': department,
            'semester': semester,
            'version': 1,
            'chunk_count': len(chunks),
            'storage_path': pdf_url,
            'uploaded_by': 'admin',  # TODO: Get from auth context
        }
        firebase_service.create_document_metadata(firestore_data)
        logger.info(f"Document metadata saved to Firestore")
        
        # Clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        
        logger.info(f"Document '{title}' processed successfully")
        return {
            "success": True,
            "message": f"Document '{title}' processed successfully",
            "document": {
                "id": doc_id,
                "title": title,
                "category": category,
                "program": program,
                "department": department,
                "semester": semester,
                "chunk_count": len(chunks),
                "filename": file.filename,
                "pdf_url": pdf_url
            }
        }
            
    except Exception as e:
        # Clean up temp file if it exists
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass
        
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
