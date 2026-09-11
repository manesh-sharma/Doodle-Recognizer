@echo off
title Stop Doodle Recognizer
echo ===================================================
echo       Stopping Doodle Recognizer Servers
echo ===================================================
echo.

echo Stopping FastAPI Backend (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a >nul 2>&1
)

echo Stopping React Frontend (Ports 5173-5175)...
for %%p in (5173 5174 5175) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

echo Closing Doodle Recognizer terminal windows...
taskkill /F /FI "WINDOWTITLE eq Doodle Recognizer - Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Doodle Recognizer - Frontend*" >nul 2>&1

echo.
echo All Doodle Recognizer servers and windows have been stopped.
echo ===================================================
pause
