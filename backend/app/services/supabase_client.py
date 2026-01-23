"""
Supabase Client - Centralized Supabase client initialization
"""

from functools import lru_cache
from supabase import create_client, Client
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get cached Supabase client instance.
    Uses service role key for backend operations (bypasses RLS).
    """
    settings = get_settings()
    
    # Use service role key if available, otherwise fall back to anon key
    api_key = settings.supabase_service_role_key or settings.supabase_anon_key
    
    if not settings.supabase_url or not api_key:
        raise ValueError(
            "Supabase credentials not configured. "
            "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in .env"
        )
    
    client = create_client(settings.supabase_url, api_key)
    logger.info("Supabase client initialized")
    
    return client
