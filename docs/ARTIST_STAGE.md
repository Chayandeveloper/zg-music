# Zubeen Stage - Artist Publishing Platform

## Overview

**Zubeen Stage** empowers verified artists to distribute their music to millions of listeners directly inside Zubeen Player without requiring a separate portal or account.

```
Listener Account
       │
       ▼
[Become an Artist Application]
  - Artist name, bio, genres, languages, socials, KYC photo, identity
  - Explicit Rights & Ownership Declaration
       │
       ▼
[Admin Review Queue]
  ├── Approved ──> User role upgraded to ARTIST; Zubeen Stage unlocked
  ├── Changes Requested ──> Artist updates profile & resubmits
  └── Rejected ──> Admin rationale logged and presented
       │
       ▼
[Zubeen Stage Dashboard]
  ├── Manage Songs & Albums
  ├── Direct Multi-Bitrate Ingestion
  ├── Rights Declaration Attestation
  └── Real-time Stream Analytics (Daily, Monthly, Listeners, Followers)
```

## Release Lifecycle

1. **DRAFT**: Artist drafts release, edits tracks, uploads artwork.
2. **UPLOADING**: Audio master sent to chunked upload handler.
3. **PROCESSING**: FFmpeg queue builds multi-variant HLS segments.
4. **READY_FOR_REVIEW**: Audio and metadata verified; ready to submit.
5. **UNDER_REVIEW**: In admin moderation queue.
6. **CHANGES_REQUESTED**: Admin provided specific feedback; artist edits.
7. **APPROVED**: Accepted by editorial and moderation teams.
8. **PUBLISHED**: Distributed to listener catalog, trending feeds, and search indices.
