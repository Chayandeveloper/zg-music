# Production Server Setup Guide (Post-OAuth & Performance Update)

This guide covers **exactly what you need to do on your existing production server** to apply the latest audio streaming fixes, eliminate login/cookie dependencies, and build the production mobile app.

---

## Key Changes in This Update
* **No OAuth / Sign-in required:** YouTube rejects OAuth Bearer tokens with HTTP 400 errors.
* **No Browser Cookies required:** No need to export or sync Chrome cookies.
* **Node.js installed on server:** `yt-dlp` uses Node.js to solve YouTube's JavaScript stream decryption challenges in ~1.5s.
* **Fast Android Client + Disk Cache:** Music streams are resolved rapidly and cached permanently.

---

## Step 1: Install Node.js on Your Server (CRITICAL)

On Linux servers, `yt-dlp` requires a JavaScript runtime (Node.js) to decrypt YouTube audio stream URLs without getting blocked.

Run this on your server terminal:
```bash
sudo apt update
sudo apt install -y nodejs

# Verify Node.js is installed
node -v
```
*(Should output `v18.x`, `v20.x`, or higher).*

---

## Step 2: Upload Updated Backend Files to Server

Copy the updated files from your local project to your server:

| Local File | Server Destination Path |
|---|---|
| `backend/services/youtube-music/app/services/stream_service.py` | `/var/www/zubeen-player/backend/services/youtube-music/app/services/stream_service.py` |
| `backend/services/youtube-music/.env` | `/var/www/zubeen-player/backend/services/youtube-music/.env` |
| `backend/services/youtube-music/requirements.txt` | `/var/www/zubeen-player/backend/services/youtube-music/requirements.txt` |

*(If your project path on the server is different, replace `/var/www/zubeen-player` with your actual directory).*

---

## Step 3: Clean Up Python Virtual Environment

SSH into your server and make sure the broken OAuth plugin is removed, and `yt-dlp` is up to date:

```bash
cd /var/www/zubeen-player/backend/services/youtube-music

# Activate your virtual environment
source .venv/bin/activate

# Uninstall the broken oauth plugin if it was installed
pip uninstall -y yt-dlp-youtube-oauth2

# Ensure latest yt-dlp version
pip install --upgrade yt-dlp

# Deactivate venv
deactivate
```

---

## Step 4: Verify Microservice `.env` on Server

Open the microservice configuration file on your server:
```bash
nano /var/www/zubeen-player/backend/services/youtube-music/.env
```

Ensure it contains **only** these clean settings (no browser cookie variables):
```ini
HOST=127.0.0.1
PORT=8002
DEBUG=false
YTMUSIC_AUTH_FILE=
REQUEST_TIMEOUT_SECONDS=10
```
*Save with `CTRL + O`, then exit with `CTRL + X`.*

---

## Step 5: Configure & Restart Systemd Service

Make sure the background service passes Node.js in its `PATH`:

```bash
sudo nano /etc/systemd/system/zubeen-ytmusic.service
```

Ensure your service file looks like this:
```ini
[Unit]
Description=Zubeen Player - YouTube Music FastAPI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/zubeen-player/backend/services/youtube-music
Environment="PATH=/var/www/zubeen-player/backend/services/youtube-music/.venv/bin:/usr/bin:/bin"
ExecStart=/var/www/zubeen-player/backend/services/youtube-music/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002 --workers 2

Restart=always
RestartSec=5
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```

Reload systemd and restart the service:
```bash
sudo systemctl daemon-reload
sudo systemctl restart zubeen-ytmusic
sudo systemctl enable zubeen-ytmusic

# Check service status:
sudo systemctl status zubeen-ytmusic
```

---

## Step 6: Update Laravel `.env` & Clear Cache

Check your Laravel `.env` file on the server:
```bash
nano /var/www/zubeen-player/backend/.env
```

Verify these lines are present:
```ini
YOUTUBE_MUSIC_SERVICE_URL=http://127.0.0.1:8002
YOUTUBE_MUSIC_SERVICE_TIMEOUT=10
YOUTUBE_MUSIC_ENABLED=true
```

Then clear and refresh Laravel's production cache:
```bash
cd /var/www/zubeen-player/backend
php artisan config:clear
php artisan config:cache
php artisan route:cache
```

---

## Step 7: Verify Live Audio Streaming on Server

Run these two tests directly on your server terminal:

```bash
# 1. Test Python Microservice health:
curl http://127.0.0.1:8002/health
# Expected Output: {"status":"healthy","service":"youtube-music-service","version":"1.0.0","ytmusic_ready":true}

# 2. Test Stream URL Extraction:
curl http://127.0.0.1:8002/api/v1/stream/ldJnjGNheQg
# Expected Output: JSON with "status": 200, "streamUrl": "https://rr..."
```

If both return successful JSON, your server backend is 100% operational!

---

## Step 8: Build the Final Mobile App (EAS Build)

On your local development machine:

1. **Update `mobile/.env` for Production:**
   ```ini
   EXPO_PUBLIC_API_BASE_URL=https://your-domain.com/api/v1
   EXPO_PUBLIC_STORAGE_BASE_URL=https://your-domain.com
   EXPO_PUBLIC_APP_NAME=Zubeefy
   ```

2. **Generate the Release APK / AAB:**
   ```powershell
   cd mobile

   # Build standalone APK for direct installation:
   eas build --platform android --profile preview

   # Build Google Play Store release bundle (.aab):
   eas build --platform android --profile production
   ```

3. **Install the APK on your device.** Song clicks, playback transitions, and pause actions will now stream smoothly from your live server.

---

## Useful Maintenance Commands

```bash
# View live Python microservice logs:
sudo journalctl -u zubeen-ytmusic -f

# Restart Python microservice:
sudo systemctl restart zubeen-ytmusic

# View Laravel error logs:
tail -f /var/www/zubeen-player/backend/storage/logs/laravel.log

# Clear and rebuild Laravel caches:
cd /var/www/zubeen-player/backend && php artisan config:clear && php artisan config:cache && php artisan route:cache
```
