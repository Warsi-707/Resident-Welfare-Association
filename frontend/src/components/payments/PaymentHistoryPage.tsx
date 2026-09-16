import React, { useState, useMemo } from 'react';
import { Search, Printer, Eye, Ban, Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Payment } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';

export const PaymentHistoryPage: React.FC = () => {
  const { payments, voidPayment, navigateTo, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [paymentToVoid, setPaymentToVoid] = useState<Payment | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.receiptNumber.toLowerCase().includes(q) ||
        p.memberName.toLowerCase().includes(q) ||
        p.houseNumber.toLowerCase().includes(q) ||
        p.memberId.toLowerCase().includes(q);

      return matchesMethod && matchesStatus && matchesSearch;
    });
  }, [payments, methodFilter, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleConfirmVoid = () => {
    if (!voidReason.trim()) {
      setVoidError('Please state a reason for voiding this receipt');
      return;
    }
    if (paymentToVoid) {
      voidPayment(paymentToVoid.id, voidReason.trim());
      setPaymentToVoid(null);
      setVoidReason('');
      setVoidError('');
    }
  };

  const totalCollected = filteredPayments
    .filter((p) => p.status === 'Valid')
    .reduce((sum, p) => sum + p.paidAmount, 0);

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Payment & Receipt Register
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {payments.length} Transactions
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Audit collection records, verify payment methods, and reprint official receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Register</span>
          </button>
          <button
            onClick={() => navigateTo('collect-payment')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Collect Payment</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search receipt #, member, house..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none outline-none focus:border-slate-400 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by payment method"
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none outline-none focus:border-slate-400"
          >
            <option value="All">All Methods</option>
            <option value="Online">Online</option>
            <option value="Cash">Cash</option>
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs">
            {(['All', 'Valid', 'Voided'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Rows per page"
            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none outline-none focus:border-slate-400"
          >
            <option value={15}>15 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Receipt No</th>
                <th className="py-2.5 px-3">Resident Member</th>
                <th className="py-2.5 px-3">House No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Paid Amount</th>
                <th className="py-2.5 px-3">Collected By</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigateTo('receipt-detail', { paymentId: p.id })}
                  >
                    <td className="py-2 px-3 font-mono font-medium text-blue-600">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {p.memberName}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {p.houseNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {p.paymentDate}
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {p.paymentType || 'Full Paid'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          p.paymentMethod === 'Online'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}
                      >
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(p.paidAmount ?? p.amount)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {p.collectedBy}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'Valid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700 line-through'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td
                      className="py-2 px-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigateTo('receipt-detail', { paymentId: p.id })}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Official Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && p.status === 'Valid' && (
                          <button
                            onClick={() => setPaymentToVoid(p)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Void Receipt"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                    No payment records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredPayments.length)} of{' '}
            {filteredPayments.length} records (Total Valid: {formatCurrency(totalCollected)})
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 py-0.5 font-semibold text-slate-700 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Void Modal */}
      {paymentToVoid && (
        <Modal
          isOpen={true}
          onClose={() => setPaymentToVoid(null)}
          title="Void Payment Entry"
          size="sm"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Warning: Irreversible Action</span>
                Voiding this payment will adjust the associated challan's paid amount and mark it
                as Unpaid or Partial. An audit log entry will be created.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reason for voiding <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Bank transfer bounced, duplicate entry..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none outline-none focus:border-rose-400"
              />
              {voidError && <p className="text-[11px] text-rose-500 mt-1">{voidError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPaymentToVoid(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVoid}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
