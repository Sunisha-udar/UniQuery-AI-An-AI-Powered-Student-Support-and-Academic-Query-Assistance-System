"""
Query router - RAG query endpoint
"""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.services.qdrant_service import get_qdrant_service
from app.services.groq_service import get_groq_service
from app.services.moderation_service import get_moderation_service

router = APIRouter()
logger = logging.getLogger(__name__)


class Citation(BaseModel):
    title: str
    page: int
    snippet: str
    score: float = 0.0


class QueryRequest(BaseModel):
    question: str
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: float
    moderation: Optional[dict] = None


@router.post("/", response_model=QueryResponse)
def process_query(request: QueryRequest, authorization: str = Header(None)):
    """
    Process a natural language query using RAG pipeline.
    
    Steps:
    1. Search Qdrant for relevant document chunks
    2. Generate answer using Groq LLM with context
    3. Return answer with citations
    """
    try:
        # Get services
        moderation_service = get_moderation_service()
        qdrant_service = get_qdrant_service()
        user_id = None

        if authorization:
            user_id = moderation_service.get_user_id_from_token(authorization)
            profile = moderation_service.get_user_profile(user_id)
            if profile.get("suspended"):
                raise HTTPException(status_code=403, detail="Your account has been suspended. Contact support or an administrator.")

        assessment = moderation_service.assess_message(request.question)
        if assessment.flagged:
            moderation_result = {
                **(moderation_service.apply_warning(user_id, assessment, request.question) if user_id else {
                    "warning_count": 0,
                    "remaining_warnings": 5,
                    "is_suspended": False,
                    "suspension_count": 0,
                }),
                "flagged": True,
                "reason_code": assessment.reason_code,
                "reason_detail": assessment.reason_detail,
                "detector": assessment.detector,
                "confidence": assessment.confidence,
            }

            return QueryResponse(
                answer=moderation_service.build_warning_message(
                    warning_count=moderation_result["warning_count"],
                    remaining_warnings=moderation_result["remaining_warnings"],
                    is_suspended=moderation_result["is_suspended"],
                ),
                citations=[],
                confidence=0.0,
                moderation=moderation_result,
            )
        
        logger.info(f"Processing query: {request.question}")
        
        # Search with filters if provided
        logger.info(f"Searching for: '{request.question}' with filters: program={request.program}, dept={request.department}, sem={request.semester}")
        
        search_results = qdrant_service.search(
            query=request.question,
            limit=5,  # Top 5 most relevant chunks
            program=request.program,
            department=request.department,
            semester=request.semester
        )
        
        logger.info(f"Search returned {len(search_results)} results")
        
        # If no documents found, use LLM to detect intent
        if not search_results:
            logger.info("No documents found in database")

            if assessment.reason_code == "academic_query_detected":
                return QueryResponse(
                    answer="I don't have information about that in my current knowledge base. 📚\n\nI can only provide answers based on the official documents that have been added to my system. Your question seems valid, so the information might not be available yet.\n\nTry:\n• Rephrasing your question with different keywords\n• Being more specific (e.g., mention your course, semester, or department)\n• Checking back later as new documents get added regularly\n\nI'm here to help, but I won't make guesses without solid documentation! 😊",
                    citations=[],
                    confidence=0.0,
                    moderation=None,
                )
            else:
                # General knowledge question (like "What is the capital of France?")
                return QueryResponse(
                    answer="Hey! I appreciate the question, but I'm specifically designed to help with university-related queries. 🎓\n\nI can answer questions about:\n• Course syllabus and curriculum\n• Attendance and leave policies\n• Exam schedules and assessment\n• Fees and admissions\n• Placements and internships\n• Hostel and library facilities\n• And much more about your university!\n\nFor general knowledge questions, I'd recommend checking out other resources. But I'm here anytime you need help with your academic stuff! 😊",
                    citations=[],
                    confidence=0.0,
                    moderation=None,
                )
        
        logger.info(f"Found {len(search_results)} relevant chunks")
        
        groq_service = get_groq_service()

        # Generate answer using Groq
        answer = groq_service.generate_answer(
            question=request.question,
            context_chunks=search_results
        )
        
        if not answer:
            logger.error("Failed to generate answer")
            return QueryResponse(
                answer="Sorry, I encountered an error generating the answer. Please try again.",
                citations=[],
                confidence=0.0
            )
        
        # Format citations
        citations = []
        for chunk in search_results:
            citations.append(Citation(
                title=chunk.get('title', 'Unknown'),
                page=chunk.get('page', 0),
                snippet=chunk.get('text', '')[:200] + '...',  # First 200 chars
                score=chunk.get('score', 0.0)
            ))
        
        # Calculate confidence (average of top 3 scores)
        top_scores = [c.score for c in citations[:3]]
        confidence = sum(top_scores) / len(top_scores) if top_scores else 0.0
        
        logger.info(f"Generated answer with confidence: {confidence:.2f}")
        
        return QueryResponse(
            answer=answer,
            citations=citations,
            confidence=round(confidence, 2),
            moderation=None,
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
