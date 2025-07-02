@echo off
title MIT App Inventor AIA Generator
echo Starting MIT App Inventor AIA Generator...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please run INSTALL_WINDOWS.bat first
    pause
    exit /b 1
)

echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies first...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting the application...
echo The application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the application
echo.

set NODE_ENV=development
npm run dev

REM Keep window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo Application stopped with error code %errorlevel%
    pause
)