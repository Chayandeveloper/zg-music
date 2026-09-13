#!/usr/bin/env bash
# Zubeen Player FFmpeg Adaptive Bitrate HLS Transcoding Pipeline
# Usage: ./transcode_hls.sh <input_file> <output_dir> <song_id>

set -e

INPUT_FILE="$1"
OUTPUT_BASE_DIR="$2"
SONG_ID="$3"

if [ -z "$INPUT_FILE" ] || [ -z "$OUTPUT_BASE_DIR" ] || [ -z "$SONG_ID" ]; then
  echo "Usage: $0 <input_file> <output_base_dir> <song_id>"
  exit 1
fi

SONG_OUTPUT_DIR="${OUTPUT_BASE_DIR}/songs/${SONG_ID}"
mkdir -p "${SONG_OUTPUT_DIR}/64k" "${SONG_OUTPUT_DIR}/128k" "${SONG_OUTPUT_DIR}/192k" "${SONG_OUTPUT_DIR}/320k"

echo "[Zubeen HLS] Starting transcoding for song ID: ${SONG_ID}"
echo "[Zubeen HLS] Input file: ${INPUT_FILE}"

# 1. Transcode 64k variant
ffmpeg -y -i "${INPUT_FILE}" \
  -c:a aac -b:a 64k -ar 44100 -ac 2 \
  -hls_time 4 -hls_playlist_type vod \
  -hls_segment_filename "${SONG_OUTPUT_DIR}/64k/seg_%03d.ts" \
  "${SONG_OUTPUT_DIR}/64k/prog_index.m3u8"

# 2. Transcode 128k variant
ffmpeg -y -i "${INPUT_FILE}" \
  -c:a aac -b:a 128k -ar 44100 -ac 2 \
  -hls_time 4 -hls_playlist_type vod \
  -hls_segment_filename "${SONG_OUTPUT_DIR}/128k/seg_%03d.ts" \
  "${SONG_OUTPUT_DIR}/128k/prog_index.m3u8"

# 3. Transcode 192k variant
ffmpeg -y -i "${INPUT_FILE}" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -hls_time 4 -hls_playlist_type vod \
  -hls_segment_filename "${SONG_OUTPUT_DIR}/192k/seg_%03d.ts" \
  "${SONG_OUTPUT_DIR}/192k/prog_index.m3u8"

# 4. Transcode 320k variant
ffmpeg -y -i "${INPUT_FILE}" \
  -c:a aac -b:a 320k -ar 48000 -ac 2 \
  -hls_time 4 -hls_playlist_type vod \
  -hls_segment_filename "${SONG_OUTPUT_DIR}/320k/seg_%03d.ts" \
  "${SONG_OUTPUT_DIR}/320k/prog_index.m3u8"

# 5. Build Master Adaptive Playlist
cat <<EOF > "${SONG_OUTPUT_DIR}/master.m3u8"
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
EOF

echo "[Zubeen HLS] Transcoding complete. Master playlist created at: ${SONG_OUTPUT_DIR}/master.m3u8"
