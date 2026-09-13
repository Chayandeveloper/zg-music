import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { X, Film, Calendar, User, Mic2, Music2 } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { SongItem } from '../store/usePlayerStore';

interface SongStoryModalProps {
  visible: boolean;
  onClose: () => void;
  song: SongItem;
}

export const SongStoryModal: React.FC<SongStoryModalProps> = ({ visible, onClose, song }) => {
  const story = song.story;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SONG STORY & CREDITS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{song.title}</Text>
          <Text style={styles.artist}>{song.artist?.name || 'Zubeen Garg'}</Text>

          {/* Credits Grid */}
          <View style={styles.creditsBox}>
            {story?.movie && (
              <View style={styles.creditItem}>
                <Film size={16} color={THEME.colors.primary} />
                <Text style={styles.creditLabel}>Motion Picture:</Text>
                <Text style={styles.creditValue}>{story.movie}</Text>
              </View>
            )}

            {story?.release_year && (
              <View style={styles.creditItem}>
                <Calendar size={16} color={THEME.colors.accent} />
                <Text style={styles.creditLabel}>Year:</Text>
                <Text style={styles.creditValue}>{story.release_year}</Text>
              </View>
            )}

            {story?.composer && (
              <View style={styles.creditItem}>
                <Music2 size={16} color={THEME.colors.primary} />
                <Text style={styles.creditLabel}>Composer:</Text>
                <Text style={styles.creditValue}>{story.composer}</Text>
              </View>
            )}

            {story?.lyricist && (
              <View style={styles.creditItem}>
                <User size={16} color={THEME.colors.textSecondary} />
                <Text style={styles.creditLabel}>Lyricist:</Text>
                <Text style={styles.creditValue}>{story.lyricist}</Text>
              </View>
            )}

            {story?.singer && (
              <View style={styles.creditItem}>
                <Mic2 size={16} color={THEME.colors.accent} />
                <Text style={styles.creditLabel}>Singer:</Text>
                <Text style={styles.creditValue}>{story.singer}</Text>
              </View>
            )}
          </View>

          {/* Behind the Scenes Narrative */}
          <View style={styles.narrativeSection}>
            <Text style={styles.sectionHeader}>ABOUT THIS SONG</Text>
            <Text style={styles.narrativeText}>
              {story?.story ||
                story?.description ||
                'Recorded as part of the golden era of Assamese and Bollywood musical milestones, celebrating lyrical poetry and expressive instrumentation.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.accent,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  artist: {
    fontSize: 15,
    color: THEME.colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  creditsBox: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  creditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    width: 100,
  },
  creditValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  narrativeSection: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  narrativeText: {
    fontSize: 15,
    lineHeight: 24,
    color: THEME.colors.textSecondary,
  },
});
