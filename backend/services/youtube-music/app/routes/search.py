from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Union, List

from ..services.ytmusic_service import ytmusic_service
from ..schemas.music import (
    UnifiedSearchResponse,
    TrackItem,
    ArtistItem,
    AlbumItem,
    PlaylistItem,
)

router = APIRouter(prefix="/api/v1", tags=["Search"])


@router.get("/search", response_model=Union[UnifiedSearchResponse, List[Union[TrackItem, ArtistItem, AlbumItem, PlaylistItem]]])
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    filter: Optional[str] = Query(None, description="Filter type: songs, artists, albums, playlists"),
    limit: int = Query(10, ge=1, le=50, description="Result limit"),
):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query must not be empty")

    valid_filters = ["songs", "artists", "albums", "playlists"]
    if filter:
        if filter not in valid_filters:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid filter '{filter}'. Allowed: {', '.join(valid_filters)}"
            )
        return ytmusic_service.search_filtered(query=q, filter_type=filter, limit=limit)

    return ytmusic_service.search_unified(query=q, limit=limit)
