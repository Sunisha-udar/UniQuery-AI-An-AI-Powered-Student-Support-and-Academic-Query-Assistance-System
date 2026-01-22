"""
Query router - RAG query endpoint
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.services.qdrant_service import get_qdrant_service
from app.services.groq_service import get_groq_service

router = APIRouter()
logger = logging.getLogger(__name__)


class Citation(BaseModel):
    title: str
    page: int
    category: str
    snippet: str
    score: float = 0.0


class QueryRequest(BaseModel):
    question: str
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    category: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: float


@router.post("/", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process a natural language query using RAG pipeline.
    
    Steps:
    1. Search Qdrant for relevant document chunks
    2. Generate answer using Groq LLM with context
    3. Return answer with citations
    """
    try:
        # Get services
        qdrant_service = get_qdrant_service()
        groq_service = get_groq_service()
        
        logger.info(f"Processing query: {request.question}")
        
        # Search with filters if provided
        logger.info(f"Searching for: '{request.question}' with filters: program={request.program}, dept={request.department}, sem={request.semester}")
        
        search_results = qdrant_service.search(
            query=request.question,
            limit=5,  # Top 5 most relevant chunks
            program=request.program,
            department=request.department,
            semester=request.semester,
            category=request.category
        )
        
        logger.info(f"Search returned {len(search_results)} results")
        
        # Always generate an answer, even if no documents found
        # The AI will use its general knowledge for greetings and general questions
        if not search_results:
            logger.info("No documents found, using general knowledge")
            # Call Groq without context for general questions
            try:
                response = groq_service.client.chat.completions.create(
                    model=groq_service.model,
                    messages=[
                        {
                            "role": "system",
                            "content": """You are UniQuery AI, a friendly university assistant chatbot. Your personality:
- Talk like a supportive friend, not a formal robot
- Use casual, conversational language (e.g., "Hey!", "Sure thing!", "No worries!")
- Be encouraging and positive
- Use emojis occasionally to be more friendly 😊
- Keep answers clear but conversational

For greetings and general questions, respond naturally. For academic questions, mention that you'd be more helpful once documents are uploaded."""
                        },
                        {
                            "role": "user",
                            "content": request.question
                        }
                    ],
                    max_tokens=512,
                    temperature=0.7
                )
                
                answer = response.choices[0].message.content
                
                return QueryResponse(
                    answer=answer,
                    citations=[],
                    confidence=0.0
                )
            except Exception as e:
                logger.error(f"Error generating general answer: {e}")
                return QueryResponse(
                    answer="Hey! 👋 I'm here to help with your university questions. Right now I don't have any documents loaded, but feel free to ask me anything! 😊",
                    citations=[],
                    confidence=0.0
                )
        
        logger.info(f"Found {len(search_results)} relevant chunks")
        
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
                category=chunk.get('category', 'unknown'),
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
            confidence=round(confidence, 2)
        )
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
