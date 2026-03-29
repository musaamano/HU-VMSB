@echo off
echo Starting HU-VMS Maintenance Server...
cd /d "d:\HU-VMS-main (1)\HU-VMS-main\backend"
echo Current directory: %CD%
echo.
echo Node version:
node --version
echo.
echo Starting working server on port 3006...
node working-server.js
pause
