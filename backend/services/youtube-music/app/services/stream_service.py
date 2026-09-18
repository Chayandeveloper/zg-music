import logging
import os
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

    # Player clients tried in order. tv_embedded bypasses bot-checks without
    # cookies; ios and web are kept as fallbacks.
    _PLAYER_CLIENTS = ["tv_embedded", "ios", "web"]

    def __init__(self, cache_ttl_seconds: int = 14400):  # 4 hours TTL (CDN URLs last ~6 hours)
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}
        # OAuth2 token file created by `yt-dlp-youtube-oauth2` plugin.
        # Run: yt-dlp --username oauth2 --password "" <any-yt-url> once to generate.
        self.oauth2_token_file: Optional[str] = os.getenv("YTDLP_OAUTH2_TOKEN_FILE") or None
        # Fallback: Netscape-format cookies file exported from a browser.
        self.cookies_file: Optional[str] = os.getenv("YTDLP_COOKIES_FILE") or None

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

        base_opts: Dict[str, Any] = {
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "noplaylist": True,
            "skip_download": True,
            "socket_timeout": 15,
            "youtube_include_dash_manifest": False,
            "youtube_include_hls_manifest": False,
        }

        # OAuth2 plugin auth (preferred) — install with: pip install yt-dlp-youtube-oauth2
        # Run once: yt-dlp --username oauth2 --password "" <any-yt-url>  to generate token.
        if self.oauth2_token_file and os.path.isfile(self.oauth2_token_file):
            base_opts["username"] = "oauth2"
            base_opts["password"] = ""
            base_opts["ap_mso"] = None
            logger.debug(f"Using OAuth2 token: {self.oauth2_token_file}")
        # Fallback: cookies file.
        elif self.cookies_file and os.path.isfile(self.cookies_file):
            base_opts["cookiefile"] = self.cookies_file
            logger.debug(f"Using cookies file: {self.cookies_file}")

        last_error: Optional[Exception] = None

        for client in self._PLAYER_CLIENTS:
            ydl_opts = {
                **base_opts,
                "extractor_args": {
                    "youtube": {
                        "player_client": [client],
                        # Skip expensive webpage fetches for embedded/ios clients.
                        "player_skip": ["webpage", "configs"] if client != "web" else [],
                    }
                },
            }

            try:
                logger.debug(f"[{video_id}] Trying player_client={client}")
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)

                stream_url = info.get("url")
                if not stream_url:
                    for f in info.get("formats", []):
                        if f.get("url"):
                            stream_url = f.get("url")
                            break

                if not stream_url:
                    logger.warning(f"[{video_id}] No stream URL with client={client}, trying next")
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

                # Save to cache
                self._cache[video_id] = {
                    "_cached_at": time.time(),
                    "data": data,
                }
                logger.info(f"[Stream Extracted] {video_id} via client={client}")
                return data

            except Exception as e:
                last_error = e
                err_str = str(e)
                if "Sign in" in err_str or "bot" in err_str.lower():
                    logger.warning(f"[{video_id}] Bot-check with client={client}, trying next")
                    continue
                # Non-bot errors (e.g. private video) — no point retrying.
                logger.error(f"Error extracting audio stream for {video_id}: {e}")
                return None

        logger.error(f"All player clients exhausted for {video_id}. Last error: {last_error}")
        return None


stream_service = StreamService()
