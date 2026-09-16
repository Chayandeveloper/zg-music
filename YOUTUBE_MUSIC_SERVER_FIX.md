# YouTube Music Python Service - Server Setup & Troubleshooting Guide

This guide explains:
1. Why `requirements.txt` gave an error on your server.
2. Why `admin/`, `services/`, and other folders were not showing up after `git pull`.
3. Why `.gitignore` is not causing the issue.
4. Exact terminal commands to fix everything and start the YouTube Music service.

---

## 1. Quick Diagnostic: Why Are `admin`, `services`, etc. Missing in `jubeefy`?

When you run `ls` inside `/var/www/fillosoft.com/jubeefy`, you only see `backend`. Even after running `git pull origin main`, git says `Already up to date`, but the other folders (`admin`, `services`, `mobile`) do not appear.

There are **two main reasons** this happens on deployment servers:

### Cause A: Git "Sparse Checkout" is Enabled on the Server (Most Common)
On production servers, deployment scripts often turn on Git's **sparse checkout** feature so that only `backend/` is checked out to save disk space. When active, git deliberately hides all other folders (`admin/`, `services/`, `mobile/`), even though they exist in GitHub!

**How to check:**
```bash
cd /var/www/fillosoft.com/jubeefy
git config core.sparseCheckout
```
- If this prints `true`, sparse checkout is actively hiding `services` and `admin`.

**How to disable sparse checkout and restore all folders:**
```bash
cd /var/www/fillosoft.com/jubeefy
git sparse-checkout disable
git checkout main
git pull origin main
ls -la
```
> After running `git sparse-checkout disable`, all folders (`admin`, `backend`, `docker`, `mobile`, `services`) will immediately appear!

---

### Cause B: The Server is Not on the `main` Branch
In your terminal, Git warned:
> *"Because this is not the default configured remote for your current branch, you must specify a branch on the command line."*

This indicates your server's checkout may be on a detached HEAD or an old local branch.

**How to switch to `main`:**
```bash
cd /var/www/fillosoft.com/jubeefy
git checkout main
git pull origin main
ls -la
```

---

## 2. Why Did `pip install -r requirements.txt` Fail?

Terminal error:
```text
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

### Root Cause:
- You ran the command inside `/var/www/fillosoft.com/jubeefy/backend`.
- `backend/` is your **PHP (Laravel)** application. It uses `composer.json` and `composer install`, not Python.
- `requirements.txt` belongs to the **Python FastAPI microservice**, which is located at:
  ```text
  services/youtube-music/requirements.txt
  ```

---

## 3. Did `.gitignore` Block the `services` Folder?

**No.** The rules in `.gitignore` under `# Python & YouTube Music Service`:
```gitignore
services/youtube-music/.venv/
services/youtube-music/__pycache__/
services/youtube-music/.pytest_cache/
services/youtube-music/*.pyc
```
- Only ignore temporary virtual environment directories (`.venv/`) and Python cache files (`__pycache__/`, `*.pyc`).
- They **do NOT** ignore the `services/` directory or `requirements.txt`.
- `backend/services/youtube-music/requirements.txt` is fully tracked in GitHub on `origin/main`.

---

## 4. Complete Step-by-Step Fix on Server

Follow these exact steps on your server terminal:

### Step 1: Clean Up Accidental `.venv` in Backend
```bash
deactivate 2>/dev/null || true
cd /var/www/fillosoft.com/jubeefy/backend
rm -rf .venv
```

---

### Step 2: Restore All Folders in `jubeefy`
```bash
cd /var/www/fillosoft.com/jubeefy

# Disable sparse checkout (if active) and switch to main
git sparse-checkout disable 2>/dev/null || true
git checkout main
git pull origin main

# Verify folders are now visible
ls -la
```

You should now see:
- `admin/`
- `backend/`
- `docker/`
- `mobile/`
- `services/`
- `shared/`

*(Alternative: If for any reason the server git repository is separated, you can simply clone and copy `services`:)*
```bash
cd /var/www/fillosoft.com/jubeefy
git clone https://github.com/Chayandeveloper/zg-music temp_zg
cp -r temp_zg/services ./services
rm -rf temp_zg
```

---

### Step 3: Set Up Python Virtual Environment and Dependencies
```bash
cd /var/www/fillosoft.com/jubeefy/backend/services/youtube-music

# Verify requirements.txt is present
ls -la requirements.txt

# Create Python virtual environment
python3 -m venv .venv

# Activate environment
source .venv/bin/activate

# Upgrade pip and install all required packages
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 4: Configure Systemd Background Service
Create the background service configuration:
```bash
sudo nano /etc/systemd/system/zubeen-ytmusic.service
```

Paste the following content:
```ini
[Unit]
Description=Zubeen Player - YouTube Music FastAPI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/fillosoft.com/jubeefy/backend/services/youtube-music
Environment="PATH=/var/www/fillosoft.com/jubeefy/backend/services/youtube-music/.venv/bin"
ExecStart=/var/www/fillosoft.com/jubeefy/backend/services/youtube-music/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002 --workers 2

Restart=always
RestartSec=5
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```

Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

---

### Step 5: Start and Enable the Service
```bash
# Reload systemd definitions
sudo systemctl daemon-reload

# Enable service to start automatically on reboot
sudo systemctl enable zubeen-ytmusic

# Start service now
sudo systemctl restart zubeen-ytmusic

# Check service status
sudo systemctl status zubeen-ytmusic
```

---

### Step 6: Verify Service is Running
Test the microservice health endpoint:
```bash
curl http://127.0.0.1:8002/health
```

Expected response:
```json
{"status":"healthy"}
```

---

### Step 7: Connect Laravel Backend to YouTube Music Service
Ensure these lines are in your `/var/www/fillosoft.com/jubeefy/backend/.env`:
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

---

## 5. Useful Server Maintenance Commands

| Action | Command |
| :--- | :--- |
| **View Live Logs** | `sudo journalctl -u zubeen-ytmusic -f` |
| **Restart Service** | `sudo systemctl restart zubeen-ytmusic` |
| **Stop Service** | `sudo systemctl stop zubeen-ytmusic` |
| **Check Status** | `sudo systemctl status zubeen-ytmusic` |
