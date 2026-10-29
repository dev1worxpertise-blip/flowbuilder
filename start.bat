@echo off
title FlowBuilder SaaS - Local Server
echo ===================================================
echo        Starting FlowBuilder (Animated Flowchart)
echo ===================================================
echo.

:: 1. Check & Start PostgreSQL if needed
echo [1/3] Checking PostgreSQL Database...
"C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" -h 127.0.0.1 -p 5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting PostgreSQL Database Server...
    start "" /B "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\18\data" -o "-h 127.0.0.1" >nul 2>&1
    timeout /t 3 /nobreak >nul
) else (
    echo PostgreSQL Database is already running.
)

:: 2. Move to project directory
cd /d "%~dp0"

:: 3. Launch the browser automatically after 2 seconds
echo.
echo [2/3] Launching Web Browser at http://localhost:5173 ...
start "" http://localhost:5173

:: 4. Start Frontend + Backend servers
echo [3/3] Starting Backend API (5055) + Frontend (5173)...
echo.
echo ===================================================
echo  App is LIVE! Keep this black window open while using.
echo  To stop the app: Close this window or press Ctrl + C.
echo ===================================================
echo.
call npm.cmd run dev
pause
