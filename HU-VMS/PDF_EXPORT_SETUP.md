# PDF Export Setup Guide

## Installation

To enable PDF export functionality, you need to install the required packages:

```bash
npm install jspdf jspdf-autotable
```

## Features

The PDF export system has been integrated into the following components:

### 1. Fuel Report (`/driver/fuel`)
- Export fuel refill reports
- Export fuel consumption reports
- Professional formatting with vehicle and driver details
- Send to Admin or Transport Office

### 2. Vehicle Issue Report (`/driver/vehicle-report`)
- Export vehicle maintenance and issue reports
- Priority-based formatting (Low, Medium, High, Critical)
- Detailed issue descriptions
- Send to Admin or Transport Office

### 3. Submit Complaint (`/driver/submit-complaint`)
- Export complaint submissions
- Category-based organization
- Professional complaint documentation
- Send to Admin or Transport Office

### 4. Trip Reports (Ready for integration)
- Trip summary reports
- Distance and fuel consumption tracking
- Complete trip details

## How to Use

1. Fill out the form with required information
2. Click the "Export PDF" button
3. Select recipient:
   - **Administration Office** - For administrative matters
   - **Transport Office** - For transport-related issues
4. PDF will be automatically generated and downloaded

## PDF Features

- Professional header with HU-VMS branding
- Color-coded sections (Blue theme: #4a90e2)
- Recipient information clearly displayed
- Detailed report tables
- Signature section with timestamp
- Professional footer with page numbers
- University branding throughout

## File Structure

```
src/
├── utils/
│   └── pdfGenerator.js          # Main PDF generation utility
├── components/
│   ├── ExportButton.jsx         # Reusable export button component
│   └── ExportButton.css         # Export button styles
└── pages/driver/
    ├── fuel/FuelReport.jsx      # Updated with PDF export
    ├── vehicle-report/VehicleIssueReport.jsx  # Updated with PDF export
    └── submit-complaint/SubmitComplaint.jsx   # Updated with PDF export
```

## Customization

### Colors
Edit `src/utils/pdfGenerator.js` to change colors:
```javascript
this.primaryColor = [74, 144, 226];    // #4a90e2
this.secondaryColor = [53, 122, 189];  // #357abd
this.darkColor = [30, 60, 114];        // #1e3c72
```

### Logo
To add a university logo, update the `addHeader` method in `pdfGenerator.js`:
```javascript
// Add logo image
doc.addImage(logoData, 'PNG', 20, 10, 30, 30);
```

### Report Templates
Each report type has its own generator method:
- `generateFuelReport(data, recipient)`
- `generateVehicleIssueReport(data, recipient)`
- `generateComplaintReport(data, recipient)`
- `generateTripReport(data, recipient)`

## Future Enhancements

- [ ] Email integration to send PDFs directly
- [ ] Batch PDF generation for multiple reports
- [ ] PDF preview before download
- [ ] Custom templates per department
- [ ] Digital signature integration
- [ ] QR code for verification
- [ ] Multi-language support

## Troubleshooting

### PDF not downloading
- Check browser console for errors
- Ensure jspdf and jspdf-autotable are installed
- Verify all required data fields are filled

### Styling issues
- Clear browser cache
- Check ExportButton.css is properly imported
- Verify CSS class names match

### Missing data in PDF
- Check that form data is properly passed to the export function
- Verify driver and vehicle information is available in context
- Update placeholder values with actual data from authentication context

## Support

For issues or questions, contact the development team or refer to:
- jsPDF Documentation: https://github.com/parallax/jsPDF
- jsPDF-AutoTable: https://github.com/simonbengtsson/jsPDF-AutoTable
