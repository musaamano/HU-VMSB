@echo off
echo ====================================
echo HU-VMS Server Startup Script
echo ====================================
echo.

echo 1. Starting Backend Server...
cd /d "d:\HU-VMS-main (1)\HU-VMS-main\backend"
echo Current directory: %CD%
echo.
echo Checking Node.js...
node --version
echo.
echo Starting minimal server on port 3005...
start "HU-VMS Backend" cmd /k "node minimal-server.js"

echo.
echo 2. Backend server should be starting...
echo    - Check for "Server running on http://localhost:3005"
echo    - If you see errors, the server may not be starting properly
echo.
echo 3. Frontend should connect to http://localhost:3005
echo    - Vite proxy is configured for port 3005
echo    - API endpoints: /api/auth/login, /api/driver/vehicle/issue
echo.
echo ====================================
echo Press any key to exit...
pause > nul
