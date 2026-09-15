import React from 'react';
import { Printer, ArrowLeft, Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ReceiptDetailPage: React.FC = () => {
  const { pageParams, getPayment, getMember, settings, navigateTo } = useApp();
  const receiptId = pageParams.receiptId || pageParams.paymentId;
  const payment = getPayment(receiptId);
  const member = payment ? getMember(payment.memberId) : null;

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Payment receipt not found.</p>
        <button
          onClick={() => navigateTo('payment-history')}
          className="mt-3 px-4 py-2 text-xs font-semibold rounded-xl bg-[#7C3AED] text-white"
        >
          Return to Payment History
        </button>
      </div>
    );
  }

  const isVoided = payment.status === 'Voided';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3.5">
      {/* Action Header on screen */}
      <div className="no-print flex items-center justify-between">
        <button
          onClick={() => navigateTo('payment-history')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Register</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Receipt</span>
        </button>
      </div>

      {/* Official Receipt Card (A4 / voucher optimized) */}
      <div className="bg-white rounded-2xl border-2 border-slate-700 p-8 shadow-sm relative overflow-hidden text-slate-900 font-sans">
        {/* Void watermark banner */}
        {isVoided && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-20">
            <span className="text-7xl font-black text-rose-700 -rotate-45 tracking-widest border-8 border-rose-700 px-8 py-2">
              VOIDED
            </span>
          </div>
        )}

        {/* Association Letterhead */}
        <div className="text-center pb-5 border-b-2 border-slate-800">
          <div className="flex items-center justify-center gap-2.5 font-bold text-base text-slate-900 uppercase tracking-wide">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.organizationName}
                className="h-10 w-auto max-w-[120px] object-contain shrink-0"
              />
            ) : (
              <Building2 className="w-5 h-5 text-[#7C3AED]" />
            )}
            <span>{settings.organizationName}</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">{settings.address}</p>
          <p className="text-xs text-slate-500">
            Reg. No: {settings.registrationNumber || 'RWA-2024-REG'} &bull; Contact: {settings.contactNumber}
          </p>
          <div className="mt-3 inline-block px-4 py-1 border border-slate-800 font-bold uppercase text-xs tracking-wider bg-slate-100">
            OFFICIAL COLLECTION RECEIPT
          </div>
        </div>

        {/* Receipt Meta Grid */}
        <div className="grid grid-cols-2 gap-4 my-5 text-xs bg-slate-50 p-3.5 border border-slate-200 rounded-xl">
          <div>
            <span className="text-slate-500 block">Receipt Number:</span>
            <span className="font-mono font-bold text-sm text-[#7C3AED]">
              {payment.receiptNumber}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Date of Deposit:</span>
            <span className="font-semibold text-slate-900">{formatDate(payment.paymentDate)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Payment Method & Type:</span>
            <span className="font-semibold text-slate-900">
              {payment.paymentMethod} &bull; {payment.paymentType || 'Full Paid'}
            </span>
            {payment.referenceNumber && (
              <span className="block font-mono text-[11px] text-slate-600 mt-0.5">
                Ref: {payment.referenceNumber}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Collected By:</span>
            <span className="font-semibold text-slate-900">{payment.collectedBy}</span>
          </div>
        </div>

        {/* Member Particulars */}
        <div className="mb-5 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Received With Thanks From:</span>
            <span className="font-bold text-slate-900 text-sm">{payment.memberName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Member Registration ID:</span>
            <span className="font-mono font-semibold text-slate-900">{payment.memberId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Property / House Number:</span>
            <span className="font-semibold text-slate-900">{payment.houseNumber}</span>
          </div>
          {member && (
            <div className="flex justify-between">
              <span className="text-slate-500">Contact:</span>
              <span className="font-mono text-slate-700">{member.contactNumber}</span>
            </div>
          )}
        </div>

        {/* Amount Table */}
        <table className="w-full text-xs border border-slate-300 mb-5">
          <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
            <tr>
              <th className="py-2 px-3 text-left">Description</th>
              <th className="py-2 px-3 text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            <tr>
              <td className="py-2.5 px-3 font-sans">
                Maintenance Subscription Payment ({payment.relevantMonth || 'Current'})
                {payment.notes && (
                  <span className="block text-[11px] font-sans text-slate-500 mt-0.5">
                    Note: {payment.notes}
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-bold text-sm">
                {formatCurrency(payment.paidAmount)}
              </td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-400">
              <td className="py-2.5 px-3 font-sans">Total Amount Received</td>
              <td className="py-2.5 px-3 text-right text-base text-emerald-700">
                {formatCurrency(payment.paidAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Post payment balance notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center mb-8">
          <span className="text-slate-600">Remaining Balance on Member Account:</span>
          <span
            className={`font-mono font-bold text-sm ${
              payment.remainingBalance === 0 ? 'text-emerald-700' : 'text-slate-900'
            }`}
          >
            {formatCurrency(payment.remainingBalance)}
          </span>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs">
          <div className="text-center">
            <div className="border-b border-dashed border-slate-400 w-48 mx-auto mb-2 h-10 flex items-end justify-center text-slate-400 font-mono text-[10px]">
              {payment.collectedBy}
            </div>
            <span className="text-slate-600 font-medium">Authorized Cashier Signature</span>
          </div>

          <div className="text-center">
            <div className="border-b border-dashed border-slate-400 w-48 mx-auto mb-2 h-10" />
            <span className="text-slate-600 font-medium">Resident Member Signature</span>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-100">
          This is a computer-generated official receipt by {settings.organizationName}. Inquiries: {settings.contactNumber}.
        </div>
      </div>
    </div>
  );
};
