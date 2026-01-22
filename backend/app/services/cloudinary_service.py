"""
Cloudinary Service - PDF storage and retrieval
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict
import logging
from functools import lru_cache

from app.config import get_settings

logger = logging.getLogger(__name__)


class CloudinaryService:
    """Service for managing PDF uploads to Cloudinary"""
    
    def __init__(self):
        """Initialize Cloudinary configuration"""
        settings = get_settings()
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True
        )
        
        logger.debug("Cloudinary service initialized")
    
    def upload_pdf(
        self,
        file_path: str,
        doc_id: str,
        metadata: Dict[str, str]
    ) -> Optional[Dict[str, str]]:
        """
        Upload a PDF file to Cloudinary.
        
        Args:
            file_path: Local path to the PDF file
            doc_id: Unique document identifier
            metadata: Document metadata (title, category, etc.)
        
        Returns:
            Dictionary with upload info (url, public_id, etc.) or None on failure
        """
        try:
            # Upload to Cloudinary with metadata
            result = cloudinary.uploader.upload(
                file_path,
                resource_type="raw",  # For non-image files
                public_id=f"pdfs/{doc_id}",
                folder="uniquery",
                context=metadata,  # Store metadata with the file
                tags=[metadata.get('category', ''), metadata.get('program', '')]
            )
            
            logger.info(f"PDF uploaded successfully: {doc_id}")
            
            return {
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'bytes': result.get('bytes', 0),
                'format': result.get('format', 'pdf'),
                'created_at': result.get('created_at', '')
            }
            
        except Exception as e:
            logger.error(f"Error uploading PDF to Cloudinary: {e}")
            return None
    
    def get_pdf_url(self, doc_id: str) -> Optional[str]:
        """
        Get the download URL for a PDF.
        
        Args:
            doc_id: Document identifier
        
        Returns:
            Secure URL to download the PDF or None if not found
        """
        try:
            # Try with .pdf extension first
            public_id = f"uniquery/pdfs/{doc_id}.pdf"
            try:
                result = cloudinary.api.resource(
                    public_id,
                    resource_type="raw"
                )
                return result['secure_url']
            except:
                # Try without extension
                public_id = f"uniquery/pdfs/{doc_id}"
                result = cloudinary.api.resource(
                    public_id,
                    resource_type="raw"
                )
                return result['secure_url']
            
        except Exception as e:
            logger.error(f"Error getting PDF URL: {e}")
            return None
    
    def delete_pdf(self, doc_id: str) -> bool:
        """
        Delete a PDF from Cloudinary.
        
        Args:
            doc_id: Document identifier
        
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            # Try with .pdf extension first
            public_id = f"uniquery/pdfs/{doc_id}.pdf"
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type="raw",
                invalidate=True
            )
            
            if result.get('result') == 'ok':
                logger.info(f"PDF deleted successfully: {doc_id}")
                return True
            
            # If not found with extension, try without
            public_id = f"uniquery/pdfs/{doc_id}"
            result = cloudinary.uploader.destroy(
                public_id,
                resource_type="raw",
                invalidate=True
            )
            
            if result.get('result') == 'ok':
                logger.info(f"PDF deleted successfully: {doc_id}")
                return True
            else:
                logger.warning(f"PDF deletion returned: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting PDF: {e}")
            return False
    
    def list_pdfs(
        self,
        max_results: int = 100,
        next_cursor: Optional[str] = None
    ) -> Dict:
        """
        List all PDFs in Cloudinary.
        
        Args:
            max_results: Maximum number of results to return
            next_cursor: Pagination cursor
        
        Returns:
            Dictionary with resources and next_cursor
        """
        try:
            result = cloudinary.api.resources(
                resource_type="raw",
                type="upload",
                prefix="uniquery/pdfs/",
                max_results=max_results,
                next_cursor=next_cursor
            )
            
            return {
                'resources': result.get('resources', []),
                'next_cursor': result.get('next_cursor')
            }
            
        except Exception as e:
            logger.error(f"Error listing PDFs: {e}")
            return {'resources': [], 'next_cursor': None}


@lru_cache()
def get_cloudinary_service() -> CloudinaryService:
    """Get cached Cloudinary service instance"""
    return CloudinaryService()
