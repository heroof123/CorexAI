@echo off
chcp 65001 >nul
cls

echo.
echo ================================================
echo    📦 Local AI IDE - Production Build       
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo ⚠️  node_modules bulunamadi!
    echo 📦 Dependencies yukleniyor...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ❌ Hata: npm install basarisiz!
        pause
        exit /b 1
    )
    echo.
)

echo 🔨 Production build baslatiliyor...
echo ⏳ Bu islem birkac dakika surebilir...
echo.

REM Build the app
npm run tauri:build

if errorlevel 1 (
    echo.
    echo ❌ Build basarisiz!
    pause
    exit /b 1
)

echo.
echo ================================================
echo ✅ Build tamamlandi!
echo.
echo 📁 Dosyalar surada:
echo    src-tauri\target\release\
echo.
echo 💾 Installer:
echo    src-tauri\target\release\bundle\
echo.
echo ================================================
echo.

REM Open the release folder
echo 📂 Klasoru acmak ister misiniz? (E/H)
set /p open_folder="> "

if /i "%open_folder%"=="E" (
    start "" "src-tauri\target\release\"
)

pause
