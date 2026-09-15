from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .config import settings
from .services.ytmusic_service import ytmusic_service
from .routes.search import router as search_router
from .routes.catalog import router as catalog_router
from .routes.stream import router as stream_router
from .schemas.music import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ytmusic_app")

app = FastAPI(
    title="YouTube Music External Discovery Service",
    description="Dedicated microservice wrapping ytmusicapi for external music discovery & metadata in Zubeen Player.",
    version="1.0.0",
)

# CORS restricted to internal network / local callers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(search_router)
app.include_router(catalog_router)
app.include_router(stream_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "YouTube Music Discovery Service",
        "library": "ytmusicapi",
        "status": "online",
        "version": "1.0.0",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health():
    return HealthResponse(
        status="healthy",
        service="youtube-music-service",
        version="1.0.0",
        ytmusic_ready=ytmusic_service.is_ready,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal YouTube Music service error", "error": str(exc)},
    )
