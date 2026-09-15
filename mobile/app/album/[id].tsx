import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, Shuffle, Heart } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongListItem } from '../../components/SongListItem';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playSong } = usePlayerStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        let res: any = null;
        try {
          res = await MobileApi.getAlbumDetail(id);
        } catch {
          // If internal fails, fallback to external album
          res = await MobileApi.getExternalAlbum(id);
        }

        if (res?.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load album:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAlbum();
  }, [id]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const rawAlbum = data.album || data;
  const rawSongs = rawAlbum.songs || rawAlbum.tracks || [];

  const album = {
    title: rawAlbum.title || 'Zubeen Songs',
    artist: typeof rawAlbum.artist === 'string' ? { name: rawAlbum.artist } : (rawAlbum.artist || { name: 'Zubeen Garg' }),
    cover_url:
      rawAlbum.cover_url ||
      rawAlbum.artwork_url ||
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80',
    release_year: rawAlbum.release_year || rawAlbum.year || 2024,
    genre: rawAlbum.genre || 'Assamese Classic',
  };

  const songs = rawSongs.map((s: any, idx: number) => ({
    id: s.id || s.external_id || `album-song-${idx}`,
    title: s.title,
    artist: typeof s.artist === 'string' ? { name: s.artist } : (s.artist || { name: 'Zubeen Garg' }),
    artwork_url: s.artwork_url || album.cover_url,
    duration_seconds: s.duration_seconds || 240,
    duration_formatted: s.duration_formatted,
    source_type: s.source_type || 'EXTERNAL',
    external_source: s.external_source || 'YOUTUBE_MUSIC',
    external_id: s.external_id || s.videoId || s.id,
    external_url: s.external_url,
  }));

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <HeaderAuthButton />
        </View>

        {/* Album Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: album.cover_url }}
            style={styles.cover}
          />
          <Text style={styles.title}>{album.title}</Text>
          <Text style={styles.artist}>{album.artist?.name}</Text>
          <Text style={styles.meta}>
            {album.release_year} • {album.genre} • {songs.length} songs
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {songs.length > 0 && (
              <TouchableOpacity
                onPress={() => playSong(songs[0], songs)}
                style={styles.playBtn}
              >
                <Play size={20} color="#000" fill="#000" />
                <Text style={styles.playText}>Play</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.iconBtn} onPress={handleShuffle}>
              <Shuffle size={20} color={THEME.colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Heart size={20} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tracklist */}
        <View style={styles.tracklist}>
          {songs.map((song: any, i: number) => (
            <SongListItem key={song.id} song={song} index={i} playlistContext={songs} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cover: {
    width: 180,
    height: 180,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 18,
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tracklist: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
});
