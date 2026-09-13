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
import { CheckCircle2, ChevronLeft, Heart, Play, UserPlus, UserCheck } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongListItem } from '../../components/SongListItem';
import { AlbumCard } from '../../components/AlbumCard';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playSong } = usePlayerStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const res = await MobileApi.getArtistDetail(Number(id));
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArtist();
  }, [id]);

  const toggleFollow = async () => {
    try {
      const res = await MobileApi.toggleFollow(Number(id));
      setIsFollowing(res.data?.is_following);
    } catch {}
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

  const artist = data.artist;
  const popularSongs = data.popular_songs || [];
  const albums = data.albums || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner with Back Button & Auth Button */}
        <View style={styles.bannerContainer}>
          <Image
            source={{
              uri:
                artist.banner_image_url ||
                'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.bannerImage}
          />
          <View style={styles.topNavRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <HeaderAuthButton />
          </View>
        </View>

        {/* Profile Card Overlay */}
        <View style={styles.profileSection}>
          <View style={styles.artistRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.artistName}>{artist.name}</Text>
                {artist.verified && <CheckCircle2 size={18} color={THEME.colors.primary} fill={THEME.colors.primary} />}
              </View>
              <Text style={styles.metaText}>
                {artist.monthly_listeners ? `${(artist.monthly_listeners / 1000).toFixed(0)}K monthly listeners` : 'Artist'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={toggleFollow}
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={16} color={THEME.colors.primary} />
                  <Text style={[styles.followText, { color: THEME.colors.primary }]}>Following</Text>
                </>
              ) : (
                <>
                  <UserPlus size={16} color="#000" />
                  <Text style={styles.followText}>Follow</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Play Popular Button */}
          {popularSongs.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => playSong(popularSongs[0], popularSongs)}
              style={styles.playAllBtn}
            >
              <Play size={18} color="#000" fill="#000" />
              <Text style={styles.playAllText}>Play Popular Tracks</Text>
            </TouchableOpacity>
          )}

          {/* Popular Tracks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Songs</Text>
            {popularSongs.map((song: any, i: number) => (
              <SongListItem key={song.id} song={song} index={i} playlistContext={popularSongs} />
            ))}
          </View>

          {/* Albums Section */}
          {albums.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Albums & Soundtracks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {albums.map((alb: any) => (
                  <AlbumCard key={alb.id} album={alb} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* About Narrative */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {artist.name}</Text>
            <Text style={styles.bioText}>{artist.biography}</Text>
          </View>
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
  bannerContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  topNavRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    padding: 20,
  },
  artistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  artistName: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  metaText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: THEME.colors.borderAccent,
  },
  followText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 18,
    marginBottom: 10,
  },
  playAllText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
});
