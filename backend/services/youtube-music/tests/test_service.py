import pytest
from unittest.mock import MagicMock, patch
from app.services.ytmusic_service import YTMusicService
from app.schemas.music import TrackItem, UnifiedSearchResponse


@pytest.fixture
def mock_service():
    with patch("app.services.ytmusic_service.YTMusic") as mock_ytmusic:
        service = YTMusicService()
        service._client = mock_ytmusic.return_value
        return service


def test_service_initialization(mock_service):
    assert mock_service.is_ready is True


def test_normalize_song(mock_service):
    raw_item = {
        "videoId": "abc12345",
        "title": "Wonderwall",
        "artists": [{"name": "Oasis", "id": "artist_oasis"}],
        "album": {"name": "(What's the Story) Morning Glory?", "id": "album_morning"},
        "duration": "4:18",
        "duration_seconds": 258,
        "thumbnails": [
            {"url": "https://lh3.googleusercontent.com/small.jpg", "width": 60, "height": 60},
            {"url": "https://lh3.googleusercontent.com/large.jpg", "width": 544, "height": 544},
        ],
        "isExplicit": False,
    }

    parsed = mock_service._normalize_song(raw_item)
    assert parsed is not None
    assert isinstance(parsed, TrackItem)
    assert parsed.title == "Wonderwall"
    assert parsed.artist == "Oasis"
    assert parsed.duration_seconds == 258
    assert parsed.source_type == "EXTERNAL"
    assert parsed.external_source == "YOUTUBE_MUSIC"
    assert parsed.external_id == "abc12345"
    assert parsed.artwork_url == "https://lh3.googleusercontent.com/large.jpg"
    assert parsed.external_url == "https://music.youtube.com/watch?v=abc12345"


def test_unified_search(mock_service):
    mock_service._client.search.side_effect = [
        # songs call
        [
            {
                "videoId": "song_1",
                "title": "Wonderwall",
                "artists": [{"name": "Oasis"}],
                "duration": "4:18",
                "thumbnails": [{"url": "https://example.com/art.jpg"}],
            }
        ],
        # artists call
        [
            {
                "browseId": "channel_oasis",
                "artist": "Oasis",
                "thumbnails": [{"url": "https://example.com/oasis.jpg"}],
            }
        ],
        # albums call
        [
            {
                "browseId": "album_glory",
                "title": "Morning Glory",
                "artists": [{"name": "Oasis"}],
                "year": "1995",
                "thumbnails": [{"url": "https://example.com/album.jpg"}],
            }
        ],
    ]

    response = mock_service.search_unified("Oasis", limit=5)
    assert isinstance(response, UnifiedSearchResponse)
    assert len(response.songs) == 1
    assert response.songs[0].title == "Wonderwall"
    assert response.songs[0].source_type == "EXTERNAL"
    assert len(response.artists) == 1
    assert response.artists[0].name == "Oasis"
    assert len(response.albums) == 1
    assert response.albums[0].title == "Morning Glory"


def test_graceful_handling_on_ytmusic_exception(mock_service):
    mock_service._client.search.side_effect = Exception("YouTube Music API network error")

    response = mock_service.search_unified("CrashTest")
    assert isinstance(response, UnifiedSearchResponse)
    assert len(response.songs) == 0
    assert len(response.artists) == 0
    assert len(response.albums) == 0
