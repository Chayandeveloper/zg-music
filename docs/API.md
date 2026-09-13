# Zubeen Player REST API Documentation

Base URI: `/api/v1`

All authenticated requests require the header:
```http
Authorization: Bearer <sanctum_token>
Accept: application/json
```

---

## 1. Authentication Endpoints

### Register Listener
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "name": "Partha Borah",
    "email": "partha@example.com",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "data": {
      "user": { "id": 1, "name": "Partha Borah", "email": "partha@example.com", "role": "LISTENER" },
      "token": "1|sanctum_token_string..."
    },
    "message": "Registration successful"
  }
  ```

### Login
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "partha@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`

### Current User Profile
- **GET** `/auth/me`
- **Response**: Returns the authenticated user record with attached artist status if approved.

### Logout
- **POST** `/auth/logout`
- **Response**: `200 OK`

---

## 2. Music Catalog & Streaming

### Home Feed
- **GET** `/home`
- **Response**:
  ```json
  {
    "data": {
      "greeting": "Good Evening",
      "recently_played": [],
      "trending": [],
      "zubeen_top_hits": [],
      "new_releases": [],
      "rising_artists": [],
      "featured_playlists": []
    }
  }
  ```

### Global Search
- **GET** `/search?q=Maya`
- **Response**: Grouped results by `songs`, `artists`, `albums`, `playlists`.

### Get Song Details & Stream Manifest
- **GET** `/songs/{id}`
- **Response**: Includes song metadata, album info, lyrics, song story, audio variants, and `hls_master_url`.

### Track Playback Event (Qualified Streams)
- **POST** `/player/track-event`
- **Body**:
  ```json
  {
    "song_id": 4,
    "duration_played_seconds": 45,
    "completed": false,
    "bitrate_streamed": "128k",
    "client_timestamp": 1757088000
  }
  ```
- **Behavior**: Dispatches event to analytics queue; increments song play counter when duration exceeds 30s.

---

## 3. Social & Library

- **POST** `/songs/{id}/like`: Toggle like status for a track.
- **GET** `/library/liked-songs`: Retrieve paginated collection of liked songs.
- **POST** `/artists/{id}/follow`: Follow/unfollow an artist.
- **GET** `/library/followed-artists`: Retrieve followed artists.
- **GET** `/playlists`: User created and saved playlists.
- **POST** `/playlists`: Create playlist `{ "title": "Late Night Zubeen", "visibility": "PUBLIC" }`.
- **POST** `/playlists/{id}/songs`: Add song to playlist `{ "song_id": 12 }`.
- **DELETE** `/playlists/{id}/songs/{song_id}`: Remove song from playlist.

---

## 4. Zubeen Stage (Artist Publishing API)

### Apply to Become an Artist
- **POST** `/artist/apply`
- **Headers**: `Content-Type: multipart/form-data`
- **Body**:
  - `artist_name`: string
  - `biography`: string
  - `genres`: JSON array of strings
  - `languages`: JSON array of strings
  - `artist_information`: string
  - `profile_image`: image file
  - `banner_image`: image file
  - `rights_declaration`: true (Required)

### Artist Dashboard
- **GET** `/artist/dashboard`
- **Response**: Total streams, monthly listeners, follower count, recent releases, and upload progress.

### Upload Song Audio (Master)
- **POST** `/artist/uploads/audio`
- **Headers**: `Content-Type: multipart/form-data`
- **Body**: `audio_file` (WAV, FLAC, MP3, M4A)
- **Response**: Returns uploaded temporary master token and duration metadata.

### Create & Submit Release
- **POST** `/artist/releases`
- **Body**: Release metadata, cover artwork token, track listings, lyrics, and mandatory rights declaration confirmation.
- **Response**: Release created in `PROCESSING` state; background FFmpeg job automatically scheduled.

---

## 5. Admin Portal API

- **GET** `/admin/dashboard`: Platform KPIs (Total users, active users, total streams, pending reviews).
- **GET** `/admin/applications`: List pending artist verification applications.
- **POST** `/admin/applications/{id}/review`: Approve, reject, or request changes with feedback.
- **GET** `/admin/releases`: Review submitted artist releases.
- **POST** `/admin/releases/{id}/review`: `{ "action": "APPROVE" | "REJECT" | "REQUEST_CHANGES", "notes": "..." }`.
- **GET** `/admin/reports`: List user copyright or content moderation reports.
- **POST** `/admin/reports/{id}/resolve`: Takedown content or dismiss complaint.
