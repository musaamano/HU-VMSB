@echo off
echo ========================================
echo HU-VMS - Fix React Error and Install PDF
echo ========================================
echo.

echo Step 1: Cleaning old installation...
if exist node_modules (
    rmdir /s /q node_modules
    echo - Removed node_modules
)

if exist package-lock.json (
    del package-lock.json
    echo - Removed package-lock.json
)

echo.
echo Step 2: Installing dependencies with correct versions...
call npm install

echo.
echo Step 3: Installation complete!
echo.
echo ========================================
echo Next Steps:
echo 1. Run: npm run dev
echo 2. Open browser to http://localhost:5173
echo 3. Test PDF export in Fuel Reports
echo ========================================
echo.
pause
