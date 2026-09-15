# YouTube Music Python Service - Server Setup & Troubleshooting Guide

This guide explains why the `requirements.txt` error occurred on your server and provides the exact terminal commands to resolve it.

---

## 1. Why Did the Error Happen?

In your server terminal, you encountered:
```text
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

### Root Cause:
1. **Wrong Folder**: You were running Python commands inside `/var/www/fillosoft.com/jubeefy/backend`.
   - The `backend/` directory is a **PHP (Laravel)** application. It uses `composer.json` and `composer install`, not Python.
   - `requirements.txt` does not exist inside `backend/`.
2. **Correct Location**:
   - `requirements.txt` belongs to the **Python FastAPI YouTube Music microservice**, which is located in:
     ```text
     services/youtube-music/requirements.txt
     ```
3. **Repository Structure**:
   - `backend/` -> PHP Laravel API
   - `services/youtube-music/` -> Python FastAPI Microservice
   - `mobile/` -> React Native Expo App

---

## 2. Step-by-Step Fix on Server

Run these commands in your server terminal:

### Step 1: Clean Up Accidental Virtual Environment in Backend
If you created `.venv` inside `backend`, deactivate and remove it:

```bash
deactivate 2>/dev/null || true
cd /var/www/fillosoft.com/jubeefy/backend
rm -rf .venv
```

---

### Step 2: Go to the Project Root and Check Directory Contents

```bash
cd /var/www/fillosoft.com/jubeefy
ls -la
```

---

### Step 3: Check If `services` Directory Exists

#### Case A: If `services` folder exists in `/var/www/fillosoft.com/jubeefy`
Simply navigate to the Python service directory:

```bash
cd /var/www/fillosoft.com/jubeefy/services/youtube-music

# Verify requirements.txt is present
ls -la requirements.txt

# Create Python virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip and install requirements
pip install --upgrade pip
pip install -r requirements.txt
```

---

#### Case B: If `services` folder is NOT present in `/var/www/fillosoft.com/jubeefy`
If running `ls` inside `/var/www/fillosoft.com/jubeefy` only shows `backend`, it means only the backend folder was originally set up. You can pull the full repo to get `services`:

```bash
cd /var/www/fillosoft.com/jubeefy

# Clone repository into a temporary folder
git clone https://github.com/Chayandeveloper/zg-music temp_repo

# Copy the services directory over
cp -r temp_repo/services ./services

# Clean up temporary folder
rm -rf temp_repo

# Now enter the Python service folder
cd /var/www/fillosoft.com/jubeefy/services/youtube-music

# Create virtual environment and install packages
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Configure and Start the Systemd Service

Once packages are installed, set up the background service for YouTube Music:

### 1. Create Systemd service file:
```bash
sudo nano /etc/systemd/system/zubeen-ytmusic.service
```

### 2. Paste the configuration:
```ini
[Unit]
Description=Zubeen Player - YouTube Music FastAPI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/fillosoft.com/jubeefy/services/youtube-music
Environment="PATH=/var/www/fillosoft.com/jubeefy/services/youtube-music/.venv/bin"
ExecStart=/var/www/fillosoft.com/jubeefy/services/youtube-music/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002 --workers 2

Restart=always
RestartSec=5
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```

### 3. Reload systemd and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable zubeen-ytmusic
sudo systemctl restart zubeen-ytmusic
sudo systemctl status zubeen-ytmusic
```

---

## 4. Verify the Python Service is Running

Test the microservice health endpoint:
```bash
curl http://127.0.0.1:8002/health
```

Expected output:
```json
{"status":"healthy"}
```

---

## 5. Connect Laravel Backend to YouTube Music Service

Check your Laravel `.env` file (`/var/www/fillosoft.com/jubeefy/backend/.env`):
```ini
YOUTUBE_MUSIC_SERVICE_URL=http://127.0.0.1:8002
YOUTUBE_MUSIC_SERVICE_TIMEOUT=5
YOUTUBE_MUSIC_ENABLED=true
```

Then clear Laravel configuration cache:
```bash
cd /var/www/fillosoft.com/jubeefy/backend
php artisan config:clear
php artisan config:cache
```
