import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  MoreVertical,
  Heart,
  Plus,
  ListPlus,
  Radio,
  Share2,
  Music,
  Check,
  Disc,
  User,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { THEME } from '../constants/theme';
import { SongItem, usePlayerStore } from '../store/usePlayerStore';

interface SongListItemProps {
  song: SongItem;
  index?: number;
  playlistContext?: SongItem[];
  queue?: SongItem[];
  onLikeChanged?: (songId: number | string, isLiked: boolean) => void;
  onLikeChange?: () => void;
}

export const SongListItem: React.FC<SongListItemProps> = ({
  song,
  index,
  playlistContext,
  queue,
  onLikeChanged,
  onLikeChange,
}) => {
  const router = useRouter();
  const { currentSong, isPlaying, loading, playSong, toggleLikeSong, isSongLiked, openAddToPlaylist } = usePlayerStore();
  const isCurrent = Boolean(
    currentSong &&
      ((currentSong.id && song.id && String(currentSong.id) === String(song.id)) ||
        (currentSong.external_id && song.external_id && currentSong.external_id === song.external_id))
  );
  const isThisLoading = isCurrent && loading;
  const likedInStore = isSongLiked(song.id) || (song.external_id ? isSongLiked(song.external_id) : false);
  const isLiked = isCurrent && currentSong
    ? currentSong.is_liked !== undefined
      ? !!currentSong.is_liked
      : likedInStore
    : likedInStore || !!song.is_liked;

  const [showOptions, setShowOptions] = useState(false);

  const handleToggleLike = async () => {
    const success = await toggleLikeSong(song);
    onLikeChanged?.(song.id, success);
    onLikeChange?.();
  };

  const effectiveQueue = playlistContext || queue;

  const handleItemPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    playSong(song, effectiveQueue);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleItemPress}
        style={[styles.container, isCurrent && styles.containerActive]}
      >
        {index !== undefined && (
          <Text style={[styles.indexText, isCurrent && { color: THEME.colors.primary }]}>
            {index + 1}
          </Text>
        )}

        <Image
          source={{
            uri:
              song.artwork_url ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80',
          }}
          style={styles.artwork}
        />

        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrent && { color: THEME.colors.primary }]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {song.artist?.name || 'Artist'} {song.album?.title ? `• ${song.album.title}` : ''}
          </Text>
        </View>

        {isThisLoading ? (
          <ActivityIndicator size={16} color={THEME.colors.primary} style={{ marginRight: 12 }} />
        ) : (
          <Text style={[styles.duration, isCurrent && { color: THEME.colors.primary }]}>
            {Math.floor(song.duration_seconds / 60)}:
            {String(song.duration_seconds % 60).padStart(2, '0')}
          </Text>
        )}

        {/* Quick Like Button */}
        <TouchableOpacity
          onPress={handleToggleLike}
          style={styles.actionBtn}
          accessibilityLabel="Like Song"
        >
          <Heart
            size={18}
            color={isLiked ? THEME.colors.primary : THEME.colors.textMuted}
            fill={isLiked ? THEME.colors.primary : 'transparent'}
          />
        </TouchableOpacity>

        {/* 3-Dots Options Menu */}
        <TouchableOpacity
          onPress={() => setShowOptions(true)}
          style={styles.actionBtn}
          accessibilityLabel="Song Options"
        >
          <MoreVertical size={18} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Song Options Bottom Sheet */}
      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Header info */}
            <View style={styles.sheetHeader}>
              <Image
                source={{
                  uri:
                    song.artwork_url ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80',
                }}
                style={styles.sheetArtwork}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.sheetArtist} numberOfLines={1}>
                  {song.artist?.name || 'Artist'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowOptions(false)} style={styles.closeBtn}>
                <X size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Actions List */}
            <View style={styles.optionsList}>
              <TouchableOpacity
                onPress={() => {
                  setShowOptions(false);
                  openAddToPlaylist(song);
                }}
                style={styles.optionRow}
              >
                <View style={styles.optionIconBox}>
                  <ListPlus size={20} color={THEME.colors.primary} />
                </View>
                <Text style={styles.optionText}>Add to Playlist</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  handleToggleLike();
                  setShowOptions(false);
                }}
                style={styles.optionRow}
              >
                <View style={styles.optionIconBox}>
                  <Heart
                    size={20}
                    color={isLiked ? THEME.colors.primary : THEME.colors.textPrimary}
                    fill={isLiked ? THEME.colors.primary : 'transparent'}
                  />
                </View>
                <Text style={styles.optionText}>
                  {isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowOptions(false);
                  router.push(`/song/${song.id}`);
                }}
                style={styles.optionRow}
              >
                <View style={styles.optionIconBox}>
                  <Music size={20} color={THEME.colors.textPrimary} />
                </View>
                <Text style={styles.optionText}>Song Details & Lyrics</Text>
              </TouchableOpacity>

              {song.artist?.id && (
                <TouchableOpacity
                  onPress={() => {
                    setShowOptions(false);
                    router.push(`/artist/${song.artist?.id}`);
                  }}
                  style={styles.optionRow}
                >
                  <View style={styles.optionIconBox}>
                    <User size={20} color={THEME.colors.textPrimary} />
                  </View>
                  <Text style={styles.optionText}>View Artist Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  containerActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  indexText: {
    width: 26,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceHover,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  duration: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginRight: 6,
  },
  actionBtn: {
    padding: 6,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  sheetArtwork: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  sheetArtist: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  optionsList: {
    paddingTop: 6,
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 14,
  },
  optionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  externalBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderColor: 'rgba(255, 0, 0, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  externalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF4D4D',
    letterSpacing: 0.2,
  },
});
