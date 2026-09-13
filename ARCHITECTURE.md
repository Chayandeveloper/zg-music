# Zubeen Player Architecture Specification

## 1. System Overview

Zubeen Player is an enterprise-grade music streaming platform that unites listeners, creators (**Zubeen Stage**), and platform administrators under a cohesive, secure ecosystem.

```
                    ┌──────────────────────────────────────────────┐
                    │               ZUBEEN PLATFORM                │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  Mobile Listener │             │   Zubeen Stage   │             │ Admin Dashboard  │
│  (Expo / ReactN) │             │ (Artist Portal)  │             │  (React / Vite)  │
└────────┬─────────┘             └────────┬─────────┘             └────────┬─────────┘
         │                                │                                │
         │  REST / Sanctum Bearer Tokens  │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │          Laravel REST API V1           │
                      │  (Sanctum, Policies, Form Requests)    │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
       ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
       │   MySQL 8.0 RDBMS  │  │   Redis Cache /    │  │   Object Storage   │
       │ (Catalog, Social,  │  │   Queue Workers    │  │ (Master Masters &  │
       │  Audit, Analytics) │  │                    │  │  HLS Transcoded)   │
       └────────────────────┘  └──────────┬─────────┘  └────────────────────┘
                                          │
                                          ▼
                               ┌────────────────────┐
                               │   FFmpeg Pipeline  │
                               │ (64k, 128k, 192k,  │
                               │  320k HLS Presets) │
                               └────────────────────┘
```

## 2. Core Domain Entities

1. **Users & Identities**:
   - Roles: `LISTENER`, `ARTIST`, `ADMIN`, `SUPER_ADMIN`.
   - Single unified account structure; artist features unlock on approval.

2. **Music Catalog**:
   - `Artists`: Public profiles, bio, social metadata, follower tallies, rising indicator.
   - `Albums`: Multi-track collections, release dates, genres, cover art.
   - `Songs`: Track duration, stream endpoints, lyrics, song story / trivia references.
   - `SongStories`: Movie source, release year, composer, lyricist, producer, trivia narrative.
   - `Lyrics`: Text lines with timestamp alignment schema for future synced lyrics.

3. **Zubeen Stage (Artist Publishing)**:
   - Application & approval workflow with KYC rights attestation.
   - Multi-step release submission: Audio upload -> Variant transcoding -> Cover artwork -> Metadata & Lyrics -> Legal Rights Declaration -> Admin Review.
   - Audit trail of review actions (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`, `TAKEDOWN`).

4. **Media Processing Pipeline**:
   - Master raw files segregated from public distribution.
   - Asynchronous queue job dispatches to FFmpeg.
   - Generates 4 adaptive bitrate representations:
     - 64 kbps (Low data / Mobile EDGE)
     - 128 kbps (Standard AAC)
     - 192 kbps (High Fidelity)
     - 320 kbps (Ultra Studio Quality)
   - Outputs HLS `.ts` segmented media and `master.m3u8` variant playlist.

5. **Copyright & Content Moderation**:
   - In-app reporting mechanism for unauthorized uploads, copyright infringements, impersonation.
   - Admin action matrix: Investigation, Takedown request, Instant unpublishing, Audit logging.

6. **Discovery & Intelligence**:
   - Recommendation heuristics combining play history, genre affinity, and liked tracks.
   - Rising Artist velocity computation (relative stream growth over 7/30 days).

---

## 3. Future Subscription & Monetization Isolation

Per specifications, all payment, wallet, payout, and subscription features are excluded from active runtime. However, the schema incorporates clean abstract interfaces:
- Models utilize soft status checks (`status = 'PUBLISHED'`) rather than hardcoded tier gates.
- Database contains no deprecated mock paywalls.
- Architecture allows plugging in an entitlement provider service without schema refactoring.
