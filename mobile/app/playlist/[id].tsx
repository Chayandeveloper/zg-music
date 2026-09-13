import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, Shuffle, ListMusic, Trash2, X } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongListItem } from '../../components/SongListItem';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';
import { THEME } from '../../constants/theme';
import { usePlayerStore } from '../../store/usePlayerStore';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playSong } = usePlayerStore();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [songToRemove, setSongToRemove] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await MobileApi.getPlaylistDetail(Number(id));
      setPlaylist(res.data);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchPlaylist();
    }
  }, [id, fetchPlaylist]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlaylist();
  };

  const confirmDeletePlaylist = async () => {
    setDeleting(true);
    try {
      await MobileApi.deletePlaylist(Number(id));
      setShowDeleteModal(false);
      router.back();
    } catch (err: any) {
      alert(err.message || 'Failed to delete playlist');
    } finally {
      setDeleting(false);
    }
  };

  const confirmRemoveSong = async () => {
    if (!songToRemove) return;
    setDeleting(true);
    try {
      await MobileApi.removeSongFromPlaylist(Number(id), songToRemove.id);
      setPlaylist((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          songs_count: Math.max(0, (prev.songs_count || 1) - 1),
          songs: (prev.songs || []).filter((s: any) => s.id !== songToRemove.id),
        };
      });
      setSongToRemove(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove song');
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !playlist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const songs = playlist.songs || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
      >
        <View style={styles.topNavRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setShowDeleteModal(true)}
              style={styles.deleteHeaderBtn}
              accessibilityLabel="Delete playlist"
            >
              <Trash2 size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
            <HeaderAuthButton />
          </View>
        </View>

        {/* Playlist Header */}
        <View style={styles.header}>
          <Image
            source={{
              uri:
                playlist.cover_url ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.cover}
          />
          <Text style={styles.title}>{playlist.title}</Text>
          {playlist.description ? (
            <Text style={styles.description}>{playlist.description}</Text>
          ) : null}
          <Text style={styles.meta}>
            {songs.length} {songs.length === 1 ? 'song' : 'songs'} • {playlist.visibility || 'PUBLIC'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {songs.length > 0 && (
              <>
                <TouchableOpacity
                  onPress={() => playSong(songs[0], songs)}
                  style={styles.playBtn}
                  activeOpacity={0.8}
                >
                  <Play size={20} color="#000" fill="#000" />
                  <Text style={styles.playText}>Play All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const shuffled = [...songs].sort(() => Math.random() - 0.5);
                    playSong(shuffled[0], shuffled);
                  }}
                  style={styles.shuffleBtn}
                  activeOpacity={0.8}
                >
                  <Shuffle size={18} color="#FFF" />
                  <Text style={styles.shuffleText}>Shuffle</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Songs List */}
        <View style={styles.trackList}>
          <Text style={styles.sectionHeader}>Tracks</Text>
          {songs.length === 0 ? (
            <View style={styles.emptyBox}>
              <ListMusic size={40} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
              <Text style={styles.emptySubtitle}>
                Add songs by tapping the three dots menu on any song
              </Text>
            </View>
          ) : (
            songs.map((song: any, index: number) => (
              <View key={song.id} style={styles.songRowWrapper}>
                <View style={{ flex: 1 }}>
                  <SongListItem song={song} queue={songs} />
                </View>
                <TouchableOpacity
                  onPress={() => setSongToRemove({ id: song.id, title: song.title })}
                  style={styles.removeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Remove ${song.title}`}
                >
                  <Trash2 size={16} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Delete Playlist Modal */}
      {showDeleteModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Playlist?</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <X size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to delete &quot;{playlist?.title}&quot;? This action cannot be undone.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.modalCancel}
                disabled={deleting}
              >
                <Text style={{ color: THEME.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeletePlaylist}
                style={[styles.modalConfirm, { backgroundColor: '#EF4444' }]}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Remove Song Modal */}
      {songToRemove && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Song?</Text>
              <TouchableOpacity onPress={() => setSongToRemove(null)}>
                <X size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Remove &quot;{songToRemove.title}&quot; from this playlist?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setSongToRemove(null)}
                style={styles.modalCancel}
                disabled={deleting}
              >
                <Text style={{ color: THEME.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRemoveSong}
                style={[styles.modalConfirm, { backgroundColor: '#EF4444' }]}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  cover: {
    width: 180,
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: THEME.colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  meta: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  playText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  shuffleText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  trackList: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  songRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeBtn: {
    padding: 10,
    marginLeft: 4,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    width: '85%',
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.borderAccent,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalMessage: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalConfirm: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
});
