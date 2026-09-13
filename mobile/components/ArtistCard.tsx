import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle2, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/theme';

interface ArtistCardProps {
  artist: {
    id: number;
    name: string;
    profile_image_url?: string | null;
    verified?: boolean;
    is_rising?: boolean;
    monthly_listeners?: number;
  };
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push(`/artist/${artist.id}` as any)}
      style={styles.card}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri:
              artist.profile_image_url ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
          }}
          style={styles.avatar}
        />
        {artist.is_rising && (
          <View style={styles.risingBadge}>
            <TrendingUp size={10} color="#000" />
            <Text style={styles.risingText}>RISING</Text>
          </View>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {artist.name}
        </Text>
        {artist.verified && <CheckCircle2 size={13} color={THEME.colors.primary} fill={THEME.colors.primary} />}
      </View>

      <Text style={styles.listeners}>
        {artist.monthly_listeners ? `${(artist.monthly_listeners / 1000).toFixed(0)}k listeners` : 'Artist'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 120,
    marginRight: 16,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    position: 'relative',
    backgroundColor: THEME.colors.surfaceHover,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  risingBadge: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  risingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  listeners: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
