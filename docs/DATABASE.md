# Zubeen Player Database Architecture

## Core Schemas & Entity Relationships

The platform utilizes MySQL 8.0 with InnoDB engine, utf8mb4 encoding, strict foreign key constraints, composite indexes for high-volume playback tracking, and JSON columns for extensible metadata.

```
                          ┌────────────────────────┐
                          │         users          │
                          └───────────┬────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │ 1:1                   │ 1:N                   │ 1:N
              ▼                       ▼                       ▼
   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
   │       artists       │ │      playlists      │ │    play_history     │
   └──────────┬──────────┘ └──────────┬──────────┘ └─────────────────────┘
              │                       │
              ├──────────┐            │ 1:N
              ▼ 1:N      ▼ 1:N        ▼
         ┌─────────┐ ┌─────────┐ ┌─────────────────────┐
         │ albums  │ │ releases│ │   playlist_songs    │
         └────┬────┘ └─────────┘ └─────────────────────┘
              │ 1:N
              ▼
         ┌─────────┐
         │  songs  │◀───────┐
         └────┬────┘        │ 1:N
              │             │
      ┌───────┴───────┐     │
  1:1 ▼           1:1 ▼     │
┌───────────┐   ┌─────────┐ │
│song_story │   │ lyrics  │ │
└───────────┘   └─────────┘ │
                            │
              ┌─────────────┴─────────────┐
              ▼ 1:N                       ▼ 1:N
      ┌───────────────┐           ┌───────────────────┐
      │ audio_variants│           │   stream_events   │
      └───────────────┘           └───────────────────┘
```

## Schema Highlights

### `users`
- `id` (BIGINT UNSIGNED, PK)
- `name` (VARCHAR 255)
- `email` (VARCHAR 255, UNIQUE)
- `password` (VARCHAR 255)
- `role` (ENUM: `LISTENER`, `ARTIST`, `ADMIN`, `SUPER_ADMIN`, DEFAULT: `LISTENER`)
- `avatar_url` (VARCHAR 1024, NULLABLE)
- `bio` (TEXT, NULLABLE)
- `remember_token`, `timestamps`

### `artists`
- `id` (BIGINT UNSIGNED, PK)
- `user_id` (BIGINT UNSIGNED, FK -> users.id, CASCADE)
- `name` (VARCHAR 255)
- `slug` (VARCHAR 255, UNIQUE)
- `profile_image_url`, `banner_image_url`
- `biography` (TEXT)
- `genres` (JSON)
- `languages` (JSON)
- `website`, `social_links` (JSON)
- `verified` (BOOLEAN, DEFAULT: FALSE)
- `total_streams` (BIGINT, DEFAULT: 0)
- `monthly_listeners` (BIGINT, DEFAULT: 0)
- `followers_count` (BIGINT, DEFAULT: 0)
- `is_rising` (BOOLEAN, DEFAULT: FALSE)
- `timestamps`

### `songs`
- `id` (BIGINT UNSIGNED, PK)
- `artist_id` (BIGINT UNSIGNED, FK -> artists.id)
- `album_id` (BIGINT UNSIGNED, NULLABLE, FK -> albums.id)
- `title` (VARCHAR 255)
- `slug` (VARCHAR 255, INDEX)
- `artwork_url` (VARCHAR 1024)
- `duration_seconds` (INT UNSIGNED)
- `genre` (VARCHAR 100, INDEX)
- `language` (VARCHAR 100, INDEX)
- `stream_url` (VARCHAR 1024)
- `hls_master_url` (VARCHAR 1024)
- `play_count` (BIGINT UNSIGNED, DEFAULT: 0, INDEX)
- `like_count` (BIGINT UNSIGNED, DEFAULT: 0)
- `track_number` (SMALLINT, DEFAULT: 1)
- `status` (ENUM: `PUBLISHED`, `TAKEN_DOWN`, DEFAULT: `PUBLISHED`)
- `timestamps`

### `song_stories`
- `id` (BIGINT UNSIGNED, PK)
- `song_id` (BIGINT UNSIGNED, UNIQUE, FK -> songs.id, CASCADE)
- `movie`, `release_year`, `composer`, `lyricist`, `producer`, `singer`
- `description` (TEXT)
- `story` (LONGTEXT)

### `lyrics`
- `id` (BIGINT UNSIGNED, PK)
- `song_id` (BIGINT UNSIGNED, UNIQUE, FK -> songs.id, CASCADE)
- `lyrics_text` (LONGTEXT)
- `language` (VARCHAR 50)
- `synced_data` (JSON, NULLABLE)

### `audio_variants`
- `id` (BIGINT UNSIGNED, PK)
- `song_id` (BIGINT UNSIGNED, FK -> songs.id, CASCADE)
- `bitrate` (ENUM: `64k`, `128k`, `192k`, `320k`)
- `format` (VARCHAR 20, DEFAULT: 'aac')
- `hls_playlist_url` (VARCHAR 1024)
- `file_size` (BIGINT UNSIGNED)
- `timestamps`

### `stream_events`
- `id` (BIGINT UNSIGNED, PK)
- `user_id` (BIGINT UNSIGNED, NULLABLE, FK -> users.id, SET NULL)
- `song_id` (BIGINT UNSIGNED, FK -> songs.id, CASCADE)
- `duration_played_seconds` (INT)
- `completed` (BOOLEAN, DEFAULT: FALSE)
- `bitrate_streamed` (VARCHAR 20)
- `ip_address` (VARCHAR 45, NULLABLE)
- `created_at` (TIMESTAMP, INDEX)
