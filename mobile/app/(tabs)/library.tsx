import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Heart, ListMusic, Plus, Clock, ChevronRight, Trash2, X } from 'lucide-react-native';
import { MobileApi } from '../../services/api';
import { SongListItem } from '../../components/SongListItem';
import { THEME } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { HeaderAuthButton } from '../../components/HeaderAuthButton';

export default function LibraryScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'liked' | 'playlists' | 'history'>('liked');
  const [likedSongs, setLikedSongs] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const extractItems = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedSongs([]);
      setPlaylists([]);
      setHistory([]);
      return;
    }

    try {
      if (activeTab === 'liked') {
        const res = await MobileApi.getLikedSongs();
        setLikedSongs(extractItems(res));
      } else if (activeTab === 'playlists') {
        const res = await MobileApi.getPlaylists();
        setPlaylists(extractItems(res));
      } else if (activeTab === 'history') {
        const res = await MobileApi.getHistory();
        setHistory(extractItems(res));
      }
    } catch (err) {
      console.error('Failed to load library data:', err);
    }
  }, [activeTab, isAuthenticated]);

  // Automatically refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return;
    try {
      await MobileApi.createPlaylist({ title: newTitle.trim() });
      setNewTitle('');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create playlist');
    }
  };

  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    setIsDeleting(true);
    try {
      await MobileApi.deletePlaylist(playlistToDelete.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistToDelete.id));
      setPlaylistToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete playlist');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.title}>Your Library</Text>
            {isAuthenticated && user && (
              <Text style={styles.userSubtitle} numberOfLines={1}>
                {user.name} • <Text style={{ color: THEME.colors.primary, fontWeight: '700' }}>{user.role}</Text>
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {activeTab === 'playlists' && isAuthenticated && (
              <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addBtn}>
                <Plus size={20} color="#000" />
              </TouchableOpacity>
            )}
            <HeaderAuthButton />
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('liked')}
            style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
          >
            <Heart
              size={16}
              color={activeTab === 'liked' ? THEME.colors.primary : THEME.colors.textMuted}
              fill={activeTab === 'liked' ? THEME.colors.primary : 'transparent'}
            />
            <Text style={[styles.tabText, activeTab === 'liked' && styles.tabTextActive]}>
              Liked {likedSongs.length > 0 ? `(${likedSongs.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('playlists')}
            style={[styles.tab, activeTab === 'playlists' && styles.tabActive]}
          >
            <ListMusic size={16} color={activeTab === 'playlists' ? THEME.colors.primary : THEME.colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'playlists' && styles.tabTextActive]}>
              Playlists {playlists.length > 0 ? `(${playlists.length})` : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          >
            <Clock size={16} color={activeTab === 'history' ? THEME.colors.primary : THEME.colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
          }
        >
          {activeTab === 'liked' && (
            <View>
              {likedSongs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Heart size={48} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyTitle}>Songs you like will appear here</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap the heart icon on any song, card, or full player to add it here
                  </Text>
                </View>
              ) : (
                likedSongs.map((song) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    queue={likedSongs}
                    onLikeChange={loadData}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === 'playlists' && (
            <View>
              {playlists.length === 0 ? (
                <View style={styles.emptyBox}>
                  <ListMusic size={48} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyTitle}>Create your first playlist</Text>
                  <Text style={styles.emptySubtitle}>
                    Organize your favorite Zubeen Garg tracks into personalized playlists
                  </Text>
                  {isAuthenticated && (
                    <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.createBtn}>
                      <Text style={styles.createBtnText}>Create Playlist</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                playlists.map((pl) => (
                  <View key={pl.id} style={styles.playlistRowContainer}>
                    <TouchableOpacity
                      onPress={() => router.push(`/playlist/${pl.id}` as any)}
                      style={styles.playlistRow}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{
                          uri:
                            pl.cover_url ||
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
                        }}
                        style={styles.plCover}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.plTitle} numberOfLines={1}>{pl.title}</Text>
                        <Text style={styles.plSubtitle}>{pl.songs_count || 0} songs • {pl.visibility || 'PUBLIC'}</Text>
                      </View>
                      <ChevronRight size={18} color={THEME.colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setPlaylistToDelete({ id: pl.id, title: pl.title })}
                      style={styles.deletePlBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel="Delete playlist"
                    >
                      <Trash2 size={16} color={THEME.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View>
              {history.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Clock size={48} color={THEME.colors.textMuted} />
                  <Text style={styles.emptyTitle}>No listening history yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Tracks you play will be recorded here
                  </Text>
                </View>
              ) : (
                history.map((h, i) => (
                  <SongListItem key={i} song={h.song || h} />
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Create Playlist Modal */}
        {showCreateModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Playlist</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={20} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Give your playlist a title"
                placeholderTextColor={THEME.colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                style={styles.modalInput}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={styles.modalCancel}
                >
                  <Text style={{ color: THEME.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreatePlaylist}
                  style={styles.modalConfirm}
                >
                  <Text style={{ color: '#000', fontWeight: '800' }}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Delete Playlist Confirmation Modal */}
        {playlistToDelete && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delete Playlist?</Text>
                <TouchableOpacity onPress={() => setPlaylistToDelete(null)}>
                  <X size={20} color={THEME.colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: THEME.colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
                Are you sure you want to delete &quot;{playlistToDelete.title}&quot;? All songs will be removed from this playlist. This action cannot be undone.
              </Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setPlaylistToDelete(null)}
                  style={styles.modalCancel}
                  disabled={isDeleting}
                >
                  <Text style={{ color: THEME.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmDeletePlaylist}
                  style={[styles.modalConfirm, { backgroundColor: '#EF4444' }]}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: THEME.colors.borderAccent,
  },
  tabText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 110,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 6,
  },
  createBtn: {
    marginTop: 20,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  playlistRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  deletePlBtn: {
    padding: 12,
    marginLeft: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plCover: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceHover,
  },
  plTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  plSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 12,
    color: THEME.colors.textPrimary,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalConfirm: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  userSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signInBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
