import React, { useState, useEffect } from 'react';
import { X, Check, Phone, Mail, MapPin } from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { Challan } from '../../types';

interface ChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  challan?: Challan | null;
  // If previewing before generating
  previewData?: {
    memberName?: string;
    contactNumber?: string;
    propertyType?: string;
    floors?: string;
    address?: string;
    month?: string;
    dueDate?: string;
    monthlyAmount?: number;
  };
  title?: string;
}

export const ChallanModal: React.FC<ChallanModalProps> = ({
  isOpen,
  onClose,
  challan,
  previewData,
  title = 'Challan Preview',
}) => {
  const { settings, members } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Resolve member info
  const member = challan
    ? members.find(
        (m) =>
          m.memberId === challan.memberId ||
          m.id === challan.memberId ||
          m.fullName.toLowerCase() === challan.memberName.toLowerCase()
      )
    : null;

  const memberName =
    challan?.memberName || previewData?.memberName || member?.fullName || 'Resident Member';
  const contact =
    member?.contactNumber ||
    member?.phone ||
    previewData?.contactNumber ||
    challan?.contactNumber ||
    '—';

  const propertyType =
    member?.memberType === 'COMMERCIAL' || previewData?.propertyType === 'Commercial'
      ? 'Commercial'
      : 'Residential';

  const floorsList =
    member?.floors && member.floors.length > 0
      ? member.floors.join(', ')
      : member?.plotNumber || previewData?.floors || challan?.houseNumber || 'Basement';

  const address =
    challan?.address || member?.address || previewData?.address || challan?.houseNumber || 'Karachi, Pakistan';
  const billingMonth = challan?.month || previewData?.month || 'Current Month';

  const rawDueDate = challan?.dueDate || previewData?.dueDate || '10-Nov-2026';
  const formatDisplayDate = (d: string) => {
    if (!d) return '10-Nov-2026';
    try {
      const parts = d.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return `${day}-${months[monthIndex] || parts[1]}-${year}`;
      }
    } catch {}
    return d;
  };
  const dueDate = formatDisplayDate(rawDueDate);
  const issueDate = formatDisplayDate(challan?.generatedDate || new Date().toISOString().split('T')[0]);

  const assignedAmount = challan
    ? (challan.totalAmount ?? challan.totalOutstanding ?? challan.monthlyAmount)
    : (previewData?.monthlyAmount ?? 2000);
  const monthlyAmount = challan?.monthlyAmount ?? challan?.baseAmount ?? assignedAmount;
  const arrearsAmount =
    challan?.arrearsAmount ?? (assignedAmount > monthlyAmount ? assignedAmount - monthlyAmount : 0);
  const paidAmount = challan?.paidAmount ?? 0;
  const balance = challan ? challan.balance : assignedAmount;
  const status = challan?.status || (balance === 0 ? 'Paid' : 'Unpaid');
  const challanNo = challan?.challanNumber || 'RWA-CHALLAN';

  // Generate QR Code on mount or challan change
  useEffect(() => {
    if (!isOpen) return;
    const qrDataText = `CHALLAN:${challanNo}\nMEMBER:${memberName}\nMONTH:${billingMonth}\nAMOUNT:Rs.${assignedAmount}\nSTATUS:${status}`;
    QRCode.toDataURL(qrDataText, { margin: 1, width: 140 })
      .then((url) => setQrCodeUrl(url))
      .catch(() => setQrCodeUrl(null));
  }, [isOpen, challanNo, memberName, billingMonth, assignedAmount, status]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden w-full max-w-2xl mx-auto my-auto animate-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Executive Invoice Preview Layout */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            {/* Top Row: Title + Right Digital Badge & QR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                  {settings.organizationName || 'Resident Welfare Association'}
                </p>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight mt-0.5">
                  Invoice
                </h1>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Monthly Maintenance Challan
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
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
                <p className="font-bold text-slate-900 mt-1">Challan: {challanNo}</p>
                <p className="text-slate-500">Billing Month: {billingMonth}</p>
                <p className="text-slate-500">Due Date: {dueDate}</p>
                <p className="text-slate-500">Issue Date: {issueDate}</p>
              </div>
            </div>

            {/* Section Subtitle */}
            <div className="pt-2">
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

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
