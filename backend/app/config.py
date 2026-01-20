"""
Configuration management for UniQuery AI
Loads environment variables and provides app-wide settings
"""

import os
from functools import lru_cache
from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Get the backend directory path
BACKEND_DIR = Path(__file__).parent.parent
ENV_FILE = BACKEND_DIR / ".env"


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
    
    # Embedding Model
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dimension: int = 384  # bge-small-en dimension
    
    # Firebase Configuration (for admin SDK)
    firebase_project_id: str = ""
    firebase_credentials_path: str = ""
    
    # LLM Configuration (Groq)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    
    # Cloudinary Configuration
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    
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
