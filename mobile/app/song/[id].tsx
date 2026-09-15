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
import { ChevronLeft, Play, Heart, FileText, BookOpen, ListPlus } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongListItem } from '../../components/SongListItem';
import { LyricsModal } from '../../components/LyricsModal';
import { SongStoryModal } from '../../components/SongStoryModal';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playSong, currentSong, toggleLikeSong, isSongLiked, openAddToPlaylist } = usePlayerStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await MobileApi.getSongDetail(Number(id));
        setData(res.data);
        const songObj = res.data?.song;
        if (songObj) {
          setIsLiked(isSongLiked(songObj.id) || !!songObj.is_liked);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSong();
  }, [id]);

  // Sync like state if currently playing song is this song or from store
  useEffect(() => {
    if (data?.song) {
      if (currentSong && currentSong.id === data.song.id && currentSong.is_liked !== undefined) {
        setIsLiked(currentSong.is_liked);
      } else {
        setIsLiked(isSongLiked(data.song.id) || !!data.song.is_liked);
      }
    }
  }, [currentSong, data, isSongLiked]);

  const handleToggleLike = async () => {
    if (!data?.song) return;
    const success = await toggleLikeSong(data.song);
    setIsLiked(success);
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const song = data.song;
  const related = data.related_songs || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <HeaderAuthButton />
        </View>

        <View style={styles.centerSection}>
          <Image
            source={{
              uri:
                song.artwork_url ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.artwork}
          />
          <Text style={styles.title}>{song.title}</Text>
          <Text style={styles.artist}>{song.artist?.name}</Text>
          <Text style={styles.genre}>{song.genre} • {song.language}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={() => playSong(song)} style={styles.playBtn} activeOpacity={0.8}>
              <Play size={20} color="#000" fill="#000" />
              <Text style={styles.playText}>Play Track</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleLike} style={styles.secondaryBtn} activeOpacity={0.8}>
              <Heart
                size={18}
                color={isLiked ? THEME.colors.primary : '#FFF'}
                fill={isLiked ? THEME.colors.primary : 'transparent'}
              />
              <Text style={[styles.secondaryBtnText, isLiked && { color: THEME.colors.primary }]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openAddToPlaylist(song)}
              style={styles.secondaryBtn}
              activeOpacity={0.8}
            >
              <ListPlus size={18} color="#FFF" />
              <Text style={styles.secondaryBtnText}>Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowLyrics(true)} style={styles.secondaryBtn} activeOpacity={0.8}>
              <FileText size={18} color={THEME.colors.primary} />
              <Text style={styles.secondaryBtnText}>Lyrics</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowStory(true)} style={styles.secondaryBtn} activeOpacity={0.8}>
              <BookOpen size={18} color={THEME.colors.accent} />
              <Text style={styles.secondaryBtnText}>Story</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Related Songs */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionHeader}>Recommended Similar Tracks</Text>
            {related.map((s: any) => (
              <SongListItem key={s.id} song={s} />
            ))}
          </View>
        )}

        <LyricsModal
          visible={showLyrics}
          onClose={() => setShowLyrics(false)}
          lyricsText={song.lyrics?.lyrics_text}
          syncedData={song.lyrics?.synced_data}
          currentPositionMs={0}
        />

        <SongStoryModal
          visible={showStory}
          onClose={() => setShowStory(false)}
          song={song}
        />
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
  centerSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  artwork: {
    width: 240,
    height: 240,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 20,
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.primary,
    marginTop: 4,
  },
  genre: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  secondaryBtnText: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  relatedSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
});
