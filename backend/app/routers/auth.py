"""
Authentication router - Firebase JWT verification and user management
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import logging

from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter()


class VerifyRequest(BaseModel):
    id_token: str


class VerifyResponse(BaseModel):
    uid: str
    email: str
    role: str


class DeleteResponse(BaseModel):
    message: str
    deleted_user_id: str


@router.post("/verify", response_model=VerifyResponse)
async def verify_token(request: VerifyRequest):
    """
    Verify Firebase ID token and return user info.
    In production, this would verify with Firebase Admin SDK.
    """
    # Mock verification for MVP
    # In production: firebase_admin.auth.verify_id_token(request.id_token)
    
    # Return mock user for demo
    return VerifyResponse(
        uid="mock-user-123",
        email="demo@university.edu",
        role="student"
    )


@router.get("/me")
async def get_current_user(authorization: str = Header(None)):
    """
    Get current user from authorization header.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Mock user for MVP
    return {
        "uid": "mock-user-123",
        "email": "demo@university.edu",
        "role": "student",
        "program": "B.Tech",
        "department": "CSE",
        "semester": 3
    }


def get_user_id_from_token(authorization: str) -> str:
    """
    Extract user ID from authorization header.
    In production, this would verify the JWT token.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Remove 'Bearer ' prefix if present
    token = authorization.replace("Bearer ", "")
    
    try:
        # In production, verify JWT and extract user ID
        # For now, we'll use Supabase's built-in auth
        supabase = get_supabase_client()
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        logger.error(f"Error extracting user from token: {e}")
        raise HTTPException(status_code=401, detail="Invalid authorization token")


@router.delete("/users/{user_id}", response_model=DeleteResponse)
async def delete_user_by_admin(user_id: str, authorization: str = Header(None)):
    """
    Delete a user account (Admin only).
    This will cascade delete all related data: queries, chat history, etc.
    """
    try:
        # Get the requesting user's ID
        requesting_user_id = get_user_id_from_token(authorization)
        
        supabase = get_supabase_client()
        
        # Verify requesting user is an admin
        requesting_user = supabase.table("profiles").select("role").eq("id", requesting_user_id).execute()
        
        if not requesting_user.data or requesting_user.data[0].get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete user accounts")
        
        # Check if user to delete exists
        user_to_delete = supabase.table("profiles").select("email, role").eq("id", user_id).execute()
        
        if not user_to_delete.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user_to_delete.data[0].get("email")
        user_role = user_to_delete.data[0].get("role")
        
        # Check if trying to delete the last admin (trigger will handle this, but provide better UX)
        if user_role == "admin":
            admin_count = supabase.table("profiles").select("id", count="exact").eq("role", "admin").execute()
            if admin_count.count <= 1:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot delete the last admin account"
                )
        
        # Delete from Supabase Auth (this is the primary deletion point)
        # The database profile and related records will cascade delete via FK constraints
        try:
            supabase.auth.admin.delete_user(user_id)
            logger.info(f"Admin {requesting_user_id} deleted user {user_id} ({user_email})")
        except Exception as auth_error:
            # If auth deletion fails, try deleting from profiles table directly
            logger.warning(f"Auth deletion failed, attempting database deletion: {auth_error}")
            supabase.table("profiles").delete().eq("id", user_id).execute()
            logger.info(f"Admin {requesting_user_id} deleted user {user_id} ({user_email}) from database")
        
        return DeleteResponse(
            message=f"User {user_email} successfully deleted",
            deleted_user_id=user_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@router.delete("/me", response_model=DeleteResponse)
async def delete_own_account(authorization: str = Header(None)):
    """
    Delete your own account (Self-deletion).
    This will cascade delete all related data: queries, chat history, etc.
    """
    try:
        # Get the requesting user's ID
        user_id = get_user_id_from_token(authorization)
        
        supabase = get_supabase_client()
        
        # Get user info before deletion
        user_info = supabase.table("profiles").select("email, role").eq("id", user_id).execute()
        
        if not user_info.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_email = user_info.data[0].get("email")
        user_role = user_info.data[0].get("role")
        
        # Check if trying to delete the last admin
        if user_role == "admin":
            admin_count = supabase.table("profiles").select("id", count="exact").eq("role", "admin").execute()
            if admin_count.count <= 1:
                raise HTTPException(
                    status_code=400, 
                    detail="Cannot delete the last admin account. Please assign another admin first."
                )
        
        # Delete from Supabase Auth
        try:
            supabase.auth.admin.delete_user(user_id)
            logger.info(f"User {user_id} ({user_email}) deleted their own account")
        except Exception as auth_error:
            # If auth deletion fails, try deleting from profiles table directly
            logger.warning(f"Auth deletion failed, attempting database deletion: {auth_error}")
            supabase.table("profiles").delete().eq("id", user_id).execute()
            logger.info(f"User {user_id} ({user_email}) deleted their own account from database")
        
        return DeleteResponse(
            message="Your account has been successfully deleted",
            deleted_user_id=user_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting own account: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
