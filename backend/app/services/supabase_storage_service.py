"""
Supabase Storage Service - PDF storage and retrieval
"""

from typing import Optional, Dict, List
import logging
from pathlib import Path
import mimetypes

from app.services.supabase_client import get_supabase_client
from app.config import get_settings

logger = logging.getLogger(__name__)


class SupabaseStorageService:
    """Service for managing PDF uploads to Supabase Storage"""
    
    BUCKET_NAME = "documents"
    
    def __init__(self):
        """Initialize Supabase Storage client"""
        self.client = get_supabase_client()
        self.settings = get_settings()
        logger.info("Supabase Storage service initialized")
    
    def _get_storage_path(self, doc_id: str) -> str:
        """Generate storage path for a document"""
        return f"pdfs/{doc_id}.pdf"
    
    def upload_pdf(
        self,
        file_path: str,
        doc_id: str,
        metadata: Dict[str, str]
    ) -> Optional[Dict[str, str]]:
        """
        Upload a PDF file to Supabase Storage.
        
        Args:
            file_path: Local path to the PDF file
            doc_id: Unique document identifier
            metadata: Document metadata (title, category, etc.)
        
        Returns:
            Dictionary with upload info (url, path, etc.) or None on failure
        """
        try:
            storage_path = self._get_storage_path(doc_id)
            
            # Read file content
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Get file size
            file_size = len(file_content)
            
            # Upload to Supabase Storage
            self.client.storage.from_(self.BUCKET_NAME).upload(
                path=storage_path,
                file=file_content,
                file_options={
                    "content-type": "application/pdf",
                    "upsert": "true"  # Overwrite if exists
                }
            )
            
            # Get public URL
            url = self.client.storage.from_(self.BUCKET_NAME).get_public_url(storage_path)
            
            logger.info(f"PDF uploaded successfully: {doc_id}")
            
            return {
                'url': url,
                'path': storage_path,
                'bytes': file_size,
                'format': 'pdf',
                'bucket': self.BUCKET_NAME
            }
            
        except Exception as e:
            logger.error(f"Error uploading PDF to Supabase Storage: {e}")
            return None
    
    def get_pdf_url(self, doc_id: str) -> Optional[str]:
        """
        Get the download URL for a PDF.
        
        Args:
            doc_id: Document identifier
        
        Returns:
            Public URL to download the PDF or None if not found
        """
        try:
            storage_path = self._get_storage_path(doc_id)
            
            # Get public URL (Supabase Storage generates permanent public URLs)
            url = self.client.storage.from_(self.BUCKET_NAME).get_public_url(storage_path)
            
            return url
            
        except Exception as e:
            logger.error(f"Error getting PDF URL for doc_id {doc_id}: {e}")
            return None
    
    def get_signed_url(self, doc_id: str, expires_in: int = 3600) -> Optional[str]:
        """
        Get a signed (temporary) download URL for a PDF.
        
        Args:
            doc_id: Document identifier
            expires_in: URL expiry time in seconds (default 1 hour)
        
        Returns:
            Signed URL to download the PDF or None if not found
        """
        try:
            storage_path = self._get_storage_path(doc_id)
            
            # Create signed URL
            response = self.client.storage.from_(self.BUCKET_NAME).create_signed_url(
                path=storage_path,
                expires_in=expires_in
            )
            
            return response.get('signedURL')
            
        except Exception as e:
            logger.error(f"Error creating signed URL for doc_id {doc_id}: {e}")
            return None
    
    def delete_pdf(self, doc_id: str) -> bool:
        """
        Delete a PDF from Supabase Storage.
        
        Args:
            doc_id: Document identifier
        
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            storage_path = self._get_storage_path(doc_id)
            
            # Delete from Supabase Storage
            self.client.storage.from_(self.BUCKET_NAME).remove([storage_path])
            
            logger.info(f"PDF deleted successfully: {doc_id}")
            return True
                
        except Exception as e:
            logger.error(f"Error deleting PDF: {e}")
            return False
    
    def list_pdfs(
        self,
        max_results: int = 100,
        offset: int = 0
    ) -> Dict:
        """
        List all PDFs in Supabase Storage.
        
        Args:
            max_results: Maximum number of results to return
            offset: Offset for pagination
        
        Returns:
            Dictionary with resources and pagination info
        """
        try:
            response = self.client.storage.from_(self.BUCKET_NAME).list(
                path="pdfs/",
                options={
                    "limit": max_results,
                    "offset": offset
                }
            )
            
            return {
                'resources': response,
                'count': len(response)
            }
            
        except Exception as e:
            logger.error(f"Error listing PDFs: {e}")
            return {'resources': [], 'count': 0}
    
    def upload_from_bytes(
        self,
        file_bytes: bytes,
        doc_id: str,
        content_type: str = "application/pdf"
    ) -> Optional[Dict[str, str]]:
        """
        Upload PDF from bytes directly (for migration scripts).
        
        Args:
            file_bytes: File content as bytes
            doc_id: Unique document identifier
            content_type: MIME type
        
        Returns:
            Dictionary with upload info or None on failure
        """
        try:
            storage_path = self._get_storage_path(doc_id)
            
            # Upload to Supabase Storage
            self.client.storage.from_(self.BUCKET_NAME).upload(
                path=storage_path,
                file=file_bytes,
                file_options={
                    "content-type": content_type,
                    "upsert": "true"
                }
            )
            
            # Get public URL
            url = self.client.storage.from_(self.BUCKET_NAME).get_public_url(storage_path)
            
            logger.info(f"PDF uploaded from bytes successfully: {doc_id}")
            
            return {
                'url': url,
                'path': storage_path,
                'bytes': len(file_bytes),
                'format': 'pdf',
                'bucket': self.BUCKET_NAME
            }
            
        except Exception as e:
            logger.error(f"Error uploading PDF from bytes: {e}")
            return None


# Singleton instance
_supabase_storage_service: Optional[SupabaseStorageService] = None


def get_supabase_storage_service() -> SupabaseStorageService:
    """Get or create Supabase Storage service singleton"""
    global _supabase_storage_service
    if _supabase_storage_service is None:
        _supabase_storage_service = SupabaseStorageService()
    return _supabase_storage_service
