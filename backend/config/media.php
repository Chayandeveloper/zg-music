<?php

return [
    'disk' => env('MEDIA_STORAGE_DISK', 'public'),
    'masters_disk' => env('MASTERS_STORAGE_DISK', 'local'),
    'hls_base_path' => 'hls/songs',
    'masters_base_path' => 'masters',
    'ffmpeg_path' => env('FFMPEG_BINARY', 'ffmpeg'),
    'ffprobe_path' => env('FFPROBE_BINARY', 'ffprobe'),
    'segment_duration' => env('HLS_SEGMENT_DURATION', 4),
    'qualifying_stream_seconds' => 30,
    'bitrates' => [
        '64k' => [
            'bitrate' => '64k',
            'sample_rate' => 44100,
            'bandwidth' => 64000,
            'channels' => 2,
        ],
        '128k' => [
            'bitrate' => '128k',
            'sample_rate' => 44100,
            'bandwidth' => 128000,
            'channels' => 2,
        ],
        '192k' => [
            'bitrate' => '192k',
            'sample_rate' => 44100,
            'bandwidth' => 192000,
            'channels' => 2,
        ],
        '320k' => [
            'bitrate' => '320k',
            'sample_rate' => 48000,
            'bandwidth' => 320000,
            'channels' => 2,
        ],
    ],
];
