@echo off
setlocal
title Doodle Recognizer Launcher

echo ===================================================
echo       Starting Doodle Recognizer (V2)
echo ===================================================
echo.

set "ROOT_DIR=%~dp0"

echo Pre-checking ports to ensure clean startup...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /T /PID %%a >nul 2>&1
)
for %%p in (5173 5174 5175) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        taskkill /F /T /PID %%a >nul 2>&1
    )
)

echo [1/3] Starting FastAPI Backend on port 8000...
start "Doodle Recognizer - Backend (FastAPI)" cmd /k "cd /d ""%ROOT_DIR%backend"" && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && python run.py"

echo [2/3] Starting React Frontend (Vite) on port 5173...
start "Doodle Recognizer - Frontend (Vite)" cmd /k "cd /d ""%ROOT_DIR%frontend"" && npm run dev"

echo.
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Opening Doodle Recognizer in your default browser...
start http://localhost:5173

echo.
echo ===================================================
echo   Doodle Recognizer is running!
echo.
echo   Local access:   http://localhost:5173
echo   API & Docs:     http://localhost:8000/docs
echo.
echo   To stop the application, simply run stop.bat or
echo   close the Backend and Frontend command windows.
echo ===================================================
echo.
pause
