"""
Groq LLM Service - AI-powered answer generation
"""

from groq import Groq
from typing import List, Dict, Optional
import logging
from functools import lru_cache

from app.config import get_settings

logger = logging.getLogger(__name__)


class GroqService:
    """Service for generating answers using Groq LLM"""
    
    def __init__(self):
        """Initialize Groq client"""
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        logger.info(f"Groq service initialized with model: {self.model}")
    
    def generate_answer(
        self,
        question: str,
        context_chunks: List[Dict],
        max_tokens: int = 1024,
        temperature: float = 0.3
    ) -> Optional[str]:
        """
        Generate an answer based on question and context.
        
        Args:
            question: User's question
            context_chunks: List of relevant chunks from Qdrant
            max_tokens: Maximum tokens in response
            temperature: Creativity (0.0-1.0, lower = more focused)
        
        Returns:
            Generated answer or None on error
        """
        try:
            # Build context from chunks
            context = self._build_context(context_chunks)
            
            # Create prompt
            prompt = self._create_prompt(question, context)
            
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are UniQuery AI, a friendly and helpful university assistant chatbot.

CRITICAL RULES:
1. For ACADEMIC questions (courses, syllabus, attendance, exams, fees, policies):
   - Answer ONLY using the provided document context
   - NEVER use your general knowledge about universities
   - If the context doesn't contain the answer, say you don't have that information
   
2. For GENERAL conversation (greetings, small talk):
   - Respond naturally and warmly
   - Use casual, conversational language
   - Use emojis occasionally 😊

3. FORMATTING RULES (CRITICAL):
   - ALWAYS use bullet points for lists, steps, or multiple items
   - BREAK DOWN long text into smaller, readable chunks
   - NEVER write long, dense paragraphs
   - Use bold text for key terms

4. Always be encouraging and helpful
5. If you cite information, do it naturally (e.g., "According to the syllabus...")

Remember: You represent THIS specific university's information. Never make assumptions based on what's "typical" or "common" at other universities."""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            answer = response.choices[0].message.content
            logger.info(f"Generated answer for question: {question[:50]}...")
            
            return answer
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return None
    
    def _build_context(self, chunks: List[Dict]) -> str:
        """Build context string from chunks"""
        context_parts = []
        
        for i, chunk in enumerate(chunks, 1):
            # Extract metadata
            title = chunk.get('title', 'Unknown')
            page = chunk.get('page', '?')
            text = chunk.get('text', '')
            
            # Format chunk
            context_parts.append(
                f"[Source {i}: {title}, Page {page}]\n{text}\n"
            )
        
        return "\n".join(context_parts)
    
    def _create_prompt(self, question: str, context: str) -> str:
        """Create RAG prompt"""
        return f"""Context from university documents:

{context}

Question: {question}

CRITICAL INSTRUCTIONS:
- Answer ONLY based on the context above - this is from THIS university's official documents
- DO NOT use general knowledge about what's "typical" at universities
- DO NOT make assumptions about policies, dates, or requirements
- If the answer isn't in the context, say: "I don't have that information in the documents I have access to"
- Mention sources naturally (e.g., "According to the syllabus document...")
- Use a friendly, conversational tone like helping a friend
- MUST USE BULLET POINTS for proper structure
- Keep paragraphs short and easy to read
- Be encouraging and positive!

Answer:"""


@lru_cache()
def get_groq_service() -> GroqService:
    """Get cached Groq service instance"""
    return GroqService()
