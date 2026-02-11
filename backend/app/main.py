"""
UniQuery AI - FastAPI Backend
Main entry point for the API server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

from app.routers import auth, query, documents, debug
from app.services.qdrant_service import get_qdrant_service
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:     %(message)s'
)
# Silence noisy loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting UniQuery AI API...")
    
    try:
        # Initialize Qdrant service
        qdrant = get_qdrant_service()
        
        # Create collection if it doesn't exist
        qdrant.create_collection()
        
        # Log collection info
        info = qdrant.get_collection_info()
        if info:
            logger.info(f"Qdrant collection ready: {info}")
        
        logger.info("✓ All services initialized successfully")
    except Exception as e:
        logger.error(f"✗ Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down UniQuery AI API...")


app = FastAPI(
    title="UniQuery AI API",
    description="AI-powered academic assistant backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(query.router, prefix="/api/query", tags=["Query"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])

# Serve frontend static files (for ngrok/mobile testing)
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    logger.info(f"Serving frontend from: {frontend_dist}")
    
    # Mount static assets
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    # Serve other static files
    @app.get("/pwa-{size}.png")
    async def serve_pwa_icons(size: str):
        icon_path = frontend_dist / f"pwa-{size}.png"
        if icon_path.exists():
            return FileResponse(icon_path)
        return {"error": "Icon not found"}
    
    @app.get("/manifest.webmanifest")
    async def serve_manifest():
        manifest_path = frontend_dist / "manifest.webmanifest"
        if manifest_path.exists():
            return FileResponse(manifest_path, media_type="application/manifest+json")
        return {"error": "Manifest not found"}
    
    @app.get("/sw.js")
    async def serve_sw():
        sw_path = frontend_dist / "sw.js"
        if sw_path.exists():
            return FileResponse(sw_path, media_type="application/javascript")
        return {"error": "Service worker not found"}
    
    @app.get("/registerSW.js")
    async def serve_register_sw():
        reg_path = frontend_dist / "registerSW.js"
        if reg_path.exists():
            return FileResponse(reg_path, media_type="application/javascript")
        return {"error": "Register SW not found"}
    
    @app.get("/workbox-{filename}.js")
    async def serve_workbox(filename: str):
        wb_path = frontend_dist / f"workbox-{filename}.js"
        if wb_path.exists():
            return FileResponse(wb_path, media_type="application/javascript")
        return {"error": "Workbox file not found"}
    
    # Serve favicon and other root files
    @app.get("/{filename}.{ext}")
    async def serve_root_files(filename: str, ext: str):
        file_path = frontend_dist / f"{filename}.{ext}"
        if file_path.exists():
            return FileResponse(file_path)
        # If not found, continue to index.html catch-all
        return FileResponse(frontend_dist / "index.html", media_type="text/html")
    
    # Catch-all route for SPA (must be last)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If it's an API route, let it 404 naturally
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"error": "Not found"})
        
        # For all other routes, serve index.html (SPA routing)
        index_path = frontend_dist / "index.html"
        if index_path.exists():
            return FileResponse(index_path, media_type="text/html")
        return {"error": "Frontend not built. Run 'cd frontend && npm run build'"}
else:
    logger.warning("Frontend dist folder not found. API-only mode.")
    
    @app.get("/")
    async def root():
        return {
            "name": "UniQuery AI API",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs",
            "note": "Frontend not available. Build with 'cd frontend && npm run build'"
        }


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """
    Health check endpoint with Qdrant info
    """
    try:
        qdrant = get_qdrant_service()
        collection_info = qdrant.get_collection_info()
        
        return {
            "status": "healthy",
            "services": {
                "qdrant": {
                    "status": "healthy",
                    "collection": collection_info
                }
            }
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "healthy",
            "message": "Server is running"
        }


@app.get("/api/health/detailed")
async def detailed_health_check():
    """
    Detailed health check that verifies all services (may be slow)
    """
    health_status = {
        "status": "healthy",
        "services": {}
    }
    
    # Check Qdrant
    try:
        qdrant = get_qdrant_service()
        qdrant_healthy = qdrant.health_check()
        collection_info = qdrant.get_collection_info()
        
        health_status["services"]["qdrant"] = {
            "status": "healthy" if qdrant_healthy else "unhealthy",
            "collection": collection_info
        }
    except Exception as e:
        health_status["services"]["qdrant"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status
