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
from app.services.name_extractor import get_name_extractor

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
        
        # Get documents from Firestore (fast)
        docs = firebase_service.list_documents(category, program, department)
        
        # Convert to response format
        documents = [
            Document(
                id=doc.get('doc_id', ''),
                title=doc.get('title', 'Untitled'),
                category=doc.get('category', 'unknown'),
                program=doc.get('program', 'unknown'),
                department=doc.get('department', 'unknown'),
                version=doc.get('version', 1),
                uploaded_at=doc.get('uploaded_at', ''),
                chunk_count=doc.get('chunk_count', 0),
                pdf_url=doc.get('storage_path')
            )
            for doc in docs
        ]
        
        return documents
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
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
    firebase_service = get_firebase_service()
    
    # Get document metadata from Firestore
    doc = firebase_service.get_document_metadata(doc_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get the base URL
    pdf_url = doc.get('storage_path')
    
    if pdf_url:
        # Inject fl_attachment to force download
        # This handles the CORS/Auth issues by making it a simple navigation/download
        if '/upload/' in pdf_url and '/fl_attachment/' not in pdf_url:
            download_url = pdf_url.replace('/upload/', '/upload/fl_attachment/')
        else:
            download_url = pdf_url

        return {
            "success": True,
            "doc_id": doc_id,
            "pdf_url": download_url
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
    title: str = Form(None),
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
    name_extractor = get_name_extractor()
    
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
        # Save uploaded file temporarily with correct extension
        file_extension = os.path.splitext(file.filename)[1] or '.pdf'
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        logger.info(f"Processing uploaded file: {file.filename}")
        
        # Auto-extract title from PDF content if not provided
        if not title:
            extracted_name = name_extractor.extract_document_name(tmp_path)
            if extracted_name:
                title = extracted_name
                logger.info(f"Auto-extracted title: {title}")
            else:
                # Fallback to filename without extension
                title = file.filename.rsplit('.', 1)[0]
                logger.info(f"Using filename as title: {title}")
        
        # Detect file type
        file_type = doc_processor.get_file_type(file.filename)
        logger.debug(f"Detected file type: {file_type}")
        
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
        
        logger.debug(f"Generated doc_id: {doc_id}")
        
        # Process document into chunks
        chunks = doc_processor.process_document(tmp_path, doc_metadata)
        
        logger.debug(f"Created {len(chunks)} chunks")
        
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
                'version': chunk['version']
            }
            for chunk in chunks
        ]
        
        # Insert into Qdrant
        logger.debug(f"Inserting {len(chunk_texts)} chunks into Qdrant...")
        try:
            success = qdrant_service.insert_documents(chunk_texts, chunk_metadata)
            
            if not success:
                logger.error("Qdrant insertion returned False")
                raise HTTPException(status_code=500, detail="Failed to insert document chunks into vector database")
        except Exception as qdrant_error:
            logger.error(f"Qdrant insertion failed: {qdrant_error}")
            raise HTTPException(status_code=500, detail=f"Vector database error: {str(qdrant_error)}")
        
        # Upload PDF to Cloudinary
        logger.debug(f"Uploading PDF to Cloudinary...")
        cloudinary_metadata = {
            'title': title,
            'category': category,
            'program': program,
            'department': department
        }
        upload_result = cloudinary_service.upload_pdf(tmp_path, doc_id, cloudinary_metadata)
        
        pdf_url = None
        cloudinary_public_id = None
        if upload_result:
            pdf_url = upload_result['url']
            cloudinary_public_id = upload_result['public_id']
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
            'cloudinary_public_id': cloudinary_public_id,
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
    
    except ValueError as ve:
        # Specific handling for image-only PDFs
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass
        
        error_msg = str(ve)
        logger.error(f"Validation error: {error_msg}")
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot process this PDF: {error_msg}"
        )
            
    except Exception as e:
        # Clean up temp file if it exists
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass
        
        logger.error(f"Error processing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
