import { useState } from 'react';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './ExportButton.css';

const ExportButton = ({ data, filename, reportTitle }) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [exportedFile, setExportedFile] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    setShowExportMenu(false);

    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(50, 205, 50);
      doc.text(reportTitle || 'Report', 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      // Prepare table data
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]).map(key => ({
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          dataKey: key
        }));
        
        const rows = data.map(item => {
          const row = {};
          Object.keys(item).forEach(key => {
            row[key] = item[key];
          });
          return row;
        });
        
        // Add table
        doc.autoTable({
          columns: columns,
          body: rows,
          startY: 35,
          theme: 'grid',
          headStyles: {
            fillColor: [50, 205, 50],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          }
        });
      }
      
      // Save PDF
      doc.save(`${filename}.pdf`);
      
      setExportedFile({ type: 'PDF', filename: `${filename}.pdf` });
      setShowShareModal(true);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setShowExportMenu(false);

    try {
      // Prepare data for Excel
      const worksheetData = data.map(item => {
        const row = {};
        Object.keys(item).forEach(key => {
          const header = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          row[header] = item[key];
        });
        return row;
      });
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, reportTitle || 'Report');
      
      // Style the header row
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "32CD32" } }
        };
      }
      
      // Save Excel file
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      setExportedFile({ type: 'Excel', filename: `${filename}.xlsx` });
      setShowShareModal(true);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const handleShareWithOfficer = () => {
    alert(`Report "${exportedFile.filename}" has been shared with Transport Officer successfully!`);
    setShowShareModal(false);
    setExportedFile(null);
  };

  const handleSkipShare = () => {
    setShowShareModal(false);
    setExportedFile(null);
  };

  return (
    <>
      <div className="export-button-container">
        <button
          className="export-button"
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={exporting}
        >
          <FileDown size={18} />
          <span>{exporting ? 'Exporting...' : 'Export Report'}</span>
        </button>

        {showExportMenu && (
          <div className="export-menu">
            <div className="export-menu-header">Export Format</div>
            <button className="export-option pdf" onClick={handleExportPDF}>
              <span className="option-icon">📄</span>
              <span>Export as PDF</span>
            </button>
            <button className="export-option excel" onClick={handleExportExcel}>
              <span className="option-icon">📊</span>
              <span>Export as Excel</span>
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={handleSkipShare}>
          <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Export Successful!</h3>
              <button className="modal-close-btn" onClick={handleSkipShare}>×</button>
            </div>
            <div className="share-modal-body">
              <div className="success-icon">✅</div>
              <p className="success-message">
                Your report has been exported as <strong>{exportedFile?.type}</strong>
              </p>
              <p className="share-question">
                Would you like to share this report with the Transport Officer?
              </p>
              <div className="officer-preview">
                <div className="officer-preview-icon">🚗</div>
                <div className="officer-preview-info">
                  <div className="officer-preview-name">Transport Officer</div>
                  <div className="officer-preview-email">transport@haramaya.edu.et</div>
                </div>
              </div>
            </div>
            <div className="share-modal-footer">
              <button className="btn-skip" onClick={handleSkipShare}>
                No, Thanks
              </button>
              <button className="btn-share-officer" onClick={handleShareWithOfficer}>
                Yes, Share Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButton;
