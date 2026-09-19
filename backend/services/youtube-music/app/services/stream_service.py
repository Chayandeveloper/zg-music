import logging
import os
import time
from typing import Optional, Dict, Any
import yt_dlp

from app.config import settings

logger = logging.getLogger("stream_service")


class StreamService:
    """
    Service responsible for extracting direct audio stream URLs (CDN links)
    from YouTube Music / YouTube videos on demand using yt-dlp.
    Maintains an in-memory cache with expiration to avoid repeated extractions.
    """

    # Modern player clients tried in order: tv_embedded & ios bypass datacenter bot-checks, android and web as fallbacks
    _FAST_CLIENTS = ["tv_embedded", "ios", "android", "web"]
    _FALLBACK_CLIENTS = ["tv_embedded", "ios", "android", "web", "mweb", "tv"]

    def __init__(self, cache_ttl_seconds: int = 18000):  # 5 hours TTL (YouTube CDN URLs typically valid ~6 hours)
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}
        # Automatic candidate search for cookies.txt
        candidate_cookies = [
            settings.YTDLP_COOKIES_FILE,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "cookies.txt")),
            os.path.abspath("cookies.txt"),
            "/var/www/fillosoft.com/jubeefy/backend/services/youtube-music/cookies.txt",
        ]
        self.cookies_file: Optional[str] = None
        for path in candidate_cookies:
            if path and os.path.isfile(path):
                self.cookies_file = path
                logger.info(f"StreamService initialized with cookies file: {path}")
                break
        if not self.cookies_file:
            logger.warning("StreamService initialized WITHOUT cookies file (not found in candidates)")

        self._cache_file = os.path.join(os.path.dirname(__file__), "..", "..", "_stream_cache.json")
        self._load_disk_cache()

    def _load_disk_cache(self):
        """Load persistent cache from disk on startup to retain stream URLs across restarts."""
        try:
            if os.path.isfile(self._cache_file):
                import json
                with open(self._cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    now = time.time()
                    # Keep only non-expired entries
                    valid = {k: v for k, v in data.items() if now - v.get("_cached_at", 0) < self.cache_ttl}
                    self._cache = valid
                    logger.info(f"Loaded {len(valid)} cached stream URLs from disk cache")
        except Exception as e:
            logger.debug(f"Could not load disk cache: {e}")

    def _save_disk_cache(self):
        """Persist memory cache to disk asynchronously / safely."""
        try:
            import json
            now = time.time()
            valid = {k: v for k, v in self._cache.items() if now - v.get("_cached_at", 0) < self.cache_ttl}
            with open(self._cache_file, "w", encoding="utf-8") as f:
                json.dump(valid, f)
        except Exception as e:
            logger.debug(f"Could not write disk cache: {e}")

    def get_stream(self, video_id: str) -> Optional[Dict[str, Any]]:
        if not video_id:
            return None

        # 1. Instant Cache HIT (<1ms)
        cached = self._cache.get(video_id)
        if cached:
            cached_at = cached.get("_cached_at", 0)
            if time.time() - cached_at < self.cache_ttl:
                logger.info(f"[StreamCache INSTANT HIT] Found cached stream URL for {video_id}")
                return cached["data"]
            else:
                self._cache.pop(video_id, None)

        url = f"https://www.youtube.com/watch?v={video_id}"

        base_opts: Dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "noplaylist": True,
            "skip_download": True,
            "socket_timeout": 12,
            # Select best audio-only stream (m4a preferred, fallback to any audio, then best overall)
            "format": "bestaudio[ext=m4a]/bestaudio/best",
        }

        if self.cookies_file and os.path.isfile(self.cookies_file):
            base_opts["cookiefile"] = self.cookies_file
            logger.info(f"Using cookies file: {self.cookies_file}")

        # If OAuth2 plugin is installed and enabled, use it
        if getattr(settings, "YTDLP_USE_OAUTH2", False):
            try:
                import yt_dlp_plugins.extractor.youtube_oauth2  # type: ignore
                base_opts["username"] = "oauth2"
                base_opts["password"] = ""
                logger.debug("Using YouTube OAuth2 plugin")
            except ImportError:
                pass

        # Try 1: Fast TV-embedded client (bypasses bot-checks on datacenter / cloud VPS IPs)
        fast_opts = {
            **base_opts,
            "extractor_args": {
                "youtube": {
                    "player_client": ["tv_embedded"],
                    "player_skip": ["webpage", "configs"],
                }
            },
        }
        try:
            with yt_dlp.YoutubeDL(fast_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                stream_url = info.get("url")
                if not stream_url:
                    for f in info.get("formats", []):
                        if f.get("url"):
                            stream_url = f.get("url")
                            break
                if stream_url:
                    data = {
                        "videoId": video_id,
                        "streamUrl": stream_url,
                        "title": info.get("title"),
                        "duration": info.get("duration"),
                        "ext": info.get("ext", "m4a"),
                        "thumbnail": info.get("thumbnail"),
                        "format_id": info.get("format_id"),
                        "abr": info.get("abr"),
                        "player_client": "tv_embedded",
                    }
                    self._cache[video_id] = {
                        "_cached_at": time.time(),
                        "data": data,
                    }
                    self._save_disk_cache()
                    logger.info(f"[Stream Extracted FAST] {video_id} via tv_embedded client")
                    return data
        except Exception as e:
            logger.debug(f"[{video_id}] Fast tv_embedded client missed ({e}), falling back...")

        # Try 2: Default yt-dlp multi-client extraction (visionos / web with node challenge solver)
        try:
            with yt_dlp.YoutubeDL(base_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                stream_url = info.get("url")
                if not stream_url:
                    for f in info.get("formats", []):
                        if f.get("url"):
                            stream_url = f.get("url")
                            break
                if stream_url:
                    data = {
                        "videoId": video_id,
                        "streamUrl": stream_url,
                        "title": info.get("title"),
                        "duration": info.get("duration"),
                        "ext": info.get("ext", "m4a"),
                        "thumbnail": info.get("thumbnail"),
                        "format_id": info.get("format_id"),
                        "abr": info.get("abr"),
                        "player_client": "default",
                    }
                    self._cache[video_id] = {
                        "_cached_at": time.time(),
                        "data": data,
                    }
                    self._save_disk_cache()
                    logger.info(f"[Stream Extracted] {video_id} via default client")
                    return data
        except Exception as e:
            logger.warning(f"[{video_id}] Default extraction failed ({e}), trying fallback clients...")

        # Try 2: Specific client fallbacks
        last_error: Optional[Exception] = None
        for client in self._FALLBACK_CLIENTS:
            ydl_opts = {
                **base_opts,
                "extractor_args": {
                    "youtube": {
                        "player_client": [client],
                        "player_skip": ["webpage", "configs"] if client != "web" else [],
                    }
                },
            }

            try:
                logger.debug(f"[{video_id}] Trying fallback player_client={client}")
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)

                stream_url = info.get("url")
                if not stream_url:
                    for f in info.get("formats", []):
                        if f.get("url"):
                            stream_url = f.get("url")
                            break

                if not stream_url:
                    continue

                data = {
                    "videoId": video_id,
                    "streamUrl": stream_url,
                    "title": info.get("title"),
                    "duration": info.get("duration"),
                    "ext": info.get("ext", "m4a"),
                    "thumbnail": info.get("thumbnail"),
                    "format_id": info.get("format_id"),
                    "abr": info.get("abr"),
                    "player_client": client,
                }

                self._cache[video_id] = {
                    "_cached_at": time.time(),
                    "data": data,
                }
                logger.info(f"[Stream Extracted] {video_id} via client={client}")
                return data

            except Exception as e:
                last_error = e
                err_str = str(e)
                # Errors that are client-specific — try next client
                retryable = (
                    "Sign in" in err_str
                    or "bot" in err_str.lower()
                    or "format is not available" in err_str.lower()
                    or "requested format" in err_str.lower()
                    or "http error 403" in err_str.lower()
                    or "http error 429" in err_str.lower()
                )
                if retryable:
                    logger.warning(f"[{video_id}] Client={client} failed ({err_str[:80]}), trying next")
                    continue
                # Truly fatal errors (private, deleted, geo-blocked) — no point retrying.
                logger.error(f"Error extracting audio stream for {video_id}: {e}")
                return None

        logger.error(f"All player clients exhausted for {video_id}. Last error: {last_error}")
        return None


stream_service = StreamService()
