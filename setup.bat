@echo off
chcp 65001 >nul
cls

echo.
echo ================================================
echo       ⚙️  Local AI IDE - Ilk Kurulum        
echo ================================================
echo.

echo Bu script ilk kurulum icin gerekli her seyi yapacak.
echo.

REM Check Node.js
echo [1/5] 📦 Node.js kontrol ediliyor...
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js bulunamadi!
    echo.
    echo 📥 Node.js yuklemek icin:
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% bulundu
echo.

REM Check npm
echo [2/5] 📦 npm kontrol ediliyor...
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm bulunamadi!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% bulundu
echo.

REM Check Rust
echo [3/5] 🦀 Rust kontrol ediliyor...
where rustc >nul 2>nul
if errorlevel 1 (
    echo ❌ Rust bulunamadi!
    echo.
    echo 📥 Rust yuklemek icin:
    echo    https://rustup.rs/
    echo.
    echo ⚠️  Rust yukledikten sonra bilgisayari yeniden baslatin!
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('rustc --version') do set RUST_VERSION=%%i
echo ✅ %RUST_VERSION% bulundu
echo.

REM Install dependencies
echo [4/5] 📦 Dependencies yukleniyor...
echo ⏳ Bu birkac dakika surebilir...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ❌ npm install basarisiz!
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies yuklendi!
echo.

REM Create services directory if not exists
echo [5/5] 📁 Klasor yapisi kontrol ediliyor...

if not exist "src\services\" (
    echo 📁 src\services\ klasoru olusturuluyor...
    mkdir src\services
    echo ✅ Klasor olusturuldu!
) else (
    echo ✅ src\services\ zaten var
)

if not exist "docs\" (
    echo 📁 docs\ klasoru olusturuluyor...
    mkdir docs
    echo ✅ Klasor olusturuldu!
) else (
    echo ✅ docs\ zaten var
)

echo.
echo ================================================
echo 🎉 Kurulum tamamlandi!
echo ================================================
echo.
echo 📋 Simdi yapilacilar:
echo.
echo 1. Gelistirme icin:
echo    • start-dev.bat  → Tauri uygulamasi
echo    • start-web.bat  → Sadece web versiyonu
echo.
echo 2. Production build icin:
echo    • build.bat      → Exe dosyasi olustur
echo.
echo 3. LM Studio kurulumu:
echo    • Port 1234: Qwen2.5-7B (Ana model)
echo    • Port 1235: Qwen2.5-3B (Hizli chat)
echo    • Port 1236: BGE Embedding (Hafiza)
echo.
echo ================================================
echo.

pause
