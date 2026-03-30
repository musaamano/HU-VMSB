import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Professional PDF Generator for HU-VMS Reports with Beautiful Roman Typography
class PDFGenerator {
    constructor() {
        this.primaryColor = [74, 144, 226];
        this.secondaryColor = [53, 122, 189];
        this.darkColor = [30, 60, 114];
        this.textColor = [51, 51, 51];
        this.lightGray = [240, 240, 240];
        this.universityLogo = null;
    }

    // Set Haramaya University logo
    setHaramayaLogo(logoData) {
        this.universityLogo = logoData;
    }

    // Add university logo to PDF
    addUniversityLogo(doc, x, y, size = 30) {
        try {
            if (this.universityLogo) {
                doc.addImage(this.universityLogo, 'PNG', x - size / 2, y - size / 2, size, size);
            } else {
                // Simple university logo placeholder
                doc.setFillColor(255, 255, 255);
                doc.circle(x, y, size / 2, 'F');
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1.5);
                doc.circle(x, y, size / 2, 'S');

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(size / 12);
                doc.setFont('helvetica', 'bold');
                doc.text('HARAMAYA', x, y - size / 2.5, { align: 'center' });
                doc.text('UNIVERSITY', x, y + size / 2.2, { align: 'center' });
            }
        } catch (error) {
            console.log('University logo rendering error:', error);
            doc.setTextColor(...this.primaryColor);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('HARAMAYA', x, y - 2, { align: 'center' });
            doc.text('UNIVERSITY', x, y + 4, { align: 'center' });
        }
    }
    // Add beautiful professional header with Roman typography
    addHeader(doc, title, subtitle = '') {
        const pageWidth = doc.internal.pageSize.getWidth();

        // Elegant header background with gradient effect
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 55, 'F');

        // Sophisticated top border with Roman blue
        doc.setFillColor(41, 98, 165);
        doc.rect(0, 0, pageWidth, 4, 'F');

        // Add university logo with professional positioning (moved further left to prevent overlap)
        this.addUniversityLogo(doc, pageWidth - 45, 28, 32);

        // Main title with classical Roman typography
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(28);
        doc.setFont('times', 'bold');
        doc.text('HU-VMS', 20, 22);

        // Classical decorative flourish
        doc.setTextColor(41, 98, 165);
        doc.setFontSize(20);
        doc.text('❦', 68, 22);

        // Report title with elegant Roman styling
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(18);
        doc.setFont('times', 'bolditalic');
        doc.text(title, 20, 36);

        // Subtitle with refined typography
        if (subtitle) {
            doc.setFontSize(12);
            doc.setFont('times', 'italic');
            doc.setTextColor(85, 85, 85);
            doc.text(subtitle, 20, 46);
        }

        // Date and time with Roman numerals style - positioned to avoid logo overlap
        doc.setFontSize(10);
        doc.setFont('times', 'normal');
        doc.setTextColor(70, 70, 70);
        const dateStr = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Position date/time with proper spacing from logo (logo ends at pageWidth - 13, so text starts at pageWidth - 55)
        const dateTimeX = pageWidth - 55;
        doc.text(`${dateStr}`, dateTimeX, 18, { align: 'right' });
        doc.text(`${timeStr}`, dateTimeX, 26, { align: 'right' });

        // Elegant bottom border with Roman styling
        doc.setDrawColor(41, 98, 165);
        doc.setLineWidth(1.2);
        doc.line(20, 52, pageWidth - 20, 52);

        // Decorative corner elements
        doc.setFillColor(41, 98, 165);
        doc.circle(25, 52, 1.5, 'F');
        doc.circle(pageWidth - 25, 52, 1.5, 'F');
    }

    // Add beautiful section header with icon and styling
    addSectionHeader(doc, title, y, icon = '❦') {
        // Section background with gradient effect
        doc.setFillColor(248, 250, 255);
        doc.roundedRect(20, y - 8, 170, 18, 4, 4, 'F');

        // Section border with Roman blue
        doc.setDrawColor(41, 98, 165);
        doc.setLineWidth(1);
        doc.roundedRect(20, y - 8, 170, 18, 4, 4, 'S');

        // Icon background circle
        doc.setFillColor(41, 98, 165);
        doc.circle(30, y + 1, 6, 'F');

        // Icon
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(icon, 30, y + 3, { align: 'center' });

        // Section title
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(16);
        doc.setFont('times', 'bolditalic');
        doc.text(title, 42, y + 3);

        // Decorative line
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(2);
        doc.line(42, y + 6, 42 + doc.getTextWidth(title), y + 6);
    }

    // Add beautiful footer with Roman elegance
    addFooter(doc, pageNumber, totalPages) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Elegant top border for footer
        doc.setDrawColor(41, 98, 165);
        doc.setLineWidth(1.2);
        doc.line(20, pageHeight - 28, pageWidth - 20, pageHeight - 28);

        // Decorative corner elements
        doc.setFillColor(41, 98, 165);
        doc.circle(25, pageHeight - 28, 1.5, 'F');
        doc.circle(pageWidth - 25, pageHeight - 28, 1.5, 'F');

        // Institution name with Roman styling
        doc.setTextColor(70, 70, 70);
        doc.setFontSize(10);
        doc.setFont('times', 'italic');
        doc.text('HARAMAYA UNIVERSITY', 25, pageHeight - 20);
        doc.setFont('times', 'normal');
        doc.text('• Vehicle Management System •', 25, pageHeight - 15);

        // Page numbering with Roman numerals style
        doc.setFont('times', 'normal');
        doc.setTextColor(85, 85, 85);
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 25, pageHeight - 20, { align: 'right' });

        // Classical footer flourish
        doc.setFont('times', 'italic');
        doc.setTextColor(41, 98, 165);
        doc.setFontSize(12);
        doc.text('❦ OFFICIUM DOCUMENTUM ❦', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Add recipient information with Roman elegance
    addRecipient(doc, recipient, yPos = 65) {
        // Elegant background with subtle gradient effect
        doc.setFillColor(250, 252, 255);
        doc.roundedRect(25, yPos, 165, 35, 6, 6, 'F');

        // Sophisticated border with Roman blue
        doc.setDrawColor(41, 98, 165);
        doc.setLineWidth(1.5);
        doc.roundedRect(25, yPos, 165, 35, 6, 6, 'S');

        // Classical "TO" label with Roman styling
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.text('DESTINATARIUS:', 32, yPos + 12);

        // Recipient name with elegant typography
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(14);
        doc.setTextColor(35, 35, 35);
        const recipientName = recipient.name || recipient;
        doc.text(recipientName, 32, yPos + 22);

        // Department with refined styling
        if (recipient.department) {
            doc.setFontSize(10);
            doc.setFont('times', 'italic');
            doc.setTextColor(85, 85, 85);
            doc.text(recipient.department, 32, yPos + 30);
        }

        // Decorative corner flourish
        doc.setTextColor(41, 98, 165);
        doc.setFontSize(10);
        doc.text('❦', 175, yPos + 8);
    }
    // Helper method for driver performance rating
    getDriverRating(completionRate) {
        if (completionRate >= 95) return { rating: 'Excellent', color: [76, 175, 80] };
        if (completionRate >= 85) return { rating: 'Good', color: [74, 144, 226] };
        if (completionRate >= 70) return { rating: 'Average', color: [255, 152, 0] };
        return { rating: 'Needs Improvement', color: [244, 67, 54] };
    }

    // Helper method for recommendations
    getDriverRecommendations(data) {
        const recommendations = [];
        const completionRate = (data.completedTrips / data.totalTrips) * 100;

        if (completionRate < 85) {
            recommendations.push('Focus on improving trip completion rate');
        }
        if (data.fuelEfficiency && data.fuelEfficiency < 8) {
            recommendations.push('Consider fuel-efficient driving techniques');
        }
        if (data.maintenanceIssues > 2) {
            recommendations.push('Schedule regular vehicle maintenance checks');
        }
        if (recommendations.length === 0) {
            recommendations.push('Continue maintaining excellent performance standards');
        }

        return recommendations;
    }

    // Helper method for security assessment
    getSecurityAssessment(data) {
        const totalIncidents = (data.unauthorizedEntries || 0) + (data.securityBreaches || 0);

        if (totalIncidents === 0) return { level: 'Excellent', color: [76, 175, 80] };
        if (totalIncidents <= 2) return { level: 'Good', color: [74, 144, 226] };
        if (totalIncidents <= 5) return { level: 'Moderate', color: [255, 152, 0] };
        return { level: 'High Risk', color: [244, 67, 54] };
    }
    // Generate Driver Report PDF with Sophisticated Roman Typography
    generateDriverReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'DRIVER PERFORMANCE REPORT', `${data.period} Performance Analysis • Haramaya University`);

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Transport Office',
            department: recipient === 'Admin' ? 'University Administration' : 'Transport Management Department'
        };
        this.addRecipient(doc, recipientInfo, 65);

        let currentY = 110;

        // Enhanced report period badge with gradient effect
        doc.setFillColor(41, 98, 165);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'F');

        // Inner gradient effect
        doc.setFillColor(51, 108, 175);
        doc.roundedRect(22, currentY + 2, 166, 18, 6, 6, 'F');

        // Golden accent border
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(1.5);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'S');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text(`❦ ${data.period.toUpperCase()} PERFORMANCE ANALYSIS ❦`, 105, currentY + 14, { align: 'center' });

        currentY += 35;

        // Driver Information Section with enhanced Roman elegance
        this.addSectionHeader(doc, 'I. CONDUCTOR INFORMATIO', currentY, '👤');
        currentY += 20;

        const driverInfo = [
            ['Nomen Conductoris', data.driverName || 'Johannes Doe'],
            ['Numerus Laboratoris', data.employeeId || 'EMP-001'],
            ['Numerus Licentiae', data.licenseNumber || 'LIC-123456'],
            ['Vehiculum Assignatum', data.vehicleId || 'VEH-001'],
            ['Tempus Relationis', data.period || 'Mensilis'],
            ['Status Conductoris', 'Activus']
        ];

        doc.autoTable({
            startY: currentY,
            body: driverInfo,
            theme: 'grid',
            styles: {
                font: 'times',
                fontSize: 11,
                cellPadding: 10,
                lineColor: [41, 98, 165],
                lineWidth: 0.8,
                textColor: [35, 35, 35],
                letterSpacing: 0.4,
                lineHeight: 1.6
            },
            columnStyles: {
                0: {
                    fontStyle: 'bolditalic',
                    cellWidth: 80,
                    fillColor: [248, 250, 255],
                    textColor: [25, 55, 95]
                },
                1: {
                    cellWidth: 90,
                    fontStyle: 'normal',
                    fillColor: [255, 255, 255]
                }
            },
            margin: { left: 25, right: 25 },
            headStyles: {
                fillColor: [41, 98, 165],
                textColor: [255, 255, 255],
                fontStyle: 'bolditalic'
            }
        });

        currentY = doc.lastAutoTable.finalY + 30;

        // Trip Performance Section with enhanced styling
        if (data.includeTripSummary) {
            this.addSectionHeader(doc, 'II. CURSUS PERFORMANCE ANALYSIS', currentY, '🚗');
            currentY += 20;

            const completionRate = data.totalTrips > 0 ? ((data.completedTrips / data.totalTrips) * 100).toFixed(1) : 0;
            const rating = this.getDriverRating(completionRate);

            // Performance indicator badge
            const badgeColor = completionRate >= 90 ? [34, 197, 94] : completionRate >= 75 ? [251, 191, 36] : [239, 68, 68];
            doc.setFillColor(...badgeColor);
            doc.roundedRect(140, currentY - 15, 45, 12, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('times', 'bold');
            doc.text(`${completionRate}% SUCCESS`, 162.5, currentY - 8, { align: 'center' });

            const tripData = [
                ['Totalis Cursus Assignatus', data.totalTrips?.toString() || '0', '📋'],
                ['Feliciter Completus', data.completedTrips?.toString() || '0', '✅'],
                ['Cancellatus/Incompletus', data.cancelledTrips?.toString() || '0', '❌'],
                ['Totalis Distantia', `${data.totalDistance || 0} km`, '📏'],
                ['Media Cursus Distantia', `${data.totalTrips > 0 ? (data.totalDistance / data.totalTrips).toFixed(1) : 0} km`, '📊'],
                ['Ratio Completionis', `${completionRate}%`, '🎯'],
                ['Gradus Performance', rating.rating, '⭐']
            ];

            doc.autoTable({
                startY: currentY,
                body: tripData.map(row => [row[2] + ' ' + row[0], row[1]]),
                theme: 'striped',
                styles: {
                    font: 'times',
                    fontSize: 11,
                    cellPadding: 10,
                    lineColor: [41, 98, 165],
                    lineWidth: 0.8,
                    textColor: [35, 35, 35],
                    letterSpacing: 0.4,
                    lineHeight: 1.6
                },
                columnStyles: {
                    0: {
                        fontStyle: 'bolditalic',
                        cellWidth: 100,
                        fillColor: [248, 250, 255],
                        textColor: [25, 55, 95]
                    },
                    1: {
                        cellWidth: 70,
                        fontStyle: 'bold',
                        textColor: [41, 98, 165],
                        halign: 'center'
                    }
                },
                margin: { left: 25, right: 25 },
                alternateRowStyles: {
                    fillColor: [252, 252, 252]
                }
            });

            currentY = doc.lastAutoTable.finalY + 25;
        }

        // Financial Summary Section with enhanced Roman elegance
        if (data.includeFinancialSummary) {
            this.addSectionHeader(doc, 'III. SUMMA FINANCIALIS', currentY, '💰');
            currentY += 20;

            const totalCosts = (data.fuelCosts || 0) + (data.maintenanceCosts || 0);
            const costPerKm = data.totalDistance > 0 ? (totalCosts / data.totalDistance).toFixed(2) : 0;

            // Cost efficiency indicator
            const efficiencyColor = costPerKm <= 5 ? [34, 197, 94] : costPerKm <= 10 ? [251, 191, 36] : [239, 68, 68];
            doc.setFillColor(...efficiencyColor);
            doc.roundedRect(140, currentY - 15, 45, 12, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('times', 'bold');
            doc.text(`${costPerKm} ETB/KM`, 162.5, currentY - 8, { align: 'center' });

            const financialData = [
                ['💧 Sumptus Combustibilis', `${data.fuelCosts || 0} ETB`],
                ['🔧 Sumptus Conservationis', `${data.maintenanceCosts || 0} ETB`],
                ['📊 Totalis Sumptus Operandi', `${totalCosts} ETB`],
                ['📈 Sumptus per Kilometrum', `${costPerKm} ETB/km`],
                ['💡 Efficentia Index', totalCosts > 0 ? ((data.totalDistance || 0) / totalCosts * 100).toFixed(1) + ' km/100ETB' : 'N/A']
            ];

            doc.autoTable({
                startY: currentY,
                body: financialData,
                theme: 'striped',
                styles: {
                    font: 'times',
                    fontSize: 11,
                    cellPadding: 10,
                    lineColor: [41, 98, 165],
                    lineWidth: 0.8,
                    textColor: [35, 35, 35],
                    letterSpacing: 0.4,
                    lineHeight: 1.6
                },
                columnStyles: {
                    0: {
                        fontStyle: 'bolditalic',
                        cellWidth: 100,
                        fillColor: [248, 250, 255],
                        textColor: [25, 55, 95]
                    },
                    1: {
                        cellWidth: 70,
                        fontStyle: 'bold',
                        textColor: [41, 98, 165],
                        halign: 'center'
                    }
                },
                margin: { left: 25, right: 25 },
                alternateRowStyles: {
                    fillColor: [252, 252, 252]
                }
            });

            currentY = doc.lastAutoTable.finalY + 25;
        }

        // Enhanced Recommendations Section
        const recommendations = this.getDriverRecommendations(data);
        this.addSectionHeader(doc, 'IV. COMMENDATIONES ET CONSILIUM', currentY, '💡');
        currentY += 20;

        // Recommendation cards with icons
        const recIcons = ['🎯', '📈', '⚡', '🛡️', '🌟'];
        recommendations.forEach((rec, index) => {
            // Card background
            doc.setFillColor(248, 250, 255);
            doc.roundedRect(25, currentY - 5, 160, 15, 3, 3, 'F');

            // Card border
            doc.setDrawColor(41, 98, 165);
            doc.setLineWidth(0.5);
            doc.roundedRect(25, currentY - 5, 160, 15, 3, 3, 'S');

            doc.setTextColor(25, 55, 95);
            doc.setFontSize(11);
            doc.setFont('times', 'bold');
            doc.text(`${recIcons[index] || '•'}`, 30, currentY + 3);

            doc.setFont('times', 'normal');
            doc.setTextColor(35, 35, 35);
            const wrappedText = doc.splitTextToSize(rec, 140);
            doc.text(wrappedText, 40, currentY + 3);
            currentY += 20;
        });

        // Professional Signature Section with enhanced Roman elegance
        currentY += 15;

        // Decorative separator with gradient effect
        doc.setFillColor(41, 98, 165);
        doc.rect(25, currentY, 160, 3, 'F');
        doc.setFillColor(218, 165, 32);
        doc.rect(25, currentY + 3, 160, 1, 'F');

        // Decorative corner elements
        doc.setFillColor(218, 165, 32);
        doc.circle(30, currentY + 1.5, 3, 'F');
        doc.circle(180, currentY + 1.5, 3, 'F');

        // Inner circles
        doc.setFillColor(41, 98, 165);
        doc.circle(30, currentY + 1.5, 1.5, 'F');
        doc.circle(180, currentY + 1.5, 1.5, 'F');

        currentY += 18;

        // Enhanced signature section
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text('❦ DOCUMENTUM OFFICIALE HU-VMS ❦', 105, currentY, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('times', 'italic');
        doc.setTextColor(70, 70, 70);
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        doc.text(`Datum: ${currentDate} • Tempus: ${currentTime}`, 105, currentY + 12, { align: 'center' });

        // Authentication seal
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(2);
        doc.circle(105, currentY + 25, 15, 'S');
        doc.setTextColor(218, 165, 32);
        doc.setFontSize(8);
        doc.setFont('times', 'bold');
        doc.text('HARAMAYA', 105, currentY + 22, { align: 'center' });
        doc.text('UNIVERSITY', 105, currentY + 28, { align: 'center' });

        this.addFooter(doc, 1, 1);

        const fileName = `HU-VMS_Driver_Report_${data.period}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }
    // Generate Fuel Station Report PDF with Sophisticated Roman Typography
    generateFuelStationReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'FUEL STATION OPERATIONS REPORT', `${data.period} Fuel Management Analysis • Haramaya University`);

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Transport Office',
            department: recipient === 'Admin' ? 'University Administration' : 'Transport Management Department'
        };
        this.addRecipient(doc, recipientInfo, 65);

        let currentY = 110;

        // Enhanced report period badge with gradient effect
        doc.setFillColor(184, 134, 11);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'F');

        // Inner gradient effect
        doc.setFillColor(194, 144, 21);
        doc.roundedRect(22, currentY + 2, 166, 18, 6, 6, 'F');

        // Golden accent border
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(1.5);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'S');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text(`⛽ ${data.period.toUpperCase()} COMBUSTIBILIS ANALYSIS ⛽`, 105, currentY + 14, { align: 'center' });

        currentY += 35;

        // Station Information Section with enhanced Roman elegance
        this.addSectionHeader(doc, 'I. STATIO COMBUSTIBILIS INFORMATIO', currentY, '⛽');
        currentY += 20;

        const stationInfo = [
            ['Nomen Stationis', data.stationName || 'HU Principalis Statio Combustibilis'],
            ['Numerus Stationis', data.stationId || 'FS-001'],
            ['Nomen Officialis', data.officerName || 'Officialis Combustibilis'],
            ['Tempus Relationis', data.period || 'Mensilis'],
            ['Datum Relationis', new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })],
            ['Status Operandi', 'Activus']
        ];

        doc.autoTable({
            startY: currentY,
            body: stationInfo,
            theme: 'grid',
            styles: {
                font: 'times',
                fontSize: 11,
                cellPadding: 10,
                lineColor: [184, 134, 11],
                lineWidth: 0.8,
                textColor: [35, 35, 35],
                letterSpacing: 0.4,
                lineHeight: 1.6
            },
            columnStyles: {
                0: {
                    fontStyle: 'bolditalic',
                    cellWidth: 80,
                    fillColor: [255, 251, 235],
                    textColor: [25, 55, 95]
                },
                1: {
                    cellWidth: 90,
                    fontStyle: 'normal',
                    fillColor: [255, 255, 255]
                }
            },
            margin: { left: 25, right: 25 },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            }
        });

        currentY = doc.lastAutoTable.finalY + 30;

        // Fuel Dispensing Statistics with enhanced styling
        if (data.includeSummary) {
            this.addSectionHeader(doc, 'II. STATISTICAE DISPENSATIONIS COMBUSTIBILIS', currentY, '📊');
            currentY += 20;

            const successRate = data.totalTransactions > 0 ? ((data.completedTransactions / data.totalTransactions) * 100).toFixed(1) : 0;

            // Success rate indicator badge
            const badgeColor = successRate >= 95 ? [34, 197, 94] : successRate >= 85 ? [251, 191, 36] : [239, 68, 68];
            doc.setFillColor(...badgeColor);
            doc.roundedRect(140, currentY - 15, 45, 12, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('times', 'bold');
            doc.text(`${successRate}% SUCCESS`, 162.5, currentY - 8, { align: 'center' });

            const summaryData = [
                ['⛽ Totalis Combustibilis Dispensatus', `${data.totalFuel || 0} Litri`],
                ['🚛 Diesel Dispensatus', `${data.dieselDispensed || 0} Litri`],
                ['🚗 Benzinum Dispensatum', `${data.petrolDispensed || 0} Litri`],
                ['📋 Totales Transactiones', (data.totalTransactions || 0).toString()],
                ['✅ Transactiones Completae', (data.completedTransactions || 0).toString()],
                ['📊 Media per Transactionem', `${data.totalTransactions > 0 ? (data.totalFuel / data.totalTransactions).toFixed(1) : 0} L`],
                ['🎯 Ratio Successus', `${successRate}%`],
                ['⏱️ Tempus Medius Dispensationis', `${data.avgDispenseTime || 5} min`]
            ];

            doc.autoTable({
                startY: currentY,
                body: summaryData,
                theme: 'striped',
                styles: {
                    font: 'times',
                    fontSize: 11,
                    cellPadding: 10,
                    lineColor: [184, 134, 11],
                    lineWidth: 0.8,
                    textColor: [35, 35, 35],
                    letterSpacing: 0.4,
                    lineHeight: 1.6
                },
                columnStyles: {
                    0: {
                        fontStyle: 'bolditalic',
                        cellWidth: 100,
                        fillColor: [255, 251, 235],
                        textColor: [25, 55, 95]
                    },
                    1: {
                        cellWidth: 70,
                        fontStyle: 'bold',
                        textColor: [184, 134, 11],
                        halign: 'center'
                    }
                },
                margin: { left: 25, right: 25 },
                alternateRowStyles: {
                    fillColor: [252, 252, 252]
                }
            });

            currentY = doc.lastAutoTable.finalY + 25;
        }

        // Financial Summary Section with enhanced Roman elegance
        if (data.includeFinancialSummary) {
            this.addSectionHeader(doc, 'III. SUMMA FINANCIALIS', currentY, '💰');
            currentY += 20;

            const dieselCost = (data.dieselDispensed || 0) * (data.dieselPrice || 45);
            const petrolCost = (data.petrolDispensed || 0) * (data.petrolPrice || 50);
            const totalRevenue = dieselCost + petrolCost;
            const netProfit = totalRevenue - (data.operatingCosts || 0);
            const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

            // Profit margin indicator
            const marginColor = profitMargin >= 20 ? [34, 197, 94] : profitMargin >= 10 ? [251, 191, 36] : [239, 68, 68];
            doc.setFillColor(...marginColor);
            doc.roundedRect(140, currentY - 15, 45, 12, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('times', 'bold');
            doc.text(`${profitMargin}% MARGIN`, 162.5, currentY - 8, { align: 'center' });

            const financialData = [
                ['💧 Reditus Diesel', `${dieselCost.toFixed(2)} ETB`],
                ['⛽ Reditus Benzini', `${petrolCost.toFixed(2)} ETB`],
                ['📊 Totalis Reditus', `${totalRevenue.toFixed(2)} ETB`],
                ['💸 Sumptus Operandi', `${data.operatingCosts || 0} ETB`],
                ['💰 Lucrum Nettum', `${netProfit.toFixed(2)} ETB`],
                ['📈 Margo Lucri', `${profitMargin}%`],
                ['💡 Reditus per Litrum', `${data.totalFuel > 0 ? (totalRevenue / data.totalFuel).toFixed(2) : 0} ETB/L`]
            ];

            doc.autoTable({
                startY: currentY,
                body: financialData,
                theme: 'striped',
                styles: {
                    font: 'times',
                    fontSize: 11,
                    cellPadding: 10,
                    lineColor: [184, 134, 11],
                    lineWidth: 0.8,
                    textColor: [35, 35, 35],
                    letterSpacing: 0.4,
                    lineHeight: 1.6
                },
                columnStyles: {
                    0: {
                        fontStyle: 'bolditalic',
                        cellWidth: 100,
                        fillColor: [255, 251, 235],
                        textColor: [25, 55, 95]
                    },
                    1: {
                        cellWidth: 70,
                        fontStyle: 'bold',
                        textColor: [184, 134, 11],
                        halign: 'center'
                    }
                },
                margin: { left: 25, right: 25 },
                alternateRowStyles: {
                    fillColor: [252, 252, 252]
                }
            });

            currentY = doc.lastAutoTable.finalY + 25;
        }

        // Enhanced Recommendations Section
        const fuelRecommendations = [
            'Optimizare dispensationis processus pro efficientiam',
            'Monitorare inventarium combustibilis regulariter',
            'Implementare systema qualitatis combustibilis',
            'Conservare equipmentum dispensationis',
            'Augere securitatem stationis combustibilis'
        ];

        this.addSectionHeader(doc, 'IV. COMMENDATIONES OPERANDI', currentY, '💡');
        currentY += 20;

        // Recommendation cards with icons
        const recIcons = ['🎯', '📊', '🔧', '🛡️', '⚡'];
        fuelRecommendations.forEach((rec, index) => {
            // Card background
            doc.setFillColor(255, 251, 235);
            doc.roundedRect(25, currentY - 5, 160, 15, 3, 3, 'F');

            // Card border
            doc.setDrawColor(184, 134, 11);
            doc.setLineWidth(0.5);
            doc.roundedRect(25, currentY - 5, 160, 15, 3, 3, 'S');

            doc.setTextColor(25, 55, 95);
            doc.setFontSize(11);
            doc.setFont('times', 'bold');
            doc.text(`${recIcons[index] || '•'}`, 30, currentY + 3);

            doc.setFont('times', 'normal');
            doc.setTextColor(35, 35, 35);
            const wrappedText = doc.splitTextToSize(rec, 140);
            doc.text(wrappedText, 40, currentY + 3);
            currentY += 20;
        });

        // Professional Signature Section with enhanced Roman elegance
        currentY += 15;

        // Decorative separator with gradient effect
        doc.setFillColor(184, 134, 11);
        doc.rect(25, currentY, 160, 3, 'F');
        doc.setFillColor(218, 165, 32);
        doc.rect(25, currentY + 3, 160, 1, 'F');

        // Decorative corner elements
        doc.setFillColor(218, 165, 32);
        doc.circle(30, currentY + 1.5, 3, 'F');
        doc.circle(180, currentY + 1.5, 3, 'F');

        // Inner circles
        doc.setFillColor(184, 134, 11);
        doc.circle(30, currentY + 1.5, 1.5, 'F');
        doc.circle(180, currentY + 1.5, 1.5, 'F');

        currentY += 18;

        // Enhanced signature section
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text('⛽ DOCUMENTUM STATIONIS COMBUSTIBILIS HU-VMS ⛽', 105, currentY, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('times', 'italic');
        doc.setTextColor(70, 70, 70);
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        doc.text(`Datum: ${currentDate} • Tempus: ${currentTime}`, 105, currentY + 12, { align: 'center' });

        // Authentication seal
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(2);
        doc.circle(105, currentY + 25, 15, 'S');
        doc.setTextColor(218, 165, 32);
        doc.setFontSize(8);
        doc.setFont('times', 'bold');
        doc.text('HARAMAYA', 105, currentY + 22, { align: 'center' });
        doc.text('FUEL STATION', 105, currentY + 28, { align: 'center' });

        this.addFooter(doc, 1, 1);
        const fileName = `HU-VMS_Fuel_Station_Report_${data.period}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }
    // Generate Gate Security Report PDF with Sophisticated Roman Typography
    generateGateSecurityReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'GATE SECURITY OPERATIONS REPORT', `${data.period} Security Analysis • Haramaya University`);

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Security Department',
            department: recipient === 'Admin' ? 'University Administration' : 'Campus Security Department'
        };
        this.addRecipient(doc, recipientInfo, 65);

        let currentY = 110;

        // Enhanced report period badge with gradient effect
        doc.setFillColor(153, 27, 27);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'F');

        // Inner gradient effect
        doc.setFillColor(163, 37, 37);
        doc.roundedRect(22, currentY + 2, 166, 18, 6, 6, 'F');

        // Golden accent border
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(1.5);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'S');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text(`🚪 ${data.period.toUpperCase()} SECURITAS ANALYSIS 🚪`, 105, currentY + 14, { align: 'center' });

        currentY += 35;

        // Security Officer Information with enhanced Roman elegance
        this.addSectionHeader(doc, 'I. OFFICIALIS SECURITATIS INFORMATIO', currentY, '🛡️');
        currentY += 20;

        const officerInfo = [
            ['Nomen Officialis', data.officerName || 'Officialis Securitatis'],
            ['Numerus Insignis', data.badgeNumber || 'SEC-001'],
            ['Statio Portae', data.gateStation || 'Porta Principalis'],
            ['Tempus Vigiliae', data.shiftPeriod || 'Vigilia Diurna'],
            ['Tempus Relationis', data.period || 'Mensilis'],
            ['Status Securitatis', 'Activus']
        ];

        doc.autoTable({
            startY: currentY,
            body: officerInfo,
            theme: 'grid',
            styles: {
                font: 'times',
                fontSize: 11,
                cellPadding: 10,
                lineColor: [153, 27, 27],
                lineWidth: 0.8,
                textColor: [35, 35, 35],
                letterSpacing: 0.4,
                lineHeight: 1.6
            },
            columnStyles: {
                0: {
                    fontStyle: 'bolditalic',
                    cellWidth: 80,
                    fillColor: [254, 242, 242],
                    textColor: [25, 55, 95]
                },
                1: {
                    cellWidth: 90,
                    fontStyle: 'normal',
                    fillColor: [255, 255, 255]
                }
            },
            margin: { left: 25, right: 25 },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            }
        });

        currentY = doc.lastAutoTable.finalY + 30;

        // Vehicle Movement Statistics with enhanced styling
        this.addSectionHeader(doc, 'II. STATISTICAE MOTUS VEHICULORUM', currentY, '🚗');
        currentY += 20;

        const authRate = data.totalEntries > 0 ? ((data.authorizedEntries / data.totalEntries) * 100).toFixed(1) : 0;

        // Authorization rate indicator badge
        const badgeColor = authRate >= 95 ? [34, 197, 94] : authRate >= 85 ? [251, 191, 36] : [239, 68, 68];
        doc.setFillColor(...badgeColor);
        doc.roundedRect(140, currentY - 15, 45, 12, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('times', 'bold');
        doc.text(`${authRate}% AUTH`, 162.5, currentY - 8, { align: 'center' });

        const movementData = [
            ['🚪 Totales Ingressus Vehiculorum', (data.totalEntries || 0).toString()],
            ['🚗 Totales Egressus Vehiculorum', (data.totalExits || 0).toString()],
            ['✅ Ingressus Auctorizati', (data.authorizedEntries || 0).toString()],
            ['❌ Conatus Non Auctorizati', (data.unauthorizedEntries || 0).toString()],
            ['🏢 Vehicula Nunc Intus', (data.vehiclesInside || 0).toString()],
            ['📊 Media Trafficus Diurnus', `${data.totalEntries && data.period === 'Monthly' ? Math.round(data.totalEntries / 30) : data.totalEntries || 0} vehicula`],
            ['🎯 Ratio Successus Auctorizationis', `${authRate}%`],
            ['⏱️ Tempus Medius Processus', `${data.avgProcessTime || 3} min`]
        ];

        doc.autoTable({
            startY: currentY,
            body: movementData,
            theme: 'striped',
            styles: {
                font: 'times',
                fontSize: 11,
                cellPadding: 10,
                lineColor: [153, 27, 27],
                lineWidth: 0.8,
                textColor: [35, 35, 35],
                letterSpacing: 0.4,
                lineHeight: 1.6
            },
            columnStyles: {
                0: {
                    fontStyle: 'bolditalic',
                    cellWidth: 100,
                    fillColor: [254, 242, 242],
                    textColor: [25, 55, 95]
                },
                1: {
                    cellWidth: 70,
                    fontStyle: 'bold',
                    textColor: [153, 27, 27],
                    halign: 'center'
                }
            },
            margin: { left: 25, right: 25 },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            }
        });

        currentY = doc.lastAutoTable.finalY + 25;

        // Security Incidents Analysis with enhanced styling
        this.addSectionHeader(doc, 'III. ANALYSIS INCIDENTIUM SECURITATIS', currentY, '🚨');
        currentY += 20;

        const securityAssessment = this.getSecurityAssessment(data);
        const totalIncidents = (data.securityBreaches || 0) + (data.unauthorizedEntries || 0) + (data.falseAlarms || 0) + (data.equipmentIssues || 0);

        // Security level indicator
        const levelColor = securityAssessment.level === 'EXCELLENS' ? [34, 197, 94] :
            securityAssessment.level === 'BONUS' ? [251, 191, 36] : [239, 68, 68];
        doc.setFillColor(...levelColor);
        doc.roundedRect(140, currentY - 15, 45, 12, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('times', 'bold');
        doc.text(securityAssessment.level, 162.5, currentY - 8, { align: 'center' });

        const incidentData = [
            ['🚨 Violationes Securitatis', (data.securityBreaches || 0).toString()],
            ['🚫 Ingressus Non Auctorizati', (data.unauthorizedEntries || 0).toString()],
            ['⚠️ Alarma Falsa', (data.falseAlarms || 0).toString()],
            ['🔧 Malfunctiones Instrumentorum', (data.equipmentIssues || 0).toString()],
            ['📊 Totalia Incidentia', totalIncidents.toString()],
            ['🛡️ Aestimatio Gradus Securitatis', securityAssessment.level],
            ['⏱️ Tempus Responsionis Medius', `${data.avgResponseTime || 5} minuta`],
            ['📈 Index Securitatis', `${totalIncidents === 0 ? 100 : Math.max(0, 100 - (totalIncidents * 5))}%`]
        ];

        doc.autoTable({
            startY: currentY,
            body: incidentData,
            theme: 'striped',
            styles: {
                font: 'times',
                fontSize: 11,
                cellPadding: 10,
                lineColor: [153, 27, 27],
                lineWidth: 0.8,
                textColor: [35, 35, 35],
                letterSpacing: 0.4,
                lineHeight: 1.6
            },
            columnStyles: {
                0: {
                    fontStyle: 'bolditalic',
                    cellWidth: 100,
                    fillColor: [254, 242, 242],
                    textColor: [25, 55, 95]
                },
                1: {
                    cellWidth: 70,
                    fontStyle: 'bold',
                    textColor: [153, 27, 27],
                    halign: 'center'
                }
            },
            margin: { left: 25, right: 25 },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            }
        });

        currentY = doc.lastAutoTable.finalY + 25;

        // Enhanced Security Recommendations Section
        const recommendations = [];
        if ((data.unauthorizedEntries || 0) > 0) {
            recommendations.push('Proceduras verificandi accessum controllem augere');
        }
        if ((data.equipmentIssues || 0) > 2) {
            recommendations.push('Conservationem instrumentorum comprehensivam ordinare');
        }
        if ((data.falseAlarms || 0) > 5) {
            recommendations.push('Sensitivitatem alarmorum calibrare');
        }
        if ((data.avgResponseTime || 5) > 10) {
            recommendations.push('Tempus responsionis incidentium optimizare');
        }
        if (recommendations.length === 0) {
            recommendations.push('Standards excellentes securitatis continuare');
            recommendations.push('Inspectiones regulares instrumentorum et disciplinam personalem');
        }

        this.addSectionHeader(doc, 'IV. COMMENDATIONES SECURITATIS', currentY, '💡');
        currentY += 20;

        // Recommendation cards with icons
        const recIcons = ['🎯', '🔧', '⚡', '🛡️', '📊'];
        recommendations.forEach((rec, index) => {
            // Card background
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(25, currentY - 5, 160, 15, 3, 3, 'F');

            // Card border
            doc.setDrawColor(153, 27, 27);
            doc.setLineWidth(0.5);
            doc.roundedRect(25, currentY - 5, 160, 15, 3, 3, 'S');

            doc.setTextColor(25, 55, 95);
            doc.setFontSize(11);
            doc.setFont('times', 'bold');
            doc.text(`${recIcons[index] || '•'}`, 30, currentY + 3);

            doc.setFont('times', 'normal');
            doc.setTextColor(35, 35, 35);
            const wrappedText = doc.splitTextToSize(rec, 140);
            doc.text(wrappedText, 40, currentY + 3);
            currentY += 20;
        });

        // Professional Signature Section with enhanced Roman elegance
        currentY += 15;

        // Decorative separator with gradient effect
        doc.setFillColor(153, 27, 27);
        doc.rect(25, currentY, 160, 3, 'F');
        doc.setFillColor(218, 165, 32);
        doc.rect(25, currentY + 3, 160, 1, 'F');

        // Decorative corner elements
        doc.setFillColor(218, 165, 32);
        doc.circle(30, currentY + 1.5, 3, 'F');
        doc.circle(180, currentY + 1.5, 3, 'F');

        // Inner circles
        doc.setFillColor(153, 27, 27);
        doc.circle(30, currentY + 1.5, 1.5, 'F');
        doc.circle(180, currentY + 1.5, 1.5, 'F');

        currentY += 18;

        // Enhanced signature section
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text('🚪 DOCUMENTUM SECURITATIS HU-VMS 🚪', 105, currentY, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('times', 'italic');
        doc.setTextColor(70, 70, 70);
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        doc.text(`Datum: ${currentDate} • Tempus: ${currentTime}`, 105, currentY + 12, { align: 'center' });

        // Authentication seal
        doc.setDrawColor(218, 165, 32);
        doc.setLineWidth(2);
        doc.circle(105, currentY + 25, 15, 'S');
        doc.setTextColor(218, 165, 32);
        doc.setFontSize(8);
        doc.setFont('times', 'bold');
        doc.text('HARAMAYA', 105, currentY + 22, { align: 'center' });
        doc.text('SECURITY', 105, currentY + 28, { align: 'center' });

        this.addFooter(doc, 1, 1);
        const fileName = `HU-VMS_Gate_Security_Report_${data.period}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }
    // Generate Fuel Report PDF
    generateFuelReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'Fuel Report', 'Driver Fuel Management');

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Transport Office',
            department: recipient === 'Admin' ? 'University Administration' : 'Transport Management Department'
        };
        this.addRecipient(doc, recipientInfo, 60);

        // Report type badge
        const reportType = data.reportType === 'refill' ? 'FUEL REFILL' : 'FUEL CONSUMPTION';
        doc.setFillColor(74, 144, 226);
        doc.roundedRect(20, 95, 80, 15, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('times', 'bolditalic');
        doc.text(reportType, 60, 104, { align: 'center' });

        // Details table
        const tableData = [
            ['Date', data.date || new Date().toLocaleDateString()],
            ['Amount', `${data.amount} Liters`],
            ['Odometer Reading', `${data.odometer} km`],
            ['Driver Name', data.driverName || 'John Doe'],
            ['Vehicle ID', data.vehicleId || 'VEH-001'],
            ['License Plate', data.licensePlate || 'ABC-1234']
        ];

        if (data.reportType === 'refill' && data.cost) {
            tableData.splice(3, 0, ['Cost', `${data.cost} ETB`]);
        }
        if (data.station) {
            tableData.push(['Gas Station', data.station]);
        }

        doc.autoTable({
            startY: 120,
            body: tableData,
            theme: 'grid',
            styles: { font: 'times', fontSize: 10, cellPadding: 6, lineColor: [74, 144, 226], lineWidth: 0.3, textColor: [51, 51, 51] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 110 } },
            margin: { left: 20, right: 20 }
        });

        this.addFooter(doc, 1, 1);
        const fileName = `HU-VMS_Fuel_Report_${data.reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }
    // Generate Vehicle Issue Report PDF
    generateVehicleIssueReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'Vehicle Issue Report', 'Maintenance & Issue Reporting');

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Transport Office',
            department: recipient === 'Admin' ? 'University Administration' : 'Transport Management Department'
        };
        this.addRecipient(doc, recipientInfo, 60);

        // Priority badge
        const priority = data.priority || 'medium';
        const priorityColors = { low: [76, 175, 80], medium: [255, 152, 0], high: [244, 67, 54] };

        doc.setFillColor(...priorityColors[priority]);
        doc.roundedRect(20, 95, 80, 15, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('times', 'bolditalic');
        doc.text(`${priority.toUpperCase()} PRIORITY`, 60, 104, { align: 'center' });

        // Issue details table
        const tableData = [
            ['Report Date', data.date || new Date().toLocaleDateString()],
            ['Issue Type', data.issueType || 'Mechanical'],
            ['Priority Level', priority.toUpperCase()],
            ['Vehicle ID', data.vehicleId || 'VEH-001'],
            ['License Plate', data.licensePlate || 'ABC-1234'],
            ['Current Odometer', `${data.odometer || 'N/A'} km`],
            ['Driver Name', data.driverName || 'John Doe']
        ];

        doc.autoTable({
            startY: 120,
            body: tableData,
            theme: 'grid',
            styles: { font: 'times', fontSize: 10, cellPadding: 6, lineColor: [74, 144, 226], lineWidth: 0.3, textColor: [51, 51, 51] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 110 } },
            margin: { left: 20, right: 20 }
        });

        this.addFooter(doc, 1, 1);
        const fileName = `HU-VMS_Vehicle_Issue_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }
    // Generate Complaint Report PDF
    generateComplaintReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'Complaint Report', 'Driver Complaint Submission');

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Transport Office',
            department: recipient === 'Admin' ? 'University Administration' : 'Transport Management Department'
        };
        this.addRecipient(doc, recipientInfo, 60);

        // Complaint details table
        const tableData = [
            ['Submission Date', data.date || new Date().toLocaleDateString()],
            ['Complaint Type', data.type || 'General'],
            ['Driver Name', data.driverName || 'John Doe'],
            ['Vehicle ID', data.vehicleId || 'VEH-001'],
            ['Contact', data.contact || 'N/A']
        ];

        doc.autoTable({
            startY: 100,
            body: tableData,
            theme: 'grid',
            styles: { font: 'times', fontSize: 10, cellPadding: 6, lineColor: [74, 144, 226], lineWidth: 0.3, textColor: [51, 51, 51] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 110 } },
            margin: { left: 20, right: 20 }
        });

        this.addFooter(doc, 1, 1);
        const fileName = `HU-VMS_Complaint_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }

    // Generate Trip Report PDF
    generateTripReport(data, recipient = 'Admin') {
        const doc = new jsPDF();
        this.addHeader(doc, 'Trip Report', 'Vehicle Trip Documentation');

        const recipientInfo = {
            name: recipient === 'Admin' ? 'Administration Office' : 'Transport Office',
            department: recipient === 'Admin' ? 'University Administration' : 'Transport Management Department'
        };
        this.addRecipient(doc, recipientInfo, 60);

        // Trip details table
        const tableData = [
            ['Trip Date', data.date || new Date().toLocaleDateString()],
            ['Driver Name', data.driverName || 'John Doe'],
            ['Vehicle ID', data.vehicleId || 'VEH-001'],
            ['Pickup Location', data.pickupLocation || 'N/A'],
            ['Destination', data.destination || 'N/A'],
            ['Start Time', data.startTime || 'N/A'],
            ['End Time', data.endTime || 'N/A'],
            ['Distance', `${data.distance || 'N/A'} km`],
            ['Fuel Used', `${data.fuelUsed || 'N/A'} L`],
            ['Trip Status', data.status || 'Completed']
        ];

        doc.autoTable({
            startY: 100,
            body: tableData,
            theme: 'grid',
            styles: { font: 'times', fontSize: 10, cellPadding: 6, lineColor: [74, 144, 226], lineWidth: 0.3, textColor: [51, 51, 51] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 110 } },
            margin: { left: 20, right: 20 }
        });

        this.addFooter(doc, 1, 1);
        const fileName = `HU-VMS_Trip_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }

    // ── Generate Maintenance Report PDF ──────────────────────────────
    generateMaintenanceReport(data, recipient = 'Both') {
        const doc = new jsPDF();
        const recipientLabel = recipient === 'Both'
            ? 'Administration Office & Transport Office'
            : recipient === 'Admin' ? 'Administration Office' : 'Transport Office';

        this.addHeader(doc, 'VEHICLE MAINTENANCE REPORT',
            `${data.period} Repair & Maintenance Analysis • Haramaya University`);

        const recipientInfo = {
            name: recipientLabel,
            department: 'Haramaya University — Vehicle Management System',
        };
        this.addRecipient(doc, recipientInfo, 65);

        let currentY = 110;

        // Period badge
        doc.setFillColor(30, 90, 60);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'F');
        doc.setFillColor(40, 110, 75);
        doc.roundedRect(22, currentY + 2, 166, 18, 6, 6, 'F');
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(1.5);
        doc.roundedRect(20, currentY, 170, 22, 8, 8, 'S');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('times', 'bolditalic');
        doc.text(`VEHICLE MAINTENANCE — ${data.period.toUpperCase()} REPORT`, 105, currentY + 14, { align: 'center' });
        currentY += 35;

        // Section I — Summary
        this.addSectionHeader(doc, 'I. MAINTENANCE SUMMARY', currentY, '📊');
        currentY += 20;

        const summaryRows = [
            ['Total Repairs Completed',   (data.totalResolved || 0).toString()],
            ['Currently In Repair',        (data.inRepair || 0).toString()],
            ['Pending Review',             (data.pending || 0).toString()],
            ['Critical Repairs',           (data.criticalCount || 0).toString()],
            ['Report Period',              `${data.startDate} to ${data.endDate}`],
            ['Generated By',              data.generatedBy || 'Maintenance Officer'],
            ['Generated On',              new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
        ];

        doc.autoTable({
            startY: currentY,
            body: summaryRows,
            theme: 'striped',
            styles: { font: 'times', fontSize: 11, cellPadding: 9, lineColor: [34, 197, 94], lineWidth: 0.8, textColor: [35, 35, 35] },
            columnStyles: {
                0: { fontStyle: 'bolditalic', cellWidth: 100, fillColor: [240, 253, 244], textColor: [25, 55, 95] },
                1: { cellWidth: 70, fontStyle: 'bold', textColor: [22, 101, 52], halign: 'center' },
            },
            margin: { left: 25, right: 25 },
            alternateRowStyles: { fillColor: [252, 252, 252] },
        });
        currentY = doc.lastAutoTable.finalY + 25;

        // Section II — Repaired Vehicles
        if (data.resolved && data.resolved.length > 0) {
            this.addSectionHeader(doc, 'II. REPAIRED VEHICLES', currentY, '🚗');
            currentY += 20;

            const repairRows = data.resolved.map((r, i) => [
                (i + 1).toString(),
                r.vehicle?.plateNumber || '—',
                r.vehicle?.model || '—',
                r.issueType || '—',
                r.severity || '—',
                r.reportedBy?.name || '—',
                r.resolvedBy?.name || '—',
                r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '—',
            ]);

            doc.autoTable({
                startY: currentY,
                head: [['#', 'Plate No.', 'Model', 'Issue Type', 'Severity', 'Reported By', 'Resolved By', 'Date Resolved']],
                body: repairRows,
                theme: 'grid',
                styles: { font: 'times', fontSize: 9, cellPadding: 6, lineColor: [34, 197, 94], lineWidth: 0.5, textColor: [35, 35, 35] },
                headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 22, fontStyle: 'bold' },
                    2: { cellWidth: 28 },
                    3: { cellWidth: 28 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 28 },
                    6: { cellWidth: 28 },
                    7: { cellWidth: 22 },
                },
                margin: { left: 15, right: 15 },
                alternateRowStyles: { fillColor: [240, 253, 244] },
                didParseCell: (hookData) => {
                    if (hookData.section === 'body' && hookData.column.index === 4) {
                        const sev = hookData.cell.raw;
                        if (sev === 'Critical') hookData.cell.styles.textColor = [220, 38, 38];
                        else if (sev === 'Moderate') hookData.cell.styles.textColor = [217, 119, 6];
                        else hookData.cell.styles.textColor = [146, 64, 14];
                    }
                },
            });
            currentY = doc.lastAutoTable.finalY + 25;
        }

        // Section III — Resolution Notes
        if (data.resolved && data.resolved.filter(r => r.resolutionNotes).length > 0) {
            // Check if we need a new page
            if (currentY > 220) { doc.addPage(); currentY = 30; }
            this.addSectionHeader(doc, 'III. RESOLUTION NOTES & COST DETAILS', currentY, '📝');
            currentY += 20;

            const noteRows = data.resolved
                .filter(r => r.resolutionNotes)
                .map(r => [
                    r.vehicle?.plateNumber || '—',
                    r.issueType || '—',
                    r.resolutionNotes?.slice(0, 120) + (r.resolutionNotes?.length > 120 ? '...' : '') || '—',
                ]);

            doc.autoTable({
                startY: currentY,
                head: [['Vehicle Plate', 'Issue Type', 'Resolution Notes & Cost Details']],
                body: noteRows,
                theme: 'striped',
                styles: { font: 'times', fontSize: 10, cellPadding: 8, lineColor: [34, 197, 94], lineWidth: 0.5, textColor: [35, 35, 35] },
                headStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 30, fontStyle: 'bold' },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 115 },
                },
                margin: { left: 15, right: 15 },
                alternateRowStyles: { fillColor: [240, 253, 244] },
            });
            currentY = doc.lastAutoTable.finalY + 20;
        }

        // Official signature block
        if (currentY > 230) { doc.addPage(); currentY = 30; }
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(1.5);
        doc.line(25, currentY, 185, currentY);
        currentY += 12;
        doc.setTextColor(25, 55, 95);
        doc.setFontSize(13);
        doc.setFont('times', 'bolditalic');
        doc.text('OFFICIAL DOCUMENT — HARAMAYA UNIVERSITY VEHICLE MANAGEMENT SYSTEM', 105, currentY, { align: 'center' });
        currentY += 10;
        doc.setFontSize(10);
        doc.setFont('times', 'italic');
        doc.setTextColor(70, 70, 70);
        doc.text(`Generated: ${new Date().toLocaleString()} | Recipient: ${recipientLabel}`, 105, currentY, { align: 'center' });

        this.addFooter(doc, 1, doc.internal.getNumberOfPages());

        const fileName = `HU-VMS_Maintenance_Report_${data.period}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        return fileName;
    }
}

// Create and export the PDF generator instance
const pdfGenerator = new PDFGenerator();
export default pdfGenerator;