import { create } from 'zustand';
import { Audio } from 'expo-av';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileApi } from '../services/api';
import { ENV } from '../config/env';
import { useAuthStore, registerAuthListener } from './useAuthStore';

export interface SongItem {
  id: number | string;
  title: string;
  artist_id?: number | null;
  artist?: { id?: number; name: string };
  album_id?: number | null;
  album?: { id?: number; title: string } | null;
  artwork_url?: string | null;
  duration_seconds: number;
  genre?: string | null;
  stream_url?: string | null;
  hls_master_url?: string | null;
  is_liked?: boolean;
  story?: any;
  lyrics?: any;
  source_type?: 'INTERNAL' | 'EXTERNAL';
  external_source?: string;
  external_id?: string;
  external_url?: string;
  playback?: {
    available?: boolean;
    type?: string;
    videoId?: string;
    stream_url?: string;
    hls_master_url?: string;
  };
}

export type PlaybackQuality = 'auto' | '64k' | '128k' | '192k' | '320k';

export type PlaybackSource =
  | {
      type: 'INTERNAL';
      url: string;
    }
  | {
      type: 'EXTERNAL_STREAM';
      provider: string;
      streamUrl?: string;
      videoId?: string;
    };

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
  isSeeking: boolean;

  // Actions
  resolvePlaybackSource: (song: SongItem) => PlaybackSource | null;
  playSong: (song: SongItem, newQueue?: SongItem[]) => Promise<void>;
  clearPendingSong: () => void;
  togglePlayPause: () => Promise<void>;
  seekTo: (positionSeconds: number) => Promise<void>;
  seekForward10: () => Promise<void>;
  seekBackward10: () => Promise<void>;
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
  toggleLikeSong: (target: SongItem | number | string) => Promise<boolean>;
  isSongLiked: (songId: number | string) => boolean;
  likedSongs: SongItem[];
  loadLikedSongs: () => Promise<void>;
  syncServerLikedSongs: (serverSongs: SongItem[]) => Promise<void>;
  songForPlaylist: SongItem | null;
  openAddToPlaylist: (song: SongItem) => void;
  closeAddToPlaylist: () => void;

  // Recently played history
  recentlyPlayed: SongItem[];
  addToRecentlyPlayed: (song: SongItem) => Promise<void>;
  loadRecentlyPlayed: () => Promise<void>;
  syncServerRecentlyPlayed: (serverSongs: SongItem[]) => Promise<void>;
}

let currentPlayToken = 0;

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
  isSeeking: false,

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

  recentlyPlayed: [],

  addToRecentlyPlayed: async (song: SongItem) => {
    try {
      const current = get().recentlyPlayed;
      const filtered = current.filter(
        (s) => String(s.id) !== String(song.id) && (!s.external_id || s.external_id !== song.external_id)
      );
      const updated = [song, ...filtered].slice(0, 30);
      set({ recentlyPlayed: updated });
      await AsyncStorage.setItem('@zubeen_recently_played', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist recently played song:', e);
    }
  },

  loadRecentlyPlayed: async () => {
    try {
      const json = await AsyncStorage.getItem('@zubeen_recently_played');
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
          set({ recentlyPlayed: parsed });
        }
      }
    } catch (e) {
      console.warn('Failed to load recently played songs:', e);
    }
  },

  syncServerRecentlyPlayed: async (serverSongs: SongItem[]) => {
    if (!Array.isArray(serverSongs) || serverSongs.length === 0) return;
    try {
      const current = get().recentlyPlayed;
      const seen = new Set<string>();
      const merged: SongItem[] = [];

      for (const s of current) {
        const key = s.external_id || String(s.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(s);
        }
      }

      for (const s of serverSongs) {
        const key = s.external_id || String(s.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(s);
        }
      }

      const final = merged.slice(0, 30);
      set({ recentlyPlayed: final });
      await AsyncStorage.setItem('@zubeen_recently_played', JSON.stringify(final));
    } catch (e) {
      console.warn('Failed to sync server recently played:', e);
    }
  },

  resolvePlaybackSource: (song: SongItem): PlaybackSource | null => {
    // 1. If explicitly pre-resolved streaming URL (CDN / HTTP)
    if (song.stream_url && (song.stream_url.startsWith('http://') || song.stream_url.startsWith('https://'))) {
      if (song.source_type === 'EXTERNAL' || song.external_source === 'YOUTUBE_MUSIC') {
        return {
          type: 'EXTERNAL_STREAM',
          provider: song.external_source || 'YOUTUBE_MUSIC',
          streamUrl: song.stream_url,
        };
      }
      return {
        type: 'INTERNAL',
        url: song.stream_url,
      };
    }

    // 2. External YouTube Song (needs dynamic stream extraction via yt-dlp)
    const videoId =
      song.external_id ||
      song.playback?.videoId ||
      (song as any).videoId ||
      (song.source_type === 'EXTERNAL' && typeof song.id === 'string' && !song.id.includes('/') ? String(song.id) : null);

    const isExternal =
      song.source_type === 'EXTERNAL' ||
      song.external_source === 'YOUTUBE_MUSIC' ||
      (typeof song.id === 'string' && isNaN(Number(song.id)) && !song.id.includes('/'));

    if (isExternal) {
      const resolvedVideoId = videoId || (typeof song.id === 'string' ? song.id : null);
      if (resolvedVideoId) {
        return {
          type: 'EXTERNAL_STREAM',
          provider: song.external_source || 'YOUTUBE_MUSIC',
          videoId: resolvedVideoId,
        };
      }
    }

    // 3. Internal Catalog Track (hosted on Zubeen Player server with local HLS/MP3)
    let uri = song.stream_url || song.hls_master_url;
    if (!uri || uri.includes('actions.google.com')) {
      uri = `/storage/audio/song_${song.id}.mp3`;
    }
    if (uri.startsWith('/')) {
      uri = `${ENV.STORAGE_BASE_URL}${uri}`;
    }
    return {
      type: 'INTERNAL',
      url: uri,
    };
  },

  playSong: async (song, newQueue) => {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated) {
      set({ pendingSong: { song, queue: newQueue } });
      authState.openAuthModal('Please sign in to play music and stream audio.');
      return;
    }

    const { sound: existingSound, queue: existingQueue } = get();

    // 1. Instantly stop old sound NON-BLOCKING (never await unload on audio thread)
    if (existingSound) {
      existingSound.stopAsync().catch(() => {});
      existingSound.unloadAsync().catch(() => {});
    }

    const activeQueue = newQueue || (existingQueue.length > 0 ? existingQueue : [song]);
    const activeIndex = activeQueue.findIndex((s) => s.id === song.id);

    // 2. Increment play token to prevent race conditions when user taps quickly
    const thisPlayToken = ++currentPlayToken;

    // 3. ZERO-LATENCY UI UPDATE (0ms):
    // Immediately display the new track title, artist, artwork, and loading state
    set({
      currentSong: song,
      queue: activeQueue,
      queueIndex: activeIndex !== -1 ? activeIndex : 0,
      loading: true,
      isPlaying: false,
      position: 0,
      duration: song.duration_seconds || 180,
      sound: null,
    });

    // Record to recently played history
    get().addToRecentlyPlayed(song);

    // 4. Resolve Playback Source
    const source = get().resolvePlaybackSource(song);

    if (!source) {
      if (currentPlayToken !== thisPlayToken) return;
      set({ loading: false, isPlaying: false });

      Alert.alert(
        'Playback Error',
        `No audio source found for "${song.title}".`,
        [
          { text: 'OK' },
          {
            text: 'Play Next in Queue',
            onPress: () => get().playNext(),
          },
        ]
      );
      return;
    }

    try {
      let audioUri: string;

      if (source.type === 'EXTERNAL_STREAM') {
        if (source.streamUrl) {
          audioUri = source.streamUrl;
        } else if (source.videoId) {
          // Extract live stream URL from microservice
          const streamRes = await MobileApi.getExternalStream(source.videoId);
          // If user clicked another song while network call was in flight, cancel this one!
          if (currentPlayToken !== thisPlayToken) return;

          if (streamRes?.data?.streamUrl) {
            audioUri = streamRes.data.streamUrl;
            // Cache resolved stream URL in song object
            song.stream_url = audioUri;
          } else {
            throw new Error('Audio stream URL could not be resolved for this track.');
          }
        } else {
          throw new Error('Missing stream URL or video ID for external track.');
        }
      } else {
        audioUri = source.url;
      }

      if (currentPlayToken !== thisPlayToken) return;

      // Load sound with expo-av
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (!status.isLoaded) {
            if (status.error) {
              console.error('Audio playback error:', status.error);
            }
            return;
          }

          if (get().isSeeking) {
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

      // Verify token again in case another song was clicked during Sound.createAsync
      if (currentPlayToken !== thisPlayToken) {
        newSound.unloadAsync().catch(() => {});
        return;
      }

      set({ sound: newSound, loading: false, isPlaying: true });

      // Track qualified playback event asynchronously
      if (typeof song.id === 'number') {
        MobileApi.trackEvent({
          song_id: song.id,
          duration_played_seconds: 35,
          bitrate_streamed: get().playbackQuality,
        }).catch(() => {});
      }

    } catch (error: any) {
      if (currentPlayToken !== thisPlayToken) return;
      console.error('Failed to load audio sound:', error);
      set({ loading: false, isPlaying: false });
      Alert.alert(
        'Playback Error',
        `Unable to play "${song.title}". Please check your connection and try again.`
      );
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
    const clamped = Math.max(0, Math.round(positionSeconds));
    set({ isSeeking: true, position: clamped });

    const { sound } = get();
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          await sound.setPositionAsync(clamped * 1000);
        }
      } catch (e) {
        // Sound may be transitioning or unloaded
      }
    }

    setTimeout(() => {
      set({ isSeeking: false });
    }, 400);
  },

  seekForward10: async () => {
    const { position, duration } = get();
    const newPos = Math.min(duration, position + 10);
    await get().seekTo(newPos);
  },

  seekBackward10: async () => {
    const { position } = get();
    const newPos = Math.max(0, position - 10);
    await get().seekTo(newPos);
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

  likedSongs: [],

  isSongLiked: (songId: number | string) => {
    if (!songId) return false;
    const strId = String(songId);
    return get().likedSongs.some(
      (s) => String(s.id) === strId || (s.external_id && s.external_id === strId)
    );
  },

  loadLikedSongs: async () => {
    try {
      const json = await AsyncStorage.getItem('@zubeen_liked_songs');
      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
          set({ likedSongs: parsed });
        }
      }
    } catch (e) {
      console.warn('Failed to load liked songs:', e);
    }
  },

  syncServerLikedSongs: async (serverSongs: SongItem[]) => {
    if (!Array.isArray(serverSongs)) return;
    try {
      const current = get().likedSongs;
      const seen = new Set<string>();
      const merged: SongItem[] = [];

      for (const s of current) {
        const key = s.external_id || String(s.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(s);
        }
      }

      for (const s of serverSongs) {
        const key = s.external_id || String(s.id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(s);
        }
      }

      set({ likedSongs: merged });
      await AsyncStorage.setItem('@zubeen_liked_songs', JSON.stringify(merged));
    } catch (e) {
      console.warn('Failed to sync server liked songs:', e);
    }
  },

  toggleLikeCurrentSong: async () => {
    const { currentSong } = get();
    if (!currentSong) return;
    await get().toggleLikeSong(currentSong);
  },

  toggleLikeSong: async (target: SongItem | number | string) => {
    const { likedSongs, currentSong, queue, recentlyPlayed } = get();

    // Resolve song object
    let songItem: SongItem | null = null;
    let targetId: string;

    if (typeof target === 'object' && target !== null && 'title' in target) {
      songItem = target as SongItem;
      targetId = String(songItem.id);
    } else {
      targetId = String(target);
      songItem =
        (currentSong && String(currentSong.id) === targetId ? currentSong : null) ||
        queue.find((s) => String(s.id) === targetId) ||
        recentlyPlayed.find((s) => String(s.id) === targetId) ||
        likedSongs.find((s) => String(s.id) === targetId) ||
        ({
          id: target,
          title: 'Track',
          duration_seconds: 180,
        } as SongItem);
    }

    const isCurrentlyLiked = likedSongs.some(
      (s) =>
        String(s.id) === targetId ||
        (s.external_id && songItem?.external_id && s.external_id === songItem.external_id)
    );

    const nextLiked = !isCurrentlyLiked;
    let updatedLiked: SongItem[];

    if (isCurrentlyLiked) {
      // Remove from liked list
      updatedLiked = likedSongs.filter(
        (s) =>
          String(s.id) !== targetId &&
          (!s.external_id || !songItem?.external_id || s.external_id !== songItem.external_id)
      );
    } else {
      // Prepend to liked list
      const cleaned = {
        ...songItem,
        is_liked: true,
      };
      updatedLiked = [
        cleaned,
        ...likedSongs.filter(
          (s) =>
            String(s.id) !== targetId &&
            (!s.external_id || !songItem?.external_id || s.external_id !== songItem.external_id)
        ),
      ];
    }

    // Update store state immediately
    const isThisCurrentSong =
      currentSong &&
      (String(currentSong.id) === targetId ||
        (currentSong.external_id && songItem?.external_id && currentSong.external_id === songItem.external_id));

    set({
      likedSongs: updatedLiked,
      currentSong: isThisCurrentSong ? { ...currentSong, is_liked: nextLiked } : currentSong,
    });

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('@zubeen_liked_songs', JSON.stringify(updatedLiked));
    } catch (e) {
      console.warn('Failed to save liked songs:', e);
    }

    // Sync to backend if numeric ID and authenticated
    const numId = typeof songItem.id === 'number' ? songItem.id : Number(songItem.id);
    if (!isNaN(numId) && numId > 0 && useAuthStore.getState().isAuthenticated) {
      MobileApi.toggleLike(numId).catch((err) => {
        console.warn('Backend like sync failed:', err?.message);
      });
    }

    return nextLiked;
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

// Auto-load recently played and liked songs on startup
usePlayerStore.getState().loadRecentlyPlayed();
usePlayerStore.getState().loadLikedSongs();


