import React, { useState, useMemo } from 'react';
import { Users, CreditCard, Banknote, Building, Printer, Download, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';

export const StaffCollectionReportPage: React.FC = () => {
  const { payments, staff, staffList: contextStaffList, navigateTo, settings } = useApp();
  const actualStaff = staff || contextStaffList || [];

  const [selectedStaff, setSelectedStaff] = useState<string>('All');

  // Valid payments only for collection statistics
  const validPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'Valid');
  }, [payments]);

  // Aggregate by staff
  const staffSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        totalAmount: number;
        receiptCount: number;
        cashAmount: number;
        bankAmount: number;
        chequeAmount: number;
      }
    >();

    // Initialize with known staff members
    actualStaff.forEach((s) => {
      const name = (s as any).fullName || (s as any).name || 'Staff';
      map.set(name, {
        name,
        totalAmount: 0,
        receiptCount: 0,
        cashAmount: 0,
        bankAmount: 0,
        chequeAmount: 0,
      });
    });

    // Also account for Administrator
    if (!map.has('Administrator')) {
      map.set('Administrator', {
        name: 'Administrator',
        totalAmount: 0,
        receiptCount: 0,
        cashAmount: 0,
        bankAmount: 0,
        chequeAmount: 0,
      });
    }

    validPayments.forEach((p) => {
      const entry = map.get(p.collectedBy) || {
        name: p.collectedBy,
        totalAmount: 0,
        receiptCount: 0,
        cashAmount: 0,
        bankAmount: 0,
        chequeAmount: 0,
      };

      entry.totalAmount += p.paidAmount;
      entry.receiptCount += 1;
      if (p.paymentMethod === 'Cash') entry.cashAmount += p.paidAmount;
      else if (p.paymentMethod === 'Online' || p.paymentMethod === 'Bank Transfer') entry.bankAmount += p.paidAmount;
      else if (p.paymentMethod === 'Cheque') entry.chequeAmount += p.paidAmount;

      map.set(p.collectedBy, entry);
    });

    return Array.from(map.values());
  }, [validPayments, actualStaff]);

  // Filtered payments list
  const displayedPayments = useMemo(() => {
    if (selectedStaff === 'All') return validPayments;
    return validPayments.filter((p) => p.collectedBy === selectedStaff);
  }, [validPayments, selectedStaff]);

  return (
    <div className="space-y-3.5">
      {/* Print header */}
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
          Staff Collection & Cashier Audit Report
        </div>
      </div>

      <div className="no-print flex items-center justify-end">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>Print Statement</span>
        </button>
      </div>

      {/* Staff Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {staffSummaries.map((s) => (
          <div
            key={s.name}
            onClick={() => setSelectedStaff(selectedStaff === s.name ? 'All' : s.name)}
            className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
              selectedStaff === s.name
                ? 'border-blue-600 bg-blue-50/30 font-semibold'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{s.name}</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                {s.receiptCount} Receipts
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-2">
              {formatCurrency(s.totalAmount)}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
              <div>
                <span>Cash:</span>
                <span className="font-mono font-semibold text-slate-700 block text-xs mt-0.5">
                  {formatCurrency(s.cashAmount)}
                </span>
              </div>
              <div>
                <span>Online/Bank:</span>
                <span className="font-mono font-semibold text-slate-700 block text-xs mt-0.5">
                  {formatCurrency(s.bankAmount)}
                </span>
              </div>
              <div>
                <span>Cheque:</span>
                <span className="font-mono font-semibold text-slate-700 block text-xs mt-0.5">
                  {formatCurrency(s.chequeAmount)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Transaction Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Audit Register: {selectedStaff === 'All' ? 'All Staff Collections' : `${selectedStaff}'s Receipts`}
            </h3>
            <p className="text-xs text-slate-500">
              Showing {displayedPayments.length} verified receipts totaling{' '}
              <strong className="text-slate-900">
                {formatCurrency(displayedPayments.reduce((sum, p) => sum + p.paidAmount, 0))}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Collector:</span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 shadow-2xs focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Staff Members</option>
              {staffSummaries.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">House No</th>
                <th className="py-3 px-4 text-right">Amount Collected</th>
                <th className="py-3 px-4 text-center">Payment Instrument</th>
                <th className="py-3 px-4">Reference / Notes</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="no-print py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-blue-600">
                    {p.receiptNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{p.memberName}</td>
                  <td className="py-3 px-4 text-slate-600">{p.houseNumber}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {formatCurrency(p.paidAmount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={p.paymentMethod} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {p.referenceNumber || 'Counter Cash'}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{p.collectedBy}</td>
                  <td className="no-print py-3 px-4 text-center">
                    <button
                      onClick={() => navigateTo('receipt-detail', { receiptId: p.id })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
