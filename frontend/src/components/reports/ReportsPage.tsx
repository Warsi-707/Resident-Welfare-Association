import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Zap } from 'lucide-react';
import { formatCurrency, getLocalTodayYMD, escapeCSV, downloadCSV } from '../../utils/formatters';
import { FLOOR_OPTIONS } from '../../types';

export const ReportsPage: React.FC = () => {
  const { members, challans, payments } = useApp();

  const [reportView, setReportView] = useState('Collections & Challans');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFloor, setFilterFloor] = useState('All');
  const [memberQuery, setMemberQuery] = useState('');
  const [auditUserQuery, setAuditUserQuery] = useState('');

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    challans.forEach((c) => {
      if (c.month) set.add(c.month);
    });
    if (set.size === 0) {
      set.add('September 2026');
      set.add('October 2026');
    }
    return Array.from(set);
  }, [challans]);

  // Filtered records based on all active filters
  const filteredRecords = useMemo(() => {
    return challans.filter((c) => {
      const matchMonth = filterMonth === 'All' || c.month.toLowerCase().includes(filterMonth.toLowerCase());
      const matchStatus = filterStatus === 'All' || c.status === filterStatus;
      const matchFloor = filterFloor === 'All' || c.houseNumber.toLowerCase().includes(filterFloor.toLowerCase());
      const q = memberQuery.toLowerCase().trim();
      const matchMember = !q || c.memberName.toLowerCase().includes(q) || c.houseNumber.toLowerCase().includes(q) || c.memberId.toLowerCase().includes(q);

      // Date filtering
      let matchDate = true;
      if (fromDate) {
        const d = c.generatedDate || c.dueDate || c.issueDate || '';
        if (d && d < fromDate) matchDate = false;
      }
      if (toDate) {
        const d = c.generatedDate || c.dueDate || c.issueDate || '';
        if (d && d > toDate) matchDate = false;
      }

      // Audit user query
      let matchAuditUser = true;
      if (auditUserQuery.trim()) {
        const aq = auditUserQuery.toLowerCase().trim();
        const matchingPayment = payments.find((p) => (p.challanId === c.id || p.challanNumber === c.challanNumber));
        const collectorOrAuditor = (matchingPayment?.collectedBy || matchingPayment?.voidedBy || '').toLowerCase();
        if (!collectorOrAuditor.includes(aq)) {
          matchAuditUser = false;
        }
      }

      return matchMonth && matchStatus && matchFloor && matchMember && matchDate && matchAuditUser;
    });
  }, [challans, payments, filterMonth, filterStatus, filterFloor, memberQuery, fromDate, toDate, auditUserQuery]);

  // Metric computations
  const membersInView = useMemo(() => {
    const unique = new Set(filteredRecords.map((c) => c.memberId));
    return unique.size;
  }, [filteredRecords]);

  const challanValue = useMemo(() => {
    return filteredRecords.reduce((sum, c) => sum + (c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount ?? 0), 0);
  }, [filteredRecords]);

  const netCollected = useMemo(() => {
    return filteredRecords.reduce((sum, c) => sum + c.paidAmount, 0);
  }, [filteredRecords]);

  const outstanding = useMemo(() => {
    return filteredRecords.reduce((sum, c) => sum + c.balance, 0);
  }, [filteredRecords]);

  const partialCount = useMemo(() => {
    return filteredRecords.filter((c) => c.status === 'Partial Paid').length;
  }, [filteredRecords]);

  const reversalCount = useMemo(() => {
    return payments.filter((p) => p.status === 'Voided').length;
  }, [payments]);

  const collectionPercentage = challanValue > 0 ? Math.round((netCollected / challanValue) * 100) : 0;

  const exportCSV = () => {
    const headers = [
      'Member ID',
      'Member Name',
      'House Number',
      'Billing Month',
      'Challan Number',
      'Challan Value',
      'Collected Amount',
      'Outstanding Amount',
      'Status',
      'Due Date',
      'Payment Method',
      'Receipt Number',
      'Payment Date',
      'Collected By',
    ];

    const rows = filteredRecords.map((c) => {
      const matchingPayments = payments.filter((p) => {
        if (p.status === 'Voided' || p.isVoid) return false;
        if (p.challanId && p.challanId === c.id) return true;
        if (p.challanNumber && p.challanNumber === c.challanNumber) return true;
        if (c.allocations && c.allocations.some((a) => a.receiptNumber === p.receiptNumber || a.id === p.id)) return true;
        return false;
      });

      let paymentMethod = '-';
      let receiptNumber = '-';
      let paymentDate = '-';
      let collectedBy = '-';

      if (matchingPayments.length > 0) {
        paymentMethod = Array.from(new Set(matchingPayments.map((p) => p.paymentMethod).filter(Boolean))).join(', ') || '-';
        receiptNumber = matchingPayments.map((p) => p.receiptNumber).filter(Boolean).join(', ') || '-';
        paymentDate = matchingPayments.map((p) => p.paymentDate).filter(Boolean).join(', ') || '-';
        collectedBy = Array.from(new Set(matchingPayments.map((p) => p.collectedBy || p.collectedByName).filter(Boolean))).join(', ') || '-';
      } else if (c.allocations && c.allocations.length > 0) {
        paymentMethod = Array.from(new Set(c.allocations.map((a) => a.paymentMethod).filter(Boolean))).join(', ') || '-';
        receiptNumber = c.allocations.map((a) => a.receiptNumber).filter(Boolean).join(', ') || '-';
        paymentDate = c.allocations.map((a) => a.paymentDate).filter(Boolean).join(', ') || '-';
      }

      const challanVal = Number(c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount ?? c.baseAmount ?? 0);
      const collectedVal = Number(c.paidAmount ?? 0);
      const outstandingVal = Number(c.balance ?? Math.max(0, challanVal - collectedVal));

      return [
        escapeCSV(c.memberId),
        escapeCSV(c.memberName),
        escapeCSV(c.houseNumber),
        escapeCSV(c.month),
        escapeCSV(c.challanNumber),
        escapeCSV(challanVal),
        escapeCSV(collectedVal),
        escapeCSV(outstandingVal),
        escapeCSV(c.status),
        escapeCSV(c.dueDate),
        escapeCSV(paymentMethod),
        escapeCSV(receiptNumber),
        escapeCSV(paymentDate),
        escapeCSV(collectedBy),
      ].join(',');
    });

    const summaryRows = [
      '',
      '--- REPORT SUMMARY ---',
      `Members in View,${membersInView}`,
      `Total Challan Value,${challanValue}`,
      `Net Collected,${netCollected}`,
      `Outstanding,${outstanding}`,
      `Partial Count,${partialCount}`,
      `Reversal Count,${reversalCount}`,
    ];

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows,
      ...summaryRows,
    ].join('\r\n');

    const filename = `RWA_Collection_Report_${getLocalTodayYMD()}.csv`;
    downloadCSV(filename, csvContent);
  };

  return (
    <div className="space-y-3.5">
      {/* CARD 1: Filters & Metrics (Compact) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3">
        {/* Card Header Strip */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Financial Reports & Analytics</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
              Audit Ready
            </span>
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Report View
            </label>
            <select
              value={reportView}
              onChange={(e) => setReportView(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="Collections & Challans">Collections & Challan...</option>
              <option value="Member Ledger">Member Ledger</option>
              <option value="Daily Cash Register">Daily Cash Register</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Month
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial Paid">Partial Paid</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Floor
            </label>
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Floors</option>
              {FLOOR_OPTIONS.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Member / Business
            </label>
            <input
              type="text"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Search member, busines"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Audit User
            </label>
            <input
              type="text"
              value={auditUserQuery}
              onChange={(e) => setAuditUserQuery(e.target.value)}
              placeholder="Reversed by user"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* 6 Metric Summary Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
          {/* MEMBERS IN VIEW */}
          <div className="bg-slate-50/60 rounded-lg p-2.5 border border-slate-100 min-w-0 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              MEMBERS IN VIEW
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 truncate">
              {membersInView}
            </div>
          </div>

          {/* CHALLAN VALUE */}
          <div className="bg-slate-50/60 rounded-lg p-2.5 border border-slate-100 min-w-0 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              CHALLAN VALUE
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 truncate">
              {formatCurrency(challanValue)}
            </div>
          </div>

          {/* NET COLLECTED */}
          <div className="bg-slate-50/60 rounded-lg p-2.5 border border-slate-100 min-w-0 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              NET COLLECTED
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5 truncate">
              {formatCurrency(netCollected)}
            </div>
          </div>

          {/* OUTSTANDING */}
          <div className="bg-slate-50/60 rounded-lg p-2.5 border border-slate-100 min-w-0 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              OUTSTANDING
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-700 mt-0.5 truncate">
              {formatCurrency(outstanding)}
            </div>
          </div>

          {/* PARTIAL COUNT */}
          <div className="bg-slate-50/60 rounded-lg p-2.5 border border-slate-100 min-w-0 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              PARTIAL COUNT
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 truncate">
              {partialCount}
            </div>
          </div>

          {/* REVERSAL COUNT */}
          <div className="bg-slate-50/60 rounded-lg p-2.5 border border-slate-100 min-w-0 overflow-hidden">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
              REVERSAL COUNT
            </div>
            <div className="text-sm sm:text-base font-bold text-rose-600 mt-0.5 truncate">
              {reversalCount}
            </div>
          </div>
        </div>

        {/* Collection Progress Bar */}
        <div className="pt-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Collection Progress</span>
            <span className="font-bold text-[#7C3AED] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 text-[11px]">
              {collectionPercentage}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 border border-slate-200/90 rounded-full overflow-hidden p-0.5 shadow-2xs">
            <div
              className="h-full bg-gradient-to-r from-[#7C3AED] to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, collectionPercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* CARD 2: Detail Table or Empty State (Compact) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Collection Report Detail
          </h2>
          <span className="text-[11px] text-slate-400 font-normal">
            {filteredRecords.length} records
          </span>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto -mx-3.5 sm:-mx-4 px-3.5 sm:px-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Floor / House</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Challan Value</th>
                  <th className="py-2.5 px-3">Collected</th>
                  <th className="py-2.5 px-3">Outstanding</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.memberName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.houseNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.month}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(r.totalAmount ?? r.totalOutstanding ?? r.monthlyAmount)}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">{formatCurrency(r.paidAmount)}</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-700">{formatCurrency(r.balance)}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : r.status === 'Partial Paid'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-right">{r.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state matching Screenshot 6 (Compact) */
          <div className="border border-dashed border-slate-200 rounded-xl py-10 sm:py-12 px-4 text-center flex flex-col items-center justify-center my-1">
            <div className="w-9 h-9 rounded-full border-2 border-slate-300 flex items-center justify-center mb-2.5">
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
              No report data
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select different filters or generate challans first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
