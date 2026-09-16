# YouTube Music Microservice (ytmusicapi)

This service provides external music discovery, search, and metadata querying via [`ytmusicapi`](https://ytmusicapi.readthedocs.io/) for the Zubeen Player platform.

## Architecture Role

- **Caller**: Laravel REST API only (port 8000).
- **Client**: Expo React Native mobile client never calls this service directly.
- **Data Policy**: Provides metadata, discovery, search, and identifiers only. Audio is never extracted, downloaded, or rehosted.

## Setup & Running

### Requirements
- Python 3.10+
- Virtualenv

### Local Installation
```bash
cd backend/services/youtube-music
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### Running Locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Health check:
`GET http://localhost:8001/health`

Search endpoint:
`GET http://localhost:8001/api/v1/search?q=Zubeen+Garg&filter=songs`
