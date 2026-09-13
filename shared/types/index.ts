/**
 * Zubeen Player - Shared TypeScript Interfaces & Types
 */

import {
  UserRole,
  ArtistApplicationStatus,
  ReleaseStatus,
  AudioBitrate,
  ReportReason,
  ReportStatus,
} from '../constants';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  bio?: string | null;
  email_verified_at?: string | null;
  artist_id?: number | null;
  artist?: Artist | null;
  created_at: string;
  updated_at: string;
}

export interface Artist {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  biography?: string | null;
  genres: string[];
  languages: string[];
  website?: string | null;
  social_links?: Record<string, string> | null;
  verified: boolean;
  total_streams: number;
  monthly_listeners: number;
  followers_count: number;
  is_rising?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistApplication {
  id: number;
  user_id: number;
  artist_name: string;
  biography: string;
  profile_image_path?: string | null;
  banner_image_path?: string | null;
  genres: string[];
  languages: string[];
  social_links: Record<string, string>;
  website?: string | null;
  artist_information: string;
  rights_declaration: boolean;
  status: ArtistApplicationStatus;
  admin_notes?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  icon_name?: string | null;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}

export interface SongStory {
  id: number;
  song_id: number;
  movie?: string | null;
  release_year?: number | null;
  composer?: string | null;
  lyricist?: string | null;
  producer?: string | null;
  singer?: string | null;
  description?: string | null;
  story?: string | null;
}

export interface SyncedLyricLine {
  time_ms: number;
  text: string;
}

export interface Lyric {
  id: number;
  song_id: number;
  lyrics_text: string;
  language?: string | null;
  synced_data?: SyncedLyricLine[] | null;
}

export interface AudioVariant {
  id: number;
  song_id: number;
  bitrate: AudioBitrate;
  format: string;
  hls_playlist_url: string;
  duration_seconds: number;
  file_size: number;
}

export interface Song {
  id: number;
  title: string;
  slug: string;
  artist_id: number;
  artist?: Artist;
  album_id?: number | null;
  album?: Album | null;
  artwork_url?: string | null;
  duration_seconds: number;
  genre?: string | null;
  language?: string | null;
  stream_url?: string | null; // Progressive fallback or HLS master playlist URL
  hls_master_url?: string | null;
  play_count: number;
  like_count: number;
  is_liked?: boolean;
  track_number?: number | null;
  story?: SongStory | null;
  lyrics?: Lyric | null;
  variants?: AudioVariant[];
  status: 'PUBLISHED' | 'TAKEN_DOWN';
  created_at: string;
}

export interface Album {
  id: number;
  title: string;
  slug: string;
  artist_id: number;
  artist?: Artist;
  cover_url?: string | null;
  description?: string | null;
  genre?: string | null;
  language?: string | null;
  release_year: number;
  release_date?: string | null;
  songs_count?: number;
  songs?: Song[];
  is_liked?: boolean;
  status: 'PUBLISHED' | 'TAKEN_DOWN';
  created_at: string;
}

export interface Playlist {
  id: number;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  user_id: number;
  user?: User;
  visibility: 'PUBLIC' | 'PRIVATE';
  songs_count?: number;
  songs?: Song[];
  created_at: string;
  updated_at: string;
}

export interface Release {
  id: number;
  artist_id: number;
  artist?: Artist;
  title: string;
  release_type: 'SINGLE' | 'ALBUM' | 'EP';
  cover_image_path?: string | null;
  cover_image_url?: string | null;
  genre: string;
  language: string;
  composer?: string | null;
  lyricist?: string | null;
  producer?: string | null;
  release_date: string;
  description?: string | null;
  lyrics?: string | null;
  rights_declaration: boolean;
  rights_declared_at?: string | null;
  status: ReleaseStatus;
  admin_feedback?: string | null;
  songs?: Song[];
  created_at: string;
  updated_at: string;
}

export interface CopyrightReport {
  id: number;
  reporter_id: number;
  reporter?: User;
  song_id: number;
  song?: Song;
  reason: ReportReason;
  description: string;
  infringing_urls?: string[] | null;
  status: ReportStatus;
  admin_action?: string | null;
  admin_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface StreamEventPayload {
  song_id: number;
  duration_played_seconds: number;
  completed: boolean;
  bitrate_streamed?: AudioBitrate;
  client_timestamp: number;
}

export interface ArtistAnalyticsOverview {
  total_streams: number;
  monthly_listeners: number;
  followers: number;
  total_songs: number;
  total_albums: number;
  daily_trends: { date: string; streams: number; listeners: number }[];
  top_songs: Song[];
  top_albums: Album[];
}
