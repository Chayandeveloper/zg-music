# Zubeen Player - Deployment Guide

## Production Architecture

```
Internet / Mobile Apps / Web Clients
                │
                ▼
         [Cloudflare CDN]
         ├── Static Assets (Admin App, Images)
         └── HLS Streams (.m3u8 & .ts chunks)
                │
                ▼
      [Nginx Reverse Proxy]
         ├── /api/*      ──> PHP 8.3 FPM (Laravel)
         ├── /admin/*    ──> Vite React SPA
         └── /storage/*  ──> S3 / Object Storage (Read-Only)
```

## Running with Docker Compose

1. Clone repository:
   ```bash
   git clone <repo_url>
   cd ZUBEEN-PLAYER
   ```
2. Build and launch services:
   ```bash
   docker-compose up -d --build
   ```
3. Initialize database & seed demo catalog:
   ```bash
   docker-compose exec backend php artisan migrate --seed
   ```
4. Verify endpoints:
   - Backend API: `http://localhost:8000/api/v1/health`
   - Admin Portal: `http://localhost:3000`

## Production Environment Variables

### Backend (`backend/.env`)
```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.zubeenplayer.com

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=zubeen_player
DB_USERNAME=zubeen_admin
DB_PASSWORD=<secure_strong_password>

REDIS_HOST=redis
REDIS_PORT=6379
QUEUE_CONNECTION=redis

FILESYSTEM_DISK=s3
MEDIA_STORAGE_DISK=s3
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_DEFAULT_REGION=ap-south-1
AWS_BUCKET=zubeen-player-media
AWS_URL=https://cdn.zubeenplayer.com
```

### Admin Portal (`admin/.env`)
```ini
VITE_API_URL=https://api.zubeenplayer.com/api/v1
```

### Mobile App (`mobile/config/env.ts`)
```ts
export const ENV = {
  API_BASE_URL: 'https://api.zubeenplayer.com/api/v1',
  STORAGE_BASE_URL: 'https://cdn.zubeenplayer.com',
  APP_NAME: 'Zubeen Player',
};
```
