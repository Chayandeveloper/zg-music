import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { X } from 'lucide-react-native';
import { THEME } from '../constants/theme';

interface LyricsModalProps {
  visible: boolean;
  onClose: () => void;
  lyricsText?: string | null;
  syncedData?: { time_ms: number; text: string }[] | null;
  currentPositionMs: number;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  visible,
  onClose,
  lyricsText,
  syncedData,
  currentPositionMs,
}) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LYRICS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {syncedData && syncedData.length > 0 ? (
            <View style={{ gap: 16 }}>
              {syncedData.map((line, idx) => {
                const isActive =
                  currentPositionMs >= line.time_ms &&
                  (idx === syncedData.length - 1 || currentPositionMs < syncedData[idx + 1].time_ms);
                return (
                  <Text
                    key={idx}
                    style={[
                      styles.syncedLine,
                      isActive && styles.syncedLineActive,
                    ]}
                  >
                    {line.text}
                  </Text>
                );
              })}
            </View>
          ) : lyricsText ? (
            <Text style={styles.plainLyrics}>{lyricsText}</Text>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Lyrics not yet available for this release.</Text>
            </View>
          )}
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
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: 28,
  },
  syncedLine: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    lineHeight: 32,
  },
  syncedLineActive: {
    color: THEME.colors.primary,
    transform: [{ scale: 1.05 }],
  },
  plainLyrics: {
    fontSize: 17,
    lineHeight: 28,
    color: THEME.colors.textPrimary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
});
