import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/theme';

interface AlbumCardProps {
  album: {
    id: number;
    title: string;
    cover_url?: string | null;
    artist?: { name: string };
    release_year?: number;
    genre?: string;
  };
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/album/${album.id}` as any)}
      style={styles.card}
    >
      <Image
        source={{
          uri:
            album.cover_url ||
            'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80',
        }}
        style={styles.cover}
      />
      <Text style={styles.title} numberOfLines={1}>
        {album.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {album.artist?.name || 'Artist'} {album.release_year ? `• ${album.release_year}` : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 135,
    marginRight: 14,
  },
  cover: {
    width: 135,
    height: 135,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceHover,
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
