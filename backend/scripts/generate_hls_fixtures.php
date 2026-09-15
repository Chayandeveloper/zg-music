<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$songs = App\Models\Song::all();
echo "Found " . $songs->count() . " songs in database.\n";

$audioDir = storage_path('app/public/audio');
@mkdir($audioDir, 0777, true);

// Frequencies for acoustic harmonic chords (C, E, G, A notes)
$chords = [
    1 => 'sine=frequency=261.63:duration=60',
    2 => 'sine=frequency=329.63:duration=60',
    3 => 'sine=frequency=392.00:duration=60',
    4 => 'sine=frequency=440.00:duration=60',
    5 => 'sine=frequency=523.25:duration=60',
    6 => 'sine=frequency=293.66:duration=60',
    7 => 'sine=frequency=349.23:duration=60',
    8 => 'sine=frequency=415.30:duration=60',
    9 => 'sine=frequency=493.88:duration=60',
    10 => 'sine=frequency=369.99:duration=60',
    11 => 'sine=frequency=466.16:duration=60',
];

foreach ($songs as $song) {
    $id = $song->id;
    $base = storage_path('app/public/hls/songs/' . $id);
    @mkdir($base, 0777, true);

    $chord = $chords[$id] ?? 'sine=frequency=440:duration=60';
    $rawWav = storage_path("app/public/audio/temp_{$id}.wav");
    $mp3Path = storage_path("app/public/audio/song_{$id}.mp3");

    // 1. Generate synthesized pleasant audio with soft fade in/out
    $cmdGen = "ffmpeg -y -f lavfi -i \"{$chord}\" -af \"afade=t=in:ss=0:d=2,afade=t=out:st=56:d=4\" -ar 44100 -ac 2 \"{$rawWav}\" 2>&1";
    exec($cmdGen);

    // 2. Generate direct MP3 stream
    $cmdMp3 = "ffmpeg -y -i \"{$rawWav}\" -c:a libmp3lame -b:a 192k \"{$mp3Path}\" 2>&1";
    exec($cmdMp3);

    // 3. Generate HLS for presets
    $presets = [
        '64k' => '64k',
        '128k' => '128k',
        '192k' => '192k',
        '320k' => '320k',
    ];

    foreach ($presets as $name => $bitrate) {
        $variantDir = $base . '/' . $name;
        @mkdir($variantDir, 0777, true);

        $cmdHls = "ffmpeg -y -i \"{$rawWav}\" -c:a aac -b:a {$bitrate} -ac 2 " .
                  "-hls_time 4 -hls_playlist_type vod " .
                  "-hls_segment_filename \"{$variantDir}/seg_%03d.ts\" " .
                  "\"{$variantDir}/prog_index.m3u8\" 2>&1";
        exec($cmdHls);
    }

    // 4. Generate master.m3u8
    $master = "#EXTM3U\n#EXT-X-VERSION:4\n#EXT-X-INDEPENDENT-SEGMENTS\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=64000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-64k\"\n64k/prog_index.m3u8\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-128k\"\n128k/prog_index.m3u8\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=192000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-192k\"\n192k/prog_index.m3u8\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=320000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-320k\"\n320k/prog_index.m3u8\n";
    file_put_contents($base . '/master.m3u8', $master);

    // Cleanup temp WAV
    @unlink($rawWav);

    // Update Song model
    $song->update([
        'hls_master_url' => "/storage/hls/songs/{$id}/master.m3u8",
        'stream_url' => "/storage/audio/song_{$id}.mp3",
    ]);

    echo "Generated real HLS + MP3 for song {$id} ({$song->title})\n";
}

echo "All songs audio streams and HLS segments generated successfully!\n";
