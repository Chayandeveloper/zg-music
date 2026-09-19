import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { usePlayerStore } from '../store/usePlayerStore';

export const YouTubeAudioPlayer: React.FC = () => {
  const playerRef = useRef<YoutubeIframeRef>(null);
  const {
    currentSong,
    isPlaying,
    position,
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

  const isFetchingRef = useRef(false);
  const durationFetchedRef = useRef<string | null>(null);

  // Periodic progress polling while YouTube audio is active
  useEffect(() => {
    if (!isYouTube || !isPlaying || !videoId) return;

    const interval = setInterval(async () => {
      if (!playerRef.current || isSeeking || isFetchingRef.current) return;

      isFetchingRef.current = true;
      try {
        // Fetch duration once per videoId
        if (durationFetchedRef.current !== videoId) {
          const dur = await playerRef.current.getDuration();
          if (typeof dur === 'number' && dur > 0) {
            durationFetchedRef.current = videoId;
            updateProgress(Math.floor(position), Math.floor(dur));
          }
        }

        const curr = await playerRef.current.getCurrentTime();
        if (typeof curr === 'number' && !isNaN(curr) && curr >= 0) {
          updateProgress(Math.floor(curr));
        }
      } catch {
        // Ignore transient poll errors during track changes
      } finally {
        isFetchingRef.current = false;
      }
    }, 1000);

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
      // Guard: Do not let late 'playing' events override a user-initiated pause!
      if (!usePlayerStore.getState().isPlaying) {
        return;
      }
      usePlayerStore.setState({ isPlaying: true, loading: false, buffering: false });
    } else if (state === 'buffering') {
      usePlayerStore.setState({ buffering: true });
    } else if (state === 'paused') {
      usePlayerStore.setState({ isPlaying: false, buffering: false });
    }
  };

  const currentVideoIdRef = useRef<string>('');
  if (videoId && videoId !== currentVideoIdRef.current) {
    currentVideoIdRef.current = videoId;
  }
  useEffect(() => {
    if (!isYouTube) {
      currentVideoIdRef.current = '';
    }
  }, [isYouTube]);

  const activeVideoId = videoId || currentVideoIdRef.current;
  if (!isYouTube || !activeVideoId) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <YoutubePlayer
        ref={playerRef}
        height={200}
        width={200}
        play={isPlaying && isYouTube && !!videoId}
        mute={!isPlaying}
        volume={isPlaying ? 100 : 0}
        videoId={activeVideoId}
        useLocalHTML={true}
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
          injectedJavaScript: `
            (function() {
              try {
                Object.defineProperty(document, 'hidden', { value: false, writable: false });
                Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
                document.addEventListener('visibilitychange', function(e) {
                  e.stopImmediatePropagation();
                }, true);

                function handleMsg(e) {
                  try {
                    var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                    if (!data) return;
                    if (data.eventName === 'pauseVideo') {
                      if (window.player && window.player.pauseVideo) window.player.pauseVideo();
                      var v = document.querySelector('video');
                      if (v) { v.pause(); v.muted = true; }
                    } else if (data.eventName === 'playVideo') {
                      if (window.player && window.player.playVideo) window.player.playVideo();
                      var v = document.querySelector('video');
                      if (v) { v.muted = false; v.play(); }
                    }
                  } catch(err) {}
                }
                document.addEventListener('message', handleMsg);
                window.addEventListener('message', handleMsg);
              } catch (e) {}
            })();
            true;
          `,
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
    right: 0,
    width: 200,
    height: 200,
    opacity: 0.001,
    overflow: 'hidden',
    zIndex: -1,
  },
});
