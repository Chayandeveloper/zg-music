import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Play, Flame, Disc, Radio, TrendingUp, Music } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongCard } from '../../components/SongCard';
import { ArtistCard } from '../../components/ArtistCard';
import { AlbumCard } from '../../components/AlbumCard';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { playSong } = usePlayerStore();
  const [feed, setFeed] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHome = async () => {
    try {
      const res = await MobileApi.getHomeFeed();
      setFeed(res.data);
    } catch (err) {
      console.error('Failed to load home feed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
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
              {feed.zubeen_top_hits.map((song: any) => (
                <SongCard key={song.id} song={song} playlistContext={feed.zubeen_top_hits} />
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
              {feed.trending.map((song: any) => (
                <SongCard key={song.id} song={song} playlistContext={feed.trending} />
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

        {/* Section: New Releases / Albums */}
        {feed?.new_releases?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Disc size={18} color={THEME.colors.success} />
                <Text style={styles.sectionTitle}>New Releases & Albums</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {feed.new_releases.map((album: any) => (
                <AlbumCard key={album.id} album={album} />
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
              {feed.made_for_you.map((song: any) => (
                <SongCard key={song.id} song={song} playlistContext={feed.made_for_you} />
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
});
