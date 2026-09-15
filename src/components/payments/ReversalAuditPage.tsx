import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Undo2, Search, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { FLOOR_OPTIONS } from '../../types';

export const ReversalAuditPage: React.FC = () => {
  const { payments, voidPayment } = useApp();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');
  const [reversedByFilter, setReversedByFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reverse action modal state
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState('');

  // Reversed payments
  const reversedPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'Voided');
  }, [payments]);

  // Valid payments available for reversal
  const validPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'Valid');
  }, [payments]);

  const filteredReversals = useMemo(() => {
    return reversedPayments.filter((p) => {
      const matchFloor = floorFilter === 'All' || p.houseNumber.toLowerCase().includes(floorFilter.toLowerCase());
      const matchUser = !reversedByFilter || (p.voidedBy || '').toLowerCase().includes(reversedByFilter.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.memberName.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.houseNumber.toLowerCase().includes(q) ||
        (p.voidReason || '').toLowerCase().includes(q);

      return matchFloor && matchUser && matchSearch;
    });
  }, [reversedPayments, floorFilter, reversedByFilter, searchQuery]);

  const handleConfirmReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) {
      setReversalError('Please select a payment receipt to reverse');
      return;
    }
    if (!reversalReason.trim()) {
      setReversalError('Mandatory audit reason is required for reversal');
      return;
    }

    voidPayment(selectedPaymentId, reversalReason.trim());
    setReverseModalOpen(false);
    setSelectedPaymentId('');
    setReversalReason('');
    setReversalError('');
  };

  return (
    <div className="space-y-3.5">
      {/* Main White Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3.5">
        {/* Card Header Strip */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Payment Reversal Audit Trail</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              {reversedPayments.length} Reversed
            </span>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            />
          </div>

          {/* Floor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Floor
            </label>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Floors</option>
              {FLOOR_OPTIONS.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </select>
          </div>

          {/* Reversed By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Reversed By
            </label>
            <input
              type="text"
              value={reversedByFilter}
              onChange={(e) => setReversedByFilter(e.target.value)}
              placeholder="User name"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 bg-white"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Member / business / challan / re..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* Subheading: Reversal Records & Count (Screenshot 5) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Reversal Records
          </h2>
          <span className="text-xs text-slate-400 font-normal">
            {filteredReversals.length} reversals
          </span>
        </div>

        {/* Content Table or Empty State */}
        {filteredReversals.length > 0 ? (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs">
                  <th className="py-3.5 px-3">Receipt #</th>
                  <th className="py-3.5 px-3">Member</th>
                  <th className="py-3.5 px-3">Amount</th>
                  <th className="py-3.5 px-3">Reversed By</th>
                  <th className="py-3.5 px-3">Audit Reason</th>
                  <th className="py-3.5 px-3 text-right">Reversed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReversals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{r.receiptNumber}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{r.memberName}</td>
                    <td className="py-3.5 px-3 font-bold text-rose-700">{formatCurrency(r.paidAmount ?? r.amount)}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {r.voidedBy || 'Administrator'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 italic max-w-xs">{r.voidReason}</td>
                    <td className="py-3.5 px-3 text-slate-500 text-right">{r.voidedAt || r.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state matching Screenshot 5 */
          <div className="border border-dashed border-slate-200 rounded-2xl py-24 px-4 text-center flex flex-col items-center justify-center my-2">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center mb-3">
              <Undo2 className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No reversal records
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Reversed payments will appear here permanently.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
