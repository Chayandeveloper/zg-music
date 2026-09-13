import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  ListPlus,
  FileText,
  BookOpen,
  Sliders,
  X,
} from 'lucide-react-native';
import { usePlayerStore, PlaybackQuality } from '../store/usePlayerStore';
import { THEME } from '../constants/theme';
import { LyricsModal } from './LyricsModal';
import { SongStoryModal } from './SongStoryModal';

export const FullPlayerModal: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    shuffle,
    repeatMode,
    isFullPlayerVisible,
    playbackQuality,
    queue,
    queueIndex,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    toggleLikeCurrentSong,
    openAddToPlaylist,
    closeFullPlayer,
    setPlaybackQuality,
    playSong,
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  if (!currentSong) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleSeekTouch = (e: any) => {
    const { locationX } = e.nativeEvent;
    // Assume bar width ~ 320
    const percent = Math.max(0, Math.min(1, locationX / 320));
    seekTo(Math.floor(percent * duration));
  };

  const qualities: { id: PlaybackQuality; label: string; desc: string }[] = [
    { id: 'auto', label: 'Adaptive HLS', desc: 'Auto switches with network' },
    { id: '64k', label: '64 kbps', desc: 'Data Saver / Edge mobile' },
    { id: '128k', label: '128 kbps', desc: 'Standard streaming' },
    { id: '192k', label: '192 kbps', desc: 'High Definition' },
    { id: '320k', label: '320 kbps', desc: 'Studio Master Fidelity' },
  ];

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeFullPlayer}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closeFullPlayer} style={styles.headerIcon}>
            <ChevronDown size={28} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.playingFrom}>PLAYING FROM CATALOG</Text>
            <Text style={styles.albumName} numberOfLines={1}>
              {currentSong.album?.title || 'Zubeefy Masters'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowQualityMenu(!showQualityMenu)}
            style={styles.headerIcon}
          >
            <Sliders size={20} color={THEME.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quality Menu Popover */}
        {showQualityMenu && (
          <View style={styles.qualityPopover}>
            <Text style={styles.popoverHeader}>AUDIO STREAMING QUALITY</Text>
            {qualities.map((q) => (
              <TouchableOpacity
                key={q.id}
                onPress={() => {
                  setPlaybackQuality(q.id);
                  setShowQualityMenu(false);
                }}
                style={[
                  styles.qualityOption,
                  playbackQuality === q.id && styles.qualityOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.qualityOptionLabel,
                    playbackQuality === q.id && { color: THEME.colors.primary, fontWeight: '700' },
                  ]}
                >
                  {q.label}
                </Text>
                <Text style={styles.qualityOptionDesc}>{q.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Large Artwork */}
          <View style={styles.artworkContainer}>
            <Image
              source={{
                uri:
                  currentSong.artwork_url ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
              }}
              style={styles.largeArtwork}
            />
          </View>

          {/* Song Info & Actions */}
          <View style={styles.infoRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {currentSong.artist?.name || 'Zubeen Garg'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => openAddToPlaylist(currentSong)}
                style={styles.playerActionBtn}
                activeOpacity={0.7}
              >
                <ListPlus size={24} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleLikeCurrentSong}
                style={styles.likeButton}
                activeOpacity={0.7}
              >
                <Heart
                  size={26}
                  color={currentSong.is_liked ? THEME.colors.primary : THEME.colors.textMuted}
                  fill={currentSong.is_liked ? THEME.colors.primary : 'transparent'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seeker / Progress Bar */}
          <View style={styles.progressContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleSeekTouch}
              style={styles.progressBarBg}
            >
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              <View style={[styles.progressKnob, { left: `${progressPercent}%` }]} />
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Main Player Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={toggleShuffle} style={styles.controlIcon}>
              <Shuffle
                size={22}
                color={shuffle ? THEME.colors.primary : THEME.colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={playPrevious} style={styles.controlIcon}>
              <SkipBack size={28} color={THEME.colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={togglePlayPause} style={styles.mainPlayButton}>
              {isPlaying ? (
                <Pause size={30} color={THEME.colors.black} fill={THEME.colors.black} />
              ) : (
                <Play size={30} color={THEME.colors.black} fill={THEME.colors.black} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={playNext} style={styles.controlIcon}>
              <SkipForward size={28} color={THEME.colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat} style={styles.controlIcon}>
              {repeatMode === 'one' ? (
                <Repeat1 size={22} color={THEME.colors.primary} />
              ) : (
                <Repeat
                  size={22}
                  color={repeatMode === 'all' ? THEME.colors.primary : THEME.colors.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Action Tabs (Lyrics, Song Story, Queue) */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setShowLyrics(true)}
              style={styles.tabButton}
            >
              <FileText size={18} color={THEME.colors.primary} />
              <Text style={styles.tabText}>Lyrics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowStory(true)}
              style={styles.tabButton}
            >
              <BookOpen size={18} color={THEME.colors.accent} />
              <Text style={styles.tabText}>Story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQueue(!showQueue)}
              style={[styles.tabButton, showQueue && styles.tabButtonActive]}
            >
              <ListMusic size={18} color={THEME.colors.textPrimary} />
              <Text style={styles.tabText}>Queue ({queue.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Integrated Queue Drawer */}
          {showQueue && (
            <View style={styles.queueContainer}>
              <Text style={styles.queueHeader}>UP NEXT</Text>
              {queue.map((song, i) => (
                <TouchableOpacity
                  key={`${song.id}-${i}`}
                  onPress={() => playSong(song, queue)}
                  style={[
                    styles.queueItem,
                    i === queueIndex && styles.queueItemActive,
                  ]}
                >
                  <Text style={[styles.queueNumber, i === queueIndex && { color: THEME.colors.primary }]}>
                    {i + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.queueTitle, i === queueIndex && { color: THEME.colors.primary }]}
                      numberOfLines={1}
                    >
                      {song.title}
                    </Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>
                      {song.artist?.name || 'Artist'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Lyrics Modal */}
        <LyricsModal
          visible={showLyrics}
          onClose={() => setShowLyrics(false)}
          lyricsText={currentSong.lyrics?.lyrics_text}
          syncedData={currentSong.lyrics?.synced_data}
          currentPositionMs={position * 1000}
        />

        {/* Song Story Modal */}
        <SongStoryModal
          visible={showStory}
          onClose={() => setShowStory(false)}
          song={currentSong}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIcon: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  playingFrom: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  albumName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  artworkContainer: {
    marginTop: 20,
    width: 320,
    height: 320,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  largeArtwork: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: THEME.colors.surfaceHover,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 28,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  artistName: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  likeButton: {
    padding: 8,
  },
  playerActionBtn: {
    padding: 8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 24,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 2,
  },
  progressKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.colors.primary,
    position: 'absolute',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 12,
  },
  controlIcon: {
    padding: 8,
  },
  mainPlayButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 28,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: THEME.colors.borderAccent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  queueContainer: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  queueHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  queueItemActive: {
    backgroundColor: 'rgba(234,179,8,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  queueNumber: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    width: 24,
    fontWeight: '700',
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  queueArtist: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  qualityPopover: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 240,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.borderAccent,
    padding: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  popoverHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  qualityOption: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityOptionSelected: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  qualityOptionLabel: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  qualityOptionDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
