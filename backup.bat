@echo off
setlocal enabledelayedexpansion

title Zubeen Player - Project Backup
color 0A

:: Ensure we are in the project root directory
cd /d "%~dp0"

echo ===================================================
echo           ZUBEEN PLAYER - SMART BACKUP
echo ===================================================
echo.
echo [*] Checking prerequisites...

:: Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Git is not found in PATH!
    echo Please install Git to accurately filter .gitignore files.
    echo.
    pause
    exit /b 1
)

:: Set backup destination to Downloads\zubeen back folder
set "DEST_DIR=%USERPROFILE%\Downloads\zubeen back"
if not exist "%DEST_DIR%" (
    echo [*] Creating backup directory: "%DEST_DIR%"
    mkdir "%DEST_DIR%"
)

:: Generate ISO timestamp (format: YYYY-MM-DD_HHMMSS)
for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"`) do (
    set "TIMESTAMP=%%I"
)

set "BACKUP_NAME=backup_zubeen_player_%TIMESTAMP%.zip"
set "BACKUP_PATH=%DEST_DIR%\%BACKUP_NAME%"
set "TEMP_LIST=%TEMP%\backup_filelist_%RANDOM%.txt"

echo [*] Scanning project files (excluding node_modules and .gitignore)...
git ls-files --cached --others --exclude-standard > "%TEMP_LIST%"

for /f %%A in ('type "%TEMP_LIST%" ^| find /c /v ""') do set "FILE_COUNT=%%A"

if %FILE_COUNT% equ 0 (
    color 0C
    echo [ERROR] No files found to back up!
    if exist "%TEMP_LIST%" del "%TEMP_LIST%"
    pause
    exit /b 1
)

echo [*] Found %FILE_COUNT% clean files to back up.
echo [*] Compressing into %BACKUP_PATH%...

:: Check if tar is available (built-in on Windows 10/11)
where tar >nul 2>nul
if %ERRORLEVEL% equ 0 (
    tar -a -c -f "%BACKUP_PATH%" -T "%TEMP_LIST%"
) else (
    echo [*] tar not found, falling back to PowerShell zip...
    powershell -NoProfile -Command ^
        "$files = Get-Content '%TEMP_LIST%';" ^
        "Compress-Archive -Path $files -DestinationPath '%BACKUP_PATH%' -CompressionLevel Optimal"
)

:: Clean up temp file
if exist "%TEMP_LIST%" del "%TEMP_LIST%"

:: Check if backup file was created
if not exist "%BACKUP_PATH%" (
    color 0C
    echo.
    echo [ERROR] Failed to create backup file!
    echo.
    pause
    exit /b 1
)

:: Get file size
for %%F in ("%BACKUP_PATH%") do set "FILE_SIZE=%%~zF"
for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "[math]::Round(%FILE_SIZE% / 1MB, 2)"`) do set "SIZE_MB=%%S"

color 0A
echo.
echo ===================================================
echo             BACKUP COMPLETED SUCCESSFULLY!
echo ===================================================
echo  Archive File : %BACKUP_PATH%
echo  Total Files  : %FILE_COUNT%
echo  Archive Size : %SIZE_MB% MB
echo ===================================================
echo.
echo Press any key to close...
pause >nul
