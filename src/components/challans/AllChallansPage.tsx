import React, { useState, useMemo } from 'react';
import {
  Search,
  FileSpreadsheet,
  CreditCard,
  Printer,
  Eye,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { Challan } from '../../types';
import { downloadChallanPdf } from '../../utils/pdfGenerator';

export const AllChallansPage: React.FC = () => {
  const { challans, members, settings, addToast, navigateTo, currentUser, deleteChallan, sendChallanWhatsApp } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial Paid' | 'Unpaid'>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Delete state
  const [selectedForDelete, setSelectedForDelete] = useState<Challan | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    challans.forEach((c) => set.add(c.month));
    return Array.from(set);
  }, [challans]);

  const filteredChallans = useMemo(() => {
    const list = challans.filter((c) => {
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesMonth = monthFilter === 'All' || c.month === monthFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.challanNumber.toLowerCase().includes(q) ||
        c.memberName.toLowerCase().includes(q) ||
        c.houseNumber.toLowerCase().includes(q) ||
        c.memberId.toLowerCase().includes(q);
      return matchesStatus && matchesMonth && matchesSearch;
    });

    // Sort: Recently updated / generated / paid challans at the TOP
    return list.sort((a, b) => {
      const timeA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
      const timeB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });
  }, [challans, statusFilter, monthFilter, searchQuery]);

  const totalPages = Math.ceil(filteredChallans.length / pageSize) || 1;
  const paginatedChallans = filteredChallans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleDownloadPdf = (c: Challan) => {
    const member = members.find(
      (m) => m.memberId === c.memberId || m.id === c.memberId || m.fullName === c.memberName
    );
    downloadChallanPdf(c, member, settings);
    addToast({
      type: 'success',
      title: 'PDF Downloaded',
      description: `Challan ${c.challanNumber} downloaded directly to your Downloads folder.`,
    });
  };

  const handleSendWhatsApp = async (c: Challan) => {
    setSendingId(c.id);
    try {
      await sendChallanWhatsApp(c.id);
    } finally {
      setSendingId(null);
    }
  };

  const handleDeletePrompt = (c: Challan) => {
    setSelectedForDelete(c);
    if (c.paidAmount > 0 || c.status === 'Paid' || c.status === 'Partial Paid') {
      setDeleteBlockedOpen(true);
    } else {
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteChallan(selectedForDelete.id);
      if (ok) {
        setDeleteModalOpen(false);
        setSelectedForDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Filter, Actions and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Challans & Billing Register</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-[#7C3AED] border border-purple-100">
              {challans.length} Total
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Register</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => navigateTo('generate-challan')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Generate Challans</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search challan #, member, house..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none outline-none focus:border-slate-400 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Month Selector */}
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by month"
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs">
              {(['All', 'Paid', 'Partial Paid', 'Unpaid'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
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
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-semibold text-xs">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Payable</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Delivery</th>
                <th className="py-2.5 px-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedChallans.length > 0 ? (
                paginatedChallans.map((c) => {
                  const deliveryStatus = (c.whatsappStatus || 'PENDING').toUpperCase();
                  const isSendingThis = sendingId === c.id;
                  const totalAmt = c.totalOutstanding ?? c.totalAmount ?? c.monthlyAmount;
                  const paidAmt = c.paidAmount ?? 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Member & House */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{c.memberName}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span>{c.houseNumber}</span>
                          <span>&bull;</span>
                          <span className="text-[#7C3AED] font-semibold">{c.challanNumber}</span>
                        </div>
                      </td>

                      {/* Billing Month */}
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {c.month}
                      </td>

                      {/* Payable / Balance */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          Rs {totalAmt.toLocaleString()}
                        </div>
                        {paidAmt > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Paid: Rs {paidAmt.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap select-none">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-600'
                              : c.status === 'Partial Paid'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap select-none">
                        {deliveryStatus === 'SENT' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100"
                            title={c.whatsappSentAt ? `Sent at: ${c.whatsappSentAt}` : 'Message accepted by WhatsApp'}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            SENT
                          </span>
                        ) : deliveryStatus === 'DELIVERED' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100"
                            title="Delivered to member handset"
                          >
                            <CheckCheck className="w-3 h-3" />
                            DELIVERED
                          </span>
                        ) : deliveryStatus === 'READ' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-600 border border-teal-100"
                            title="Read by member"
                          >
                            <CheckCheck className="w-3 h-3 text-teal-600" />
                            READ
                          </span>
                        ) : deliveryStatus === 'FAILED' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 cursor-help"
                            title={c.whatsappError || 'WhatsApp delivery failed.'}
                          >
                            <AlertCircle className="w-3 h-3" />
                            FAILED
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] border border-purple-100"
                            title="Sending pending"
                          >
                            <Clock className="w-3 h-3" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap pr-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() => navigateTo('challan-detail', { challanId: c.id })}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="View Challan Voucher"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>View</span>
                          </button>

                          {/* PDF */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(c)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            <span>PDF</span>
                          </button>

                          {/* Send / Resend WhatsApp */}
                          <button
                            type="button"
                            disabled={isSendingThis}
                            onClick={() => handleSendWhatsApp(c)}
                            className="px-2.5 py-1 bg-white hover:bg-purple-50 text-[#7C3AED] hover:text-[#6D28D9] font-bold text-xs rounded-lg border border-purple-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            title={
                              c.whatsappStatus === 'SENT'
                                ? 'Resend branded PDF via WhatsApp API'
                                : 'Send branded PDF via WhatsApp API'
                            }
                          >
                            {isSendingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin text-[#7C3AED]" />
                            ) : (
                              <Send className="w-3 h-3 text-[#7C3AED]" />
                            )}
                            <span>{c.whatsappStatus === 'SENT' ? 'Resend' : 'Send'}</span>
                          </button>

                          {/* Collect Payment */}
                          {c.balance > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                navigateTo('collect-payment', {
                                  selectedMemberId: c.memberId,
                                  selectedChallanId: c.id,
                                })
                              }
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                              title="Collect Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeletePrompt(c)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title="Delete Challan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No challans found matching your filters.
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
            {Math.min(currentPage * pageSize, filteredChallans.length)} of{' '}
            {filteredChallans.length} challans
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

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && selectedForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-slate-100 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete Challan Permanently?
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedForDelete.challanNumber} &bull; {selectedForDelete.memberName} ({selectedForDelete.month})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed mb-4">
              Delete this challan permanently?
              This action is only allowed because no payment has been recorded against this challan.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedForDelete(null);
                }}
                disabled={isDeleting}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE BLOCKED MODAL ================= */}
      {deleteBlockedOpen && selectedForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl border border-slate-100 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Deletion Prohibited
                </h3>
                <p className="text-[11px] text-slate-500">Financial records protected</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-lg border border-amber-200 leading-relaxed mb-4">
              This challan has payment history and cannot be deleted.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeleteBlockedOpen(false);
                  setSelectedForDelete(null);
                }}
                className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

