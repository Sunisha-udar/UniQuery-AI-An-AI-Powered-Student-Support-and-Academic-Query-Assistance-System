"""
Query router - RAG query endpoint
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class Citation(BaseModel):
    title: str
    page: int
    category: str
    snippet: str


class QueryRequest(BaseModel):
    question: str
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: float


# Mock responses for demo
MOCK_RESPONSES = {
    "attendance": {
        "answer": "The minimum attendance requirement is **75%** for all courses. Students with less than 75% attendance will not be permitted to appear for end-semester examinations.",
        "citations": [
            {"title": "Attendance Policy 2024", "page": 3, "category": "attendance", "snippet": "A minimum of 75% attendance is mandatory..."}
        ],
        "confidence": 0.95
    },
    "exam": {
        "answer": "The end-semester examinations are scheduled from **March 15 to March 30, 2024**. The detailed timetable will be published 2 weeks before the exams.",
        "citations": [
            {"title": "Academic Calendar 2024", "page": 5, "category": "academic_calendar", "snippet": "End semester examinations: March 15-30..."}
        ],
        "confidence": 0.92
    },
    "python": {
        "answer": "Yes, **Python Programming** is included in the 3rd semester syllabus for B.Tech CSE. The course code is CS301.",
        "citations": [
            {"title": "CSE Syllabus 2024", "page": 24, "category": "syllabus", "snippet": "CS301 - Python Programming (3-0-2) 4 credits..."}
        ],
        "confidence": 0.98
    },
    "default": {
        "answer": "I found some relevant information in the academic documents. Could you please be more specific about what you'd like to know?",
        "citations": [
            {"title": "Academic Handbook 2024", "page": 1, "category": "admin_info", "snippet": "Welcome to the academic year 2024..."}
        ],
        "confidence": 0.65
    }
}


@router.post("/", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process a natural language query and return RAG response.
    In production, this would use Qdrant for vector search and Groq for LLM.
    """
    question_lower = request.question.lower()
    
    # Simple keyword matching for demo
    if "attendance" in question_lower:
        response = MOCK_RESPONSES["attendance"]
    elif "exam" in question_lower or "schedule" in question_lower:
        response = MOCK_RESPONSES["exam"]
    elif "python" in question_lower or "syllabus" in question_lower:
        response = MOCK_RESPONSES["python"]
    else:
        response = MOCK_RESPONSES["default"]
    
    return QueryResponse(
        answer=response["answer"],
        citations=[Citation(**c) for c in response["citations"]],
        confidence=response["confidence"]
    )
