@echo off
echo Starting HU-VMS Backend Debug...
cd /d "d:\HU-VMS-main (1)\HU-VMS-main\backend"
echo Current directory: %CD%
echo.
echo Node version:
node --version
echo.
echo Environment variables:
echo PORT=%PORT%
echo MONGO_URI=%MONGO_URI%
echo.
echo Starting simple server...
node simple-backend.js
pause
