import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Music, User, Disc, Flame } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongListItem } from '../../components/SongListItem';
import { ArtistCard } from '../../components/ArtistCard';
import { AlbumCard } from '../../components/AlbumCard';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Maya', 'Anamika', 'Mon Jaai', 'Zubeen Garg', 'Papon']);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await MobileApi.search(text);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecent = (term: string) => {
    handleSearch(term);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
          <HeaderAuthButton />
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={THEME.colors.textMuted} />
          <TextInput
            placeholder="Search songs, artists, albums..."
            placeholderTextColor={THEME.colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <X size={18} color={THEME.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
          )}

          {!query && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Flame size={16} color={THEME.colors.primary} />
                <Text style={styles.sectionTitle}>Trending & Recent Searches</Text>
              </View>
              <View style={styles.chipContainer}>
                {recentSearches.map((term, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSelectRecent(term)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {results && (() => {
            const songs = results.songs || [];
            const artists = results.artists || [];
            const albums = results.albums || [];

            const hasAnyResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

            if (!hasAnyResults) {
              return (
                <View style={styles.centerBox}>
                  <Text style={styles.emptyText}>No results matching "{query}"</Text>
                </View>
              );
            }

            return (
              <View>
                {/* 1. Unified Songs Results */}
                {songs.length > 0 && (
                  <View style={styles.groupSection}>
                    <View style={styles.groupHeader}>
                      <Music size={16} color={THEME.colors.primary} />
                      <Text style={styles.groupTitle}>Songs</Text>
                    </View>
                    {songs.map((song: any, idx: number) => (
                      <SongListItem
                        key={`song-${song.id || idx}`}
                        song={song}
                        index={idx}
                        queue={songs}
                      />
                    ))}
                  </View>
                )}

                {/* 2. Unified Artists Results */}
                {artists.length > 0 && (
                  <View style={styles.groupSection}>
                    <View style={styles.groupHeader}>
                      <User size={16} color={THEME.colors.accent} />
                      <Text style={styles.groupTitle}>Artists</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {artists.map((artist: any, idx: number) => (
                        <ArtistCard key={`artist-${artist.id || idx}`} artist={artist} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* 3. Unified Albums Results */}
                {albums.length > 0 && (
                  <View style={styles.groupSection}>
                    <View style={styles.groupHeader}>
                      <Disc size={16} color={THEME.colors.success} />
                      <Text style={styles.groupTitle}>Albums</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {albums.map((album: any, idx: number) => (
                        <AlbumCard key={`album-${album.id || idx}`} album={album} />
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })()}
        </ScrollView>
      </View>
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: THEME.colors.textPrimary,
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 110,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  recentSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
  },
  groupSection: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  externalSection: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 0, 0, 0.04)',
    borderColor: 'rgba(255, 0, 0, 0.18)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  externalHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  externalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  externalSectionNotice: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 10,
  },
  ytBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderColor: '#FF4D4D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ytBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF4D4D',
  },
});
