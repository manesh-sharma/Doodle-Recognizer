@echo off
title Stop Doodle Recognizer
echo ===================================================
echo       Stopping Doodle Recognizer Servers
echo ===================================================
echo.

echo Stopping FastAPI Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping React Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All Doodle Recognizer servers have been stopped.
echo ===================================================
pause
