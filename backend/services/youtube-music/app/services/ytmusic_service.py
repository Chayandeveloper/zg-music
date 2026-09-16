import os
import logging
from typing import Optional, List, Dict, Any
from ytmusicapi import YTMusic

from ..config import settings
from ..schemas.music import (
    TrackItem,
    ArtistItem,
    AlbumItem,
    PlaylistItem,
    UnifiedSearchResponse,
)

logger = logging.getLogger("ytmusic_service")


class YTMusicService:
    """
    Dedicated wrapper class encapsulating all ytmusicapi interactions.
    Does not allow direct scattering of ytmusicapi calls across the application.
    """

    def __init__(self, auth_file: Optional[str] = None):
        self.auth_file = auth_file or settings.YTMUSIC_AUTH_FILE
        self._client: Optional[YTMusic] = None
        self._initialize_client()

    def _initialize_client(self):
        try:
            if self.auth_file and os.path.exists(self.auth_file):
                logger.info(f"Initializing YTMusic with auth file: {self.auth_file}")
                self._client = YTMusic(self.auth_file)
            else:
                logger.info("Initializing YTMusic in anonymous/public mode")
                self._client = YTMusic()
        except Exception as e:
            logger.error(f"Failed to initialize YTMusic client: {e}")
            self._client = None

    @property
    def is_ready(self) -> bool:
        return self._client is not None

    def _extract_best_thumbnail(self, thumbnails: Optional[List[Dict[str, Any]]]) -> Optional[str]:
        if not thumbnails or not isinstance(thumbnails, list):
            return None
        # Thumbnails are typically sorted by resolution ascending; pick the last one
        return thumbnails[-1].get("url")

    def _parse_duration(self, duration_str: Optional[str]) -> int:
        if not duration_str or not isinstance(duration_str, str):
            return 0
        parts = duration_str.split(":")
        try:
            if len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
            elif len(parts) == 3:
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        except (ValueError, TypeError):
            return 0
        return 0

    def search_unified(self, query: str, limit: int = 10) -> UnifiedSearchResponse:
        """
        Executes a broad search querying songs, artists, and albums from YouTube Music.
        """
        if not self._client:
            self._initialize_client()
        if not self._client:
            logger.error("YTMusic client is unavailable for search")
            return UnifiedSearchResponse(query=query)

        songs: List[TrackItem] = []
        artists: List[ArtistItem] = []
        albums: List[AlbumItem] = []
        playlists: List[PlaylistItem] = []

        try:
            # Query songs
            raw_songs = self._client.search(query=query, filter="songs", limit=limit)
            for item in raw_songs:
                parsed_song = self._normalize_song(item)
                if parsed_song:
                    songs.append(parsed_song)
        except Exception as e:
            logger.warning(f"Error searching songs for query '{query}': {e}")

        try:
            # Query artists
            raw_artists = self._client.search(query=query, filter="artists", limit=min(limit, 5))
            for item in raw_artists:
                parsed_artist = self._normalize_artist(item)
                if parsed_artist:
                    artists.append(parsed_artist)
        except Exception as e:
            logger.warning(f"Error searching artists for query '{query}': {e}")

        try:
            # Query albums
            raw_albums = self._client.search(query=query, filter="albums", limit=min(limit, 5))
            for item in raw_albums:
                parsed_album = self._normalize_album(item)
                if parsed_album:
                    albums.append(parsed_album)
        except Exception as e:
            logger.warning(f"Error searching albums for query '{query}': {e}")

        return UnifiedSearchResponse(
            query=query,
            songs=songs,
            artists=artists,
            albums=albums,
            playlists=playlists,
        )

    def search_filtered(self, query: str, filter_type: str, limit: int = 20) -> List[Any]:
        """
        Executes a filtered search for a specific entity type: 'songs', 'artists', 'albums', 'playlists'.
        """
        if not self._client:
            self._initialize_client()
        if not self._client:
            logger.error("YTMusic client is unavailable for filtered search")
            return []

        try:
            results = self._client.search(query=query, filter=filter_type, limit=limit)
            normalized = []
            for item in results:
                if filter_type == "songs":
                    parsed = self._normalize_song(item)
                elif filter_type == "artists":
                    parsed = self._normalize_artist(item)
                elif filter_type == "albums":
                    parsed = self._normalize_album(item)
                elif filter_type == "playlists":
                    parsed = self._normalize_playlist(item)
                else:
                    parsed = item
                if parsed:
                    normalized.append(parsed)
            return normalized
        except Exception as e:
            logger.error(f"Error executing filtered search '{filter_type}' for query '{query}': {e}")
            return []

    def get_song(self, video_id: str) -> Optional[TrackItem]:
        """
        Retrieves song metadata for a given YouTube video ID.
        """
        if not self._client:
            self._initialize_client()
        if not self._client:
            return None

        try:
            # ytmusicapi get_song returns video details
            song_data = self._client.get_song(video_id)
            if not song_data:
                return None
            video_details = song_data.get("videoDetails", {})
            title = video_details.get("title", "Unknown Title")
            author = video_details.get("author", "Unknown Artist")
            duration_sec = int(video_details.get("lengthSeconds", 0))
            thumb_url = self._extract_best_thumbnail(video_details.get("thumbnail", {}).get("thumbnails", []))

            return TrackItem(
                title=title,
                artist=author,
                duration_seconds=duration_sec,
                duration_formatted=f"{duration_sec // 60}:{duration_sec % 60:02d}",
                artwork_url=thumb_url,
                source_type="EXTERNAL",
                external_source="YOUTUBE_MUSIC",
                external_id=video_id,
                external_url=f"https://music.youtube.com/watch?v={video_id}",
            )
        except Exception as e:
            logger.error(f"Error fetching song metadata for video_id '{video_id}': {e}")
            return None

    def get_artist(self, channel_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves artist metadata, top songs, and albums for a channel/browse ID.
        """
        if not self._client:
            self._initialize_client()
        if not self._client:
            return None

        try:
            artist_data = self._client.get_artist(channel_id)
            if not artist_data:
                return None

            name = artist_data.get("name", "Unknown Artist")
            thumb_url = self._extract_best_thumbnail(artist_data.get("thumbnails", []))
            description = artist_data.get("description")

            # Parse top songs
            songs = []
            for s in artist_data.get("songs", {}).get("results", []):
                norm = self._normalize_song(s)
                if norm:
                    songs.append(norm.model_dump())

            # Parse albums
            albums = []
            for a in artist_data.get("albums", {}).get("results", []):
                norm = self._normalize_album(a)
                if norm:
                    albums.append(norm.model_dump())

            return {
                "name": name,
                "external_id": channel_id,
                "source_type": "EXTERNAL",
                "external_source": "YOUTUBE_MUSIC",
                "artwork_url": thumb_url,
                "description": description,
                "external_url": f"https://music.youtube.com/channel/{channel_id}",
                "top_songs": songs,
                "albums": albums,
            }
        except Exception as e:
            logger.error(f"Error fetching artist metadata for channel_id '{channel_id}': {e}")
            return None

    def get_album(self, browse_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves album metadata and tracklist for a browse ID.
        """
        if not self._client:
            self._initialize_client()
        if not self._client:
            return None

        try:
            album_data = self._client.get_album(browse_id)
            if not album_data:
                return None

            title = album_data.get("title", "Unknown Album")
            artist_name = ""
            artists = album_data.get("artists", [])
            if artists:
                artist_name = ", ".join(a.get("name", "") for a in artists if "name" in a)

            year = album_data.get("year")
            try:
                year_int = int(year) if year else None
            except (ValueError, TypeError):
                year_int = None

            thumb_url = self._extract_best_thumbnail(album_data.get("thumbnails", []))
            tracks = []
            for idx, t in enumerate(album_data.get("tracks", []), start=1):
                video_id = t.get("videoId")
                if video_id:
                    duration_sec = t.get("duration_seconds", 0)
                    tracks.append(
                        TrackItem(
                            title=t.get("title", f"Track {idx}"),
                            artist=artist_name or t.get("artists", [{}])[0].get("name", "Unknown"),
                            album=title,
                            album_id=browse_id,
                            duration_seconds=duration_sec,
                            duration_formatted=t.get("duration"),
                            artwork_url=thumb_url,
                            source_type="EXTERNAL",
                            external_source="YOUTUBE_MUSIC",
                            external_id=video_id,
                            external_url=f"https://music.youtube.com/watch?v={video_id}",
                        ).model_dump()
                    )

            return {
                "title": title,
                "artist": artist_name,
                "external_id": browse_id,
                "source_type": "EXTERNAL",
                "external_source": "YOUTUBE_MUSIC",
                "year": year_int,
                "artwork_url": thumb_url,
                "track_count": len(tracks),
                "tracks": tracks,
                "external_url": f"https://music.youtube.com/browse/{browse_id}",
            }
        except Exception as e:
            logger.error(f"Error fetching album metadata for browse_id '{browse_id}': {e}")
            return None

    def get_playlist(self, playlist_id: str, limit: int = 100) -> Optional[Dict[str, Any]]:
        """
        Retrieves playlist metadata and tracks for a playlist ID.
        """
        if not self._client:
            self._initialize_client()
        if not self._client:
            return None

        try:
            pl_data = self._client.get_playlist(playlist_id, limit=limit)
            if not pl_data:
                return None

            title = pl_data.get("title", "Unknown Playlist")
            author = pl_data.get("author", {}).get("name") if isinstance(pl_data.get("author"), dict) else pl_data.get("author")
            thumb_url = self._extract_best_thumbnail(pl_data.get("thumbnails", []))

            tracks = []
            for t in pl_data.get("tracks", []):
                vid = t.get("videoId")
                if vid:
                    tracks.append(
                        TrackItem(
                            title=t.get("title", "Unknown"),
                            artist=", ".join(a.get("name", "") for a in t.get("artists", [])) if t.get("artists") else "Unknown",
                            duration_seconds=t.get("duration_seconds", 0),
                            duration_formatted=t.get("duration"),
                            artwork_url=self._extract_best_thumbnail(t.get("thumbnails", [])),
                            source_type="EXTERNAL",
                            external_source="YOUTUBE_MUSIC",
                            external_id=vid,
                            external_url=f"https://music.youtube.com/watch?v={vid}",
                        ).model_dump()
                    )

            return {
                "title": title,
                "author": author,
                "external_id": playlist_id,
                "source_type": "EXTERNAL",
                "external_source": "YOUTUBE_MUSIC",
                "track_count": len(tracks),
                "artwork_url": thumb_url,
                "tracks": tracks,
                "external_url": f"https://music.youtube.com/playlist?list={playlist_id}",
            }
        except Exception as e:
            logger.error(f"Error fetching playlist metadata for playlist_id '{playlist_id}': {e}")
            return None

    # Normalization Helpers
    def _normalize_song(self, item: Dict[str, Any]) -> Optional[TrackItem]:
        video_id = item.get("videoId")
        if not video_id:
            return None

        title = item.get("title", "Unknown")
        artists = item.get("artists", [])
        artist_name = ", ".join(a.get("name", "") for a in artists if "name" in a) if artists else "Unknown"
        artist_id = artists[0].get("id") if artists and "id" in artists[0] else None

        album = item.get("album", {})
        album_name = album.get("name") if isinstance(album, dict) else None
        album_id = album.get("id") if isinstance(album, dict) else None

        duration_formatted = item.get("duration")
        duration_sec = item.get("duration_seconds") or self._parse_duration(duration_formatted)
        artwork_url = self._extract_best_thumbnail(item.get("thumbnails", []))

        return TrackItem(
            title=title,
            artist=artist_name,
            artist_id=artist_id,
            album=album_name,
            album_id=album_id,
            duration_seconds=duration_sec,
            duration_formatted=duration_formatted,
            artwork_url=artwork_url,
            source_type="EXTERNAL",
            external_source="YOUTUBE_MUSIC",
            external_id=video_id,
            external_url=f"https://music.youtube.com/watch?v={video_id}",
            is_explicit=bool(item.get("isExplicit", False)),
        )

    def _normalize_artist(self, item: Dict[str, Any]) -> Optional[ArtistItem]:
        external_id = item.get("browseId")
        if not external_id:
            return None

        name = item.get("artist") or item.get("title", "Unknown Artist")
        artwork_url = self._extract_best_thumbnail(item.get("thumbnails", []))
        subscribers = item.get("subscribers")

        return ArtistItem(
            name=name,
            external_id=external_id,
            source_type="EXTERNAL",
            external_source="YOUTUBE_MUSIC",
            artwork_url=artwork_url,
            subscribers=subscribers,
            external_url=f"https://music.youtube.com/channel/{external_id}",
        )

    def _normalize_album(self, item: Dict[str, Any]) -> Optional[AlbumItem]:
        external_id = item.get("browseId")
        if not external_id:
            return None

        title = item.get("title", "Unknown Album")
        artists = item.get("artists", [])
        artist_name = ", ".join(a.get("name", "") for a in artists if "name" in a) if artists else None
        artist_id = artists[0].get("id") if artists and "id" in artists[0] else None

        year = item.get("year")
        try:
            year_int = int(year) if year else None
        except (ValueError, TypeError):
            year_int = None

        artwork_url = self._extract_best_thumbnail(item.get("thumbnails", []))

        return AlbumItem(
            title=title,
            artist=artist_name,
            artist_id=artist_id,
            external_id=external_id,
            source_type="EXTERNAL",
            external_source="YOUTUBE_MUSIC",
            year=year_int,
            artwork_url=artwork_url,
            external_url=f"https://music.youtube.com/browse/{external_id}",
        )

    def _normalize_playlist(self, item: Dict[str, Any]) -> Optional[PlaylistItem]:
        external_id = item.get("browseId")
        if not external_id:
            return None

        title = item.get("title", "Unknown Playlist")
        author = item.get("author")
        item_count_str = item.get("itemCount")
        try:
            item_count = int(item_count_str) if item_count_str else None
        except (ValueError, TypeError):
            item_count = None

        artwork_url = self._extract_best_thumbnail(item.get("thumbnails", []))

        return PlaylistItem(
            title=title,
            author=author,
            external_id=external_id,
            source_type="EXTERNAL",
            external_source="YOUTUBE_MUSIC",
            item_count=item_count,
            artwork_url=artwork_url,
            external_url=f"https://music.youtube.com/playlist?list={external_id}",
        )


ytmusic_service = YTMusicService()
