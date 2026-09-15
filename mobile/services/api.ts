import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

const TOKEN_KEY = '@zubeen_auth_token';

export class MobileApi {
  public static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public static async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  public static async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  public static async sendOtp(phone: string, type?: 'login' | 'register') {
    return this.request<{ message: string; phone: string; expires_in: number; debug_otp?: string }>(
      '/auth/send-otp',
      { method: 'POST', body: JSON.stringify({ phone, type }) }
    );
  }

  public static async verifyOtp(data: { phone: string; otp: string; name?: string }) {
    return this.request<{ data: { user: any; token: string }; message: string }>(
      '/auth/verify-otp',
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  public static async register(data: any) {
    return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  public static async login(credentials: { email: string; password: string }) {
    return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  public static async getMe() {
    return this.request<any>('/auth/me');
  }

  public static async logout() {
    return this.request<any>('/auth/logout', { method: 'POST' });
  }

  // Catalog
  public static async getHomeFeed() {
    return this.request<any>('/home');
  }

  public static async search(query: string) {
    return this.request<any>(`/search?q=${encodeURIComponent(query)}`);
  }

  // External Music Discovery (ytmusicapi via Laravel API)
  public static async searchExternal(query: string, filter?: string) {
    const filterParam = filter ? `&filter=${encodeURIComponent(filter)}` : '';
    return this.request<any>(`/external/search?q=${encodeURIComponent(query)}${filterParam}`);
  }

  public static async getExternalSong(id: string) {
    return this.request<any>(`/external/songs/${encodeURIComponent(id)}`);
  }

  public static async getExternalArtist(id: string) {
    return this.request<any>(`/external/artists/${encodeURIComponent(id)}`);
  }

  public static async getExternalAlbum(id: string) {
    return this.request<any>(`/external/albums/${encodeURIComponent(id)}`);
  }

  public static async getExternalPlaylist(id: string) {
    return this.request<any>(`/external/playlists/${encodeURIComponent(id)}`);
  }

  public static async getExternalStream(videoId: string) {
    return this.request<{ status: string; data: { videoId: string; streamUrl: string; title?: string; duration?: number; ext?: string; thumbnail?: string } }>(
      `/external/stream/${encodeURIComponent(videoId)}`
    );
  }

  public static async getSongs(page: number = 1) {
    return this.request<any>(`/songs?page=${page}`);
  }

  public static async getSongDetail(id: number) {
    return this.request<any>(`/songs/${id}`);
  }

  public static async getArtists(rising?: boolean) {
    const q = rising ? '?rising=1' : '';
    return this.request<any>(`/artists${q}`);
  }

  public static async getArtistDetail(id: number) {
    return this.request<any>(`/artists/${id}`);
  }

  public static async getAlbumDetail(id: number | string) {
    return this.request<any>(`/albums/${id}`);
  }

  // Social & Library
  public static async toggleLike(songId: number | string) {
    return this.request<any>(`/songs/${songId}/like`, { method: 'POST' });
  }

  public static async getLikedSongs() {
    return this.request<any>('/library/liked-songs');
  }

  public static async toggleFollow(artistId: number) {
    return this.request<any>(`/artists/${artistId}/follow`, { method: 'POST' });
  }

  public static async getFollowedArtists() {
    return this.request<any>('/library/followed-artists');
  }

  public static async getPlaylists() {
    return this.request<any>('/playlists');
  }

  public static async getPlaylistDetail(playlistId: number) {
    return this.request<any>(`/playlists/${playlistId}`);
  }

  public static async createPlaylist(data: { title: string; visibility?: string }) {
    return this.request<any>('/playlists', { method: 'POST', body: JSON.stringify(data) });
  }

  public static async deletePlaylist(playlistId: number) {
    return this.request<any>(`/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  }

  public static async addSongToPlaylist(playlistId: number, songId: number | string) {
    return this.request<any>(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ song_id: songId }),
    });
  }

  public static async removeSongFromPlaylist(playlistId: number, songId: number | string) {
    return this.request<any>(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    });
  }

  public static async getHistory() {
    return this.request<any>('/library/history');
  }

  // Audio Playback Tracking
  public static async trackEvent(data: { song_id: number; duration_played_seconds: number; completed?: boolean; bitrate_streamed?: string }) {
    return this.request<any>('/player/track-event', { method: 'POST', body: JSON.stringify(data) });
  }

  // Zubeen Stage (Artist Publishing)
  public static async getArtistApplicationStatus() {
    return this.request<any>('/artist/application-status');
  }

  public static async applyToStage(data: any) {
    return this.request<any>('/artist/apply', { method: 'POST', body: JSON.stringify(data) });
  }

  public static async getStageDashboard() {
    return this.request<any>('/artist/dashboard');
  }

  public static async getStageReleases() {
    return this.request<any>('/artist/releases');
  }

  public static async uploadAudio(file: { uri: string; name: string; type?: string }) {
    const token = await this.getToken();
    const formData = new FormData();

    if (typeof window !== 'undefined' && (window as any).document && (file.uri.startsWith('blob:') || file.uri.startsWith('data:'))) {
      const resp = await fetch(file.uri);
      const blob = await resp.blob();
      formData.append('audio_file', blob, file.name);
    } else {
      formData.append('audio_file', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'audio/mpeg',
      } as any);
    }

    const res = await fetch(`${ENV.API_BASE_URL}/artist/uploads/audio`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to upload audio file.');
    }

    return res.json();
  }

  public static async submitRelease(data: any) {
    return this.request<any>('/artist/releases', { method: 'POST', body: JSON.stringify(data) });
  }
}
