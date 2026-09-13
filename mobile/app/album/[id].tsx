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
        const res = await MobileApi.getAlbumDetail(Number(id));
        setData(res.data);
      } catch (err) {
        console.error(err);
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

  const album = data.album;
  const songs = album.songs || [];

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
            source={{
              uri:
                album.cover_url ||
                'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80',
            }}
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

            <TouchableOpacity style={styles.iconBtn}>
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
