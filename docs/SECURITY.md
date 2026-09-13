# Zubeen Player - Security & Content Integrity Policy

## 1. Authentication & Session Security
- **Bearer Token Strategy**: API operates over Laravel Sanctum with cryptographically secure personal access tokens.
- **Hashed Credentials**: Passwords strictly hashed using Bcrypt (cost factor 12). Plaintext passwords are never accepted, stored, or logged.
- **Role Isolation**:
  - `LISTENER`: Standard playback, playlists, likes, follows.
  - `ARTIST`: Zubeen Stage release submission, analytics access.
  - `ADMIN`: Content moderation, release approval, application review, copyright takedown.
  - `SUPER_ADMIN`: Complete system oversight, staff provisioning.

## 2. Ingestion & Audio Upload Security
- **MIME Verification**: Deep binary magic number inspection using PHP `finfo_file` (not client extensions).
- **Disk Isolation**: Master recordings are held in private non-public directories (`storage/app/masters/`) with unique UUID nonces.
- **Size Limits**: Enforced 100MB max per audio track and 5MB per artwork image.
- **Mandatory Rights Attestation**: Releases cannot be submitted without an explicit recorded rights declaration timestamp.

## 3. Media Delivery Security & CDN
- **HLS Segments**: Public playback URLs reference segmented `.m3u8` playlists and `.ts` chunk files.
- **Credential Protection**: Object storage keys, database passwords, and Sanctum tokens are strictly excluded from client bundles and logs.

## 4. Content Moderation & DMCA/Copyright Resolution
- **In-App Reporting**: Immediate reporting triage for copyright infringements, impersonations, and unauthorized uploads.
- **Immediate Takedown**: Admins can unpublish and take down tracks with an immutable audit log trail (`audit_logs`).
