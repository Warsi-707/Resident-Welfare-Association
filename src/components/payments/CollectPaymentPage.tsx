import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Challan, FLOOR_OPTIONS } from '../../types';
import { Check, CheckCircle2, X, Undo2, Share2, FileText } from 'lucide-react';
import { formatCurrency, getLocalTodayYMD } from '../../utils/formatters';
import { downloadChallanPdf } from '../../utils/pdfGenerator';

export const CollectPaymentPage: React.FC = () => {
  const { challans, members, payments, collectPayment, voidPayment, navigateTo, addToast, settings, currentUser } = useApp();

  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFloor, setFilterFloor] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment recording modal state
  const [activeChallan, setActiveChallan] = useState<Challan | null>(null);
  const [paymentType, setPaymentType] = useState<'Full Paid' | 'Partial Paid'>('Full Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(() => getLocalTodayYMD());
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  // Reversal modal state
  const [reversalChallan, setReversalChallan] = useState<Challan | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const openPaymentModal = (c: Challan, type: 'Full Paid' | 'Partial Paid' = 'Full Paid') => {
    setActiveChallan(c);
    setPaymentType(type);
    if (type === 'Full Paid') {
      setPaidAmount(c.balance);
    } else {
      setPaidAmount(0);
    }
    setSuccessReceipt(null);
  };

  const openReversalModal = (c: Challan) => {
    setReversalChallan(c);
    setReversalReason('');
    setReversalError('');
  };

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalChallan) return;
    if (!reversalReason.trim()) {
      setReversalError('Why is this payment being reversed? Please provide a reason.');
      return;
    }

    const linkedPayment = payments.find((p) => {
      if (p.status !== 'Valid' && p.isVoid) return false;
      if (p.challanId === reversalChallan.id || p.challanNumber === reversalChallan.challanNumber) return true;
      if ((p as any).allocations && Array.isArray((p as any).allocations)) {
        if ((p as any).allocations.some((a: any) => a.challanNumber === reversalChallan.challanNumber)) return true;
      }
      if (p.memberId === reversalChallan.memberId || p.memberName.toLowerCase() === reversalChallan.memberName.toLowerCase()) {
        return true;
      }
      return false;
    });

    const amtToReverse = linkedPayment?.paidAmount ?? reversalChallan.paidAmount ?? (reversalChallan.totalAmount ?? reversalChallan.monthlyAmount);

    const isConfirmed = window.confirm(
      `Reverse Rs ${amtToReverse.toLocaleString()}? This action will be recorded in the audit trail.`
    );
    if (!isConfirmed) return;

    setIsReversing(true);
    try {
      const paymentIdToVoid = linkedPayment ? linkedPayment.id : reversalChallan.id;
      await voidPayment(paymentIdToVoid, reversalReason.trim());
      addToast({
        type: 'info',
        title: 'Payment Reversed',
        description: `Payment of Rs ${amtToReverse.toLocaleString()} for ${reversalChallan.challanNumber} was reversed.`,
      });
      setReversalChallan(null);
      setReversalReason('');
      setReversalError('');
    } catch (err: any) {
      setReversalError(err.message || 'Failed to reverse payment.');
    } finally {
      setIsReversing(false);
    }
  };

  // Derived helper for reversal modal
  const reversalData = useMemo(() => {
    if (!reversalChallan) return null;
    const member = members.find(
      (m) =>
        m.memberId === reversalChallan.memberId ||
        m.id === reversalChallan.memberId ||
        m.fullName.toLowerCase() === reversalChallan.memberName.toLowerCase()
    );

    const memberFloors = member?.floors && member.floors.length > 0
      ? member.floors.join(', ')
      : (member?.plotNumber || reversalChallan.houseNumber || 'Basement');

    const linkedPayment = payments.find((p) => {
      if (p.status !== 'Valid' && p.isVoid) return false;
      if (p.challanId === reversalChallan.id || p.challanNumber === reversalChallan.challanNumber) return true;
      if ((p as any).allocations && Array.isArray((p as any).allocations)) {
        if ((p as any).allocations.some((a: any) => a.challanNumber === reversalChallan.challanNumber)) return true;
      }
      if (p.memberId === reversalChallan.memberId || p.memberName.toLowerCase() === reversalChallan.memberName.toLowerCase()) {
        return true;
      }
      return false;
    });

    const amountToReverse = linkedPayment?.paidAmount ?? reversalChallan.paidAmount ?? (reversalChallan.totalAmount ?? reversalChallan.monthlyAmount);

    const formatDisplayDate = (dStr: string) => {
      try {
        const d = new Date(dStr.includes('T') ? dStr : `${dStr}T00:00:00`);
        if (isNaN(d.getTime())) return dStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
      } catch {
        return dStr;
      }
    };

    const paymentDateStr = linkedPayment?.paymentDate || getLocalTodayYMD();
    const paymentTypeLabel = linkedPayment?.paymentType === 'Partial Paid' ? 'Partial' : 'Full';
    const originalPaymentText = `Rs ${amountToReverse.toLocaleString()} on ${formatDisplayDate(paymentDateStr)} (${paymentTypeLabel})`;
    const collectedBy = linkedPayment?.collectedBy || linkedPayment?.collectedByName || currentUser?.fullName || 'Administrator';

    const today = new Date();
    const formattedReversalDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

    return {
      member,
      memberFloors,
      linkedPayment,
      amountToReverse,
      originalPaymentText,
      collectedBy,
      formattedReversalDate,
    };
  }, [reversalChallan, members, payments, currentUser]);

  const handleShareChallan = (c: Challan) => {
    const member = members.find(
      (m) =>
        m.memberId === c.memberId ||
        m.id === c.memberId ||
        m.fullName.toLowerCase() === c.memberName.toLowerCase()
    );
    const floors = member?.floors && member.floors.length > 0
      ? member.floors.join(', ')
      : (member?.plotNumber || c.houseNumber || 'Basement');

    const shareText = `*RWA Monthly Security Challan (Receipt)*\nChallan No: ${c.challanNumber}\nMember: ${c.memberName}\nFloor(s): ${floors}\nMonth: ${c.month}\nDue Date: ${c.dueDate}\nAssigned Amount: Rs ${((c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount)).toLocaleString()}\nPaid Amount: Rs ${((c.paidAmount ?? (c.status === 'Paid' ? (c.totalAmount ?? c.monthlyAmount) : 0))).toLocaleString()}\nBalance: Rs ${((c.balance ?? 0)).toLocaleString()}\nStatus: ${c.status}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      addToast({
        type: 'success',
        title: 'Receipt Copied',
        description: `Challan receipt summary for ${c.memberName} (${c.challanNumber}) copied to clipboard.`,
      });
    }
  };

  const handleDownloadPdf = (c: Challan) => {
    const member = members.find(
      (m) =>
        m.memberId === c.memberId ||
        m.id === c.memberId ||
        m.fullName.toLowerCase() === c.memberName.toLowerCase()
    );
    downloadChallanPdf(c, member, settings);
    addToast({
      type: 'success',
      title: 'PDF Downloaded',
      description: `Challan ${c.challanNumber} downloaded directly to your Downloads folder.`,
    });
  };

  const handleQuickPay = (c: Challan) => {
    const isConfirmed = window.confirm(`Mark Rs ${c.balance.toLocaleString()} as fully paid?`);
    if (!isConfirmed) return;

    collectPayment({
      memberId: c.memberId,
      challanId: c.id,
      paymentType: 'Full Paid',
      paidAmount: c.balance,
      paymentMethod: 'Cash',
      paymentDate: getLocalTodayYMD(),
      notes: 'Full payment collected',
    });

    const member = members.find(
      (m) =>
        m.memberId === c.memberId ||
        m.id === c.memberId ||
        m.fullName.toLowerCase() === c.memberName.toLowerCase()
    );

    const updatedChallan: Challan = {
      ...c,
      paidAmount: (c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount),
      balance: 0,
      status: 'Paid',
    };

    downloadChallanPdf(updatedChallan, member, settings);

    addToast({
      type: 'success',
      title: 'Payment Collected',
      description: `Rs ${c.balance.toLocaleString()} collected & Paid PDF downloaded directly to your Downloads folder.`,
    });
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallan) return;

    const collectedAmt = Number(paidAmount);
    if (isNaN(collectedAmt) || collectedAmt <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    const receipt = collectPayment({
      memberId: activeChallan.memberId,
      challanId: activeChallan.id,
      paymentType,
      paidAmount: collectedAmt,
      paymentMethod,
      paymentDate,
      referenceNumber,
      notes,
    });

    const isFull = paymentType === 'Full Paid' || collectedAmt >= activeChallan.balance;
    const member = members.find(
      (m) =>
        m.memberId === activeChallan.memberId ||
        m.id === activeChallan.memberId ||
        m.fullName.toLowerCase() === activeChallan.memberName.toLowerCase()
    );

    const updatedChallan: Challan = {
      ...activeChallan,
      paidAmount: (activeChallan.paidAmount ?? 0) + collectedAmt,
      balance: Math.max(0, activeChallan.balance - collectedAmt),
      status: isFull ? 'Paid' : 'Partial Paid',
    };

    downloadChallanPdf(updatedChallan, member, settings);

    setSuccessReceipt(receipt?.receiptNumber || receipt);
  };

  const filteredChallans = useMemo(() => {
    const list = challans.filter((c) => {
      const matchMonth = filterMonth === 'All' || c.month.toLowerCase().includes(filterMonth.toLowerCase());
      const matchStatus = filterStatus === 'All' || c.status.toLowerCase() === filterStatus.toLowerCase();
      
      const member = members.find(
        (m) => m.memberId === c.memberId || m.id === c.memberId || m.fullName === c.memberName
      );
      const memberFloors = member?.floors && member.floors.length > 0
        ? member.floors
        : (member?.plotNumber ? member.plotNumber.split(',').map(s => s.trim()).filter(Boolean) : (c.houseNumber ? [c.houseNumber] : ['Ground']));

      const matchFloor = filterFloor === 'All' || memberFloors.some(f => f.toLowerCase().includes(filterFloor.toLowerCase()));

      let matchDate = true;
      if (fromDate) {
        matchDate = matchDate && (c.dueDate >= fromDate || (c.generatedDate && c.generatedDate >= fromDate));
      }
      if (toDate) {
        matchDate = matchDate && (c.dueDate <= toDate || (c.generatedDate && c.generatedDate <= toDate));
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.memberName.toLowerCase().includes(q) ||
        c.challanNumber.toLowerCase().includes(q) ||
        c.houseNumber.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (member?.address && member.address.toLowerCase().includes(q)) ||
        c.memberId.toLowerCase().includes(q) ||
        memberFloors.some(f => f.toLowerCase().includes(q));

      return matchMonth && matchStatus && matchFloor && matchDate && matchSearch;
    });

    // Sort: Recently updated / generated / paid challans at the TOP
    return list.sort((a, b) => {
      const timeA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
      const timeB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });
  }, [challans, members, filterMonth, filterStatus, filterFloor, fromDate, toDate, searchQuery]);

  return (
    <div className="space-y-3.5">
      {/* Main Single White Card (Compact) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3.5">
        {/* Filter Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Month */}
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
              <option value="September">September 2026</option>
              <option value="October">October 2026</option>
              <option value="November">November 2026</option>
              <option value="December">December 2026</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial Paid">Partial Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {/* Floor */}
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

          {/* From Date */}
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

          {/* To Date */}
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

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name / business / floor / ..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 bg-white focus:outline-none outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Content Area: Table if challans exist, or Empty State Dashed Box */}
        {filteredChallans.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-3.5 whitespace-nowrap">Name</th>
                  <th className="py-3 px-3 whitespace-nowrap">Floor(s)</th>
                  <th className="py-3 px-3 whitespace-nowrap">Challan</th>
                  <th className="py-3 px-3 whitespace-nowrap">Month</th>
                  <th className="py-3 px-3 whitespace-nowrap">Amount</th>
                  <th className="py-3 px-3 whitespace-nowrap">Paid</th>
                  <th className="py-3 px-3 whitespace-nowrap">Balance</th>
                  <th className="py-3 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap min-w-[220px] pr-4">Collection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.map((c) => {
                  const member = members.find(
                    (m) => m.memberId === c.memberId || m.id === c.memberId || m.fullName === c.memberName
                  );
                  const memberFloors = member?.floors && member.floors.length > 0
                    ? member.floors
                    : (member?.plotNumber ? member.plotNumber.split(',').map(s => s.trim()).filter(Boolean) : (c.houseNumber ? [c.houseNumber] : ['Ground']));

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {c.memberName}
                      </td>

                      {/* Floor(s) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {memberFloors.map((fl, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600"
                            >
                              {fl}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Challan */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {c.challanNumber}
                      </td>

                      {/* Month */}
                      <td className="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {c.month}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        Rs {((c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount)).toLocaleString()}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        Rs {((c.paidAmount ?? 0)).toLocaleString()}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        Rs {((c.balance ?? 0)).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
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

                      {/* Collection Action */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap min-w-[220px] pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.status !== 'Paid' ? (
                            <>
                              {/* Paid button */}
                              <button
                                type="button"
                                onClick={() => handleQuickPay(c)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200/80 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Paid
                              </button>

                              {/* Partial button */}
                              <button
                                type="button"
                                onClick={() => openPaymentModal(c, 'Partial Paid')}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-lg border border-amber-200/80 shadow-2xs transition-colors cursor-pointer"
                              >
                                <span className="text-[11px] font-black leading-none">½</span> Partial
                              </button>

                              {/* Reversal button for Partial Paid */}
                              {c.status === 'Partial Paid' && (
                                <button
                                  type="button"
                                  onClick={() => openReversalModal(c)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg border border-blue-200/80 shadow-2xs transition-colors cursor-pointer"
                                >
                                  <Undo2 className="w-3.5 h-3.5" /> Reversal
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Paid PDF */}
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(c)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                              >
                                Paid PDF
                              </button>

                              {/* Share */}
                              <button
                                type="button"
                                onClick={() => handleShareChallan(c)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                              >
                                Share
                              </button>

                              {/* Reversal */}
                              <button
                                type="button"
                                onClick={() => openReversalModal(c)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg border border-blue-200/80 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Undo2 className="w-3.5 h-3.5" /> Reversal
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty state */
          <div className="border border-dashed border-slate-200 rounded-xl py-10 sm:py-12 px-4 text-center flex flex-col items-center justify-center my-1">
            <div className="w-9 h-9 rounded-full border-2 border-slate-300 flex items-center justify-center mb-2.5">
              <Check className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
              No challans in this view
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generate challans first or change your filters.
            </p>
          </div>
        )}
      </div>

      {/* Collect Payment Modal Dialog */}
      {activeChallan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Payment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeChallan.challanNumber} · {activeChallan.memberName} ({activeChallan.month})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveChallan(null)}
                className="w-8 h-8 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successReceipt ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Payment Successfully Collected!
                </h4>
                <p className="text-xs text-slate-500">
                  Receipt Number: <strong className="text-slate-800">{successReceipt}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setActiveChallan(null)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Payment Type
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => {
                        const val = e.target.value as 'Full Paid' | 'Partial Paid';
                        setPaymentType(val);
                        if (val === 'Full Paid') {
                          setPaidAmount(activeChallan.balance);
                        } else {
                          setPaidAmount(0);
                        }
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Full Paid">Full Paid</option>
                      <option value="Partial Paid">Partial Paid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'Online')}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online / Raast</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Amount (Rs)
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      max={activeChallan.balance}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold focus:outline-none outline-none focus:border-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                      required
                    />
                  </div>
                </div>

                {paymentMethod === 'Online' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Reference / Raast ID
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. TXN-89210"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional collection remarks"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveChallan(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold text-white shadow-2xs cursor-pointer"
                  >
                    Confirm Collection
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalChallan && reversalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-bold text-slate-900">
                Reverse Payment
              </h3>
              <button
                type="button"
                onClick={() => setReversalChallan(null)}
                className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amber Warning Notice */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] p-3.5 rounded-xl text-xs leading-relaxed">
              A reversal does not delete the original payment. The original transaction is marked reversed and a permanent audit record is created.
            </div>

            {/* Summary Details Card */}
            <div className="bg-slate-50/40 border border-slate-200/80 rounded-xl p-4 text-xs space-y-1.5 text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Member:</span> {reversalChallan.memberName}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Challan:</span> {reversalChallan.challanNumber}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Floor(s):</span> {reversalData.memberFloors}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Original Payment:</span> {reversalData.originalPaymentText}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Collected By:</span> {reversalData.collectedBy}
              </div>
              <div>
                <span className="font-semibold text-slate-900">Amount to Reverse:</span> Rs {reversalData.amountToReverse.toLocaleString()}
              </div>
            </div>

            {reversalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {reversalError}
              </div>
            )}

            <form onSubmit={handleConfirmReversal} className="space-y-4">
              {/* 2 Columns: Reversal Date & Reversed By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Reversal Date
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={reversalData.formattedReversalDate}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 select-none cursor-default"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Reversed By
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.fullName || 'Administrator'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 select-none cursor-default"
                  />
                </div>
              </div>

              {/* Textarea: Reversal Reason / Note * */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reversal Reason / Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reversalReason}
                  onChange={(e) => {
                    setReversalReason(e.target.value);
                    if (reversalError) setReversalError('');
                  }}
                  rows={4}
                  placeholder="Why is this payment being reversed?"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalChallan(null)}
                  disabled={isReversing}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReversing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isReversing ? 'Reversing...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
