"""
Configuration management for UniQuery AI
Loads environment variables and provides app-wide settings
"""

import os
from functools import lru_cache
from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Get the project root directory (parent of backend)
PROJECT_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Settings
    app_name: str = "UniQuery AI"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Qdrant Configuration
    qdrant_url: str
    qdrant_api_key: str
    qdrant_collection_name: str = "uniquery"
    
    # Voyage AI Embedding Configuration
    voyage_api_key: str = ""
    embedding_dimension: int = 512  # voyage-3-lite dimension
    
    # Firebase Configuration (for admin SDK)
    firebase_project_id: str = ""
    firebase_credentials_path: str = ""
    
    # LLM Configuration (Groq)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    

    
    # Supabase Configuration
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # CORS Configuration
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://uni-query-ai.vercel.app"
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra fields like VITE_* variables
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to ensure settings are loaded only once.
    """
    return Settings()
