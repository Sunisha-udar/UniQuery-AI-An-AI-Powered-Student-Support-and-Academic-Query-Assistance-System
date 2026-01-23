"""
Supabase Database Service - PostgreSQL operations for document metadata
Replaces Firebase/Firestore service with identical interface
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class SupabaseDBService:
    """Service for managing document metadata in Supabase PostgreSQL"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.client = get_supabase_client()
        self.table_name = "documents"
        logger.info("Supabase DB service initialized")
    
    def create_document_metadata(self, doc_data: Dict[str, Any]) -> bool:
        """
        Create document metadata in Supabase.
        
        Args:
            doc_data: Document metadata including:
                - doc_id: Document ID
                - title: Document title
                - category: Document category
                - program: Academic program
                - department: Department
                - semester: Semester number
                - version: Version number
                - chunk_count: Number of chunks
                - storage_path: Supabase Storage URL
                - uploaded_by: User ID who uploaded
                
        Returns:
            True if successful
        """
        try:
            doc_id = doc_data['doc_id']
            
            # Prepare data for insert
            insert_data = {
                'id': doc_id,
                'title': doc_data.get('title'),
                'category': doc_data.get('category'),
                'program': doc_data.get('program', 'All'),
                'department': doc_data.get('department', 'All'),
                'semester': doc_data.get('semester', 0),
                'version': doc_data.get('version', 1),
                'chunk_count': doc_data.get('chunk_count', 0),
                'storage_path': doc_data.get('storage_path'),
                'uploaded_by': doc_data.get('uploaded_by', 'admin'),
                'uploaded_at': datetime.utcnow().isoformat(),
                'valid_from': doc_data.get('valid_from'),
                'valid_to': doc_data.get('valid_to'),
            }
            
            # Insert into Supabase
            self.client.table(self.table_name).insert(insert_data).execute()
            
            logger.info(f"Document metadata created in Supabase: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating document metadata: {e}")
            return False
    
    def get_document_metadata(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document metadata from Supabase.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document metadata or None
        """
        try:
            response = self.client.table(self.table_name).select("*").eq("id", doc_id).execute()
            
            if response.data and len(response.data) > 0:
                doc = response.data[0]
                # Map 'id' to 'doc_id' for compatibility
                doc['doc_id'] = doc.pop('id', doc_id)
                return doc
            return None
            
        except Exception as e:
            logger.error(f"Error getting document metadata: {e}")
            return None
    
    def list_documents(
        self,
        category: Optional[str] = None,
        program: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        List documents with optional filtering.
        
        Args:
            category: Filter by category
            program: Filter by program
            department: Filter by department
            
        Returns:
            List of document metadata
        """
        try:
            query = self.client.table(self.table_name).select("*")
            
            # Apply filters
            if category:
                query = query.eq('category', category)
            if program:
                query = query.eq('program', program)
            if department:
                query = query.eq('department', department)
            
            # Order by upload date (newest first)
            query = query.order('uploaded_at', desc=True)
            
            response = query.execute()
            
            results = []
            for doc in response.data:
                # Map 'id' to 'doc_id' for compatibility
                doc['doc_id'] = doc.pop('id', None)
                results.append(doc)
            
            return results
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []
    
    def delete_document_metadata(self, doc_id: str) -> bool:
        """
        Delete document metadata from Supabase.
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if successful
        """
        try:
            self.client.table(self.table_name).delete().eq("id", doc_id).execute()
            logger.info(f"Document metadata deleted from Supabase: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document metadata: {e}")
            return False
    
    def update_document_metadata(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update document metadata in Supabase.
        
        Args:
            doc_id: Document ID
            updates: Fields to update
            
        Returns:
            True if successful
        """
        try:
            # Add updated_at timestamp
            updates['updated_at'] = datetime.utcnow().isoformat()
            
            self.client.table(self.table_name).update(updates).eq("id", doc_id).execute()
            logger.info(f"Document metadata updated in Supabase: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating document metadata: {e}")
            return False


# Singleton instance
_supabase_db_service: Optional[SupabaseDBService] = None


def get_supabase_db_service() -> SupabaseDBService:
    """Get or create Supabase DB service singleton"""
    global _supabase_db_service
    if _supabase_db_service is None:
        _supabase_db_service = SupabaseDBService()
    return _supabase_db_service
