import React, { useState, useMemo } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Member, FLOOR_OPTIONS } from '../../types';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatters';

export const AllMembersPage: React.FC = () => {
  const { members, navigateTo, toggleMemberStatus, deleteMember, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Toggle status confirmation modal
  const [memberToToggle, setMemberToToggle] = useState<Member | null>(null);
  // Delete member confirmation modal
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        m.fullName.toLowerCase().includes(query) ||
        m.houseNumber.toLowerCase().includes(query) ||
        m.address.toLowerCase().includes(query) ||
        m.contactNumber.includes(query) ||
        m.memberId.toLowerCase().includes(query);

      // Floor filter
      const floors = m.floors || ['Ground', '1st Floor'];
      const matchesFloor =
        floorFilter === 'All' ||
        floors.some((f) => f.toLowerCase().includes(floorFilter.toLowerCase()));

      // Type filter
      const mType = (m.memberType || 'RESIDENTIAL').toUpperCase();
      const matchesType =
        typeFilter === 'All' || mType === typeFilter.toUpperCase();

      // Min amount
      const min = minAmount ? parseFloat(minAmount) : null;
      const matchesMin = min === null || isNaN(min) || m.monthlyAmount >= min;

      // Max amount
      const max = maxAmount ? parseFloat(maxAmount) : null;
      const matchesMax = max === null || isNaN(max) || m.monthlyAmount <= max;

      return matchesSearch && matchesFloor && matchesType && matchesMin && matchesMax;
    });
  }, [members, searchQuery, floorFilter, typeFilter, minAmount, maxAmount]);

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleConfirmToggle = () => {
    if (memberToToggle) {
      toggleMemberStatus(memberToToggle.memberId);
      setMemberToToggle(null);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-3.5">
      {/* Main Single White Card holding Filters and Content */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3.5">
        {/* Card Header Strip */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Members Directory</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {members.length} Total
            </span>
          </div>
          <button
            onClick={() => navigateTo('add-member')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>

        {/* Filter Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Name, phone, address, busines:"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all bg-white"
            />
          </div>

          {/* Floor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Floor
            </label>
            <select
              value={floorFilter}
              onChange={(e) => {
                setFloorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400 transition-all"
            >
              <option value="All">All Floors</option>
              {FLOOR_OPTIONS.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </select>
          </div>

          {/* Member Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Member Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400 transition-all"
            >
              <option value="All">All Types</option>
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>

          {/* Min Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Min Amount
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="0"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all bg-white"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
              Max Amount
            </label>
            <input
              type="text"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Any"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 transition-all bg-white"
            />
          </div>
        </div>

        {/* Content Area: Table if items exist, or Empty State Dashed Container if empty */}
        {filteredMembers.length > 0 ? (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium text-xs">
                  <th className="py-3.5 px-3">Name</th>
                  <th className="py-3.5 px-3">Type / Business</th>
                  <th className="py-3.5 px-3">Floor(s)</th>
                  <th className="py-3.5 px-3">Address</th>
                  <th className="py-3.5 px-3">Contact</th>
                  <th className="py-3.5 px-3">Assigned Amount</th>
                  <th className="py-3.5 px-3">Added</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMembers.map((m) => {
                  const floors = m.floors || ['Ground', '1st Floor'];
                  const memberType = (m.memberType || 'RESIDENTIAL').toUpperCase();

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {m.fullName}
                      </td>

                      {/* Type / Business */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 tracking-wider">
                          {memberType}
                        </span>
                      </td>

                      {/* Floor(s) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {floors.map((fl, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600"
                            >
                              {fl}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-3 text-slate-800 font-semibold text-xs max-w-sm">
                        {m.address}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {m.contactNumber}
                      </td>

                      {/* Assigned Amount */}
                      <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(m.monthlyAmount ?? m.monthlyDueAmount)}
                      </td>

                      {/* Added Date */}
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {m.joiningDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigateTo('edit-member', { memberId: m.memberId })}
                            className="inline-flex items-center justify-center px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToDelete(m)}
                            className="inline-flex items-center justify-center px-3 py-1 bg-rose-50/70 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200/80 shadow-2xs transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State Dashed Box (Compact & elegant) */
          <div className="border border-dashed border-slate-200 rounded-xl py-10 sm:py-12 px-4 text-center flex flex-col items-center justify-center my-1">
            {/* Circular concentric target icon matching screenshot 2 */}
            <div className="w-9 h-9 rounded-full border-2 border-slate-300 flex items-center justify-center mb-2.5">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
              </div>
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">
              No members found
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &ldquo;Add Member&rdquo; to create the first member record.
            </p>
          </div>
        )}

        {/* Pagination Bar when multiple pages */}
        {filteredMembers.length > pageSize && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredMembers.length)} of{' '}
              {filteredMembers.length} members
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Toggle Modal */}
      {memberToToggle && (
        <Modal
          isOpen={true}
          onClose={() => setMemberToToggle(null)}
          title={`${memberToToggle.status === 'Active' ? 'Deactivate' : 'Activate'} Member`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to mark{' '}
              <strong className="text-slate-900">{memberToToggle.fullName}</strong> ({memberToToggle.houseNumber}) as{' '}
              <strong className="text-slate-900">
                {memberToToggle.status === 'Active' ? 'Inactive' : 'Active'}
              </strong>
              ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMemberToToggle(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggle}
                className={`px-4 py-1.5 rounded-xl text-white text-xs font-semibold shadow-xs ${
                  memberToToggle.status === 'Active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <Modal
          isOpen={true}
          onClose={() => !isDeleting && setMemberToDelete(null)}
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
                  <strong className="font-semibold">{memberToDelete.fullName}</strong> (Member ID: {memberToDelete.memberId}, {memberToDelete.houseNumber}) will be removed if they have no financial transactions. Members with financial history must be deactivated instead.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setMemberToDelete(null)}
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
                    await deleteMember(memberToDelete.memberId);
                    setMemberToDelete(null);
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
