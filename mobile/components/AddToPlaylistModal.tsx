import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { X, Plus, Check, ListMusic } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { MobileApi } from '../services/api';
import { SongItem, usePlayerStore } from '../store/usePlayerStore';

interface AddToPlaylistModalProps {
  visible: boolean;
  song: SongItem | null;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  visible,
  song,
  onClose,
}) => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const loadPlaylists = async () => {
    if (!visible) return;
    setLoading(true);
    try {
      const res = await MobileApi.getPlaylists();
      setPlaylists(res.data || []);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setAddedIds([]);
      setShowCreate(false);
      setNewTitle('');
      loadPlaylists();
    }
  }, [visible, song?.id]);

  const handleAddToPlaylist = async (playlist: any) => {
    if (!song) return;
    setAddingId(playlist.id);
    try {
      await MobileApi.addSongToPlaylist(playlist.id, song.id);
      setAddedIds((prev) => [...prev, playlist.id]);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add song to playlist');
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim() || !song) return;
    setCreating(true);
    try {
      const res = await MobileApi.createPlaylist({ title: newTitle.trim() });
      const newPlaylist = res.data;
      if (newPlaylist?.id) {
        await MobileApi.addSongToPlaylist(newPlaylist.id, song.id);
        setAddedIds((prev) => [...prev, newPlaylist.id]);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        await loadPlaylists();
        setShowCreate(false);
        setNewTitle('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  if (!song) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add to Playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Song Summary Card */}
          <View style={styles.songCard}>
            <Image
              source={{
                uri:
                  song.artwork_url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80',
              }}
              style={styles.songArtwork}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {song.artist?.name || 'Artist'}
              </Text>
            </View>
          </View>

          {/* Create New Playlist Option */}
          {showCreate ? (
            <View style={styles.createBox}>
              <TextInput
                placeholder="Enter playlist name..."
                placeholderTextColor={THEME.colors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                style={styles.input}
                autoFocus
              />
              <View style={styles.createActions}>
                <TouchableOpacity
                  onPress={() => setShowCreate(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateAndAdd}
                  disabled={creating || !newTitle.trim()}
                  style={[styles.confirmBtn, !newTitle.trim() && { opacity: 0.5 }]}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Create & Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowCreate(true)}
              style={styles.newPlaylistBtn}
              activeOpacity={0.8}
            >
              <View style={styles.plusIconBox}>
                <Plus size={18} color="#000" />
              </View>
              <Text style={styles.newPlaylistText}>New Playlist</Text>
            </TouchableOpacity>
          )}

          {/* Playlists List */}
          <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              </View>
            ) : playlists.length === 0 ? (
              <View style={styles.emptyBox}>
                <ListMusic size={32} color={THEME.colors.textMuted} />
                <Text style={styles.emptyText}>No playlists created yet.</Text>
              </View>
            ) : (
              playlists.map((pl) => {
                const isAdded = addedIds.includes(pl.id);
                const isAdding = addingId === pl.id;

                return (
                  <TouchableOpacity
                    key={pl.id}
                    onPress={() => handleAddToPlaylist(pl)}
                    disabled={isAdding || isAdded}
                    style={[styles.playlistRow, isAdded && styles.playlistRowAdded]}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri:
                          pl.cover_url ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80',
                      }}
                      style={styles.plCover}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.plTitle} numberOfLines={1}>
                        {pl.title}
                      </Text>
                      <Text style={styles.plSubtitle}>
                        {pl.songs_count || 0} songs • {pl.visibility || 'PUBLIC'}
                      </Text>
                    </View>
                    {isAdding ? (
                      <ActivityIndicator size="small" color={THEME.colors.primary} />
                    ) : isAdded ? (
                      <View style={styles.addedBadge}>
                        <Check size={14} color="#000" />
                        <Text style={styles.addedText}>Added</Text>
                      </View>
                    ) : (
                      <Plus size={18} color={THEME.colors.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  songArtwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  songArtist: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
    gap: 12,
  },
  plusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlaylistText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  createBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
    color: THEME.colors.textPrimary,
    fontSize: 14,
    marginBottom: 10,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  playlistList: {
    maxHeight: 260,
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  playlistRowAdded: {
    opacity: 0.8,
  },
  plCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: THEME.colors.surfaceHover,
  },
  plTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  plSubtitle: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addedText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
});
