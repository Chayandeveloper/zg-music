from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..services.ytmusic_service import ytmusic_service
from ..schemas.music import TrackItem

router = APIRouter(prefix="/api/v1", tags=["Catalog Metadata"])


@router.get("/songs/{video_id}", response_model=TrackItem)
def get_song_metadata(video_id: str):
    song = ytmusic_service.get_song(video_id)
    if not song:
        raise HTTPException(status_code=404, detail=f"Song metadata not found for ID: {video_id}")
    return song


@router.get("/artists/{channel_id}")
def get_artist_metadata(channel_id: str):
    artist = ytmusic_service.get_artist(channel_id)
    if not artist:
        raise HTTPException(status_code=404, detail=f"Artist metadata not found for ID: {channel_id}")
    return artist


@router.get("/albums/{browse_id}")
def get_album_metadata(browse_id: str):
    album = ytmusic_service.get_album(browse_id)
    if not album:
        raise HTTPException(status_code=404, detail=f"Album metadata not found for ID: {browse_id}")
    return album


@router.get("/playlists/{playlist_id}")
def get_playlist_metadata(
    playlist_id: str,
    limit: int = Query(100, ge=1, le=500, description="Max playlist tracks to fetch"),
):
    playlist = ytmusic_service.get_playlist(playlist_id, limit=limit)
    if not playlist:
        raise HTTPException(status_code=404, detail=f"Playlist metadata not found for ID: {playlist_id}")
    return playlist
