@echo off
echo Starting HU-VMS Backend Server...
cd /d "d:\HU-VMS-main (1)\HU-VMS-main\backend"
echo Current directory: %CD%
echo Node version:
node --version
echo Starting server on port 3005...
node basic-server.js
pause
