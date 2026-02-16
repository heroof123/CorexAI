@echo off
chcp 65001 >nul
cls

echo.
echo ================================================
echo       🌐 Local AI IDE - Web Version            
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
    echo ✅ Dependencies yuklendi!
    echo.
)

echo 🔧 Web development server baslatiliyor...
echo.
echo 🌐 Tarayici: http://localhost:1420
echo 💡 Ipucu: Cikmak icin Ctrl+C yapin
echo.
echo ================================================
echo.

REM Start the web dev server
npm run dev

echo.
echo.
echo 👋 Web server kapatildi.
pause