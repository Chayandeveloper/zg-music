import { create } from 'zustand';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { MobileApi } from '../services/api';
import { ENV } from '../config/env';
import { useAuthStore, registerAuthListener } from './useAuthStore';

export interface SongItem {
  id: number;
  title: string;
  artist_id?: number;
  artist?: { id: number; name: string };
  album_id?: number | null;
  album?: { id: number; title: string } | null;
  artwork_url?: string | null;
  duration_seconds: number;
  genre?: string | null;
  stream_url?: string | null;
  hls_master_url?: string | null;
  is_liked?: boolean;
  story?: any;
  lyrics?: any;
}

export type PlaybackQuality = 'auto' | '64k' | '128k' | '192k' | '320k';

interface PlayerState {
  currentSong: SongItem | null;
  queue: SongItem[];
  queueIndex: number;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  volume: number;
  shuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  buffering: boolean;
  loading: boolean;
  playbackQuality: PlaybackQuality;
  isFullPlayerVisible: boolean;
  pendingSong: { song: SongItem; queue?: SongItem[] } | null;
  
  // Audio playback object reference
  sound: Audio.Sound | null;

  // Actions
  playSong: (song: SongItem, newQueue?: SongItem[]) => Promise<void>;
  clearPendingSong: () => void;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionSeconds: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  addToQueue: (song: SongItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setPlaybackQuality: (quality: PlaybackQuality) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  toggleLikeCurrentSong: () => Promise<void>;
  toggleLikeSong: (songId: number) => Promise<boolean>;
  songForPlaylist: SongItem | null;
  openAddToPlaylist: (song: SongItem) => void;
  closeAddToPlaylist: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  volume: 1.0,
  shuffle: false,
  repeatMode: 'off',
  buffering: false,
  loading: false,
  playbackQuality: 'auto',
  isFullPlayerVisible: false,
  pendingSong: null,
  songForPlaylist: null,
  sound: null,

  clearPendingSong: () => set({ pendingSong: null }),

  openAddToPlaylist: (song) => {
    const { isAuthenticated, openAuthModal } = useAuthStore.getState();
    if (!isAuthenticated) {
      openAuthModal('Please sign in to add songs to playlists.');
      return;
    }
    set({ songForPlaylist: song });
  },

  closeAddToPlaylist: () => set({ songForPlaylist: null }),

  playSong: async (song, newQueue) => {
    // 0. Auth Guard: if not authenticated, trigger sign in box
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated) {
      set({ pendingSong: { song, queue: newQueue } });
      authState.openAuthModal('Please sign in to play music and stream audio.');
      return;
    }

    const { sound: existingSound, queue: existingQueue } = get();

    // 1. Teardown existing audio sound instance
    if (existingSound) {
      try {
        await existingSound.unloadAsync();
      } catch {}
    }

    const activeQueue = newQueue || (existingQueue.length > 0 ? existingQueue : [song]);
    const activeIndex = activeQueue.findIndex((s) => s.id === song.id);

    set({
      currentSong: song,
      queue: activeQueue,
      queueIndex: activeIndex !== -1 ? activeIndex : 0,
      loading: true,
      isPlaying: false,
      position: 0,
      duration: song.duration_seconds || 180,
    });

    try {
      // Resolve stream source: either full absolute URL, or prepend backend storage URL
      let uri = song.stream_url || 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg';
      if (uri.startsWith('/')) {
        uri = `${ENV.STORAGE_BASE_URL}${uri}`;
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (!status.isLoaded) {
            if (status.error) {
              console.error('Audio playback error:', status.error);
            }
            return;
          }

          set({
            position: Math.floor(status.positionMillis / 1000),
            duration: Math.floor((status.durationMillis || (song.duration_seconds * 1000)) / 1000),
            isPlaying: status.isPlaying,
            buffering: status.isBuffering,
          });

          if (status.didJustFinish) {
            const { repeatMode } = get();
            if (repeatMode === 'one') {
              get().seekTo(0);
            } else {
              get().playNext();
            }
          }
        }
      );

      set({ sound: newSound, loading: false, isPlaying: true });

      // Track qualified playback event
      MobileApi.trackEvent({
        song_id: song.id,
        duration_played_seconds: 35, // Report stream event
        bitrate_streamed: get().playbackQuality,
      }).catch(() => {});

    } catch (error) {
      console.error('Failed to load audio sound:', error);
      set({ loading: false, isPlaying: false });
    }
  },

  togglePlayPause: async () => {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated) {
      authState.openAuthModal('Please sign in to play music.');
      return;
    }

    const { sound, isPlaying } = get();
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      set({ isPlaying: false });
    } else {
      await sound.playAsync();
      set({ isPlaying: true });
    }
  },

  seekTo: async (positionSeconds) => {
    const { sound } = get();
    if (!sound) return;
    await sound.setPositionAsync(positionSeconds * 1000);
    set({ position: positionSeconds });
  },

  playNext: async () => {
    const { queue, queueIndex, shuffle, repeatMode } = get();
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      get().playSong(nextSong, queue);
    }
  },

  playPrevious: async () => {
    const { queue, queueIndex, position } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds into song, restart track
    if (position > 3) {
      get().seekTo(0);
      return;
    }

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      get().playSong(queue[prevIndex], queue);
    }
  },

  addToQueue: (song) => {
    set((state) => ({
      queue: [...state.queue, song],
    }));
  },

  removeFromQueue: (index) => {
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
    }));
  },

  clearQueue: () => {
    set({ queue: [], queueIndex: 0 });
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },

  toggleRepeat: () => {
    set((state) => ({
      repeatMode: state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off',
    }));
  },

  setPlaybackQuality: (quality) => {
    set({ playbackQuality: quality });
  },

  openFullPlayer: () => {
    set({ isFullPlayerVisible: true });
  },

  closeFullPlayer: () => {
    set({ isFullPlayerVisible: false });
  },

  toggleLikeCurrentSong: async () => {
    const { isAuthenticated, openAuthModal } = useAuthStore.getState();
    if (!isAuthenticated) {
      openAuthModal('Please sign in to save songs to your Liked Songs.');
      return;
    }

    const { currentSong } = get();
    if (!currentSong) return;

    try {
      const res = await MobileApi.toggleLike(currentSong.id);
      const isLiked = res.data?.is_liked;
      set((state) => ({
        currentSong: state.currentSong ? { ...state.currentSong, is_liked: isLiked } : null,
      }));
    } catch (err) {
      console.error('Failed to toggle like on current song:', err);
    }
  },

  toggleLikeSong: async (songId: number) => {
    const { isAuthenticated, openAuthModal } = useAuthStore.getState();
    if (!isAuthenticated) {
      openAuthModal('Please sign in to save songs to your Liked Songs.');
      return false;
    }

    try {
      const res = await MobileApi.toggleLike(songId);
      const isLiked = res.data?.is_liked;
      const { currentSong } = get();
      if (currentSong && currentSong.id === songId) {
        set({ currentSong: { ...currentSong, is_liked: isLiked } });
      }
      return !!isLiked;
    } catch (err) {
      console.error('Failed to toggle like song:', err);
      return false;
    }
  },
}));

registerAuthListener(
  () => {
    const { pendingSong, clearPendingSong, playSong } = usePlayerStore.getState();
    if (pendingSong) {
      const { song, queue } = pendingSong;
      clearPendingSong();
      setTimeout(() => {
        playSong(song, queue);
      }, 300);
    }
  },
  async () => {
    const { sound } = usePlayerStore.getState();
    if (sound) {
      try {
        await sound.stopAsync();
      } catch {}
    }
    usePlayerStore.setState({ isPlaying: false, currentSong: null, sound: null, pendingSong: null });
  }
);
