import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Phone, Download, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, getLocalTodayYMD, escapeCSV, downloadCSV } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';

export const PaymentStatusReportPage: React.FC = () => {
  const { challans, members, navigateTo, pageParams, settings } = useApp();

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    challans.forEach((c) => set.add(c.month));
    return Array.from(set);
  }, [challans]);

  const defaultStatus = pageParams.filterStatus || 'Unpaid';
  const [activeStatus, setActiveStatus] = useState<'Paid' | 'Partial Paid' | 'Unpaid'>(
    defaultStatus as any
  );
  const [selectedMonth, setSelectedMonth] = useState('');
  const activeMonth = selectedMonth || availableMonths[0] || '';
  const monthChallans = activeMonth ? challans.filter((c) => c.month === activeMonth) : challans;

  const filteredChallans = useMemo(() => {
    return monthChallans.filter((c) => c.status === activeStatus);
  }, [monthChallans, activeStatus]);

  const paidCount = monthChallans.filter((c) => c.status === 'Paid').length;
  const partialCount = monthChallans.filter((c) => c.status === 'Partial Paid').length;
  const unpaidCount = monthChallans.filter((c) => c.status === 'Unpaid').length;

  const totalOutstandingForCategory = filteredChallans.reduce((sum, c) => sum + c.balance, 0);

  const handleExportCSV = () => {
    const headers = [
      'Challan Number',
      'Member ID',
      'Member Name',
      'House Number',
      'Contact Number',
      'Billed Total',
      'Paid Amount',
      'Remaining Balance',
      'Due Date',
      'Status',
    ];
    const rows = filteredChallans.map((c) => {
      const m = members.find((mem) => mem.memberId === c.memberId);
      return [
        escapeCSV(c.challanNumber),
        escapeCSV(c.memberId),
        escapeCSV(c.memberName),
        escapeCSV(c.houseNumber),
        escapeCSV(m?.contactNumber || ''),
        escapeCSV(c.totalOutstanding ?? c.totalAmount ?? c.monthlyAmount ?? 0),
        escapeCSV(c.paidAmount ?? 0),
        escapeCSV(c.balance ?? 0),
        escapeCSV(c.dueDate),
        escapeCSV(c.status),
      ].join(',');
    });

    const summaryRows = [
      '',
      '--- STATUS REPORT SUMMARY ---',
      `Status Category,${escapeCSV(activeStatus)}`,
      `Billing Month,${escapeCSV(selectedMonth || 'All')}`,
      `Total Members,${filteredChallans.length}`,
      `Total Category Balance,${totalOutstandingForCategory}`,
    ];

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows,
      ...summaryRows,
    ].join('\r\n');

    const filename = `RWA_${activeStatus.replace(/\s+/g, '_')}_Report_${getLocalTodayYMD()}.csv`;
    downloadCSV(filename, csvContent);
  };

  return (
    <div className="space-y-3.5">
      {/* Printable Report Header */}
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
          {activeStatus} Members Report — {selectedMonth}
        </div>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="text-xs font-medium text-slate-600">
          {activeStatus} Members Report
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800 shadow-2xs focus:outline-none outline-none focus:border-slate-400"
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
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export List</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 3 Status Category Filter Tabs */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Unpaid Tab */}
        <div
          onClick={() => setActiveStatus('Unpaid')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
            activeStatus === 'Unpaid'
              ? 'bg-rose-50 border-rose-400 font-semibold'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">Unpaid Members</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{unpaidCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Zero payment received for period</p>
        </div>

        {/* Partial Paid Tab */}
        <div
          onClick={() => setActiveStatus('Partial Paid')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
            activeStatus === 'Partial Paid'
              ? 'bg-amber-50 border-amber-400 font-semibold'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Partial Paid</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{partialCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Partially settled dues</p>
        </div>

        {/* Fully Paid Tab */}
        <div
          onClick={() => setActiveStatus('Paid')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
            activeStatus === 'Paid'
              ? 'bg-emerald-50 border-emerald-400 font-semibold'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Fully Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{paidCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">No outstanding balances remaining</p>
        </div>
      </div>

      {/* Table of Members in this Category */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeStatus} Members — {selectedMonth}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredChallans.length} members with total balance of{' '}
              <strong className="text-slate-900">{formatCurrency(totalOutstandingForCategory)}</strong>
            </p>
          </div>
        </div>

        {filteredChallans.length === 0 ? (
          <EmptyState
            title={`No ${activeStatus} Members`}
            description={`Great news! There are currently no members with ${activeStatus.toLowerCase()} status for ${selectedMonth}.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Challan No</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">House No</th>
                  <th className="py-3 px-4">Contact Number</th>
                  <th className="py-3 px-4 text-right">Total Due</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="no-print py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredChallans.map((c) => {
                  const m = members.find((mem) => mem.memberId === c.memberId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {c.challanNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <button
                          onClick={() => navigateTo('member-detail', { memberId: c.memberId })}
                          className="hover:underline text-left text-slate-900 font-semibold"
                        >
                          {c.memberName}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.houseNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {m?.contactNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                        {formatCurrency(c.totalOutstanding)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                        {formatCurrency(c.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {formatCurrency(c.balance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="no-print py-3 px-4 text-center">
                        {c.balance > 0 ? (
                          <button
                            onClick={() =>
                              navigateTo('collect-payment', {
                                selectedMemberId: c.memberId,
                                selectedChallanId: c.id,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => navigateTo('challan-detail', { challanId: c.id })}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
