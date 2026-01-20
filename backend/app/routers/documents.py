"""
Documents router - Document management endpoints
"""

from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class Document(BaseModel):
    id: str
    title: str
    category: str
    program: str
    department: str
    version: int
    uploaded_at: str
    chunk_count: int


# Mock documents for demo
MOCK_DOCUMENTS = [
    Document(id="1", title="CSE Syllabus 2024", category="syllabus", program="B.Tech", department="CSE", version=2, uploaded_at="2024-01-15", chunk_count=162),
    Document(id="2", title="Attendance Policy", category="attendance", program="All", department="All", version=1, uploaded_at="2024-01-10", chunk_count=24),
    Document(id="3", title="Exam Rules 2024", category="exam_rules", program="All", department="All", version=3, uploaded_at="2024-01-08", chunk_count=48),
]


@router.get("/", response_model=List[Document])
async def list_documents(
    category: Optional[str] = None,
    program: Optional[str] = None,
    department: Optional[str] = None
):
    """
    List all documents with optional filtering.
    """
    docs = MOCK_DOCUMENTS
    
    if category:
        docs = [d for d in docs if d.category == category]
    if program:
        docs = [d for d in docs if d.program == program or d.program == "All"]
    if department:
        docs = [d for d in docs if d.department == department or d.department == "All"]
    
    return docs


@router.get("/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    """
    Get a specific document by ID.
    """
    for doc in MOCK_DOCUMENTS:
        if doc.id == doc_id:
            return doc
    return {"error": "Document not found"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    program: str = Form(...),
    department: str = Form(...)
):
    """
    Upload a new document (mock implementation).
    In production, this would:
    1. Save file to Firebase Storage
    2. Parse PDF and extract text
    3. Chunk and embed text
    4. Store vectors in Qdrant
    5. Save metadata to Firestore
    """
    return {
        "success": True,
        "message": f"Document '{title}' uploaded successfully",
        "document": {
            "id": "new-doc-123",
            "title": title,
            "category": category,
            "program": program,
            "department": department,
            "filename": file.filename,
            "chunk_count": 0  # Would be calculated after processing
        }
    }
