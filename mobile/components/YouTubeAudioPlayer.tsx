import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { usePlayerStore } from '../store/usePlayerStore';

export const YouTubeAudioPlayer: React.FC = () => {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const {
    currentSong,
    isPlaying,
    activeEngine,
    playNext,
    repeatMode,
    seekTo,
    setYoutubePlayerRef,
    updateProgress,
    isSeeking,
  } = usePlayerStore();

  const isYouTube = activeEngine === 'youtube';
  const videoId = isYouTube
    ? currentSong?.external_id ||
      currentSong?.playback?.videoId ||
      (typeof currentSong?.id === 'string' && !currentSong.id.includes('/') ? currentSong.id : null)
    : null;

  // Register the player reference with usePlayerStore so seek/controls work globally
  useEffect(() => {
    if (playerRef.current) {
      setYoutubePlayerRef(playerRef.current);
    }
  }, [playerRef.current, videoId]);

  // Periodic progress polling while YouTube audio is active
  useEffect(() => {
    if (!isYouTube || !isPlaying || !videoId) return;

    const interval = setInterval(async () => {
      if (playerRef.current && !isSeeking) {
        try {
          const [curr, dur] = await Promise.all([
            playerRef.current.getCurrentTime(),
            playerRef.current.getDuration(),
          ]);
          if (typeof curr === 'number' && !isNaN(curr) && curr >= 0) {
            updateProgress(
              Math.floor(curr),
              typeof dur === 'number' && dur > 0 ? Math.floor(dur) : undefined
            );
          }
        } catch {
          // Ignore transient poll errors during track changes
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isYouTube, isPlaying, videoId, isSeeking]);

  const handleChangeState = (state: string) => {
    if (state === 'ended') {
      if (repeatMode === 'one') {
        seekTo(0);
      } else {
        playNext();
      }
    } else if (state === 'playing') {
      usePlayerStore.setState({ isPlaying: true, loading: false, buffering: false });
    } else if (state === 'buffering') {
      usePlayerStore.setState({ buffering: true });
    } else if (state === 'paused') {
      usePlayerStore.setState({ isPlaying: false, buffering: false });
    }
  };

  if (!videoId) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <YoutubePlayer
        ref={playerRef}
        height={2}
        width={2}
        play={isPlaying && isYouTube}
        videoId={videoId}
        onChangeState={handleChangeState}
        initialPlayerParams={{
          preventFullScreen: true,
          controls: false,
          showClosedCaptions: false,
        }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          androidLayerType: 'hardware',
        }}
        onError={(e) => {
          console.warn('[YouTubeAudioPlayer] Playback error:', e);
          usePlayerStore.setState({ loading: false, isPlaying: false });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 2,
    height: 2,
    opacity: 0.01,
    overflow: 'hidden',
    zIndex: -1,
  },
});
