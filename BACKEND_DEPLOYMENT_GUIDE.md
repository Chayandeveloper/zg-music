# Backend Production Deployment & Verification Guide

This guide contains the exact step-by-step commands to deploy the Laravel backend to a live server and verify its health using test endpoints.

---

## 1. Pre-Deployment (Preparing the Files to Send)

Before zipping or transferring the `backend` folder, **exclude heavy, platform-specific, and secret files**:

### Exclude these:
* `vendor/` (will be generated fresh on the server)
* `.env` (create a production-specific one on the server)
* `storage/logs/*.log`

### Quick Zip Command (PowerShell on Windows):
```powershell
# From your project root, compress backend excluding vendor
Compress-Archive -Path backend\* -DestinationPath backend_deploy.zip
```
*(Make sure to delete or move `vendor` out of `backend` before zipping, or uncheck it in your archive tool).*

---

## 2. Server Setup & Deployment Commands

Run these commands sequentially in your server terminal (Ubuntu/Debian VPS or similar):

### Step 1: Navigate to your server web root
```bash
cd /var/www
# If you uploaded a zip:
unzip backend_deploy.zip -d zubeen-backend
cd /var/www/zubeen-backend
```

### Step 2: Install Composer Dependencies (Production Mode)
```bash
composer install --no-dev --optimize-autoloader
```

### Step 3: Configure Production `.env`
```bash
cp .env.example .env
nano .env
```
Ensure the following variables are set in `.env`:
```ini
APP_NAME="Zubeen Player"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-api-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_secure_password

SESSION_DRIVER=database
QUEUE_CONNECTION=database
```

### Step 4: Generate Application Key
```bash
php artisan key:generate --force
```

### Step 5: Run Database Migrations (and Seeds if fresh catalog needed)
```bash
# Run migrations in production mode:
php artisan migrate --force

# (Optional) Seed initial demo catalog:
php artisan db:seed --force
```

### Step 6: Create Public Storage Symlink
```bash
php artisan storage:link
```

### Step 7: Set Correct Folder Permissions
Web server (`www-data` on Ubuntu/Nginx/Apache) must have write access:
```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Step 8: Production Performance Caching
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 3. Web Server Configuration (Nginx)

> [!IMPORTANT]
> The root **must** point to `/public`, never to the parent folder.

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/zubeen-backend/public;

    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock; # or php8.3-fpm.sock
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site & reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/zubeen-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Post-Deployment Verification (2 Test Endpoints)

Use these commands to verify that your live backend and database are fully operational:

### Endpoint 1: Health Check
Verifies web server routing, PHP engine, and API uptime (No DB query).

* **URL**: `https://api.yourdomain.com/api/v1/health`
* **cURL Command**:
  ```bash
  curl -i https://api.yourdomain.com/api/v1/health
  ```
* **Expected Output (`HTTP/1.1 200 OK`)**:
  ```json
  {
    "status": "healthy",
    "service": "Zubeefy API",
    "version": "1.0.0",
    "timestamp": "2026-09-12T15:30:00+00:00"
  }
  ```

---

### Endpoint 2: Songs Catalog (Database Test)
Verifies that database credentials in `.env` are correct, migrations succeeded, and data can be read.

* **URL**: `https://api.yourdomain.com/api/v1/songs`
* **cURL Command**:
  ```bash
  curl -i https://api.yourdomain.com/api/v1/songs
  ```
* **Expected Output (`HTTP/1.1 200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Maya",
        "artist": "Zubeen Garg",
        "duration": 284
      }
    ]
  }
  ```

---

## 5. Troubleshooting & Diagnostics

If you receive a `500 Internal Server Error`:

### View Realtime Application Error Logs:
```bash
tail -n 50 -f /var/www/zubeen-backend/storage/logs/laravel.log
```

### Clear Cache After Editing `.env`:
```bash
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

### View Nginx Error Logs:
```bash
sudo tail -n 50 -f /var/log/nginx/error.log
```
