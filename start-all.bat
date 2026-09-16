@echo off
echo ===================================================
echo   Starting ZUBEEN PLAYER (All Services)
echo ===================================================

echo Starting YouTube Music Microservice on port 8002...
start "Zubeen - YouTube Music Service (8002)" cmd /k "cd /d "%~dp0backend\services\youtube-music" && uvicorn app.main:app --host 0.0.0.0 --port 8002"

echo Starting Laravel Backend on port 8001...
start "Zubeen - Laravel API (8001)" cmd /k "cd /d "%~dp0backend" && php artisan serve --host=0.0.0.0 --port=8001"

echo Starting Expo Mobile App...
start "Zubeen - Expo Mobile" cmd /k "cd /d "%~dp0mobile" && npx expo start -c"

echo ===================================================
echo   All 3 services are launching in separate windows!
echo   1. YouTube Music Service: http://127.0.0.1:8002
echo   2. Laravel API:           http://127.0.0.1:8001
echo   3. Expo Metro Bundler:    Expo CLI window
echo ===================================================
pause
