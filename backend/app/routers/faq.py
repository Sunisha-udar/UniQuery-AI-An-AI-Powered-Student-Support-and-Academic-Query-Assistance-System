"""
FAQ router - Frequently Asked Questions management
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import logging
from datetime import datetime

from app.services.supabase_client import get_supabase_client

router = APIRouter()
logger = logging.getLogger(__name__)


class FAQItem(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    view_count: int = 0
    is_pinned: bool = False
    created_at: str
    updated_at: Optional[str] = None


class CreateFAQRequest(BaseModel):
    question: str
    answer: str
    category: str
    program: Optional[str] = "All"
    department: Optional[str] = "All"
    semester: Optional[int] = 0
    is_pinned: bool = False


class UpdateFAQRequest(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    program: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None
    is_pinned: Optional[bool] = None


@router.get("/", response_model=List[FAQItem])
async def get_faqs(
    category: Optional[str] = None,
    program: Optional[str] = None,
    department: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """
    Get all FAQs with optional filtering.
    Pinned FAQs appear first, then sorted by view count.
    """
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("faqs").select("*")
        
        # Apply filters
        if category:
            query = query.eq("category", category)
        if program:
            query = query.eq("program", program)
        if department:
            query = query.eq("department", department)
        
        # Order by pinned first, then view count
        query = query.order("is_pinned", desc=True).order("view_count", desc=True).limit(limit)
        
        response = query.execute()
        
        return response.data
        
    except Exception as e:
        logger.error(f"Error fetching FAQs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch FAQs: {str(e)}")


@router.get("/popular", response_model=List[dict])
async def get_popular_questions(limit: int = Query(default=10, le=50)):
    """
    Get most frequently asked questions from chat history.
    Groups similar questions and returns the most common ones.
    """
    try:
        supabase = get_supabase_client()
        
        # Get all questions from chat history
        response = supabase.table("chat_history").select("question").execute()
        
        if not response.data:
            return []
        
        # Count question frequency (case-insensitive)
        question_counts = {}
        for item in response.data:
            question = item.get("question", "").strip().lower()
            if question and len(question) > 10:  # Filter out very short questions
                question_counts[question] = question_counts.get(question, 0) + 1
        
        # Sort by frequency
        sorted_questions = sorted(
            question_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        # Format response
        popular = [
            {
                "question": q[0].capitalize(),
                "count": q[1]
            }
            for q in sorted_questions
        ]
        
        return popular
        
    except Exception as e:
        logger.error(f"Error fetching popular questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch popular questions: {str(e)}")


@router.post("/", response_model=FAQItem)
async def create_faq(faq: CreateFAQRequest):
    """
    Create a new FAQ entry (Admin only).
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare data
        faq_data = {
            "question": faq.question,
            "answer": faq.answer,
            "category": faq.category,
            "program": faq.program or "All",
            "department": faq.department or "All",
            "semester": faq.semester or 0,
            "is_pinned": faq.is_pinned,
            "view_count": 0,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        response = supabase.table("faqs").insert(faq_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create FAQ")
        
        logger.info(f"FAQ created: {response.data[0]['id']}")
        return response.data[0]
        
    except Exception as e:
        logger.error(f"Error creating FAQ: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create FAQ: {str(e)}")


@router.patch("/{faq_id}", response_model=FAQItem)
async def update_faq(faq_id: str, updates: UpdateFAQRequest):
    """
    Update an existing FAQ (Admin only).
    """
    try:
        supabase = get_supabase_client()
        
        # Prepare update data (only include non-None fields)
        update_data = {
            k: v for k, v in updates.dict().items() 
            if v is not None
        }
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update in database
        response = supabase.table("faqs").update(update_data).eq("id", faq_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        logger.info(f"FAQ updated: {faq_id}")
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating FAQ: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update FAQ: {str(e)}")


@router.delete("/{faq_id}")
async def delete_faq(faq_id: str):
    """
    Delete an FAQ (Admin only).
    """
    try:
        supabase = get_supabase_client()
        
        # Delete from database
        response = supabase.table("faqs").delete().eq("id", faq_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        logger.info(f"FAQ deleted: {faq_id}")
        return {"success": True, "message": "FAQ deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting FAQ: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete FAQ: {str(e)}")


@router.post("/{faq_id}/increment-view")
async def increment_faq_view(faq_id: str):
    """
    Increment the view count for an FAQ.
    Called when a user views/expands an FAQ.
    Uses a secure database function to bypass RLS.
    """
    try:
        supabase = get_supabase_client()
        
        # Call the secure function to increment view count
        # This bypasses RLS since it's a SECURITY DEFINER function
        supabase.rpc("increment_faq_view_count", {"faq_id": faq_id}).execute()
        
        # Get updated view count
        response = supabase.table("faqs").select("view_count").eq("id", faq_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="FAQ not found")
        
        current_count = response.data[0].get("view_count", 0)
        
        return {"success": True, "view_count": current_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error incrementing FAQ view: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to increment view count: {str(e)}")


@router.get("/categories")
async def get_faq_categories():
    """
    Get all unique FAQ categories.
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("faqs").select("category").execute()
        
        if not response.data:
            return []
        
        # Get unique categories
        categories = list(set(item["category"] for item in response.data if item.get("category")))
        categories.sort()
        
        return categories
        
    except Exception as e:
        logger.error(f"Error fetching FAQ categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")
