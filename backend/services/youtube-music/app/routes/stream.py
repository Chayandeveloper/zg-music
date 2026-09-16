from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel

from ..services.stream_service import stream_service

router = APIRouter(prefix="/api/v1", tags=["Audio Streaming"])


class StreamResponse(BaseModel):
    videoId: str
    streamUrl: str
    title: Optional[str] = None
    duration: Optional[int] = None
    ext: Optional[str] = "m4a"
    thumbnail: Optional[str] = None
    format_id: Optional[str] = None
    abr: Optional[float] = None


@router.get("/stream/{video_id}", response_model=StreamResponse)
def get_audio_stream(video_id: str):
    """
    Extracts direct CDN audio stream URL for a given YouTube video ID.
    Used for native audio playback in mobile player (expo-av).
    """
    stream_data = stream_service.get_stream(video_id)
    if not stream_data:
        raise HTTPException(
            status_code=404,
            detail=f"Audio stream could not be extracted for ID: {video_id}",
        )
    return stream_data
