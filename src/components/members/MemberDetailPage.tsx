import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  Home,
  Phone,
  FileSpreadsheet,
  Receipt,
  UserCheck,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

export const MemberDetailPage: React.FC = () => {
  const { pageParams, getMember, challans, payments, getMemberLedger, navigateTo, deleteMember, currentUser, settings } =
    useApp();
  const memberId = pageParams?.memberId;
  const member = getMember(memberId);

  const [activeTab, setActiveTab] = useState<'overview' | 'challans' | 'payments' | 'receipts' | 'ledger'>(
    'overview'
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!member) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <p className="text-sm text-slate-500 font-medium">Member account not found or invalid ID.</p>
        <button
          onClick={() => navigateTo('members')}
          className="mt-3 px-4 py-2 text-xs text-blue-600 hover:underline font-semibold"
        >
          Return to Member Directory
        </button>
      </div>
    );
  }

  const memberChallans = challans.filter((c) => c.memberId === member.memberId);
  const memberPayments = payments.filter((p) => p.memberId === member.memberId && p.status === 'Valid');
  const ledgerEntries = getMemberLedger(member.memberId);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-3.5">
      {/* Printable society ledger header (hidden on screen, visible during print) */}
      <div className="hidden print-only mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold">{settings.organizationName}</h1>
        <p className="text-xs text-slate-600">{settings.address}</p>
        <p className="text-xs text-slate-600">Contact: {settings.contactNumber}</p>
        <div className="mt-3 text-sm font-bold underline">STATEMENT OF MEMBER ACCOUNT / LEDGER</div>
        <div className="mt-2 text-xs flex justify-between">
          <div>
            <strong>Member:</strong> {member.fullName} ({member.memberId})<br />
            <strong>Property:</strong> {member.houseNumber}, {member.address}
          </div>
          <div className="text-right">
            <strong>Date Generated:</strong> {new Date().toLocaleDateString('en-GB')}<br />
            <strong>Current Balance Due:</strong> {formatCurrency(member.totalOutstanding)}
          </div>
        </div>
      </div>

      {/* Screen Action Toolbar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigateTo('members')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start"
        >
          <span>&larr; Back to Members</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          <button
            onClick={handlePrintLedger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Ledger</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => navigateTo('edit-member', { memberId: member.memberId })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Member</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => navigateTo('generate-challan', { selectedMemberId: member.memberId })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Generate Challan</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/40 hover:bg-rose-100/70 text-rose-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Delete this member"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Member</span>
            </button>
          )}

          <button
            onClick={() => navigateTo('collect-payment', { selectedMemberId: member.memberId })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Collect Payment</span>
          </button>
        </div>
      </div>

      {/* Member Profile Banner Header */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-base shadow-xs">
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{member.fullName}</h2>
                <StatusBadge status={member.status} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-mono font-semibold text-blue-600">{member.memberId}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Home className="w-3.5 h-3.5 text-slate-400" /> {member.houseNumber}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-mono text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.contactNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Financial Cards (Required by Prompt) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-medium text-slate-500 block">Monthly Amount</span>
            <p className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrency(member.monthlyAmount)}
            </p>
            <span className="text-[10px] text-slate-400">Regular fee</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-medium text-slate-500 block">Current Month Due</span>
            <p className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrency(member.currentMonthDue)}
            </p>
            <span className="text-[10px] text-slate-400">Current cycle</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] font-medium text-slate-500 block">Previous Dues</span>
            <p className="text-base font-bold text-rose-600 font-mono mt-1">
              {formatCurrency(member.previousDues)}
            </p>
            <span className="text-[10px] text-slate-400">Arrears balance</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/80">
            <span className="text-[11px] font-semibold text-rose-800 block">Total Outstanding</span>
            <p className="text-lg font-bold text-rose-700 font-mono mt-0.5">
              {formatCurrency(member.totalOutstanding)}
            </p>
            <span className="text-[10px] text-rose-600">Net payable balance</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-800 block">Total Paid</span>
            <p className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
              {formatCurrency(member.totalPaid)}
            </p>
            <span className="text-[10px] text-emerald-700">Settled this cycle</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="no-print flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-2 rounded-2xl shadow-2xs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'challans', label: `Challan History (${memberChallans.length})` },
          { id: 'payments', label: `Payment History (${memberPayments.length})` },
          { id: 'receipts', label: 'Receipts' },
          { id: 'ledger', label: 'Member Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Information Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Member Profile Information
            </h3>
            <dl className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Full Name</dt>
                <dd className="col-span-2 text-slate-900 font-semibold">{member.fullName}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Member ID</dt>
                <dd className="col-span-2 text-blue-600 font-mono font-bold">{member.memberId}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">House Number</dt>
                <dd className="col-span-2 text-slate-900">{member.houseNumber}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Address</dt>
                <dd className="col-span-2 text-slate-900">{member.address}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Contact Number</dt>
                <dd className="col-span-2 text-slate-900 font-mono">{member.contactNumber}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Joining Date</dt>
                <dd className="col-span-2 text-slate-900">{formatDate(member.joiningDate)}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Portal Username</dt>
                <dd className="col-span-2 text-slate-900 font-mono">{member.username}</dd>
              </div>
              <div className="py-2.5 grid grid-cols-3">
                <dt className="text-slate-500 font-medium">Status</dt>
                <dd className="col-span-2">
                  <StatusBadge status={member.status} size="sm" />
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Account Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Settlement Status & Actions
              </h3>
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Payment Compliance</span>
                  <StatusBadge
                    status={
                      member.totalOutstanding === 0
                        ? 'Paid'
                        : member.totalPaid > 0
                        ? 'Partial Paid'
                        : 'Unpaid'
                    }
                    size="sm"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-500">Outstanding Balance</p>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    {formatCurrency(member.totalOutstanding)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                Collection staff or administrators can collect full or partial payments directly against
                this resident's balance. Real-time computerized receipts will be generated automatically.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => navigateTo('collect-payment', { selectedMemberId: member.memberId })}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/25 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Collect Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Challan History */}
      {activeTab === 'challans' && (
        <div className="no-print bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {memberChallans.length === 0 ? (
            <EmptyState
              title="No Challans Found"
              description="No monthly challan vouchers have been issued for this resident yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Challan No</th>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4 text-right">Monthly Fee</th>
                    <th className="py-3 px-4 text-right">Prior Dues</th>
                    <th className="py-3 px-4 text-right">Total Due</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {memberChallans.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {c.challanNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{c.month}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatCurrency(c.monthlyAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(c.previousDues)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.totalOutstanding)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {formatCurrency(c.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={c.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {formatCurrency(c.balance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(c.dueDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => navigateTo('challan-detail', { challanId: c.id })}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Payment History */}
      {activeTab === 'payments' && (
        <div className="no-print bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {memberPayments.length === 0 ? (
            <EmptyState
              title="No Payment History"
              description="No payments have been recorded for this member account yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-center">Method</th>
                    <th className="py-3 px-4">Collected By</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {memberPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(p.remainingBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={p.paymentType} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={p.paymentMethod} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.collectedBy}</td>
                      <td className="py-3 px-4 text-center">
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
          )}
        </div>
      )}

      {/* TAB CONTENT: Receipts */}
      {activeTab === 'receipts' && (
        <div className="no-print bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Member Official Receipts</h3>
            <span className="text-xs text-slate-500">{memberPayments.length} issued receipts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberPayments.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600">{p.receiptNumber}</span>
                  <StatusBadge status={p.paymentMethod} size="sm" />
                </div>
                <p className="text-lg font-bold font-mono text-slate-900 mt-2">
                  {formatCurrency(p.paidAmount)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Paid on: {formatDate(p.paymentDate)}</p>
                <div className="mt-3 pt-2 border-t border-slate-200/70 flex justify-end">
                  <button
                    onClick={() => navigateTo('receipt-detail', { receiptId: p.id })}
                    className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    View / Print
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Ledger (Also printed in print mode) */}
      {(activeTab === 'ledger' || true) && (
        <div className={activeTab !== 'ledger' ? 'hidden print-only' : ''}>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="no-print p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chronological Account Ledger</h3>
                <p className="text-xs text-slate-500">
                  Comprehensive audit statement of debits (bills), credits (payments), and running balance
                </p>
              </div>
              <button
                onClick={handlePrintLedger}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print Ledger</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Reference No</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (Bill)</th>
                    <th className="py-3 px-4 text-right">Credit (Paid)</th>
                    <th className="py-3 px-4 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-mono">
                  {ledgerEntries.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-sans text-slate-600">{formatDate(l.date)}</td>
                      <td className="py-2.5 px-4 font-sans">{l.month}</td>
                      <td className="py-2.5 px-4 font-semibold text-blue-600">{l.reference}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-700">{l.description}</td>
                      <td className="py-2.5 px-4 text-right text-slate-900">
                        {l.debit > 0 ? formatCurrency(l.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-700 font-semibold">
                        {l.credit > 0 ? formatCurrency(l.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        <span className={l.runningBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          {formatCurrency(l.runningBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                    <td colSpan={4} className="py-3 px-4 font-sans">
                      Current Outstanding Balance
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatCurrency(ledgerEntries.reduce((sum, e) => sum + e.debit, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatCurrency(ledgerEntries.reduce((sum, e) => sum + e.credit, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-700 text-sm">
                      {formatCurrency(member.totalOutstanding)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Delete Member"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-rose-200/80 flex items-center justify-center shrink-0 text-rose-700 font-bold text-xs mt-0.5">
                !
              </div>
              <div>
                <p className="font-semibold text-rose-950 mb-1">
                  Are you sure you want to delete this member?
                </p>
                <p className="leading-relaxed text-rose-800/90">
                  <strong className="font-semibold">{member.fullName}</strong> (Member ID: {member.memberId}, {member.houseNumber}) will be permanently deleted from the system.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteMember(member.memberId);
                    setShowDeleteModal(false);
                    navigateTo('members');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Member'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
