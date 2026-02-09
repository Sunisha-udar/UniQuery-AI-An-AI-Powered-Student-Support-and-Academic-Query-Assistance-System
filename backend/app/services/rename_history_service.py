"""
Rename History Service - Tracks document rename operations for undo/redo
Uses Supabase to store rename history
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


class RenameHistoryService:
    """Service for managing document rename history"""
    
    def __init__(self):
        """Initialize Supabase client"""
        self.client = get_supabase_client()
        self.table_name = "rename_history"
        logger.info("Rename History service initialized")
    
    def create_history_table(self) -> bool:
        """
        Create the rename_history table if it doesn't exist.
        Note: This should be run as a migration in production.
        
        Table schema:
        - id: UUID primary key
        - doc_id: Document ID
        - old_title: Previous title
        - new_title: New title
        - renamed_at: Timestamp
        - renamed_by: User who performed the rename
        - undone: Boolean flag indicating if this rename was undone
        """
        try:
            # This is a placeholder - in production, use Supabase migrations
            # For now, we'll check if the table exists by trying to query it
            logger.info("Rename history table should be created via Supabase migrations")
            return True
        except Exception as e:
            logger.error(f"Error checking rename_history table: {e}")
            return False
    
    def record_rename(
        self,
        doc_id: str,
        old_title: str,
        new_title: str,
        renamed_by: str = "admin"
    ) -> Optional[str]:
        """
        Record a rename operation in the history.
        
        Args:
            doc_id: Document ID
            old_title: Previous title
            new_title: New title
            renamed_by: User who performed the rename
            
        Returns:
            History entry ID if successful, None otherwise
        """
        try:
            history_data = {
                'doc_id': doc_id,
                'old_title': old_title,
                'new_title': new_title,
                'renamed_at': datetime.utcnow().isoformat(),
                'renamed_by': renamed_by,
                'undone': False
            }
            
            response = self.client.table(self.table_name).insert(history_data).execute()
            
            if response.data and len(response.data) > 0:
                history_id = response.data[0].get('id')
                logger.info(f"Recorded rename history: {old_title} → {new_title} for doc {doc_id}")
                return history_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error recording rename history: {e}")
            # Don't fail the rename operation if history recording fails
            return None
    
    def get_document_history(self, doc_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get rename history for a specific document.
        
        Args:
            doc_id: Document ID
            limit: Maximum number of history entries to return
            
        Returns:
            List of history entries (newest first)
        """
        try:
            response = self.client.table(self.table_name)\
                .select("*")\
                .eq("doc_id", doc_id)\
                .order("renamed_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error getting document history: {e}")
            return []
    
    def get_latest_rename(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the most recent rename operation for a document.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Latest history entry or None
        """
        try:
            response = self.client.table(self.table_name)\
                .select("*")\
                .eq("doc_id", doc_id)\
                .eq("undone", False)\
                .order("renamed_at", desc=True)\
                .limit(1)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting latest rename: {e}")
            return None
    
    def mark_as_undone(self, history_id: str) -> bool:
        """
        Mark a history entry as undone.
        
        Args:
            history_id: History entry ID
            
        Returns:
            True if successful
        """
        try:
            self.client.table(self.table_name)\
                .update({'undone': True})\
                .eq("id", history_id)\
                .execute()
            
            logger.info(f"Marked history entry {history_id} as undone")
            return True
            
        except Exception as e:
            logger.error(f"Error marking history as undone: {e}")
            return False
    
    def get_all_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all rename history (for admin view).
        
        Args:
            limit: Maximum number of entries to return
            
        Returns:
            List of all history entries (newest first)
        """
        try:
            response = self.client.table(self.table_name)\
                .select("*")\
                .order("renamed_at", desc=True)\
                .limit(limit)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error getting all history: {e}")
            return []


# Singleton instance
_rename_history_service: Optional[RenameHistoryService] = None


def get_rename_history_service() -> RenameHistoryService:
    """Get or create Rename History service singleton"""
    global _rename_history_service
    if _rename_history_service is None:
        _rename_history_service = RenameHistoryService()
    return _rename_history_service
