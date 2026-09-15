import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getLocalTodayFormatted, isSameLocalCalendarDay } from '../../utils/formatters';

export const AdminDashboard: React.FC = () => {
  const { members, challans, payments } = useApp();

  // Metric counts matching screenshot
  const totalMembersDisplay = members.length;
  
  // Valid payments calculations
  const validPayments = payments.filter((p) => p.status === 'Valid');
  const netCollection = validPayments.reduce((sum, p) => sum + p.paidAmount, 0);

  // Outstanding amount computed from all challan balances
  const outstandingDisplay = challans.reduce((sum, c) => sum + c.balance, 0);

  // Partial paid count
  const partialPaidCount = challans.filter((c) => c.status === 'Partial Paid').length;

  // Today's collections using consistent local calendar date
  const now = new Date();
  const todayOverviewDateStr = getLocalTodayFormatted(now);
  const todayPayments = validPayments.filter((p) => isSameLocalCalendarDay(p.paymentDate, now));
  const todayNetCollection = todayPayments.reduce((sum, p) => sum + (p.paidAmount ?? p.amount ?? 0), 0);
  const todayFullyPaid = todayPayments.filter((p) => p.paymentType === 'Full Paid').length;
  const todayPartialPaid = todayPayments.filter((p) => p.paymentType === 'Partial Paid').length;
  
  // Reversals Today using consistent local calendar date
  const todayReversals = payments.filter((p) => {
    const isRev = p.status === 'Reversed' || p.status === 'Voided' || p.isVoid;
    if (!isRev) return false;
    const dateToCheck = p.voidedAt || p.paymentDate;
    return isSameLocalCalendarDay(dateToCheck, now);
  });
  const reversalsTodayCount = todayReversals.length;

  // Generated challans count
  const generatedChallansDisplay = challans.length;

  const formatCollectionDate = (dateStr: string) => {
    if (!dateStr) return '12-Sept-2026';
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          const d = parts[2];
          const m = parseInt(parts[1], 10);
          const y = parts[0];
          return `${d}-${months[m - 1] || parts[1]}-${y}`;
        }
      }
    } catch {}
    return dateStr;
  };

  return (
    <div className="space-y-3.5">
      {/* 4 TOP METRIC CARDS: Compact, elegant ERP styling that strictly prevents text overflow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* CARD 1: Total Members */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E6F9F0] flex items-center justify-center shrink-0">
            <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border-2 border-[#10B981] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            </div>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block truncate">
              Total Members
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug my-0.5 truncate">
              {totalMembersDisplay}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight truncate" title="Registered members">
              Registered members
            </p>
          </div>
        </div>

        {/* CARD 2: Net Collection */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#F3E8FF] flex items-center justify-center shrink-0">
            <span className="text-[#7C3AED] font-bold text-xs sm:text-sm leading-none">
              Rs
            </span>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block truncate">
              Net Collection
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug my-0.5 truncate">
              {formatCurrency(netCollection)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight truncate" title="After payment reversals">
              After payment reversal
            </p>
          </div>
        </div>

        {/* CARD 3: Outstanding */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <span className="text-[#D97706] font-bold text-sm sm:text-base leading-none">
              !
            </span>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block truncate">
              Outstanding
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug my-0.5 truncate">
              {formatCurrency(outstandingDisplay)}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight truncate" title="Pending challan balance">
              Pending challan balance
            </p>
          </div>
        </div>

        {/* CARD 4: Partial Paid */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0 overflow-hidden">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <span className="text-[#EF4444] font-bold text-xs sm:text-sm leading-none">
              ½
            </span>
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium leading-tight block truncate">
              Partial Paid
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug my-0.5 truncate">
              {partialPaidCount}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-normal leading-tight truncate" title="Challans with balance">
              Challans with balance
            </p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN MAIN CONTENT: Tightly spaced, compact cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-3.5">
        {/* LEFT COLUMN: Recent Collections (~67% on Desktop) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Recent Collections
            </h2>
          </div>

          {/* Card Body */}
          {validPayments.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl py-6 px-4 text-center flex flex-col items-center justify-center flex-1 my-1 min-h-[160px]">
              {/* Subtle 8-dot circular spinner */}
              <svg
                className="w-4 h-4 text-slate-300 mx-auto mb-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="4" r="1.3" fill="currentColor" fillOpacity="0.25" />
                <circle cx="17.65" cy="6.35" r="1.3" fill="currentColor" fillOpacity="0.35" />
                <circle cx="20" cy="12" r="1.3" fill="currentColor" fillOpacity="0.5" />
                <circle cx="17.65" cy="17.65" r="1.3" fill="currentColor" fillOpacity="0.65" />
                <circle cx="12" cy="20" r="1.3" fill="currentColor" fillOpacity="0.8" />
                <circle cx="6.35" cy="17.65" r="1.3" fill="currentColor" fillOpacity="0.9" />
                <circle cx="4" cy="12" r="1.3" fill="currentColor" fillOpacity="0.95" />
                <circle cx="6.35" cy="6.35" r="1.3" fill="currentColor" fillOpacity="1" />
              </svg>
              <h3 className="text-xs font-semibold text-slate-800">
                No collection yet
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Payments you record will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3.5 px-3.5 mt-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs">
                    <th className="py-3 px-3 whitespace-nowrap">Member</th>
                    <th className="py-3 px-3 whitespace-nowrap">Floor</th>
                    <th className="py-3 px-3 whitespace-nowrap">Date</th>
                    <th className="py-3 px-3 whitespace-nowrap">Amount</th>
                    <th className="py-3 px-3 whitespace-nowrap">Type</th>
                    <th className="py-3 px-3 whitespace-nowrap">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validPayments.slice(0, 5).map((pay) => {
                    const member = members.find(
                      (m) =>
                        m.memberId === pay.memberId ||
                        m.id === pay.memberId ||
                        m.fullName.toLowerCase() === pay.memberName.toLowerCase()
                    );
                    const memberFloors =
                      member?.floors && member.floors.length > 0
                        ? member.floors
                        : member?.plotNumber
                        ? member.plotNumber.split(',').map((s) => s.trim()).filter(Boolean)
                        : ['Ground', '1st Floor', '2nd Floor'];

                    return (
                      <tr
                        key={pay.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Member */}
                        <td className="py-3.5 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                          {pay.memberName}
                        </td>

                        {/* Floor badges */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {memberFloors.map((fl: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F3FF] text-[#7C3AED]"
                              >
                                {fl}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 text-slate-700 font-medium text-xs whitespace-nowrap">
                          {formatCollectionDate(pay.paymentDate)}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                          Rs {((pay.paidAmount ?? pay.amount)).toLocaleString()}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pay.paymentType === 'Partial Paid'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            {pay.paymentType || 'Full Paid'}
                          </span>
                        </td>

                        {/* Collected By */}
                        <td className="py-3.5 px-3 text-slate-600 font-medium text-xs whitespace-nowrap">
                          {pay.collectedBy || 'Administrator'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Showing {Math.min(5, validPayments.length)} of {validPayments.length} collections
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Today Overview (~32% on Desktop) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Today Overview
              </h2>
              <span className="text-[11px] text-slate-400 font-normal">
                {todayOverviewDateStr}
              </span>
            </div>

            {/* 5 Rows with styled grey pills matching image.png */}
            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              {/* Row 1: Today's Net Collection */}
              <div className="bg-[#F9FAFB] rounded-lg px-3 py-1.5 sm:py-2 flex items-center justify-between border border-slate-100/60">
                <span className="text-[11px] text-slate-500 font-normal">
                  Today&apos;s Net Collection
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {formatCurrency(todayNetCollection)}
                </span>
              </div>

              {/* Row 2: Fully Paid Today */}
              <div className="bg-[#F9FAFB] rounded-lg px-3 py-1.5 sm:py-2 flex items-center justify-between border border-slate-100/60">
                <span className="text-[11px] text-slate-500 font-normal">
                  Fully Paid Today
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {todayFullyPaid}
                </span>
              </div>

              {/* Row 3: Partial Payments Today */}
              <div className="bg-[#F9FAFB] rounded-lg px-3 py-1.5 sm:py-2 flex items-center justify-between border border-slate-100/60">
                <span className="text-[11px] text-slate-500 font-normal">
                  Partial Payments Today
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {todayPartialPaid}
                </span>
              </div>

              {/* Row 4: Reversals Today */}
              <div className="bg-[#F9FAFB] rounded-lg px-3 py-1.5 sm:py-2 flex items-center justify-between border border-slate-100/60">
                <span className="text-[11px] text-slate-500 font-normal">
                  Reversals Today
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {reversalsTodayCount}
                </span>
              </div>

              {/* Row 5: Generated Challans */}
              <div className="bg-[#F9FAFB] rounded-lg px-3 py-1.5 sm:py-2 flex items-center justify-between border border-slate-100/60">
                <span className="text-[11px] text-slate-500 font-normal">
                  Generated Challans
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {generatedChallansDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
