/**
 * Zubeen Player - Shared Constants & Domain Enums
 */

export const USER_ROLES = {
  LISTENER: 'LISTENER',
  ARTIST: 'ARTIST',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ARTIST_APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
} as const;

export type ArtistApplicationStatus =
  (typeof ARTIST_APPLICATION_STATUS)[keyof typeof ARTIST_APPLICATION_STATUS];

export const RELEASE_STATUS = {
  DRAFT: 'DRAFT',
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  READY_FOR_REVIEW: 'READY_FOR_REVIEW',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED',
  TAKEDOWN_REQUESTED: 'TAKEDOWN_REQUESTED',
  TAKEN_DOWN: 'TAKEN_DOWN',
} as const;

export type ReleaseStatus = (typeof RELEASE_STATUS)[keyof typeof RELEASE_STATUS];

export const AUDIO_BITRATES = {
  LOW: '64k',
  STANDARD: '128k',
  HIGH: '192k',
  ULTRA: '320k',
} as const;

export type AudioBitrate = (typeof AUDIO_BITRATES)[keyof typeof AUDIO_BITRATES];

export const SUPPORTED_AUDIO_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/x-m4a'] as const;

export const REPORT_REASONS = {
  COPYRIGHT: 'COPYRIGHT',
  UNAUTHORIZED_UPLOAD: 'UNAUTHORIZED_UPLOAD',
  IMPERSONATION: 'IMPERSONATION',
  OTHER: 'OTHER',
} as const;

export type ReportReason = (typeof REPORT_REASONS)[keyof typeof REPORT_REASONS];

export const REPORT_STATUS = {
  PENDING: 'PENDING',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const STREAM_QUALIFYING_SECONDS = 30; // Minimum listening seconds for a qualified play count

export const BRAND = {
  NAME: 'Zubeen Player',
  STAGE_NAME: 'Zubeen Stage',
  TAGLINE: 'Soul of Assamese & Global Music',
  COLORS: {
    BACKGROUND: '#090B10',
    CARD_BG: '#121620',
    CARD_BORDER: '#1F2637',
    PRIMARY: '#EAB308', // Warm Amber Gold
    PRIMARY_HOVER: '#FACC15',
    ACCENT: '#8B5CF6', // Electric Violet
    SUCCESS: '#10B981',
    DANGER: '#EF4444',
    WARNING: '#F59E0B',
    TEXT_PRIMARY: '#F8FAFC',
    TEXT_SECONDARY: '#94A3B8',
    TEXT_MUTED: '#64748B',
  },
};
