export interface User {
  id: number;
  name: string;
  email: string;
  role: 'LISTENER' | 'ARTIST' | 'ADMIN' | 'SUPER_ADMIN';
  avatar_url?: string | null;
  bio?: string | null;
  artist?: Artist | null;
  created_at: string;
}

export interface Artist {
  id: number;
  name: string;
  slug: string;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  biography?: string | null;
  genres: string[];
  languages: string[];
  verified: boolean;
  total_streams: number;
  monthly_listeners: number;
  followers_count: number;
  is_rising?: boolean;
}

export interface ArtistApplication {
  id: number;
  user_id: number;
  user?: User;
  artist_name: string;
  biography: string;
  profile_image_path?: string | null;
  banner_image_path?: string | null;
  genres: string[];
  languages: string[];
  social_links?: Record<string, string>;
  website?: string | null;
  artist_information: string;
  rights_declaration: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  admin_notes?: string | null;
  created_at: string;
}

export interface Song {
  id: number;
  artist_id: number;
  artist?: Artist;
  album_id?: number | null;
  album?: { id: number; title: string };
  title: string;
  artwork_url?: string | null;
  duration_seconds: number;
  genre?: string | null;
  language?: string | null;
  stream_url?: string | null;
  hls_master_url?: string | null;
  play_count: number;
  like_count: number;
  status: 'PUBLISHED' | 'TAKEN_DOWN';
  created_at: string;
}

export interface ReleaseSong {
  id: number;
  song_id?: number | null;
  song?: Song;
  title: string;
  original_master_path: string;
  duration_seconds: number;
  track_number: number;
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_log?: string | null;
}

export interface Release {
  id: number;
  artist_id: number;
  artist?: Artist;
  title: string;
  release_type: 'SINGLE' | 'ALBUM' | 'EP';
  cover_image_path?: string | null;
  genre: string;
  language: string;
  composer?: string | null;
  lyricist?: string | null;
  producer?: string | null;
  release_date: string;
  description?: string | null;
  lyrics?: string | null;
  rights_declaration: boolean;
  status: 'DRAFT' | 'UPLOADING' | 'PROCESSING' | 'READY_FOR_REVIEW' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'TAKEN_DOWN';
  admin_feedback?: string | null;
  release_songs?: ReleaseSong[];
  created_at: string;
}

export interface CopyrightReport {
  id: number;
  reporter_id: number;
  reporter?: User;
  song_id: number;
  song?: Song;
  reason: string;
  description: string;
  status: 'PENDING' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
  admin_action?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user?: User;
  action: string;
  auditable_type?: string | null;
  auditable_id?: number | null;
  new_values?: any;
  ip_address?: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_artists: number;
  total_songs: number;
  total_albums: number;
  total_streams: number;
  pending_applications: number;
  pending_releases: number;
  pending_reports: number;
}
