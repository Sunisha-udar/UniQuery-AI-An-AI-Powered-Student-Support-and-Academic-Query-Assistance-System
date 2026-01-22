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
            semester=request.semester
        )
        
        logger.info(f"Search returned {len(search_results)} results")
        
        # If no documents found, use LLM to detect intent
        if not search_results:
            logger.info("No documents found in database")
            
            # Use LLM to intelligently classify the intent
            try:
                intent_response = groq_service.client.chat.completions.create(
                    model=groq_service.model,
                    messages=[
                        {
                            "role": "system",
                            "content": """Classify the user's message into one of these categories:
1. "general_conversation" - greetings, small talk, thanks, farewells, asking about you, casual chat
2. "academic_question" - questions about courses, syllabus, attendance, exams, fees, university policies, admissions, placements, hostel, library, documents, etc.
3. "general_knowledge" - questions about science, history, geography, mathematics, technology, sports, health, current affairs, or any factual information not related to the university

Respond with ONLY the category name, nothing else."""
                        },
                        {
                            "role": "user",
                            "content": f"Classify this message: {request.question}"
                        }
                    ],
                    max_tokens=10,
                    temperature=0.0
                )
                
                intent = intent_response.choices[0].message.content.strip().lower()
                logger.info(f"Detected intent: {intent}")
                
            except Exception as e:
                logger.error(f"Error detecting intent: {e}")
                intent = "academic_question"  # Default to academic to be safe
            
            if "general" in intent or "conversation" in intent:
                # Handle greetings and small talk naturally
                try:
                    response = groq_service.client.chat.completions.create(
                        model=groq_service.model,
                        messages=[
                            {
                                "role": "system",
                                "content": """You are UniQuery AI, a friendly university assistant chatbot for students.
- Be warm, friendly, and helpful
- Use casual, conversational language
- Use emojis occasionally to be friendly 😊
- Keep responses concise
- You help students with academic questions based on uploaded university documents
- For this message, just respond naturally to the greeting/small talk"""
                            },
                            {
                                "role": "user",
                                "content": request.question
                            }
                        ],
                        max_tokens=256,
                        temperature=0.7
                    )
                    
                    answer = response.choices[0].message.content
                    
                    return QueryResponse(
                        answer=answer,
                        citations=[],
                        confidence=0.0
                    )
                except Exception as e:
                    logger.error(f"Error generating greeting response: {e}")
                    return QueryResponse(
                        answer="Hey there! 👋 I'm UniQuery AI, here to help you with academic questions. Feel free to ask me anything about your courses, syllabus, attendance, or exams!",
                        citations=[],
                        confidence=0.0
                    )
            elif "knowledge" in intent or "general" in intent:
                # General knowledge question (like "What is the capital of France?")
                return QueryResponse(
                    answer="Hey! I appreciate the question, but I'm specifically designed to help with university-related queries. 🎓\n\nI can answer questions about:\n• Course syllabus and curriculum\n• Attendance and leave policies\n• Exam schedules and assessment\n• Fees and admissions\n• Placements and internships\n• Hostel and library facilities\n• And much more about your university!\n\nFor general knowledge questions, I'd recommend checking out other resources. But I'm here anytime you need help with your academic stuff! 😊",
                    citations=[],
                    confidence=0.0
                )
            else:
                # Academic question but no matching documents - DO NOT use general knowledge
                return QueryResponse(
                    answer="I don't have information about that in my current knowledge base. 📚\n\nI can only provide answers based on the official documents that have been added to my system. Your question seems valid, so the information might not be available yet.\n\nTry:\n• Rephrasing your question with different keywords\n• Being more specific (e.g., mention your course, semester, or department)\n• Checking back later as new documents get added regularly\n\nI'm here to help, but I won't make guesses without solid documentation! 😊",
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
