# Fix React useState Error

## Problem
The error "Cannot read properties of null (reading 'useState')" is caused by:
1. Incorrect jspdf version (4.2.0 was installed instead of 2.5.1)
2. Possible React version mismatch in node_modules

## Solution

### Step 1: Clean Installation
Run these commands in the `HU-VMS-main/HU-VMS` directory:

```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Or on Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json

# Or on Windows Command Prompt:
rmdir /s /q node_modules
del package-lock.json
```

### Step 2: Reinstall Dependencies
```bash
npm install
```

This will install the correct versions:
- jspdf: ^2.5.1 (not 4.2.0)
- jspdf-autotable: ^3.8.2 (not 5.0.7)
- All other dependencies with correct versions

### Step 3: Restart Dev Server
```bash
npm run dev
```

## Why This Happened

The jspdf package versions were incorrect:
- **Wrong:** jspdf@4.2.0 (very old, incompatible)
- **Correct:** jspdf@2.5.1 (latest stable)

The old version may have caused React conflicts or module resolution issues.

## Verification

After reinstalling, you should see:
- No React errors in console
- PDF export buttons working correctly
- All components loading properly

## Alternative: Manual Fix

If the above doesn't work, try:

```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Delete node_modules and lock file
rm -rf node_modules package-lock.json

# 3. Reinstall
npm install

# 4. If still issues, check for duplicate React
npm ls react
npm ls react-dom

# 5. If duplicates found, dedupe
npm dedupe
```

## Package.json Updated

The package.json has been updated with correct versions:
```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.576.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.20.0"
  }
}
```

## If Error Persists

1. Check that you're in the correct directory: `HU-VMS-main/HU-VMS`
2. Ensure no other React versions are installed globally
3. Check vite.config.js for any React-related configurations
4. Try clearing browser cache and hard refresh (Ctrl+Shift+R)

## Contact

If issues continue, the problem may be:
- Node.js version incompatibility (use Node 16+ recommended)
- System-specific path issues (spaces in directory names)
- Corrupted npm cache

Run: `node --version` and `npm --version` to verify your environment.
