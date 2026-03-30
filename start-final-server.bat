@echo off
title HU-VMS Maintenance Server
echo ====================================
echo Starting Final Working Server...
echo ====================================
echo.
cd /d "d:\HU-VMS-main (1)\HU-VMS-main\backend"
echo Current directory: %CD%
echo.
echo Killing any existing processes on port 3006...
for /f "tokens=1,2,3,4,5" %%a in ('netstat -ano ^| findstr :3006') do (
    for /f "tokens=1,2,3" %%b in ("%%a") do (
        taskkill /PID %%c /F 2>nul
    )
)
echo.
echo Starting simple maintenance server...
node simple-maintenance-server.js
echo.
echo ====================================
echo Server should be running on: http://localhost:3006
echo.
echo Available endpoints:
echo   POST /api/auth/login
echo   POST /api/driver/vehicle/issue
echo   GET  /api/maintenance/issues
echo   PUT  /api/maintenance/issues/:id
echo   GET  /api/maintenance/reports/data
echo   POST /api/maintenance/reports/send
echo.
echo Press any key to stop server...
pause > nul
