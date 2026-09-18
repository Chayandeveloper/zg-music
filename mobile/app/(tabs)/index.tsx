import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Play, Flame, Disc, Radio, TrendingUp, Music, Clock } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongCard } from '../../components/SongCard';
import { ArtistCard } from '../../components/ArtistCard';
import { AlbumCard } from '../../components/AlbumCard';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { playSong, prefetchSong, recentlyPlayed, syncServerRecentlyPlayed, loadRecentlyPlayed } = usePlayerStore();
  const [feed, setFeed] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAlbumId, setLoadingAlbumId] = useState<string | null>(null);

  const playAlbum = async (albumId: string | number) => {
    try {
      setLoadingAlbumId(String(albumId));
      let res: any = null;
      try {
        res = await MobileApi.getAlbumDetail(albumId);
      } catch {
        res = await MobileApi.getExternalAlbum(String(albumId));
      }

      const albumData = res?.data?.album || res?.data;
      const rawSongs = albumData?.songs || albumData?.tracks || [];

      if (rawSongs.length > 0) {
        const normalizedSongs = rawSongs.map((s: any, idx: number) => ({
          id: s.id || s.external_id || `album-song-${idx}`,
          title: s.title,
          artist: typeof s.artist === 'string' ? { name: s.artist } : (s.artist || { name: 'Zubeen Garg' }),
          artwork_url: s.artwork_url || albumData.cover_url || albumData.artwork_url,
          duration_seconds: s.duration_seconds || 240,
          duration_formatted: s.duration_formatted,
          source_type: s.source_type || 'EXTERNAL',
          external_source: s.external_source || 'YOUTUBE_MUSIC',
          external_id: s.external_id || s.videoId || s.id,
          external_url: s.external_url,
        }));

        await playSong(normalizedSongs[0], normalizedSongs);
      }
    } catch (err) {
      console.error('Failed to play album:', err);
    } finally {
      setLoadingAlbumId(null);
    }
  };

  const fetchHome = async () => {
    try {
      const res = await MobileApi.getHomeFeed();
      setFeed(res.data);
      if (res?.data?.recently_played && Array.isArray(res.data.recently_played)) {
        syncServerRecentlyPlayed(res.data.recently_played);
      }
      // Background prefetch top songs across all sections for instant playback on tap
      const toPrefetch: any[] = [];
      if (Array.isArray(res?.data?.zubeen_top_hits)) toPrefetch.push(...res.data.zubeen_top_hits.slice(0, 5));
      if (Array.isArray(res?.data?.zubeen_hindi_hits)) toPrefetch.push(...res.data.zubeen_hindi_hits.slice(0, 3));
      if (Array.isArray(res?.data?.zubeen_bangla_hits)) toPrefetch.push(...res.data.zubeen_bangla_hits.slice(0, 3));

      toPrefetch.forEach((s: any, idx: number) => {
        setTimeout(() => {
          prefetchSong(s);
        }, idx * 150);
      });
    } catch (err) {
      console.error('Failed to load home feed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecentlyPlayed();
    fetchHome();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHome();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with App Logo, Greeting, Stage Badge & Auth Button */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
          />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.greeting}>{feed?.greeting || 'Good Evening'}</Text>
            <Text style={styles.userName}>{user ? user.name : 'Welcome to Zubeefy'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.badgeZubeen}>
              <Sparkles size={14} color="#000" />
              <Text style={styles.badgeText}>STAGE</Text>
            </View>
            <HeaderAuthButton />
          </View>
        </View>

        {/* Hero Spotlight: Zubeen Garg Legacy */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80' }}
            style={styles.heroBg}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroPill}>
              <Music size={12} color={THEME.colors.primary} />
              <Text style={styles.heroPillText}>ICON OF ASSAM</Text>
            </View>
            <Text style={styles.heroTitle}>The Soul of Northeast Melodies</Text>
            <Text style={styles.heroSubtitle}>
              Over 32,000 classics in Assamese, Hindi, Bengali, and global folk fusion.
            </Text>
            {feed?.zubeen_top_hits?.[0] && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => playSong(feed.zubeen_top_hits[0], feed.zubeen_top_hits)}
                style={styles.heroPlayButton}
              >
                <Play size={18} color="#000" fill="#000" />
                <Text style={styles.heroPlayText}>Play Top Hits</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Featured Album Showcase: Zubeen Songs */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => playAlbum('zubeen-songs')}
          style={styles.zubeenAlbumBanner}
        >
          <Image
            source={{
              uri:
                feed?.zubeen_songs_album?.cover_url ||
                'https://yt3.googleusercontent.com/MIeKBUrRYIWXrLR7IkV4PWbl-7lU8oLo8lRW_z618Gr_DjlOyT9hZIo9g1-eQjUKiCQfnzzWCyhVP8nq=w544-h544-l90-rj',
            }}
            style={styles.zubeenAlbumBannerBg}
          />
          <View style={styles.zubeenAlbumBannerOverlay} />

          <View style={styles.zubeenAlbumBannerContent}>
            <View style={styles.zubeenAlbumBadgeRow}>
              <View style={styles.zubeenAlbumBadge}>
                <Disc size={13} color="#000" />
                <Text style={styles.zubeenAlbumBadgeText}>ALBUM • ONLY ZUBEEN SONGS</Text>
              </View>
              <Text style={styles.zubeenAlbumBadgeSub}>30 Hits</Text>
            </View>

            <Text style={styles.zubeenAlbumBannerTitle}>Zubeen Songs</Text>
            <Text style={styles.zubeenAlbumBannerSubtitle}>
              Tap here to play only Zubeen Garg's greatest albums and timeless melodies.
            </Text>

            <View style={styles.zubeenAlbumBtnRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => playAlbum('zubeen-songs')}
                style={styles.zubeenAlbumPlayBtn}
              >
                {loadingAlbumId === 'zubeen-songs' ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Play size={18} color="#000" fill="#000" />
                    <Text style={styles.zubeenAlbumPlayBtnText}>Play Zubeen Album</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push('/album/zubeen-songs' as any)}
                style={styles.zubeenAlbumTracksBtn}
              >
                <Text style={styles.zubeenAlbumTracksBtnText}>View Tracklist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section: Recently Played */}
        {recentlyPlayed?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Clock size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Recently Played</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {recentlyPlayed.map((song: any, idx: number) => (
                <SongCard key={`recent-${song.id || song.external_id || idx}`} song={song} playlistContext={recentlyPlayed} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Zubeen's Hit Albums */}
        {((feed?.zubeen_albums && feed.zubeen_albums.length > 0) || (feed?.new_releases && feed.new_releases.length > 0)) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Disc size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Zubeen's Hit Albums</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {(feed?.zubeen_albums || feed?.new_releases).map((album: any, idx: number) => (
                <AlbumCard
                  key={album.id || album.external_id || `alb-${idx}`}
                  album={album}
                  onPressPlay={() => playAlbum(album.id || album.external_id || 'zubeen-songs')}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Zubeen's Top Hits */}
        {feed?.zubeen_top_hits?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Flame size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Zubeen's Timeless Hits</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.zubeen_top_hits.map((song: any, idx: number) => (
                <SongCard key={`top-${song.id || song.external_id || song.videoId || idx}`} song={song} playlistContext={feed.zubeen_top_hits} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Zubeen's Hindi Songs */}
        {feed?.zubeen_hindi_hits?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Music size={18} color={THEME.colors.accent} />
                <Text style={styles.sectionTitle}>Zubeen's Hindi Songs</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.zubeen_hindi_hits.map((song: any, idx: number) => (
                <SongCard
                  key={`hindi-${song.id || song.external_id || idx}`}
                  song={song}
                  playlistContext={feed.zubeen_hindi_hits}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Zubeen's Bangla Songs */}
        {feed?.zubeen_bangla_hits?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Flame size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Zubeen's Bangla Songs</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.zubeen_bangla_hits.map((song: any, idx: number) => (
                <SongCard
                  key={`bangla-${song.id || song.external_id || idx}`}
                  song={song}
                  playlistContext={feed.zubeen_bangla_hits}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Trending Now */}
        {feed?.trending?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={18} color={THEME.colors.accent} />
                <Text style={styles.sectionTitle}>Trending Across Assam</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.trending.map((song: any, idx: number) => (
                <SongCard key={`trending-${song.id || song.external_id || song.videoId || idx}`} song={song} playlistContext={feed.trending} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Rising Artists */}
        {feed?.rising_artists?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Rising Artists on Stage</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.rising_artists.map((artist: any) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Section: Made For You */}
        {feed?.made_for_you?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Radio size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Recommended For You</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.made_for_you.map((song: any, idx: number) => (
                <SongCard key={`mfy-${song.id || song.external_id || song.videoId || idx}`} song={song} playlistContext={feed.made_for_you} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 110, // Avoid overlap with mini player
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    backgroundColor: '#000',
  },
  greeting: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  badgeZubeen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 11, 16, 0.75)',
  },
  heroContent: {
    zIndex: 2,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderAccent,
    marginBottom: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    maxWidth: '90%',
  },
  heroPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  heroPlayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.2,
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 6,
  },
  zubeenAlbumBanner: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    backgroundColor: '#12141c',
    minHeight: 180,
    justifyContent: 'flex-end',
    padding: 18,
  },
  zubeenAlbumBannerBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  zubeenAlbumBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 12, 18, 0.82)',
  },
  zubeenAlbumBannerContent: {
    zIndex: 2,
  },
  zubeenAlbumBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  zubeenAlbumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zubeenAlbumBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.6,
  },
  zubeenAlbumBadgeSub: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  zubeenAlbumBannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  zubeenAlbumBannerSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    maxWidth: '92%',
  },
  zubeenAlbumBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  zubeenAlbumPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  zubeenAlbumPlayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },
  zubeenAlbumTracksBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zubeenAlbumTracksBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
