import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/theme';

import { Play } from 'lucide-react-native';

interface AlbumCardProps {
  album: {
    id?: number | string;
    external_id?: string;
    title: string;
    cover_url?: string | null;
    artwork_url?: string | null;
    artist?: { name: string } | string;
    release_year?: number;
    year?: number;
    genre?: string;
  };
  onPressPlay?: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPressPlay }) => {
  const router = useRouter();
  const albumId = album.id || album.external_id || '';
  const artistName = typeof album.artist === 'string' ? album.artist : (album.artist?.name || 'Zubeen Garg');
  const yearText = album.release_year || album.year;
  const coverImage =
    album.cover_url ||
    album.artwork_url ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (albumId) {
          router.push(`/album/${albumId}` as any);
        }
      }}
      style={styles.card}
    >
      <View style={styles.coverWrapper}>
        <Image
          source={{ uri: coverImage }}
          style={styles.cover}
        />
        {onPressPlay && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => {
              e.stopPropagation();
              onPressPlay();
            }}
            style={styles.playBadge}
          >
            <Play size={14} color="#000" fill="#000" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {artistName} {yearText ? `• ${yearText}` : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 135,
    marginRight: 14,
  },
  coverWrapper: {
    width: 135,
    height: 135,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceHover,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  artist: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
