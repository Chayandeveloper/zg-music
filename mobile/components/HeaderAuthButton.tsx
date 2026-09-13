import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, LogOut } from 'lucide-react-native';
import { THEME } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';

export const HeaderAuthButton: React.FC = () => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();

  if (isAuthenticated) {
    const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
    const isArtist = user?.role === 'ARTIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    return (
      <View style={styles.authContainer}>
        {/* Sleek User Profile Avatar */}
        <View style={[styles.avatarCircle, isArtist && styles.artistAvatar]}>
          <Text style={styles.avatarText}>{initial}</Text>
          {isArtist && <View style={styles.artistDot} />}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={() => logout()}
          style={styles.logoutBtn}
          accessibilityLabel="Sign Out"
          activeOpacity={0.7}
        >
          <LogOut size={16} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => openAuthModal()}
      style={styles.signInBtn}
      activeOpacity={0.8}
      accessibilityLabel="Sign In"
    >
      <User size={14} color="#000" />
      <Text style={styles.signInBtnText}>Sign In</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  authContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  artistAvatar: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  artistDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
    borderWidth: 1.5,
    borderColor: THEME.colors.background,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  signInBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
