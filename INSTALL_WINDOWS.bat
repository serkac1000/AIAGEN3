
@echo off
title MIT App Inventor AIA Generator - Installation
echo MIT App Inventor AIA Generator - Windows Installation
echo =====================================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js 18 or higher from: https://nodejs.org/
    echo Choose the LTS version and install with default settings
    echo Make sure to check "Add to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo NPM version:
npm --version

echo.
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo This could be due to:
    echo - Network connectivity issues
    echo - Permissions problems
    echo - Outdated npm version
    echo.
    echo Try running: npm cache clean --force
    echo Then run this script again
    pause
    exit /b 1
)

echo.
echo Installation complete!
echo.
echo To start the application, run: START_APP.bat
echo Or manually run: npm run dev
echo.
echo The application will be available at: http://localhost:5000
echo.
pause
