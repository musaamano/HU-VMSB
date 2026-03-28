@echo off
echo ====================================
echo HU-VMS Maintenance Server Startup
echo ====================================
echo.
cd /d "d:\HU-VMS-main (1)\HU-VMS-main\backend"
echo Current directory: %CD%
echo.
echo Checking Node.js...
node --version
echo.
echo Starting simple maintenance server...
node simple-maintenance-server.js
echo.
echo ====================================
pause
