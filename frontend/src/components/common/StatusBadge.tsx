import React from 'react';
import { ChallanStatus, MemberStatus, PaymentType, PaymentMethod, StaffStatus, PaymentRecordStatus } from '../../types';

interface StatusBadgeProps {
  status: ChallanStatus | MemberStatus | PaymentType | PaymentMethod | StaffStatus | PaymentRecordStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  const normalized = String(status).toLowerCase();

  if (normalized === 'paid' || normalized === 'active' || normalized === 'valid') {
    // Green
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (normalized === 'partial paid' || normalized === 'partial' || normalized === 'pending') {
    // Amber
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'unpaid' || normalized === 'overdue' || normalized === 'voided') {
    // Red
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'inactive') {
    // Neutral Gray
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (normalized === 'cash') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'online') {
    colorClasses = 'bg-blue-50 text-blue-600 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (normalized === 'full paid') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  const paddingClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${paddingClasses} ${colorClasses} whitespace-nowrap tracking-tight`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
