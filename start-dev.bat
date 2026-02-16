@echo off
cls

echo ================================================
echo       Corex - Development Launcher            
echo ================================================
echo.

if not exist "package.json" (
    echo Error: package.json not found!
    echo Please run this file in the project directory.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo npm install failed!
        pause
        exit /b 1
    )
)

where rustc >nul 2>nul
if errorlevel 1 (
    echo Rust not found! Install from: https://rustup.rs/
    pause
    exit /b 1
)

echo Starting Corex development server...
echo Press Ctrl+C to exit
echo App will open at: http://localhost:1420
echo.

REM Enable Rust logging
set RUST_LOG=info

npm run tauri dev

if errorlevel 1 (
    echo.
    echo Application closed with error!
    echo Check if LM Studio is running on port 1234
    echo.
)

pause
