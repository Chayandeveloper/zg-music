import logging
import time
from typing import Optional, Dict, Any
import yt_dlp

logger = logging.getLogger("stream_service")


class StreamService:
    """
    Service responsible for extracting direct audio stream URLs (CDN links)
    from YouTube Music / YouTube videos on demand using yt-dlp.
    Maintains an in-memory cache with expiration to avoid repeated extractions.
    """

    def __init__(self, cache_ttl_seconds: int = 14400):  # 4 hours TTL (CDN URLs last ~6 hours)
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get_stream(self, video_id: str) -> Optional[Dict[str, Any]]:
        if not video_id:
            return None

        # Check memory cache
        cached = self._cache.get(video_id)
        if cached:
            cached_at = cached.get("_cached_at", 0)
            if time.time() - cached_at < self.cache_ttl:
                logger.info(f"[StreamCache HIT] Found cached stream URL for {video_id}")
                return cached["data"]
            else:
                self._cache.pop(video_id, None)

        url = f"https://www.youtube.com/watch?v={video_id}"
        ydl_opts = {
            "format": "bestaudio/best/18",
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "noplaylist": True,
            "skip_download": True,
            "socket_timeout": 12,
            "youtube_include_dash_manifest": False,
            "youtube_include_hls_manifest": False,
            "extractor_args": {
                "youtube": {
                    "player_client": ["android"]
                }
            },
        }


        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                stream_url = info.get("url")
                if not stream_url:
                    logger.warning(f"No direct stream URL extracted for {video_id}")
                    return None

                data = {
                    "videoId": video_id,
                    "streamUrl": stream_url,
                    "title": info.get("title"),
                    "duration": info.get("duration"),
                    "ext": info.get("ext", "m4a"),
                    "thumbnail": info.get("thumbnail"),
                    "format_id": info.get("format_id"),
                    "abr": info.get("abr"),
                }

                # Save to cache
                self._cache[video_id] = {
                    "_cached_at": time.time(),
                    "data": data,
                }
                logger.info(f"[Stream Extracted] Successfully extracted audio stream for {video_id}")
                return data

        except Exception as e:
            logger.error(f"Error extracting audio stream for {video_id}: {e}")
            return None


stream_service = StreamService()
