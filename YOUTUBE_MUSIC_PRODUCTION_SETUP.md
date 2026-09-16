# YouTube Music API - Production Setup Guide

Follow these exact steps on your live server to set up and run the YouTube Music API service.

---

### Step 1: Install Server Prerequisites
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv ffmpeg
```

---

### Step 2: Setup Python Virtual Environment
Navigate to the `backend/services/youtube-music` folder on your server:

```bash
cd /var/www/zubeen-player/backend/services/youtube-music

# Create virtual environment
python3 -m venv .venv

# Activate and install dependencies
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 3: Create Systemd Background Service
Create the service configuration file:

```bash
sudo nano /etc/systemd/system/zubeen-ytmusic.service
```

Paste the following:

```ini
[Unit]
Description=Zubeen Player - YouTube Music FastAPI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/zubeen-player/backend/services/youtube-music
Environment="PATH=/var/www/zubeen-player/backend/services/youtube-music/.venv/bin"
ExecStart=/var/www/zubeen-player/backend/services/youtube-music/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002 --workers 4

Restart=always
RestartSec=5
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```

*(Note: Replace `/var/www/zubeen-player` with your server's actual project folder path if different).*

---

### Step 4: Start and Enable the Service
```bash
# Reload systemd
sudo systemctl daemon-reload

# Start the service
sudo systemctl start zubeen-ytmusic

# Enable auto-start on server reboot
sudo systemctl enable zubeen-ytmusic

# Check service status
sudo systemctl status zubeen-ytmusic
```

---

### Step 5: Update Laravel `.env`
In your server's `backend/.env` file, ensure these lines exist:

```ini
YOUTUBE_MUSIC_SERVICE_URL=http://127.0.0.1:8002
YOUTUBE_MUSIC_SERVICE_TIMEOUT=5
YOUTUBE_MUSIC_ENABLED=true
```

Then clear and rebuild Laravel cache:

```bash
cd /var/www/zubeen-player/backend
php artisan config:clear
php artisan config:cache
php artisan route:cache
```

---

### Step 6: Verify Everything is Working

```bash
# 1. Test Python Microservice health:
curl http://127.0.0.1:8002/health
# Output: {"status":"healthy"}

# 2. Test Laravel API endpoint:
curl http://127.0.0.1:8000/api/v1/health
# Output: {"status":"healthy",...}
```

---

### Useful Maintenance Commands
```bash
# View live service logs:
sudo journalctl -u zubeen-ytmusic -f

# Restart service:
sudo systemctl restart zubeen-ytmusic

# Stop service:
sudo systemctl stop zubeen-ytmusic
```
