"""
PDF Processing Service
Extracts text from PDFs and chunks them for RAG
"""

import PyPDF2
import pdfplumber
from typing import List, Dict, Any
import logging
import hashlib

logger = logging.getLogger(__name__)


class PDFService:
    """Service for processing PDF documents"""
    
    def extract_text_from_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF with page numbers.
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of dicts with 'page' and 'text' keys
        """
        pages = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text()
                    if text and text.strip():
                        pages.append({
                            'page': page_num,
                            'text': text.strip()
                        })
            
            logger.info(f"Extracted {len(pages)} pages from PDF")
            return pages
            
        except Exception as e:
            logger.error(f"Error extracting PDF: {e}")
            raise
    
    def chunk_text(
        self, 
        text: str, 
        chunk_size: int = 500, 
        overlap: int = 50
    ) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Text to chunk
            chunk_size: Target size of each chunk (characters)
            overlap: Overlap between chunks (characters)
            
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < text_length:
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size * 0.5:  # At least 50% of chunk
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return chunks
    
    def process_pdf(
        self,
        pdf_path: str,
        doc_metadata: Dict[str, Any],
        chunk_size: int = 500,
        overlap: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Process PDF into chunks with metadata.
        
        Args:
            pdf_path: Path to PDF file
            doc_metadata: Document metadata (program, dept, etc.)
            chunk_size: Size of text chunks
            overlap: Overlap between chunks
            
        Returns:
            List of chunks with metadata
        """
        # Extract text from PDF
        pages = self.extract_text_from_pdf(pdf_path)
        
        # Process each page
        all_chunks = []
        chunk_id = 0
        
        for page_data in pages:
            page_num = page_data['page']
            page_text = page_data['text']
            
            # Chunk the page text
            chunks = self.chunk_text(page_text, chunk_size, overlap)
            
            # Add metadata to each chunk
            for chunk_text in chunks:
                chunk_id += 1
                chunk_metadata = {
                    'id': chunk_id,
                    'text': chunk_text,
                    'page': page_num,
                    'doc_id': doc_metadata.get('doc_id'),
                    'title': doc_metadata.get('title'),
                    'program': doc_metadata.get('program'),
                    'department': doc_metadata.get('department'),
                    'semester': doc_metadata.get('semester'),
                    'category': doc_metadata.get('category'),
                    'version': doc_metadata.get('version', 1)
                }
                all_chunks.append(chunk_metadata)
        
        logger.info(f"Created {len(all_chunks)} chunks from {len(pages)} pages")
        return all_chunks
    
    def generate_doc_id(self, filename: str, metadata: Dict[str, Any]) -> str:
        """
        Generate unique document ID based on filename and metadata.
        
        Args:
            filename: Original filename
            metadata: Document metadata
            
        Returns:
            Unique document ID (16 character hash)
        """
        unique_string = f"{filename}_{metadata.get('program')}_{metadata.get('department')}_{metadata.get('semester')}_{metadata.get('category')}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:16]


# Singleton instance
_pdf_service = None


def get_pdf_service() -> PDFService:
    """Get or create PDF service singleton"""
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = PDFService()
    return _pdf_service
