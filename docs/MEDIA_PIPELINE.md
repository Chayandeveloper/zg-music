# Zubeen Player - Media Pipeline & HLS Transcoding

## Transcoding Architecture

The media processing architecture ensures that original artist masters are securely preserved in an isolated disk/bucket, while web/mobile clients stream optimized, segmented audio streams through HTTP Live Streaming (HLS).

```
Artist Master (WAV / FLAC / MP3 / M4A)
              │
              ▼
  [Audio Validation & Verification]
  - Check MIME header (not extension)
  - Verify container integrity with ffprobe / PHP ID3
  - Enforce max size (100MB) and min duration (15s)
              │
              ▼
  [Laravel Queue: ProcessAudioVariantsJob]
              │
              ▼
  [FFmpeg Transcoding Workers]
  ├── 64 kbps   ──> prog_index.m3u8 + seg_000.ts...
  ├── 128 kbps  ──> prog_index.m3u8 + seg_000.ts...
  ├── 192 kbps  ──> prog_index.m3u8 + seg_000.ts...
  └── 320 kbps  ──> prog_index.m3u8 + seg_000.ts...
              │
              ▼
  [Master Adaptive Manifest (master.m3u8)]
              │
              ▼
  [Storage & CDN Distribution]
```

## Security & CDN Delivery

1. **Storage Isolation**: Masters are saved in non-public storage (`storage/app/masters/`).
2. **Path Sanitization**: Files are saved using UUID/SHA256 nonces, never using raw user-submitted filenames.
3. **Adaptive Bitrate Streaming**: The mobile player auto-negotiates the stream bandwidth via `master.m3u8` or allows user to select specific bitrates (Data Saver vs High Fidelity).
