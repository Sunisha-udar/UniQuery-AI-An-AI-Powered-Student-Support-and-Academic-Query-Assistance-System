"""
Documents router - Document management endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
import logging

from app.services.pdf_service import get_pdf_service
from app.services.qdrant_service import get_qdrant_service
from app.services.supabase_storage_service import get_supabase_storage_service
from app.services.document_processor import get_document_processor
from app.services.supabase_db_service import get_supabase_db_service
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
    pdf_url: Optional[str] = None


class ManualAnswerRequest(BaseModel):
    question: str
    answer: str
    category: str = "Manual Answer"
    program: str = "All"
    department: str = "All"
    semester: int = 0
    doc_id: Optional[str] = None  # If provided, updates existing answer


class ExistingAnswerResponse(BaseModel):
    exists: bool
    doc_id: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None


@router.get("/", response_model=List[Document])
async def list_documents(
    category: Optional[str] = None,
    program: Optional[str] = None,
    department: Optional[str] = None
):
    """
    List all documents with optional filtering from Supabase.
    """
    try:
        db_service = get_supabase_db_service()
        
        # Get documents from Supabase
        docs = db_service.list_documents(category, program, department)
        
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
    Get a specific document by ID from Supabase.
    """
    try:
        db_service = get_supabase_db_service()
        storage_service = get_supabase_storage_service()
        
        # Get document metadata from Supabase
        doc = db_service.get_document_metadata(doc_id)
        
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get PDF URL from Supabase Storage
        pdf_url = storage_service.get_pdf_url(doc_id)
        
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
    db_service = get_supabase_db_service()
    storage_service = get_supabase_storage_service()
    
    # Get document metadata from Supabase
    doc = db_service.get_document_metadata(doc_id)
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get the PDF URL from Supabase Storage
    pdf_url = storage_service.get_pdf_url(doc_id)
    
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
    Delete a document and its chunks from Qdrant and PDF from Supabase Storage.
    """
    try:
        db_service = get_supabase_db_service()
        storage_service = get_supabase_storage_service()
        qdrant_service = get_qdrant_service()
        
        # Check if document exists in Supabase
        doc = db_service.get_document_metadata(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete all chunks from Qdrant using the service method
        chunks_deleted = qdrant_service.delete_by_doc_id(doc_id)
        logger.info(f"Deleted {chunks_deleted} chunks from Qdrant for doc_id: {doc_id}")
        
        # Delete from Supabase Storage
        storage_deleted = storage_service.delete_pdf(doc_id)
        if storage_deleted:
            logger.info(f"Deleted PDF from Supabase Storage for doc_id: {doc_id}")
        else:
            logger.warning(f"PDF not found in Supabase Storage for doc_id: {doc_id}")
        
        # Delete metadata from Supabase
        db_deleted = db_service.delete_document_metadata(doc_id)
        if db_deleted:
            logger.info(f"Deleted metadata from Supabase for doc_id: {doc_id}")
        
        return {
            "success": True,
            "message": f"Document {doc_id} deleted successfully",
            "chunks_deleted": chunks_deleted,
            "pdf_deleted": storage_deleted,
            "metadata_deleted": db_deleted
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")




@router.get("/manual-answer/check", response_model=ExistingAnswerResponse)
async def check_existing_answer(question: str, authorization: str = Header(None)):
    """
    Check if a manual answer already exists for the given question.
    Returns the existing answer details if found.
    """
    try:
        db_service = get_supabase_db_service()
        
        # Query Supabase for manual answers matching this question
        # We'll search for documents with category "Manual Answer"
        docs = db_service.list_documents(category="Manual Answer")
        
        # Find matching question (stored in title or we need to add question field)
        for doc in docs:
            # Fallback for legacy answers
            stored_question = doc.get('title', '').replace('Manual Answer: ', '').replace('...', '').strip()
            match_found = (question_text.startswith(stored_question) or stored_question in question_text)
            
            if match_found:
                qdrant_service = get_qdrant_service()
                doc_id = doc.get('doc_id')
                
                # Quick search to get answer chunks
                results = qdrant_service.search(
                    query=question,
                    limit=3
                )
                
                # Find chunks from this doc_id
                answer_chunks = [r for r in results if r.get('doc_id') == doc_id]
                
                if answer_chunks:
                    # Extract answer from first chunk (remove "Question:" prefix)
                    full_text = answer_chunks[0].get('text', '')
                    answer = full_text.split('Answer: ')[-1] if 'Answer: ' in full_text else full_text
                    
                    return ExistingAnswerResponse(
                        exists=True,
                        doc_id=doc_id,
                        answer=answer,
                        category=doc.get('category'),
                        program=doc.get('program'),
                        department=doc.get('department'),
                        semester=doc.get('semester')
                    )
        
        # No match found
        return ExistingAnswerResponse(exists=False)
        
    except Exception as e:
        logger.error(f"Error checking for existing answer: {e}")
        return ExistingAnswerResponse(exists=False)


@router.post("/manual-answer")
async def submit_manual_answer(request: ManualAnswerRequest, authorization: str = Header(None)):
    """
    Submit a manual text answer for a low-confidence question.
    If doc_id is provided, updates existing answer. Otherwise creates new.
    """
    try:
        doc_processor = get_document_processor()
        qdrant_service = get_qdrant_service()
        db_service = get_supabase_db_service()
        
        # Check if this is an update or create
        is_update = request.doc_id is not None
        
        if is_update:
            logger.info(f"Updating existing manual answer: {request.doc_id}")
            doc_id = request.doc_id
            
            # Delete old chunks from Qdrant
            try:
                deleted_count = qdrant_service.delete_by_doc_id(doc_id)
                logger.info(f"Deleted {deleted_count} old chunks from Qdrant")
            except Exception as delete_error:
                logger.error(f"Error deleting old chunks: {delete_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete old answer chunks: {str(delete_error)}"
                )
        else:
            # Generate unique doc_id for new manual answer
            from datetime import datetime
            import hashlib
            unique_string = f"{request.question}_{request.answer}_{datetime.utcnow().isoformat()}"
            doc_id = f"manual_{hashlib.md5(unique_string.encode()).hexdigest()[:16]}"
            logger.info(f"Creating new manual answer document: {doc_id}")
        
        # Create synthetic title
        title = f"Manual Answer: {request.question[:50]}..."
        
        # Generate document metadata
        from datetime import datetime
        doc_metadata = {
            'title': title,
            'category': request.category,
            'program': request.program,
            'department': request.department,
            'semester': request.semester,
            'version': 1,
            'uploaded_at': datetime.utcnow().isoformat(),
            'question': request.question,
            'doc_id': doc_id
        }
        
        # Chunk the answer text using the document processor
        chunks_data = doc_processor.chunk_text(
            text=f"Question: {request.question}\n\nAnswer: {request.answer}",
            chunk_size=1000,
            overlap=200
        )
        
        logger.debug(f"Created {len(chunks_data)} chunks from manual answer")
        
        # Create metadata for each chunk
        chunks = []
        chunk_metadata = []
        
        for idx, chunk_text in enumerate(chunks_data):
            chunk_id = f"{doc_id}_chunk_{idx}"
            chunks.append(chunk_text)
            chunk_metadata.append({
                'id': chunk_id,
                'program': request.program,
                'department': request.department,
                'semester': request.semester,
                'category': request.category,
                'doc_id': doc_id,
                'page': idx + 1,
                'title': title,
                'version': 1
            })
        
        # Insert into Qdrant
        logger.debug(f"Inserting {len(chunks)} chunks into Qdrant...")
        success = qdrant_service.insert_documents(chunks, chunk_metadata)
        
        if not success:
            logger.error("Qdrant insertion returned False")
            raise HTTPException(
                status_code=500,
                detail="Failed to insert manual answer into vector database"
            )
        
        # Save or update metadata in Supabase
        supabase_data = {
            'doc_id': doc_id,
            'title': title,
            'category': request.category,
            'program': request.program,
            'department': request.department,
            'semester': request.semester,
            'version': 1,
            'chunk_count': len(chunks),
            'storage_path': None,  # No PDF for manual answers
            'uploaded_by': 'admin',
        }
        
        if is_update:
            # Update existing document metadata
            logger.info(f"Updating manual answer metadata in Supabase...")
            try:
                db_service.update_document_metadata(doc_id, supabase_data)
            except Exception as db_error:
                # Rollback: Delete chunks from Qdrant
                logger.error(f"Failed to update metadata: {db_error}")
                logger.info(f"Rolling back: deleting {len(chunks)} chunks from Qdrant for doc_id: {doc_id}")
                try:
                    chunks_deleted = qdrant_service.delete_by_doc_id(doc_id)
                    logger.info(f"Rollback successful: deleted {chunks_deleted} chunks")
                except Exception as rollback_error:
                    logger.error(f"Rollback failed: {rollback_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to update document metadata: {str(db_error)}"
                )
        else:
            # Create new document metadata
            logger.info(f"Saving manual answer metadata to Supabase...")
            try:
                db_service.create_document_metadata(supabase_data)
            except Exception as db_error:
                # Rollback: Delete orphaned vectors from Qdrant
                logger.error(f"Failed to save metadata: {db_error}")
                logger.info(f"Rolling back: deleting {len(chunks)} chunks from Qdrant for doc_id: {doc_id}")
                try:
                    chunks_deleted = qdrant_service.delete_by_doc_id(doc_id)
                    logger.info(f"Rollback successful: deleted {chunks_deleted} chunks")
                except Exception as rollback_error:
                    logger.error(f"Rollback failed: {rollback_error}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save document metadata: {str(db_error)}"
                )
        
        logger.info(f"Manual answer '{title}' processed successfully ({'updated' if is_update else 'created'})")
        
        return {
            "success": True,
            "message": f"Manual answer for '{request.question}' {'updated' if is_update else 'submitted'} successfully",
            "is_update": is_update,
            "document": {
                "id": doc_id,
                "title": title,
                "category": request.category,
                "program": request.program,
                "department": request.department,
                "semester": request.semester,
                "chunk_count": len(chunks)
            }
        }
        
    except HTTPException:
        # Re-raise HTTPException to preserve original status codes
        raise
    except Exception as e:
        logger.error(f"Error submitting manual answer: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting manual answer: {str(e)}"
        )


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
    5. Uploads original to Supabase Storage
    6. Returns processing results
    """
    # Get services
    doc_processor = get_document_processor()
    qdrant_service = get_qdrant_service()
    storage_service = get_supabase_storage_service()
    db_service = get_supabase_db_service()
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
        
        # Upload PDF to Supabase Storage
        logger.debug(f"Uploading PDF to Supabase Storage...")
        storage_metadata = {
            'title': title,
            'category': category,
            'program': program,
            'department': department
        }
        upload_result = storage_service.upload_pdf(tmp_path, doc_id, storage_metadata)
        
        pdf_url = None
        if upload_result:
            pdf_url = upload_result['url']
            logger.info(f"PDF uploaded to Supabase Storage: {pdf_url}")
        else:
            logger.warning("Failed to upload PDF to Supabase Storage, but chunks are in Qdrant")
        
        # Save metadata to Supabase
        logger.info(f"Saving document metadata to Supabase...")
        supabase_data = {
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
        db_service.create_document_metadata(supabase_data)
        logger.info(f"Document metadata saved to Supabase")
        
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
