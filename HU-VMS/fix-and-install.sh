#!/bin/bash

echo "========================================"
echo "HU-VMS - Fix React Error and Install PDF"
echo "========================================"
echo ""

echo "Step 1: Cleaning old installation..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "- Removed node_modules"
fi

if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo "- Removed package-lock.json"
fi

echo ""
echo "Step 2: Installing dependencies with correct versions..."
npm install

echo ""
echo "Step 3: Installation complete!"
echo ""
echo "========================================"
echo "Next Steps:"
echo "1. Run: npm run dev"
echo "2. Open browser to http://localhost:5173"
echo "3. Test PDF export in Fuel Reports"
echo "========================================"
echo ""
