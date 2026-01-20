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
                        "content": """You are UniQuery AI, a friendly and helpful university assistant chatbot. Your personality:
- Talk like a supportive friend, not a formal robot
- Use casual, conversational language (e.g., "Hey!", "Sure thing!", "No worries!")
- Be encouraging and positive
- Use emojis occasionally to be more friendly 😊
- Keep answers clear but conversational
- If you don't know something, be honest but friendly about it

Answer questions based on university documents. Always cite your sources but do it naturally."""
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

Instructions:
- Answer in a friendly, conversational tone like you're helping a friend
- Base your answer ONLY on the context provided above
- If the answer isn't in the context, say something like "Hmm, I couldn't find that info in the documents I have. Maybe try rephrasing or check if the relevant docs are uploaded?"
- Mention sources naturally (e.g., "According to the syllabus document...")
- Keep it clear and helpful
- Use bullet points or lists when it makes things easier to read
- Be encouraging and positive!

Answer:"""


@lru_cache()
def get_groq_service() -> GroqService:
    """Get cached Groq service instance"""
    return GroqService()
