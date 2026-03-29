@echo off
echo Starting HU-VMS Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak

echo Starting HU-VMS Frontend...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo Both servers should be starting...
echo Backend: http://localhost:3002
echo Frontend: http://localhost:5173 (usually)
pause
