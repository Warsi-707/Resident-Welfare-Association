export function formatCurrency(value: unknown): string {
  const amount = Number(value ?? 0);
  return `Rs ${Number.isFinite(amount) ? Math.round(amount).toLocaleString('en-PK') : '0'}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    // If format is YYYY-MM-DD, parse components directly to prevent UTC timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (month >= 1 && month <= 12) {
        return `${String(day).padStart(2, '0')} ${months[month - 1]} ${year}`;
      }
    }
    // If format is DD-MMM-YYYY (e.g. 10-Sept-2026 or 10-Oct-2026)
    if (/^\d{1,2}-[A-Za-z]+-\d{4}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[0].padStart(2, '0')} ${parts[1]} ${parts[2]}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string, timeString?: string): string {
  if (!dateString) return '—';
  const formattedDate = formatDate(dateString);
  return timeString ? `${formattedDate}, ${timeString}` : formattedDate;
}

// Convert number to words for formal receipts
export function numberToWords(num: number): string {
  if (!num || num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  return inWords(Math.round(num)) + ' Rupees Only';
}

// Get today's date formatted as DD-MMM-YYYY (e.g., 12-Sep-2026) in user's local timezone
export function getLocalTodayFormatted(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Get today's date formatted as YYYY-MM-DD in user's local timezone (preventing UTC offset shifting)
export function getLocalTodayYMD(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check whether a date string/Date matches the local calendar day of a reference date
export function isSameLocalCalendarDay(dateInput: string | Date | undefined | null, targetDate = new Date()): boolean {
  if (!dateInput) return false;

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth() + 1;
  const targetDay = targetDate.getDate();

  if (dateInput instanceof Date) {
    return (
      dateInput.getFullYear() === targetYear &&
      dateInput.getMonth() + 1 === targetMonth &&
      dateInput.getDate() === targetDay
    );
  }

  const str = String(dateInput).trim();
  if (!str) return false;

  // YYYY-MM-DD (matches calendar date directly, avoiding UTC offset shift)
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    return y === targetYear && m === targetMonth && d === targetDay;
  }

  // DD-MMM-YYYY (e.g. 12-Sep-2026, 12-Sept-2026, 09-Sept-2026 10:30 AM)
  const dmyMatch = str.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const monthStr = dmyMatch[2].toLowerCase();
    const y = parseInt(dmyMatch[3], 10);

    const monthMap: Record<string, number> = {
      jan: 1, january: 1,
      feb: 2, february: 2,
      mar: 3, march: 3,
      apr: 4, april: 4,
      may: 5,
      jun: 6, june: 6,
      jul: 7, july: 7,
      aug: 8, august: 8,
      sep: 9, sept: 9, september: 9,
      oct: 10, october: 10,
      nov: 11, november: 11,
      dec: 12, december: 12,
    };

    const m = monthMap[monthStr];
    if (m) {
      return y === targetYear && m === targetMonth && d === targetDay;
    }
  }

  // Fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return (
      parsed.getFullYear() === targetYear &&
      parsed.getMonth() + 1 === targetMonth &&
      parsed.getDate() === targetDay
    );
  }

  return false;
}

// Helper to escape CSV values safely following RFC 4180
export function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Numeric values: return plain number
  if (/^-?\d+(\.\d+)?$/.test(str.trim())) {
    return str.trim();
  }
  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Download CSV with UTF-8 BOM so Microsoft Excel and other viewers display all columns properly
export function downloadCSV(filename: string, csvContent: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


