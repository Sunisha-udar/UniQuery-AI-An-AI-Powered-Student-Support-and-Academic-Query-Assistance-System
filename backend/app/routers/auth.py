"""
Authentication router - Firebase JWT verification
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

router = APIRouter()


class VerifyRequest(BaseModel):
    id_token: str


class VerifyResponse(BaseModel):
    uid: str
    email: str
    role: str


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
