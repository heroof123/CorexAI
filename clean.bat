@echo off
chcp 65001 >nul
cls

echo.
echo ================================================
echo       🧹 Local AI IDE - Cache Temizle       
echo ================================================
echo.

echo ⚠️  UYARI: Bu islem sunlari yapacak:
echo    • IndexedDB cache'ini temizleyecek (tarayici)
echo    • node_modules'u silecek
echo    • Tauri target klasorunu temizleyecek
echo    • npm cache'ini temizleyecek
echo.
echo ❓ Devam etmek istiyor musunuz? (E/H)
set /p confirm="> "

if /i not "%confirm%"=="E" (
    echo.
    echo ❌ Islem iptal edildi.
    pause
    exit /b 0
)

echo.
echo 🧹 Temizlik basliyor...
echo.

REM Clean node_modules
if exist "node_modules\" (
    echo [1/4] 📦 node_modules siliniyor...
    rmdir /s /q node_modules
    echo ✅ node_modules silindi
) else (
    echo [1/4] ✓ node_modules zaten yok
)
echo.

REM Clean Tauri target
if exist "src-tauri\target\" (
    echo [2/4] 🦀 Tauri build cache siliniyor...
    rmdir /s /q src-tauri\target
    echo ✅ Tauri cache silindi
) else (
    echo [2/4] ✓ Tauri cache zaten yok
)
echo.

REM Clean npm cache
echo [3/4] 📦 npm cache temizleniyor...
call npm cache clean --force
echo ✅ npm cache temizlendi
echo.

REM Clean package-lock
if exist "package-lock.json" (
    echo [4/4] 🔒 package-lock.json siliniyor...
    del /f /q package-lock.json
    echo ✅ package-lock.json silindi
) else (
    echo [4/4] ✓ package-lock.json zaten yok
)

echo.
echo ================================================
echo ✅ Temizlik tamamlandi!
echo ================================================
echo.
echo 💡 IndexedDB cache'i temizlemek icin:
echo    1. Tarayicida F12'ye basin
echo    2. Application → Storage → IndexedDB
echo    3. 'local-ai-ide-db' uzerine sag tik → Delete
echo.
echo 📋 Sonraki adimlar:
echo    1. setup.bat calistirin (dependencies yukler)
echo    2. start-dev.bat ile baslatin
echo.

pause
