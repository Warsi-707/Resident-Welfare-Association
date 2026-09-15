import React, { useState, useEffect } from 'react';
import {
  Printer,
  CreditCard,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Check,
  Send,
  Loader2,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

export const ChallanDetailPage: React.FC = () => {
  const {
    pageParams,
    getChallan,
    getMember,
    settings,
    navigateTo,
    currentUser,
    deleteChallan,
    sendChallanWhatsApp,
  } = useApp();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const challanId = pageParams.challanId;
  const challan = getChallan(challanId);
  const member = challan ? getMember(challan.memberId) : null;

  useEffect(() => {
    if (!challan) return;
    const assignedAmt =
      challan.totalAmount ?? challan.totalOutstanding ?? challan.monthlyAmount;
    const qrDataText = `CHALLAN:${challan.challanNumber}\nMEMBER:${challan.memberName}\nMONTH:${challan.month}\nAMOUNT:Rs.${assignedAmt}\nSTATUS:${challan.status}`;
    QRCode.toDataURL(qrDataText, { margin: 1, width: 140 })
      .then((url) => setQrCodeUrl(url))
      .catch(() => setQrCodeUrl(null));
  }, [challan]);

  if (!challan) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 max-w-md mx-auto my-8 shadow-xs">
        <p className="text-sm font-semibold text-slate-700">Challan record not found.</p>
        <p className="text-xs text-slate-400 mt-1">The requested voucher could not be located in the database.</p>
        <button
          onClick={() => navigateTo('challans')}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs transition-colors cursor-pointer"
        >
          Back to All Challans
        </button>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';
  const hasPaymentHistory = challan.paidAmount > 0 || challan.status === 'Paid' || challan.status === 'Partial Paid';

  const handleDeleteClick = () => {
    if (hasPaymentHistory) {
      setDeleteBlockedOpen(true);
    } else {
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const ok = await deleteChallan(challan.id);
      if (ok) {
        setDeleteModalOpen(false);
        navigateTo('challans');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      await sendChallanWhatsApp(challan.id);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const deliveryStatus = (challan.whatsappStatus || 'PENDING').toUpperCase();

  // Get payment completion date if available from allocations
  const latestPaymentDate = challan.allocations && challan.allocations.length > 0
    ? challan.allocations[challan.allocations.length - 1].paymentDate
    : undefined;

  // Single Voucher Component
  const renderSingleVoucher = (copyTitle: string, isPrintOnly = false) => {
    const memberName = challan.memberName;
    const contact = member?.contactNumber || member?.phone || challan.contactNumber || '—';
    const propertyType = member?.memberType === 'COMMERCIAL' ? 'Commercial' : 'Residential';
    const floorsList = member?.floors && member.floors.length > 0
      ? member.floors.join(', ')
      : (member?.plotNumber || challan.houseNumber || 'Basement');
    const address = challan.address || member?.address || challan.houseNumber || 'Karachi, Pakistan';
    const billingMonth = challan.month;
    
    const formatDisplayDate = (d: string) => {
      if (!d) return '10-Nov-2026';
      try {
        const cleanD = d.split('T')[0];
        const parts = cleanD.split('-');
        if (parts.length === 3) {
          const year = parts[0];
          const monthIndex = parseInt(parts[1], 10) - 1;
          const day = parts[2];
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${day}-${months[monthIndex] || parts[1]}-${year}`;
        }
      } catch {}
      return d;
    };
    const dueDate = formatDisplayDate(challan.dueDate);
    const issueDate = formatDisplayDate(challan.generatedDate || new Date().toISOString());
    const assignedAmount = challan.totalAmount ?? challan.totalOutstanding ?? challan.monthlyAmount;
    const monthlyAmount = challan.monthlyAmount ?? challan.baseAmount ?? assignedAmount;
    const arrearsAmount = challan.arrearsAmount ?? (assignedAmount > monthlyAmount ? assignedAmount - monthlyAmount : 0);
    const paidAmount = challan.paidAmount ?? (challan.status === 'Paid' ? assignedAmount : 0);
    const balance = challan.balance ?? (assignedAmount - paidAmount);
    const status = challan.status;

    return (
      <div
        className={`bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 text-slate-900 font-sans shadow-xs space-y-6 max-w-2xl mx-auto ${
          isPrintOnly ? 'print-voucher my-4' : ''
        }`}
      >
        {/* Top Row: Title + Right Digital Badge & QR */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                {settings.organizationName || 'Resident Welfare Association'}
              </p>
              {copyTitle && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                  {copyTitle}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight mt-0.5">
              Invoice
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Monthly Maintenance Challan
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Logo (from settings) */}
            {settings.logoUrl && (
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
                <img
                  src={settings.logoUrl}
                  alt="Association Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* 3-Column Metadata: Association, Member, Challan Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          {/* Col 1: Association Information */}
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-sm text-slate-900">Association Information</h3>
            <p className="font-bold text-slate-900 mt-1">
              {settings.organizationName || 'Resident Welfare Association'}
            </p>
            <p className="text-slate-500">
              Reg No: {settings.registrationNumber || settings.associationShortName || 'RWA-REG-2026'}
            </p>
            <p className="text-slate-500 leading-snug">
              {settings.address || 'Block 12 FB Area, Karachi, Sindh'}
            </p>
            {settings.contactNumber && (
              <p className="text-slate-500">Phone: {settings.contactNumber}</p>
            )}
          </div>

          {/* Col 2: Member Information */}
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-sm text-slate-900">Member Information</h3>
            <p className="font-bold text-slate-900 mt-1">{memberName}</p>
            <p className="text-slate-500">Contact: {contact}</p>
            <p className="text-slate-500">{propertyType} &bull; {floorsList}</p>
            <p className="text-slate-500 leading-snug">{address}</p>
          </div>

          {/* Col 3: Challan Summary */}
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-sm text-slate-900">Challan Summary</h3>
            <p className="font-bold text-slate-900 mt-1">Challan: {challan.challanNumber}</p>
            <p className="text-slate-500">Billing Month: {billingMonth}</p>
            <p className="text-slate-500">Due Date: {dueDate}</p>
            <p className="text-slate-500">Issue Date: {issueDate}</p>
          </div>
        </div>

        {/* Section Subtitle */}
        <div className="pt-1">
          <h4 className="font-serif italic text-base text-slate-800">
            Description of Services
          </h4>
        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold rounded-lg overflow-hidden">
                <th className="py-2 px-3 text-left w-12 rounded-l-md">Item</th>
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-center w-20">Quantity</th>
                <th className="py-2 px-3 text-right w-24">Unit Price</th>
                <th className="py-2 px-3 text-right w-24 rounded-r-md">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-500">001</td>
                <td className="py-2.5 px-3 font-medium text-slate-900">
                  Monthly Maintenance Charges ({billingMonth})
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">1</td>
                <td className="py-2.5 px-3 text-right text-slate-600">
                  Rs. {monthlyAmount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                  Rs. {monthlyAmount.toLocaleString()}
                </td>
              </tr>

              {arrearsAmount > 0 && (
                <tr>
                  <td className="py-2.5 px-3 font-medium text-slate-500">002</td>
                  <td className="py-2.5 px-3 font-medium text-amber-700">
                    Previous Arrears / Outstanding Balance
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">1</td>
                  <td className="py-2.5 px-3 text-right text-amber-700">
                    Rs. {arrearsAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-amber-700">
                    Rs. {arrearsAmount.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="border-b border-slate-900 mt-1" />
        </div>

        {/* Bottom Row: Status Stamp (Left) + Totals Breakdown (Right) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          {/* Left Side Status Stamp */}
          <div>
            {status === 'Paid' ? (
              <div className="px-4 py-2.5 rounded-lg border-2 border-emerald-500 bg-emerald-50/70 text-emerald-700 inline-block shadow-2xs">
                <div className="font-extrabold text-xs tracking-wider flex items-center gap-1.5">
                  PAID IN FULL <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="text-[9px] font-medium text-emerald-600 mt-0.5">
                  THANK YOU FOR YOUR TIMELY PAYMENT
                </div>
              </div>
            ) : status === 'Partial Paid' ? (
              <div className="px-4 py-2.5 rounded-lg border-2 border-amber-500 bg-amber-50/70 text-amber-800 inline-block shadow-2xs">
                <div className="font-extrabold text-xs tracking-wider">
                  PARTIALLY PAID
                </div>
                <div className="text-[9px] font-medium text-amber-700 mt-0.5">
                  BALANCE DUE: RS. {balance.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-lg border-2 border-rose-500 bg-rose-50/70 text-rose-800 inline-block shadow-2xs">
                <div className="font-extrabold text-xs tracking-wider">
                  PAYMENT DUE
                </div>
                <div className="text-[9px] font-medium text-rose-700 mt-0.5">
                  PAY ON OR BEFORE {dueDate.toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Right Side Totals */}
          <div className="w-full sm:w-64 space-y-1.5 text-xs self-end">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                Rs. {monthlyAmount.toLocaleString()}
              </span>
            </div>

            {arrearsAmount > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Prior Arrears</span>
                <span className="font-semibold">
                  Rs. {arrearsAmount.toLocaleString()}
                </span>
              </div>
            )}

            <div className="border-t border-slate-900 pt-1.5 flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-900">Total Amount</span>
              <span className="font-extrabold text-base text-slate-900">
                Rs. {assignedAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Paid Amount</span>
              <span className="font-bold text-emerald-600">
                Rs. {paidAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Balance Due</span>
              <span className={`font-bold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Rs. {balance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-2">
          <p className="text-[11px] text-slate-500 italic">
            {settings.challanFooter ||
              `Thank you for choosing ${settings.organizationName || 'Resident Welfare Association'}.`}
          </p>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] font-bold text-slate-500 tracking-wide">
              Powered By Isysware
            </span>
          </div>
        </div>
      </div>
    );
  };

  const copiesCount = settings.challanCopies || 1;

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto">
      {/* ================= SCREEN ACTION HEADER ================= */}
      <div className="no-print bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Challan Voucher {challan.challanNumber}
            </h2>
            <StatusBadge status={challan.status} size="sm" />
            {deliveryStatus === 'SENT' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                WhatsApp: SENT
              </span>
            ) : deliveryStatus === 'DELIVERED' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                <CheckCheck className="w-3 h-3" />
                WhatsApp: DELIVERED
              </span>
            ) : deliveryStatus === 'READ' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">
                <CheckCheck className="w-3 h-3 text-teal-600" />
                WhatsApp: READ
              </span>
            ) : deliveryStatus === 'FAILED' ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 cursor-help"
                title={challan.whatsappError || 'WhatsApp delivery failed.'}
              >
                <AlertCircle className="w-3 h-3" />
                WhatsApp: FAILED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#7C3AED] border border-purple-100">
                <Clock className="w-3 h-3" />
                WhatsApp: PENDING
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Billing Month: {challan.month} &bull; Issued to {challan.memberName} ({challan.houseNumber})
            {challan.whatsappError && (
              <span className="text-rose-500 font-medium ml-2">
                &bull; {challan.whatsappError}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => navigateTo('challans')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Back</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            disabled={isSendingWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Send or resend branded PDF directly to member WhatsApp"
          >
            {isSendingWhatsApp ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{deliveryStatus === 'SENT' ? 'Resend WhatsApp' : 'Send WhatsApp'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Challan {copiesCount > 1 ? `(${copiesCount} Copies)` : ''}</span>
          </button>

          {challan.balance > 0 && (
            <button
              onClick={() =>
                navigateTo('collect-payment', {
                  selectedMemberId: challan.memberId,
                  selectedChallanId: challan.id,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect Payment</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Delete Unpaid Challan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Challan</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= SCREEN VOUCHER VIEW (SINGLE CLEAN VOUCHER) ================= */}
      <div className="no-print">
        {renderSingleVoucher('Official Voucher / Resident Copy')}
      </div>

      {/* ================= PRINT / PDF LAYOUT (HANDLES 1, 2, OR 3 COPIES IN PRINT STYLES) ================= */}
      <div className="hidden print-only space-y-4">
        {copiesCount === 1 && (
          <div>{renderSingleVoucher('Resident Member Copy', true)}</div>
        )}

        {copiesCount === 2 && (
          <div className="space-y-6">
            <div>{renderSingleVoucher('Association Copy', true)}</div>
            <div className="border-t-2 border-dashed border-slate-400 my-4"></div>
            <div>{renderSingleVoucher('Resident Member Copy', true)}</div>
          </div>
        )}

        {copiesCount === 3 && (
          <div className="space-y-4">
            <div>{renderSingleVoucher('Association Copy', true)}</div>
            <div className="border-t-2 border-dashed border-slate-400 my-3"></div>
            <div>{renderSingleVoucher('Bank / Office Copy', true)}</div>
            <div className="border-t-2 border-dashed border-slate-400 my-3"></div>
            <div>{renderSingleVoucher('Resident Member Copy', true)}</div>
          </div>
        )}
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModalOpen && (
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
                  {challan.challanNumber} &bull; {challan.memberName} ({challan.month})
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
                onClick={() => setDeleteModalOpen(false)}
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
      {deleteBlockedOpen && (
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
                onClick={() => setDeleteBlockedOpen(false)}
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

