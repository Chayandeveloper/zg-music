# Zubeen Player

A production-ready music streaming ecosystem celebrating the iconic legacy of Zubeen Garg alongside diverse regional and international artists.

## Repository Layout

- **`mobile/`**: React Native & Expo cross-platform streaming app with global audio player, lyrics sheet, library management, and integrated **Zubeen Stage** artist portal.
- **`backend/`**: Laravel 11 REST API with Laravel Sanctum, Role-Based Access Control, Queue Workers, and Redis caching.
- **`admin/`**: React 18 + Vite + TypeScript dashboard for content approval, release review, artist KYC, and copyright moderation.
- **`media/`**: FFmpeg transcoding presets, scripts, and adaptive HLS pipeline generators.
- **`shared/`**: Common TypeScript contracts, constants, and domain types.
- **`docs/`**: Comprehensive guides covering API, Database, Media Pipeline, Deployment, and Security.

## Quick Start

### 1. Backend (Laravel API)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 2. Admin Dashboard (Vite + React)
```bash
cd admin
npm install
npm run dev
```

### 3. Mobile App (Expo)
```bash
cd mobile
npm install
npx expo start
```

### 4. Running with Docker Compose
```bash
docker-compose up -d --build
```
