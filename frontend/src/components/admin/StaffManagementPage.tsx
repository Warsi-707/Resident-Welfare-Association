import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, CheckCircle2, XCircle, Phone, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Staff } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { PageHeader } from '../common/PageHeader';
import { Modal } from '../common/Modal';

export const StaffManagementPage: React.FC = () => {
  const { staff, staffList, addStaff, toggleStaffStatus } = useApp();
  const actualStaff = staff || staffList || [];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '+92 3',
    email: '',
    username: '',
    password: 'password123',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [staffToToggle, setStaffToToggle] = useState<Staff | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) return;

    addStaff({
      name: formData.name.trim(),
      fullName: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password,
      status: formData.status,
    });

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      phone: '+92 3',
      email: '',
      username: '',
      password: 'password123',
      status: 'Active',
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actualStaff.map((s) => {
          const displayName = (s as any).fullName || (s as any).name || 'Staff Member';
          const displayPhone = (s as any).phone || (s as any).contactNumber || '—';
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold text-xs border border-purple-100">
                    {displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{displayName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-400">{(s as any).staffId || s.id}</span>
                      <StatusBadge status={s.status} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Status Toggle (No permanent deletion rule) */}
                <button
                  onClick={() => setStaffToToggle(s)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                    s.status === 'Active'
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {s.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{displayPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px]">{s.email || '—'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Lifetime Collections</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(s.totalCollected || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Portal Username</span>
                  <span className="font-mono font-semibold text-[#7C3AED] text-xs">{s.username}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Staff Member */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Register Collection Staff"
          subtitle="Provision staff credentials for counter and field payment recording"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-sm shadow-purple-500/25"
              >
                Create Staff Account
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Asim Raza"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 0000000"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@rwa.org"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="asim.raza"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Modal for Staff Toggle */}
      {staffToToggle && (
        <Modal
          isOpen={true}
          onClose={() => setStaffToToggle(null)}
          title={staffToToggle.status === 'Active' ? 'Deactivate Staff Access' : 'Reactivate Staff Access'}
          subtitle={`Staff ID: ${(staffToToggle as any).staffId || staffToToggle.id}`}
          footer={
            <>
              <button
                onClick={() => setStaffToToggle(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toggleStaffStatus(staffToToggle.id);
                  setStaffToToggle(null);
                }}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs ${
                  staffToToggle.status === 'Active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm
              </button>
            </>
          }
        >
          <div className="text-xs text-slate-600 space-y-2">
            <p>
              Are you sure you want to change the status of{' '}
              <strong className="text-slate-900">
                {(staffToToggle as any).fullName || (staffToToggle as any).name}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-900">
                {staffToToggle.status === 'Active' ? 'Inactive' : 'Active'}
              </strong>
              ?
            </p>
            <p className="text-[11px] text-slate-500">
              Historical receipt records collected by this staff member will remain untouched in the
              audit trail.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
