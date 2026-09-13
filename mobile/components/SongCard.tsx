import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { SongItem, usePlayerStore } from '../store/usePlayerStore';

interface SongCardProps {
  song: SongItem;
  playlistContext?: SongItem[];
}

export const SongCard: React.FC<SongCardProps> = ({ song, playlistContext }) => {
  const { playSong } = usePlayerStore();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => playSong(song, playlistContext)}
      style={styles.card}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri:
              song.artwork_url ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
          }}
          style={styles.artwork}
        />
        <View style={styles.playBadge}>
          <Play size={14} color={THEME.colors.black} fill={THEME.colors.black} />
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {song.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {song.artist?.name || 'Artist'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 14,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: THEME.colors.surfaceHover,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  artist: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
