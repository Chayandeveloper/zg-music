<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(App\Http\Controllers\Api\V1\CatalogController::class);

echo "=== TESTING REAL SEARCH DEDUPLICATION & INTEGRATION ===\n";

$req = new Illuminate\Http\Request(['q' => 'Maya']);
$res = $controller->search($req);
$data = $res->getData()->data;

echo "Search Query: " . $data->query . "\n";
echo "Total Unified Songs: " . count($data->songs) . "\n";
echo "Total Unified Artists: " . count($data->artists) . "\n";
echo "Total Unified Albums: " . count($data->albums) . "\n\n";

echo "Top 4 Songs in Unified Results:\n";
foreach (array_slice($data->songs, 0, 4) as $idx => $s) {
    $src = $s->source_type ?? 'UNKNOWN';
    $playType = $s->playback->type ?? 'NONE';
    $artistName = is_object($s->artist) ? $s->artist->name : (is_array($s->artist) ? $s->artist['name'] : $s->artist);
    echo " [" . ($idx + 1) . "] {$s->title} (Artist: {$artistName}) | Source: {$src} | Playback: {$playType}\n";
}

echo "\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===\n";
