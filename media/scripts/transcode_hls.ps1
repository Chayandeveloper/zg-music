# Zubeen Player Windows PowerShell FFmpeg HLS Transcoding Pipeline
# Usage: .\transcode_hls.ps1 -InputFile "path\to\audio.mp3" -OutputDir "path\to\output" -SongId 123

param (
    [Parameter(Mandatory=$true)]
    [string]$InputFile,

    [Parameter(Mandatory=$true)]
    [string]$OutputDir,

    [Parameter(Mandatory=$true)]
    [string]$SongId
)

$ErrorActionPreference = "Stop"

$SongOutputDir = Join-Path $OutputDir "songs\$SongId"
$Variants = @("64k", "128k", "192k", "320k")

foreach ($v in $Variants) {
    $VariantDir = Join-Path $SongOutputDir $v
    if (-not (Test-Path $VariantDir)) {
        New-Item -ItemType Directory -Path $VariantDir -Force | Out-Null
    }
}

Write-Host "[Zubeen HLS] Transcoding Song $SongId from $InputFile"

# 64k
& ffmpeg -y -i "$InputFile" -c:a aac -b:a 64k -ar 44100 -ac 2 -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$SongOutputDir\64k\seg_%03d.ts" "$SongOutputDir\64k\prog_index.m3u8"

# 128k
& ffmpeg -y -i "$InputFile" -c:a aac -b:a 128k -ar 44100 -ac 2 -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$SongOutputDir\128k\seg_%03d.ts" "$SongOutputDir\128k\prog_index.m3u8"

# 192k
& ffmpeg -y -i "$InputFile" -c:a aac -b:a 192k -ar 44100 -ac 2 -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$SongOutputDir\192k\seg_%03d.ts" "$SongOutputDir\192k\prog_index.m3u8"

# 320k
& ffmpeg -y -i "$InputFile" -c:a aac -b:a 320k -ar 48000 -ac 2 -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$SongOutputDir\320k\seg_%03d.ts" "$SongOutputDir\320k\prog_index.m3u8"

# Write master playlist
$MasterContent = @"
#EXTM3U
#EXT-X-VERSION:4
#EXT-X-INDEPENDENT-SEGMENTS

#EXT-X-STREAM-INF:BANDWIDTH=64000,CODECS="mp4a.40.2",AUDIO="audio-64k"
64k/prog_index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2",AUDIO="audio-128k"
128k/prog_index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=192000,CODECS="mp4a.40.2",AUDIO="audio-192k"
192k/prog_index.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=320000,CODECS="mp4a.40.2",AUDIO="audio-320k"
320k/prog_index.m3u8
"@

Set-Content -Path (Join-Path $SongOutputDir "master.m3u8") -Value $MasterContent
Write-Host "[Zubeen HLS] Master manifest written successfully."
