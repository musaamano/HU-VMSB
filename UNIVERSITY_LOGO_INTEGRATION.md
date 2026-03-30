# University Logo Integration for PDF Reports

## Overview
The HU-VMS PDF generator now includes support for the Haramaya University logo in all generated reports (Fuel Station Reports and Gate Security Reports).

## Current Implementation
- **Logo Position**: Top-right corner of PDF header
- **Logo Size**: 24px diameter circular design
- **Fallback**: Professional placeholder with "HU" text and university name

## How to Add the Actual University Logo

### Step 1: Convert Logo to Base64
1. Take your Haramaya University logo image (PNG or JPG format recommended)
2. Convert it to base64 format using an online converter or tool
3. The result should look like: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`

### Step 2: Set the Logo in Code
```javascript
import pdfGenerator from './src/utils/pdfGenerator';

// Set the university logo
pdfGenerator.setHaramayaLogo('data:image/png;base64,YOUR_BASE64_STRING_HERE');

// Or use the generic method
pdfGenerator.setUniversityLogo('data:image/png;base64,YOUR_BASE64_STRING_HERE');
```

### Step 3: Generate Reports
Once the logo is set, all PDF reports will automatically include the university logo:
- Fuel Station Reports
- Gate Security Reports
- Driver Reports
- All other PDF exports

## Features
- **Automatic Integration**: Logo appears on all PDF reports without additional code
- **Professional Styling**: Logo is properly sized and positioned
- **Fallback Design**: If no logo is provided, a professional placeholder is used
- **Error Handling**: Invalid logo formats are handled gracefully

## Technical Details
- Logo is rendered as a circular design in the PDF header
- University name "HARAMAYA UNIVERSITY" appears below the logo
- Date and time are positioned to avoid overlap with the logo
- Compatible with all existing PDF generation functions

## Example Usage in Components

### Fuel Station Reports
```javascript
// In FuelReports.jsx - logo will automatically appear
const handleGenerateReport = async () => {
    const pdfData = {
        // ... report data
    };
    pdfGenerator.generateFuelStationReport(pdfData, recipient);
};
```

### Gate Security Reports
```javascript
// In GateSecurityReports.jsx - logo will automatically appear
const handleGenerateReport = async () => {
    const pdfData = {
        // ... report data
    };
    pdfGenerator.generateGateSecurityReport(pdfData, recipient);
};
```

## Logo Specifications
- **Recommended Size**: 200x200 pixels or larger
- **Format**: PNG with transparent background preferred
- **Quality**: High resolution for crisp PDF rendering
- **Colors**: Should work well on blue header background

## Notes
- The logo system is backward compatible - existing code will work without changes
- Logo is cached once set and will appear on all subsequent PDF generations
- For best results, use a square logo image that will fit well in a circular frame