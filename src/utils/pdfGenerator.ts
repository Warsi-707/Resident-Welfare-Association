import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Challan, Member, AssociationSettings } from '../types';

async function resolveLogoDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadChallanPdf(
  challan: Challan,
  member: Member | null | undefined,
  settings: AssociationSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const memberName = challan.memberName || member?.fullName || 'Resident Member';
  const contact = member?.contactNumber || member?.phone || challan.contactNumber || '—';
  const propertyType = member?.memberType === 'COMMERCIAL' ? 'Commercial' : 'Residential';
  const floorsList =
    member?.floors && member.floors.length > 0
      ? member.floors.join(', ')
      : member?.plotNumber || challan.houseNumber || 'Basement';
  const address = challan.address || member?.address || challan.houseNumber || 'Karachi, Pakistan';
  const billingMonth = challan.month || 'Current Month';

  const formatDisplayDate = (d?: string) => {
    if (!d) return '10-Nov-2026';
    try {
      const cleanD = d.split('T')[0];
      const parts = cleanD.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return `${day}-${months[monthIndex] || parts[1]}-${year}`;
      }
    } catch {}
    return d;
  };

  const dueDate = formatDisplayDate(challan.dueDate);
  const issueDate = formatDisplayDate(challan.generatedDate || new Date().toISOString());

  const isPaid = challan.status === 'Paid';
  const isPartial = challan.status === 'Partial Paid';
  const assignedAmount =
    challan.totalAmount ?? challan.totalOutstanding ?? challan.monthlyAmount ?? 0;
  const monthlyAmount = challan.monthlyAmount ?? challan.baseAmount ?? assignedAmount;
  const arrearsAmount =
    challan.arrearsAmount ?? (assignedAmount > monthlyAmount ? assignedAmount - monthlyAmount : 0);
  const paidAmount = challan.paidAmount ?? (isPaid ? assignedAmount : 0);
  const balance = challan.balance ?? (assignedAmount - paidAmount);

  // Generate QR Code data URL
  const qrDataText = `CHALLAN:${challan.challanNumber}\nMEMBER:${memberName}\nMONTH:${billingMonth}\nAMOUNT:Rs.${assignedAmount}\nSTATUS:${challan.status}\nISSUER:${settings.organizationName || 'RWA'}`;
  let qrCodeDataUrl: string | null = null;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrDataText, {
      margin: 1,
      width: 200,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR code generation failed in client PDF generator:', err);
  }

  // Resolve dynamic logo as base64 data URL
  const logoDataUrl = await resolveLogoDataUrl(settings.logoUrl);

  // Margins and Dimensions
  const startX = 18;
  const endX = 192;
  const contentWidth = endX - startX; // 174mm
  let currentY = 20;

  // ═════════════════════════════════════════════════════════════
  // 1. TOP HEADER SECTION
  // ═════════════════════════════════════════════════════════════

  // Category Tag above Invoice Title
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text((settings.organizationName || 'Resident Welfare Association').toUpperCase(), startX, currentY);

  // Big Elegant Serif "Invoice" Title
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(15, 23, 42);
  doc.text('Invoice', startX, currentY + 10);

  // Subtitle under Invoice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Monthly Maintenance Challan', startX + 0.5, currentY + 15);

  // ── Header Right: Dynamic Association Logo (ONLY logo, no badge or QR code) ──
  if (logoDataUrl) {
    try {
      let format = 'PNG';
      if (logoDataUrl.startsWith('data:image/jpeg') || logoDataUrl.startsWith('data:image/jpg')) {
        format = 'JPEG';
      } else if (logoDataUrl.startsWith('data:image/webp')) {
        format = 'WEBP';
      }
      const logoSize = 22;
      const logoX = endX - logoSize;
      const logoY = currentY - 2;
      doc.addImage(logoDataUrl, format, logoX, logoY, logoSize, logoSize);
    } catch (e) {
      console.warn('Client PDF logo render skipped:', e);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // 2. THREE-COLUMN METADATA SECTION (Association, Member, Challan Summary)
  // ═════════════════════════════════════════════════════════════
  currentY = 46;
  const colGap = 8;
  const colWidth = (contentWidth - colGap * 2) / 3;

  const col1X = startX;
  const col2X = startX + colWidth + colGap;
  const col3X = startX + (colWidth + colGap) * 2;

  // ── Column 1: Association Information ──
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Association Information', col1X, currentY);

  let c1Y = currentY + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.organizationName || 'Resident Welfare Association', col1X, c1Y);

  c1Y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reg No: ${settings.registrationNumber || settings.associationShortName || 'RWA-REG-2026'}`, col1X, c1Y);

  c1Y += 4;
  const addressLines = doc.splitTextToSize(settings.address || 'Block 12 FB Area, Karachi', colWidth);
  doc.text(addressLines, col1X, c1Y);
  c1Y += addressLines.length * 3.8;

  if (settings.contactNumber) {
    doc.text(`Phone: ${settings.contactNumber}`, col1X, c1Y);
  }

  // ── Column 2: Member Information ──
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Member Information', col2X, currentY);

  let c2Y = currentY + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(memberName, col2X, c2Y);

  c2Y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Contact: ${contact}`, col2X, c2Y);

  c2Y += 4;
  doc.text(`${propertyType} • ${floorsList}`, col2X, c2Y);

  c2Y += 4;
  const memberAddrLines = doc.splitTextToSize(address, colWidth);
  doc.text(memberAddrLines, col2X, c2Y);

  // ── Column 3: Challan Summary ──
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Challan Summary', col3X, currentY);

  let c3Y = currentY + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Challan No: ${challan.challanNumber}`, col3X, c3Y);

  c3Y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Billing Month: ${billingMonth}`, col3X, c3Y);

  c3Y += 4;
  doc.text(`Due Date: ${dueDate}`, col3X, c3Y);

  c3Y += 4;
  doc.text(`Issue Date: ${issueDate}`, col3X, c3Y);

  c3Y += 4;
  doc.text(`Invoice Type: Security Voucher`, col3X, c3Y);

  // ═════════════════════════════════════════════════════════════
  // 3. SECTION SUBTITLE: Description of Services
  // ═════════════════════════════════════════════════════════════
  currentY = 78;

  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Description of Services', startX, currentY);

  // ═════════════════════════════════════════════════════════════
  // 4. ITEMISED TABLE (Item, Description, Quantity, Unit Price, Total)
  // ═════════════════════════════════════════════════════════════
  currentY = 82;
  const tableHeaderHeight = 8;

  // Header Background
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(startX, currentY, contentWidth, tableHeaderHeight, 1, 1, 'F');

  // Header Text Columns
  const thY = currentY + 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const colItemX = startX + 4;
  const colDescX = startX + 22;
  const colQtyX = startX + 112;
  const colPriceX = startX + 144;
  const colTotalX = endX - 4;

  doc.text('Item', colItemX, thY);
  doc.text('Description', colDescX, thY);
  doc.text('Quantity', colQtyX, thY, { align: 'center' });
  doc.text('Unit Price', colPriceX, thY, { align: 'right' });
  doc.text('Total', colTotalX, thY, { align: 'right' });

  // Table Rows
  currentY += tableHeaderHeight + 2;
  const rowHeight = 8;

  // Row 1: Monthly Security & Maintenance
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text('001', colItemX, currentY + 5);
  doc.text(`Monthly Maintenance Charges (${billingMonth})`, colDescX, currentY + 5);
  doc.text('1', colQtyX, currentY + 5, { align: 'center' });
  doc.text(monthlyAmount.toLocaleString(), colPriceX, currentY + 5, { align: 'right' });
  doc.text(monthlyAmount.toLocaleString(), colTotalX, currentY + 5, { align: 'right' });

  currentY += rowHeight;

  // Row 2: Arrears (if any)
  if (arrearsAmount > 0) {
    // Divider Line between rows only
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(startX, currentY, endX, currentY);

    currentY += 1;
    doc.text('002', colItemX, currentY + 5);
    doc.text('Previous Arrears / Outstanding Balance', colDescX, currentY + 5);
    doc.text('1', colQtyX, currentY + 5, { align: 'center' });
    doc.text(arrearsAmount.toLocaleString(), colPriceX, currentY + 5, { align: 'right' });
    doc.text(arrearsAmount.toLocaleString(), colTotalX, currentY + 5, { align: 'right' });

    currentY += rowHeight;
  }

  // Solid Bottom Border of Table
  currentY += 2;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(startX, currentY, endX, currentY);

  // ═════════════════════════════════════════════════════════════
  // 5. TOTALS SUMMARY BLOCK (Right Aligned)
  // ═════════════════════════════════════════════════════════════
  currentY += 6;
  const totalsLabelX = endX - 48;
  const totalsValueX = endX - 4;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal', totalsLabelX, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${monthlyAmount.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });

  // Arrears line if applicable
  if (arrearsAmount > 0) {
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Prior Arrears', totalsLabelX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`Rs. ${arrearsAmount.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });
  }

  // Divider Line before Total
  currentY += 3;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(totalsLabelX - 5, currentY, endX, currentY);

  // Total Amount (Bold & Large)
  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Amount', totalsLabelX, currentY);
  doc.setFontSize(12);
  doc.text(`Rs. ${assignedAmount.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });

  // Paid & Balance Breakdown
  currentY += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Paid Amount', totalsLabelX, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`Rs. ${paidAmount.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Balance Due', totalsLabelX, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(balance > 0 ? 220 : 5, balance > 0 ? 38 : 150, balance > 0 ? 38 : 105);
  doc.text(`Rs. ${balance.toLocaleString()}`, totalsValueX, currentY, { align: 'right' });

  // ── Official Status Stamp (Left side of totals block) ──
  const stampX = startX + 4;
  const stampY = currentY - 20;
  const stampW = 54;
  const stampH = 16;

  if (isPaid) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.6);
    doc.roundedRect(stampX, stampY, stampW, stampH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text('PAID IN FULL', stampX + stampW / 2, stampY + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129);
    doc.text('THANK YOU FOR YOUR TIMELY PAYMENT', stampX + stampW / 2, stampY + 12.5, { align: 'center' });
  } else if (isPartial) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.roundedRect(stampX, stampY, stampW, stampH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text('PARTIALLY PAID', stampX + stampW / 2, stampY + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(217, 119, 6);
    doc.text(`BALANCE DUE: RS. ${balance.toLocaleString()}`, stampX + stampW / 2, stampY + 12.5, { align: 'center' });
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.roundedRect(stampX, stampY, stampW, stampH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(220, 38, 38);
    doc.text('PAYMENT DUE', stampX + stampW / 2, stampY + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(185, 28, 28);
    doc.text(`PAY ON OR BEFORE ${dueDate.toUpperCase()}`, stampX + stampW / 2, stampY + 12.5, { align: 'center' });
  }

  // ═════════════════════════════════════════════════════════════
  // 6. BOTTOM FOOTER SECTION (Centered note + 3-part contact strip)
  // ═════════════════════════════════════════════════════════════
  currentY = 158;

  // Thank You / Challan Terms note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const footerNote =
    settings.challanFooter ||
    `Thank you for choosing ${settings.organizationName || 'Resident Welfare Association'}.`;
  doc.text(footerNote, startX + contentWidth / 2, currentY, { align: 'center' });

  currentY += 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(startX, currentY, endX, currentY);

  // Powered By Isysware Footer
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Powered By Isysware', startX + contentWidth / 2, currentY, { align: 'center' });

  // Save the PDF
  doc.save(`Challan_${challan.challanNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}
