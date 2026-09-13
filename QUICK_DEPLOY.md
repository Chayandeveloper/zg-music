# Quick Deploy Commands & Endpoints

Simple, copy-paste cheat sheet for deploying the backend and checking endpoints.

---

## 1. Run on Server (Inside backend folder)

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
chmod -R 775 storage bootstrap/cache
php artisan config:cache
php artisan route:cache
```

---

## 2. Test Endpoints

Replace `YOUR-DOMAIN.com` with your actual domain or server IP.

### Endpoint 1: Health Check (Server & API Status)
* **URL**: `https://YOUR-DOMAIN.com/api/v1/health`
* **Command**:
  ```bash
  curl https://YOUR-DOMAIN.com/api/v1/health
  ```
* **Expected Output**:
  ```json
  {"status":"healthy","service":"Zubeefy API","version":"1.0.0"}
  ```

---

### Endpoint 2: Songs List (Database Connection Status)
* **URL**: `https://YOUR-DOMAIN.com/api/v1/songs`
* **Command**:
  ```bash
  curl https://YOUR-DOMAIN.com/api/v1/songs
  ```
* **Expected Output**:
  ```json
  {"data":[{"id":1,"title":"Maya","artist":"Zubeen Garg",...}]}
  ```

---

## 3. If Something Goes Wrong

Check the error log:
```bash
tail -n 50 storage/logs/laravel.log
```
