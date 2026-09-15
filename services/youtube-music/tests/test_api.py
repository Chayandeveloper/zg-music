from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.schemas.music import TrackItem, UnifiedSearchResponse

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "youtube-music-service"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["library"] == "ytmusicapi"


@patch("app.routes.search.ytmusic_service.search_unified")
def test_search_unified_api(mock_search):
    mock_search.return_value = UnifiedSearchResponse(
        query="Coldplay",
        songs=[
            TrackItem(
                title="Yellow",
                artist="Coldplay",
                duration_seconds=269,
                source_type="EXTERNAL",
                external_source="YOUTUBE_MUSIC",
                external_id="y83x7BgobA1",
            )
        ],
        artists=[],
        albums=[],
        playlists=[],
    )

    response = client.get("/api/v1/search?q=Coldplay")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "Coldplay"
    assert len(data["songs"]) == 1
    assert data["songs"][0]["title"] == "Yellow"
    assert data["songs"][0]["source_type"] == "EXTERNAL"
    assert data["songs"][0]["external_source"] == "YOUTUBE_MUSIC"


def test_search_empty_query():
    response = client.get("/api/v1/search?q=%20")
    assert response.status_code == 400


def test_search_invalid_filter():
    response = client.get("/api/v1/search?q=test&filter=invalid_filter")
    assert response.status_code == 400


@patch("app.routes.stream.stream_service.get_stream")
def test_stream_endpoint_success(mock_get_stream):
    mock_get_stream.return_value = {
        "videoId": "Fg4MfA3BCyI",
        "streamUrl": "https://rr3---sn-googlevideo.com/videoplayback?expire=12345",
        "title": "City Of Blinding Lights",
        "duration": 346,
        "ext": "m4a",
        "thumbnail": "https://img.youtube.com/vi/Fg4MfA3BCyI/hqdefault.jpg",
    }

    response = client.get("/api/v1/stream/Fg4MfA3BCyI")
    assert response.status_code == 200
    data = response.json()
    assert data["videoId"] == "Fg4MfA3BCyI"
    assert "videoplayback" in data["streamUrl"]
    assert data["ext"] == "m4a"


@patch("app.routes.stream.stream_service.get_stream")
def test_stream_endpoint_not_found(mock_get_stream):
    mock_get_stream.return_value = None

    response = client.get("/api/v1/stream/nonexistent_id")
    assert response.status_code == 404

