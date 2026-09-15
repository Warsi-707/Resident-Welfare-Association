import React, { useState, useMemo } from 'react';
import { Download, Printer, Filter, Calendar, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getLocalTodayYMD, escapeCSV, downloadCSV } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';

export const MonthlyCollectionReportPage: React.FC = () => {
  const { challans, settings } = useApp();

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    challans.forEach((c) => set.add(c.month));
    return Array.from(set);
  }, [challans]);

  const [selectedMonth, setSelectedMonth] = useState('');
  const activeMonth = selectedMonth || availableMonths[0] || '';
  const monthChallans = activeMonth ? challans.filter((c) => c.month === activeMonth) : challans;

  const totalExpected = monthChallans.reduce((sum, c) => sum + c.monthlyAmount, 0);
  const totalPrior = monthChallans.reduce((sum, c) => sum + c.previousDues, 0);
  const totalDue = totalExpected + totalPrior;
  const totalCollected = monthChallans.reduce((sum, c) => sum + c.paidAmount, 0);
  const totalOutstanding = Math.max(0, totalDue - totalCollected);
  const recoveryRate = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

  const handleExportCSV = () => {
    const headers = [
      'Challan Number',
      'Member ID',
      'Member Name',
      'House Number',
      'Billing Month',
      'Monthly Amount',
      'Previous Dues',
      'Total Due',
      'Paid Amount',
      'Balance',
      'Status',
    ];
    const rows = monthChallans.map((c) => [
      escapeCSV(c.challanNumber),
      escapeCSV(c.memberId),
      escapeCSV(c.memberName),
      escapeCSV(c.houseNumber),
      escapeCSV(c.month),
      escapeCSV(c.monthlyAmount),
      escapeCSV(c.previousDues),
      escapeCSV(c.totalOutstanding),
      escapeCSV(c.paidAmount),
      escapeCSV(c.balance),
      escapeCSV(c.status),
    ].join(','));

    const summaryRows = [
      '',
      '--- MONTHLY SUMMARY ---',
      `Billing Month,${escapeCSV(activeMonth || 'All')}`,
      `Total Billed,${totalDue}`,
      `Total Collected,${totalCollected}`,
      `Total Outstanding,${totalOutstanding}`,
      `Recovery Rate,${recoveryRate}%`,
      `Billed Residents,${monthChallans.length}`,
    ];

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows,
      ...summaryRows,
    ].join('\r\n');

    const filename = `RWA_Monthly_Collection_Report_${(selectedMonth || 'All').replace(/\s+/g, '_')}_${getLocalTodayYMD()}.csv`;
    downloadCSV(filename, csvContent);
  };

  return (
    <div className="space-y-3.5">
      {/* Printable Report Letterhead */}
      <div className="hidden print-only mb-6 text-center border-b pb-4">
        {settings.logoUrl && (
          <img
            src={settings.logoUrl}
            alt={settings.organizationName}
            className="h-12 w-auto max-w-[140px] mx-auto object-contain mb-2"
          />
        )}
        <h1 className="text-xl font-bold">{settings.organizationName}</h1>
        <p className="text-xs text-slate-600">{settings.address}</p>
        <p className="text-xs text-slate-600">Ph: {settings.contactNumber}</p>
        <div className="mt-3 text-sm font-bold underline uppercase">
          Monthly Maintenance Collection Statement — {selectedMonth}
        </div>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="text-xs font-medium text-slate-600">
          Monthly Collection Statement
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 shadow-2xs"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Total Dues Billed</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {formatCurrency(totalDue)}
          </p>
          <span className="text-[11px] text-slate-500">
            {formatCurrency(totalExpected)} current + {formatCurrency(totalPrior)} prior
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-xs font-medium text-emerald-800 block">Total Realized</span>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">{recoveryRate}% recovery rate</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rose-200 bg-rose-50/20 shadow-2xs">
          <span className="text-xs font-medium text-rose-800 block">Total Outstanding</span>
          <p className="text-xl font-bold text-rose-700 font-mono mt-1">
            {formatCurrency(totalOutstanding)}
          </p>
          <span className="text-[11px] text-rose-700">Remaining to collect</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Billed Residents</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{monthChallans.length}</p>
          <span className="text-[11px] text-slate-500">Active property units</span>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Billing Register & Collection Breakdown — {selectedMonth}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {monthChallans.length} records in period
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Challan No</th>
                <th className="py-2.5 px-3">Member ID</th>
                <th className="py-2.5 px-3">Member Name</th>
                <th className="py-2.5 px-3">House No</th>
                <th className="py-2.5 px-3 text-right">Monthly Fee</th>
                <th className="py-2.5 px-3 text-right">Prior Dues</th>
                <th className="py-2.5 px-3 text-right">Total Payable</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monthChallans.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 font-mono font-medium text-purple-700">
                    {c.challanNumber}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">{c.memberId}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{c.memberName}</td>
                  <td className="py-2 px-3 text-slate-600">{c.houseNumber}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(c.monthlyAmount)}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">
                    {formatCurrency(c.previousDues)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(c.totalOutstanding)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                    {formatCurrency(c.paidAmount)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    <span className={c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {formatCurrency(c.balance)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={4} className="py-2.5 px-3">
                  Summary Totals ({selectedMonth})
                </td>
                <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(totalExpected)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(totalPrior)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(totalDue)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                  {formatCurrency(totalCollected)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                  {formatCurrency(totalOutstanding)}
                </td>
                <td className="py-2.5 px-3 text-center">{recoveryRate}% Settled</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
