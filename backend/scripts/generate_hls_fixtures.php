<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

for ($id = 1; $id <= 6; $id++) {
    $base = storage_path('app/public/hls/songs/' . $id);
    @mkdir($base . '/64k', 0777, true);
    @mkdir($base . '/128k', 0777, true);
    @mkdir($base . '/192k', 0777, true);
    @mkdir($base . '/320k', 0777, true);

    $master = "#EXTM3U\n#EXT-X-VERSION:4\n#EXT-X-INDEPENDENT-SEGMENTS\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=64000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-64k\"\n64k/prog_index.m3u8\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-128k\"\n128k/prog_index.m3u8\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=192000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-192k\"\n192k/prog_index.m3u8\n\n" .
              "#EXT-X-STREAM-INF:BANDWIDTH=320000,CODECS=\"mp4a.40.2\",AUDIO=\"audio-320k\"\n320k/prog_index.m3u8\n";

    file_put_contents($base . '/master.m3u8', $master);

    foreach (['64k', '128k', '192k', '320k'] as $variant) {
        $prog = "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:0\n" .
                "#EXTINF:4.000000,\nhttps://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg\n" .
                "#EXT-X-ENDLIST\n";
        file_put_contents($base . '/' . $variant . '/prog_index.m3u8', $prog);
    }
}

echo "HLS manifest fixtures generated successfully for songs 1 to 6.\n";
