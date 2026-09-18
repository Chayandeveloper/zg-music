import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../store/usePlayerStore';
import { THEME } from '../constants/theme';

export const MiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const bottomOffset = 64 + bottomInset;

  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    playNext,
    openFullPlayer,
    toggleLikeCurrentSong,
    position,
    duration,
  } = usePlayerStore();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      {/* Progress Track at top edge of mini player */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openFullPlayer}
        style={styles.container}
      >
        {/* Artwork */}
        <Image
          source={{
            uri:
              currentSong.artwork_url ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80',
          }}
          style={styles.artwork}
        />

        {/* Title & Artist */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist?.name || 'Zubeefy'}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleLikeCurrentSong();
            }}
            style={styles.actionButton}
          >
            <Heart
              size={20}
              color={currentSong.is_liked ? THEME.colors.primary : THEME.colors.textMuted}
              fill={currentSong.is_liked ? THEME.colors.primary : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              togglePlayPause();
            }}
            style={styles.playButton}
            activeOpacity={0.7}
          >
            {isPlaying ? (
              <Pause size={20} color={THEME.colors.black} fill={THEME.colors.black} />
            ) : (
              <Play size={20} color={THEME.colors.black} fill={THEME.colors.black} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              playNext();
            }}
            style={styles.actionButton}
          >
            <SkipForward size={20} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 56, // Positioned immediately above standard bottom tab bar
    left: 8,
    right: 8,
    zIndex: 99,
  },
  progressBarBackground: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 22, 32, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceHover,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  artist: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});
