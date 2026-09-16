import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Challan, FLOOR_OPTIONS, BulkChallanResult } from '../../types';
import {
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCheck,
  Eye,
  Download,
  X,
  Users,
  User,
  ChevronDown,
  Search,
} from 'lucide-react';
import { ChallanModal } from './ChallanModal';
import { downloadChallanPdf } from '../../utils/pdfGenerator';

export const GenerateChallanPage: React.FC = () => {
  const {
    members,
    challans,
    generateChallans,
    sendChallanWhatsApp,
    settings,
    addToast,
  } = useApp();

  const [challanMonth, setChallanMonth] = useState('September');
  const [challanYear, setChallanYear] = useState('2026');
  const [dueDate, setDueDate] = useState('2026-10-10');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [viewModalChallan, setViewModalChallan] = useState<Challan | null>(null);

  // Bulk generation state & summary modal
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkChallanResult['whatsappSummary'] | null>(null);
  const [bulkResultOpen, setBulkResultOpen] = useState(false);

  // Individual sending tracking
  const [sendingId, setSendingId] = useState<string | null>(null);

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'Active'), [members]);

  // Member selection state (Select All or individual members)
  const [selectedMemberCodes, setSelectedMemberCodes] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selected members with active members by default
  useEffect(() => {
    if (activeMembers.length > 0 && selectedMemberCodes.length === 0) {
      setSelectedMemberCodes(activeMembers.map((m) => m.memberId));
    }
  }, [activeMembers]);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = activeMembers.length > 0 && selectedMemberCodes.length === activeMembers.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMemberCodes([]);
    } else {
      setSelectedMemberCodes(activeMembers.map((m) => m.memberId));
    }
  };

  const handleToggleMember = (code: string) => {
    setSelectedMemberCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectOnly = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMemberCodes([code]);
  };

  const searchableMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return activeMembers;
    const q = memberSearchQuery.toLowerCase().trim();
    return activeMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q) ||
        (m.plotNumber && m.plotNumber.toLowerCase().includes(q)) ||
        (m.contactNumber && m.contactNumber.includes(q))
    );
  }, [activeMembers, memberSearchQuery]);

  const previewMember = activeMembers[0] || members[0];
  const previewMemberFloors = useMemo(() => {
    if (!previewMember) return 'Basement';
    if (previewMember.floors && previewMember.floors.length > 0)
      return previewMember.floors.join(', ');
    if (previewMember.plotNumber) return previewMember.plotNumber;
    return 'Basement';
  }, [previewMember]);

  // Filters for Generated Challans list
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDelivery, setFilterDelivery] = useState('All');
  const [filterFloor, setFilterFloor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const targetPeriod = `${challanMonth} ${challanYear}`;

  const handleGenerate = async () => {
    if (selectedMemberCodes.length === 0) {
      alert('Barah-e-karam kam az kam 1 member select karein.');
      return;
    }

    setIsGenerating(true);
    try {
      const isAll = selectedMemberCodes.length === activeMembers.length;
      const res = await generateChallans({
        month: targetPeriod,
        dueDate,
        target: isAll ? 'all' : 'selected',
        memberIds: isAll ? [] : selectedMemberCodes,
      });

      if (res && res.whatsappSummary) {
        setBulkResult(res.whatsappSummary);
        setBulkResultOpen(true);
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendWhatsApp = async (c: Challan) => {
    setSendingId(c.id);
    try {
      await sendChallanWhatsApp(c.id);
    } finally {
      setSendingId(null);
    }
  };

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

  const filteredChallans = useMemo(() => {
    const list = challans.filter((c) => {
      const matchMonth =
        filterMonth === 'All' || c.month.toLowerCase().includes(filterMonth.toLowerCase());
      const matchStatus =
        filterStatus === 'All' || c.status.toLowerCase() === filterStatus.toLowerCase();
      const matchDelivery =
        filterDelivery === 'All' ||
        (c.whatsappStatus || 'PENDING').toUpperCase() === filterDelivery.toUpperCase();

      const member = members.find(
        (m) => m.memberId === c.memberId || m.id === c.memberId || m.fullName === c.memberName
      );
      const memberFloors =
        member?.floors && member.floors.length > 0
          ? member.floors
          : member?.plotNumber
          ? member.plotNumber.split(',').map((s) => s.trim()).filter(Boolean)
          : c.houseNumber
          ? [c.houseNumber]
          : ['Ground'];

      const matchFloor =
        filterFloor === 'All' ||
        memberFloors.some((f) => f.toLowerCase().includes(filterFloor.toLowerCase()));

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.memberName.toLowerCase().includes(q) ||
        c.challanNumber.toLowerCase().includes(q) ||
        c.houseNumber.toLowerCase().includes(q) ||
        c.memberId.toLowerCase().includes(q) ||
        (member?.contactNumber && member.contactNumber.includes(q)) ||
        memberFloors.some((f) => f.toLowerCase().includes(q));

      return matchMonth && matchStatus && matchDelivery && matchFloor && matchSearch;
    });

    // Sort: Recently updated / generated / paid challans at the TOP
    return list.sort((a, b) => {
      const timeA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
      const timeB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });
  }, [challans, members, filterMonth, filterStatus, filterDelivery, filterFloor, searchQuery]);

  return (
    <div className="space-y-3.5">
      {/* CARD 1: Main Generation Form */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3">
        {/* Notice Strip */}
        <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100 flex items-start gap-2">
          <Send className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 font-normal leading-normal">
            Generate monthly challans with 1-click. Branded PDFs will be automatically created and
            dispatched directly to each member&apos;s WhatsApp number via the official WhatsApp Business
            Cloud API. Duplicate challans for the same member/month are automatically skipped.
          </p>
        </div>

        {/* 2x2 Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* Challan Month */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Challan Month
            </label>
            <select
              value={challanMonth}
              onChange={(e) => setChallanMonth(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400 transition-all"
            >
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Year
            </label>
            <select
              value={challanYear}
              onChange={(e) => setChallanYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400 transition-all"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400 transition-all"
            />
          </div>

          {/* Members Ready Selector with Scrollable Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Members to Bill ({selectedMemberCodes.length}/{activeMembers.length})
              </label>
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Selector Trigger Box */}
            <div
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-white flex items-center justify-between cursor-pointer transition-all ${
                isDropdownOpen
                  ? 'border-blue-600 ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isAllSelected ? (
                  <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : selectedMemberCodes.length === 1 ? (
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Users className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className="font-semibold text-slate-800 truncate">
                  {isAllSelected
                    ? `Select All (${activeMembers.length} Members)`
                    : selectedMemberCodes.length === 1
                    ? `1 Member: ${activeMembers.find((m) => m.memberId === selectedMemberCodes[0])?.fullName || selectedMemberCodes[0]}`
                    : selectedMemberCodes.length === 0
                    ? 'None selected — click to choose'
                    : `${selectedMemberCodes.length} Members Selected`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  {selectedMemberCodes.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2.5 space-y-2 animate-in fade-in-50 zoom-in-95">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search member name or plot..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Quick Selection Toolbar */}
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 pb-1 border-b border-slate-100">
                  <span>{searchableMembers.length} members shown</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberCodes(activeMembers.map((m) => m.memberId))}
                      className="font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberCodes([])}
                      className="font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Scrollable Members List */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {searchableMembers.map((member) => {
                    const isSelected = selectedMemberCodes.includes(member.memberId);
                    return (
                      <div
                        key={member.memberId}
                        onClick={() => handleToggleMember(member.memberId)}
                        className={`group p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-200'
                            : 'bg-white hover:bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by row click
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-600 accent-blue-600 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {member.fullName}
                              </span>
                              <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                                {member.memberId}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {member.plotNumber || member.houseNumber || 'Basement'} • Rs.{' '}
                              {member.monthlyDueAmount?.toLocaleString() || '0'}/mo
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleSelectOnly(member.memberId, e)}
                          title="Sirf is member ko select karein"
                          className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-100 border border-blue-200 text-blue-600 font-semibold transition-opacity shrink-0 ml-2 cursor-pointer"
                        >
                          Only
                        </button>
                      </div>
                    );
                  })}
                  {searchableMembers.length === 0 && (
                    <p className="text-center py-4 text-xs text-slate-400">Koi member nahi mila</p>
                  )}
                </div>

                {/* Footer Toolbar */}
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Selected: <strong>{selectedMemberCodes.length}</strong> members
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-1 flex items-center justify-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 transition-colors bg-white shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            disabled={isGenerating || selectedMemberCodes.length === 0}
            onClick={handleGenerate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating & Sending WhatsApp...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isAllSelected
                    ? `Generate Challans (All ${activeMembers.length})`
                    : selectedMemberCodes.length === 1
                    ? `Generate Challan (1 Member)`
                    : `Generate Challans (${selectedMemberCodes.length} Members)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* CARD 2: Generated Challans */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Generated Challans
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {filteredChallans.length} challans
            </span>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
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
              <option value="January">January</option>
              <option value="February">February</option>
              <option value="March">March</option>
              <option value="April">April</option>
              <option value="May">May</option>
              <option value="June">June</option>
              <option value="July">July</option>
              <option value="August">August</option>
              <option value="September">September 2026</option>
              <option value="October">October 2026</option>
              <option value="November">November 2026</option>
              <option value="December">December 2026</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Payment Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Statuses</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Partial Paid">Partial Paid</option>
            </select>
          </div>

          {/* Delivery Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              WhatsApp Delivery
            </label>
            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
            >
              <option value="All">All Deliveries</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
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

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, phone, challan..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        {filteredChallans.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-semibold text-xs">
                  <th className="py-2.5 px-3 whitespace-nowrap">Member</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Type / Floor</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Payable</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center">Status</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center">Delivery</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.map((c) => {
                  const member = members.find(
                    (m) => m.memberId === c.memberId || m.id === c.memberId || m.fullName === c.memberName
                  );
                  const memberFloors =
                    member?.floors && member.floors.length > 0
                      ? member.floors
                      : member?.plotNumber
                      ? member.plotNumber.split(',').map((s) => s.trim()).filter(Boolean)
                      : c.houseNumber
                      ? [c.houseNumber]
                      : ['Ground'];
                  const memberType =
                    member?.memberType === 'COMMERCIAL' ? 'Commercial' : 'Residential';
                  const contact = member?.contactNumber || member?.phone || c.contactNumber || '';

                  const deliveryStatus = (c.whatsappStatus || 'PENDING').toUpperCase();
                  const isSendingThis = sendingId === c.id;

                  const totalAmt = c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount;
                  const paidAmt = c.paidAmount ?? 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Member */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{c.memberName}</div>
                        {contact ? (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {contact}
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-400 font-medium">No Phone</div>
                        )}
                      </td>

                      {/* Type / Floor */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-medium mr-1">
                            {memberType}
                          </span>
                          {memberFloors.map((fl, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600"
                            >
                              {fl}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Month */}
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

                      {/* Financial Status Badge */}
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

                      {/* Real WhatsApp Delivery Badge */}
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
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100"
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
                          {/* 1. View button */}
                          <button
                            type="button"
                            onClick={() => setViewModalChallan(c)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="View Challan Voucher"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>View</span>
                          </button>

                          {/* 2. PDF download */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(c)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            <span>PDF</span>
                          </button>

                          {/* 3. Send / Resend WhatsApp Cloud API */}
                          <button
                            type="button"
                            disabled={isSendingThis}
                            onClick={() => handleSendWhatsApp(c)}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-bold text-xs rounded-lg border border-blue-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            title={
                              c.whatsappStatus === 'SENT'
                                ? 'Resend branded PDF via WhatsApp API'
                                : 'Send branded PDF via WhatsApp API'
                            }
                          >
                            {isSendingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                            ) : (
                              <Send className="w-3 h-3 text-blue-600" />
                            )}
                            <span>{c.whatsappStatus === 'SENT' ? 'Resend' : 'Send'}</span>
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
          /* Empty state */
          <div className="border border-dashed border-slate-200 rounded-xl py-10 sm:py-12 px-4 text-center flex flex-col items-center justify-center my-1">
            <div className="w-9 h-9 rounded-full border-2 border-slate-300 flex items-center justify-center mb-2.5">
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800">No challans found</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select month and click &ldquo;Generate Challans&rdquo; to create vouchers and send
              WhatsApp notifications.
            </p>
          </div>
        )}
      </div>

      {/* ================= MODAL 1: VIEW CHALLAN ================= */}
      <ChallanModal
        isOpen={!!viewModalChallan}
        onClose={() => setViewModalChallan(null)}
        challan={viewModalChallan}
        title="Challan Voucher"
      />

      {/* ================= MODAL 2: GENERATION PREVIEW ================= */}
      <ChallanModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        previewData={{
          memberName: previewMember?.fullName || 'Huzaifa',
          contactNumber:
            previewMember?.contactNumber || previewMember?.phone || '3132220567',
          propertyType:
            previewMember?.memberType === 'COMMERCIAL' ? 'Commercial' : 'Residential',
          floors: previewMemberFloors || 'Basement',
          address: previewMember?.address || previewMember?.houseNumber || 'Karachi',
          month: `${challanMonth} ${challanYear}`,
          dueDate: dueDate,
          monthlyAmount: previewMember?.monthlyAmount ?? 2000,
        }}
        title="Challan Preview"
      />

      {/* ================= MODAL 3: BULK GENERATION RESULT SUMMARY ================= */}
      {bulkResultOpen && bulkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Challan Generation & WhatsApp Report
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Execution summary for {challanMonth} {challanYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkResultOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Generated
                </div>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {bulkResult.generated}
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
                <div className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                  Sent
                </div>
                <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                  {bulkResult.sent}
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-xl text-center">
                <div className="text-[10px] font-medium text-rose-600 uppercase tracking-wider">
                  Failed
                </div>
                <div className="text-base font-extrabold text-rose-700 mt-0.5">
                  {bulkResult.failed}
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
                <div className="text-[10px] font-medium text-amber-600 uppercase tracking-wider">
                  Duplicates
                </div>
                <div className="text-base font-extrabold text-amber-700 mt-0.5">
                  {bulkResult.duplicatesSkipped}
                </div>
              </div>
            </div>

            {/* Failures List if any */}
            {bulkResult.failures && bulkResult.failures.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delivery Issues ({bulkResult.failures.length})</span>
                </div>
                <div className="max-h-44 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 text-xs">
                  {bulkResult.failures.map((f, i) => (
                    <div key={i} className="p-2.5 bg-slate-50/50 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-900">{f.memberName}</div>
                        <div className="text-[10px] text-slate-400">
                          {f.memberId} &bull; {f.contactNumber || 'No number'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 max-w-[200px] truncate">
                          {f.reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Note: Challans remain safely recorded in PostgreSQL. You can configure WhatsApp API keys or update phone numbers and click &ldquo;Resend&rdquo;.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setBulkResultOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
