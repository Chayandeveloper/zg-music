from pydantic import BaseModel, Field
from typing import Optional, List


class TrackItem(BaseModel):
    title: str
    artist: str
    artist_id: Optional[str] = None
    album: Optional[str] = None
    album_id: Optional[str] = None
    duration_seconds: Optional[int] = 0
    duration_formatted: Optional[str] = None
    artwork_url: Optional[str] = None
    source_type: str = Field(default="EXTERNAL", description="INTERNAL or EXTERNAL")
    external_source: str = Field(default="YOUTUBE_MUSIC", description="Origin external service")
    external_id: str = Field(description="YouTube video ID")
    external_url: Optional[str] = None
    is_explicit: bool = False


class ArtistItem(BaseModel):
    name: str
    external_id: str = Field(description="YouTube channel or browse ID")
    source_type: str = Field(default="EXTERNAL")
    external_source: str = Field(default="YOUTUBE_MUSIC")
    artwork_url: Optional[str] = None
    subscribers: Optional[str] = None
    external_url: Optional[str] = None


class AlbumItem(BaseModel):
    title: str
    artist: Optional[str] = None
    artist_id: Optional[str] = None
    external_id: str = Field(description="YouTube browse ID")
    source_type: str = Field(default="EXTERNAL")
    external_source: str = Field(default="YOUTUBE_MUSIC")
    year: Optional[int] = None
    artwork_url: Optional[str] = None
    track_count: Optional[int] = None
    external_url: Optional[str] = None


class PlaylistItem(BaseModel):
    title: str
    author: Optional[str] = None
    external_id: str = Field(description="YouTube playlist ID")
    source_type: str = Field(default="EXTERNAL")
    external_source: str = Field(default="YOUTUBE_MUSIC")
    item_count: Optional[int] = None
    artwork_url: Optional[str] = None
    external_url: Optional[str] = None


class UnifiedSearchResponse(BaseModel):
    query: str
    songs: List[TrackItem] = []
    artists: List[ArtistItem] = []
    albums: List[AlbumItem] = []
    playlists: List[PlaylistItem] = []


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    ytmusic_ready: bool
