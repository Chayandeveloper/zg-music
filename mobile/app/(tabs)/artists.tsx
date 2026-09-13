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
import { Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MobileApi } from '../../services/api';
import { ArtistCard } from '../../components/ArtistCard';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';

export default function ArtistsScreen() {
  const router = useRouter();
  const [artists, setArtists] = useState<any[]>([]);
  const [risingArtists, setRisingArtists] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArtists = async () => {
    try {
      const [allRes, risingRes] = await Promise.all([
        MobileApi.getArtists(),
        MobileApi.getArtists(true),
      ]);
      setArtists(allRes.data || []);
      setRisingArtists(risingRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchArtists(); }} tintColor={THEME.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.title}>Artist Discovery</Text>
            <Text style={styles.subtitle}>Legends, master vocalists, and vibrant rising creators</Text>
          </View>
          <HeaderAuthButton />
        </View>

        {/* Spotlight Rising Velocity Section */}
        {risingArtists.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={18} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Rising Artists</Text>
              </View>
              <Text style={styles.velocityTag}>High Momentum</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
              {risingArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Artists Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 14 }]}>
            All Artists & Maestros
          </Text>

          <View style={styles.grid}>
            {artists.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/artist/${artist.id}` as any)}
                style={styles.artistRow}
              >
                <Image
                  source={{
                    uri:
                      artist.profile_image_url ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
                  }}
                  style={styles.rowAvatar}
                />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.rowName}>{artist.name}</Text>
                    {artist.verified && <CheckCircle2 size={14} color={THEME.colors.primary} fill={THEME.colors.primary} />}
                  </View>
                  <Text style={styles.rowGenres} numberOfLines={1}>
                    {artist.genres?.join(' • ') || 'Modern Assamese'}
                  </Text>
                </View>
                <Text style={styles.rowStreams}>
                  {artist.total_streams ? `${(artist.total_streams / 1000000).toFixed(1)}M plays` : ''}
                </Text>
              </TouchableOpacity>
            ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  velocityTag: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  rowAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.surfaceHover,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  rowGenres: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  rowStreams: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
});
