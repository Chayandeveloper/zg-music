import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MiniPlayer } from '../components/MiniPlayer';
import { FullPlayerModal } from '../components/FullPlayerModal';
import { AuthModal } from '../components/AuthModal';
import { AddToPlaylistModal } from '../components/AddToPlaylistModal';
import { Audio } from 'expo-av';
import { useAuthStore } from '../store/useAuthStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { THEME } from '../constants/theme';

export default function RootLayout() {
  const { checkAuth, isAuthModalOpen, closeAuthModal, authModalMessage } = useAuthStore();
  const { songForPlaylist, closeAddToPlaylist } = usePlayerStore();

  useEffect(() => {
    checkAuth();
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);


  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="artist/[id]" />
        <Stack.Screen name="album/[id]" />
        <Stack.Screen name="song/[id]" />
        <Stack.Screen name="playlist/[id]" />
      </Stack>

      {/* Persistent Global Mini Player, Full Player Sheet, Auth Modal & Playlist Modal */}
      <MiniPlayer />
      <FullPlayerModal />
      <AuthModal
        visible={isAuthModalOpen}
        onClose={closeAuthModal}
        message={authModalMessage}
      />
      <AddToPlaylistModal
        visible={!!songForPlaylist}
        song={songForPlaylist}
        onClose={closeAddToPlaylist}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
