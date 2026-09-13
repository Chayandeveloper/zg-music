<?php

namespace App\Jobs;

use App\Models\Song;
use App\Models\ReleaseSong;
use App\Services\MediaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAudioVariantsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public function __construct(
        public Song $song,
        public string $masterFilePath,
        public ?ReleaseSong $releaseSong = null
    ) {}

    public function handle(MediaService $mediaService): void
    {
        Log::info("Starting audio processing for song ID: {$this->song->id}");

        if ($this->releaseSong) {
            $this->releaseSong->update(['processing_status' => 'PROCESSING']);
        }

        try {
            $success = $mediaService->transcodeToHls($this->song, $this->masterFilePath);

            if ($success) {
                if ($this->releaseSong) {
                    $this->releaseSong->update([
                        'processing_status' => 'COMPLETED',
                        'song_id' => $this->song->id,
                        'duration_seconds' => $this->song->duration_seconds,
                    ]);
                }
                Log::info("HLS audio processing completed for song ID: {$this->song->id}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to process audio variants: " . $e->getMessage());

            if ($this->releaseSong) {
                $this->releaseSong->update([
                    'processing_status' => 'FAILED',
                    'error_log' => $e->getMessage(),
                ]);
            }
        }
    }
}
