# Zubeen Player - FFmpeg Media Processing Pipeline

## Overview

The Zubeen Player media pipeline provides adaptive bitrate audio streaming using HTTP Live Streaming (HLS).

## Quality Presets

| Preset | Target Bitrate | Codec | Sample Rate | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **64k** | 64 kbps | AAC-LC | 44,100 Hz | Low-bandwidth / 2G-3G mobile data saver |
| **128k** | 128 kbps | AAC-LC | 44,100 Hz | Standard streaming default |
| **192k** | 192 kbps | AAC-LC | 44,100 Hz | High-definition rich fidelity |
| **320k** | 320 kbps | AAC-LC | 48,000 Hz | Studio master audiophile tier |

## HLS Output Structure

```
storage/app/public/hls/songs/{song_id}/
├── master.m3u8               # Multi-variant master playlist
├── 64k/
│   ├── prog_index.m3u8       # Sub-variant playlist
│   ├── seg_000.ts            # Segment chunks (4s duration)
│   └── ...
├── 128k/
│   ├── prog_index.m3u8
│   └── ...
├── 192k/
│   ├── prog_index.m3u8
│   └── ...
└── 320k/
    ├── prog_index.m3u8
    └── ...
```

## Execution via Laravel Queue

When an artist submits audio in Zubeen Stage:
1. `AudioUploadService` saves master to `storage/app/masters/{artist_id}/{hash}.{ext}`.
2. `ProcessAudioVariantsJob` is dispatched onto the `media` queue.
3. Job invokes FFmpeg via `MediaService`.
4. Outputs are saved to `storage/app/public/hls/songs/{song_id}/`.
5. Database records `audio_files` and `audio_variants` are populated.
6. Song status transitions from `PROCESSING` to `READY_FOR_REVIEW`.
