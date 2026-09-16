# Start all Zubeen Player services in separate PowerShell windows
$rootDir = $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Starting ZUBEEN PLAYER (All Services)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. YouTube Music Service
Write-Host "Starting YouTube Music Microservice (Port 8002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend\services\youtube-music'; Write-Host 'YouTube Music Service (8002)' -ForegroundColor Green; uvicorn app.main:app --host 0.0.0.0 --port 8002"

# 2. Laravel Backend
Write-Host "Starting Laravel Backend (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; Write-Host 'Laravel API (8001)' -ForegroundColor Green; php artisan serve --host=0.0.0.0 --port=8001"

# 3. Expo Mobile
Write-Host "Starting Expo Mobile Packager..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\mobile'; Write-Host 'Expo Mobile' -ForegroundColor Green; npx expo start -c"

Write-Host "`nAll 3 services have been launched in separate windows!" -ForegroundColor Green
