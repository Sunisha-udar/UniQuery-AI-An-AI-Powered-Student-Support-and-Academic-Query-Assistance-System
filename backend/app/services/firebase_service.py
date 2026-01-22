"""
Firebase Service - Firestore operations for document metadata
"""

import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional, Dict, Any, List
import logging
import os
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class FirebaseService:
    """Service for managing Firestore document metadata"""
    
    def __init__(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Check if already initialized
            firebase_admin.get_app()
            logger.info("Firebase app already initialized")
        except ValueError:
            # Initialize Firebase
            # Look for service account key in multiple locations
            possible_paths = [
                Path("serviceAccountKey.json"),
                Path("..") / "serviceAccountKey.json",
                Path(__file__).parent.parent.parent / "serviceAccountKey.json",
            ]
            
            cred_path = None
            for path in possible_paths:
                if path.exists():
                    cred_path = path
                    break
            
            if cred_path:
                cred = credentials.Certificate(str(cred_path))
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase initialized with service account from {cred_path}")
            else:
                # Try default credentials or environment
                firebase_admin.initialize_app()
                logger.info("Firebase initialized with default credentials")
        
        self.db = firestore.client()
        logger.info("Firestore client initialized")
    
    def create_document_metadata(self, doc_data: Dict[str, Any]) -> bool:
        """
        Create document metadata in Firestore.
        
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
                - storage_path: Cloudinary URL
                - uploaded_by: User ID who uploaded
                - uploaded_at: Timestamp
                
        Returns:
            True if successful
        """
        try:
            doc_id = doc_data['doc_id']
            
            # Store in Firestore documents collection
            self.db.collection('documents').document(doc_id).set({
                'title': doc_data.get('title'),
                'category': doc_data.get('category'),
                'program': doc_data.get('program'),
                'department': doc_data.get('department'),
                'semester': doc_data.get('semester'),
                'version': doc_data.get('version', 1),
                'chunk_count': doc_data.get('chunk_count', 0),
                'storage_path': doc_data.get('storage_path'),
                'uploaded_by': doc_data.get('uploaded_by', 'admin'),
                'uploaded_at': firestore.SERVER_TIMESTAMP,
                'valid_from': doc_data.get('valid_from'),
                'valid_to': doc_data.get('valid_to'),
            })
            
            logger.info(f"Document metadata created in Firestore: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating document metadata: {e}")
            return False
    
    def get_document_metadata(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document metadata from Firestore.
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document metadata or None
        """
        try:
            doc_ref = self.db.collection('documents').document(doc_id)
            doc = doc_ref.get()
            
            if doc.exists:
                return doc.to_dict()
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
            query = self.db.collection('documents')
            
            # Apply filters
            if category:
                query = query.where('category', '==', category)
            if program:
                query = query.where('program', '==', program)
            if department:
                query = query.where('department', '==', department)
            
            # Order by upload date (newest first)
            query = query.order_by('uploaded_at', direction=firestore.Query.DESCENDING)
            
            docs = query.stream()
            
            results = []
            for doc in docs:
                data = doc.to_dict()
                data['doc_id'] = doc.id  # Use doc.id as doc_id
                # Convert Firestore timestamp to ISO string
                if 'uploaded_at' in data and data['uploaded_at']:
                    data['uploaded_at'] = data['uploaded_at'].isoformat() if hasattr(data['uploaded_at'], 'isoformat') else str(data['uploaded_at'])
                results.append(data)
            
            return results
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []
    
    def delete_document_metadata(self, doc_id: str) -> bool:
        """
        Delete document metadata from Firestore.
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if successful
        """
        try:
            self.db.collection('documents').document(doc_id).delete()
            logger.info(f"Document metadata deleted from Firestore: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document metadata: {e}")
            return False
    
    def update_document_metadata(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update document metadata in Firestore.
        
        Args:
            doc_id: Document ID
            updates: Fields to update
            
        Returns:
            True if successful
        """
        try:
            self.db.collection('documents').document(doc_id).update(updates)
            logger.info(f"Document metadata updated in Firestore: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating document metadata: {e}")
            return False


# Singleton instance
_firebase_service: Optional[FirebaseService] = None


def get_firebase_service() -> FirebaseService:
    """Get or create Firebase service singleton"""
    global _firebase_service
    if _firebase_service is None:
        _firebase_service = FirebaseService()
    return _firebase_service
