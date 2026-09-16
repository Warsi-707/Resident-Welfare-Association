import React, { useState, useRef, useEffect } from 'react';
import {
  Columns2,
  Users,
  FileText,
  Check,
  Undo2,
  TrendingUp,
  Settings as SettingsIcon,
  Search,
  X,
  Menu,
  RotateCcw,
  Receipt,
  User as UserIcon,
  LogOut,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const {
    currentUser,
    activePage,
    navigateTo,
    logout,
    settings,
    members,
    challans,
    resetToSampleData,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  const role = currentUser?.role || 'ADMIN';

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(e.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (pageId: string, params?: Record<string, any>) => {
    navigateTo(pageId, params);
    setMobileMenuOpen(false);
  };

  // Search matches
  const searchResults = searchQuery.trim()
    ? members
        .filter(
          (m) =>
            m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.houseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.contactNumber.includes(searchQuery)
        )
        .slice(0, 5)
    : [];

  // Page title mapping
  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return 'Dashboard';
      case 'members':
        return 'Members';
      case 'add-member':
        return 'Add Member';
      case 'edit-member':
        return 'Edit Member';
      case 'member-detail':
        return 'Member Detail';
      case 'generate-challan':
        return 'Generate Challan';
      case 'challans':
        return 'All Challans';
      case 'challan-detail':
        return 'Challan Detail';
      case 'collect-payment':
        return 'Payment Collection';
      case 'reversals':
      case 'payment-history':
        return 'Reversal Audit';
      case 'receipts':
      case 'receipt-detail':
        return 'Receipts';
      case 'reports':
      case 'report-monthly':
      case 'report-daily':
      case 'report-dues':
      case 'report-paid':
      case 'report-partial':
      case 'report-unpaid':
      case 'report-ledger':
      case 'report-cash-online':
      case 'report-date-range':
        return 'Reports';
      case 'settings':
        return 'Settings';
      case 'activity-logs':
        return 'Activity Logs';
      case 'profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  // Modern SaaS Active vs Inactive Item styles matching screenshot
  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <div className="h-screen bg-[#F1F4F9] text-slate-900 flex flex-col font-sans antialiased overflow-hidden">
      <div className="flex flex-1 relative overflow-hidden min-h-0">
        {/* FIXED LEFT SIDEBAR: always full viewport height */}
        <aside className="no-print hidden md:flex flex-col w-[210px] shrink-0 bg-white border-r border-slate-200/80 z-20 h-full overflow-y-auto">
          {/* Top Organization Header */}
          <div className="pt-3.5 pb-2.5 px-4 flex items-center gap-2.5">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.organizationName}
                className="w-8 h-8 rounded-lg object-contain shrink-0 border border-slate-200/80 p-0.5 bg-white shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-bold text-slate-900 leading-tight tracking-tight truncate">
                {settings.organizationName || 'Resident Welfare Association'}
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 font-normal truncate">
                {settings.address || 'Block 12 · FB Area'}
              </p>
            </div>
          </div>

          {/* Navigation Links (7 items exactly as in screenshot) */}
          <nav className="flex-1 px-2.5 py-1.5 space-y-0.5 overflow-y-auto scrollbar-none">
            {/* 1. Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass(activePage === 'dashboard')}
              title="Dashboard"
            >
              <Columns2 className="w-3.5 h-3.5 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* 2. Members */}
            <button
              onClick={() => handleNavClick('members')}
              className={navItemClass(
                activePage === 'members' ||
                  activePage === 'add-member' ||
                  activePage === 'edit-member' ||
                  activePage === 'member-detail'
              )}
              title="Members"
            >
              <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-semibold shrink-0">
                @
              </div>
              <span>Members</span>
            </button>

            {/* 3. Generate Challan */}
            <button
              onClick={() => handleNavClick('generate-challan')}
              className={navItemClass(
                activePage === 'generate-challan' ||
                  activePage === 'challans' ||
                  activePage === 'challan-detail'
              )}
              title="Generate Challan"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Generate Challan</span>
            </button>

            {/* 4. Payment Collection */}
            <button
              onClick={() => handleNavClick('collect-payment')}
              className={navItemClass(
                activePage === 'collect-payment' ||
                  activePage === 'receipts' ||
                  activePage === 'receipt-detail'
              )}
              title="Payment Collection"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Payment Collection</span>
            </button>

            {/* 5. Reversals */}
            <button
              onClick={() => handleNavClick('reversals')}
              className={navItemClass(
                activePage === 'reversals' || activePage === 'payment-history'
              )}
              title="Reversals"
            >
              <Undo2 className="w-3.5 h-3.5 shrink-0" />
              <span>Reversals</span>
            </button>

            {/* 6. Reports */}
            <button
              onClick={() => handleNavClick('reports')}
              className={navItemClass(
                activePage === 'reports' || activePage.startsWith('report-')
              )}
              title="Reports"
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Reports</span>
            </button>

            {/* 7. Settings */}
            <button
              onClick={() => handleNavClick('settings')}
              className={navItemClass(
                activePage === 'settings' ||
                  activePage === 'activity-logs'
              )}
              title="Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Storage Mode Indicator */}
          <div className="p-3 mt-auto">
            <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60">
              <h4 className="text-[11px] font-bold text-slate-800 mb-0.5">
                PostgreSQL Storage
              </h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                All members, challans, payments, receipts and audit records are securely stored in PostgreSQL via Prisma.
              </p>
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col w-64 max-w-xs bg-white text-slate-900 p-4 shadow-xl z-50 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 leading-tight">
                    Resident Welfare Association
                  </h2>
                  <p className="text-[10px] text-slate-400">Block 12 · FB Area</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3 space-y-1">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={navItemClass(activePage === 'dashboard')}
                >
                  <Columns2 className="w-3.5 h-3.5" /> <span>Dashboard</span>
                </button>
                <button
                  onClick={() => handleNavClick('members')}
                  className={navItemClass(activePage === 'members')}
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px] font-semibold">
                    @
                  </div>
                  <span>Members</span>
                </button>
                <button
                  onClick={() => handleNavClick('generate-challan')}
                  className={navItemClass(activePage === 'generate-challan')}
                >
                  <FileText className="w-3.5 h-3.5" /> <span>Generate Challan</span>
                </button>
                <button
                  onClick={() => handleNavClick('collect-payment')}
                  className={navItemClass(activePage === 'collect-payment')}
                >
                  <Check className="w-3.5 h-3.5" /> <span>Payment Collection</span>
                </button>
                <button
                  onClick={() => handleNavClick('reversals')}
                  className={navItemClass(activePage === 'reversals' || activePage === 'payment-history')}
                >
                  <Undo2 className="w-3.5 h-3.5" /> <span>Reversals</span>
                </button>
                <button
                  onClick={() => handleNavClick('reports')}
                  className={navItemClass(activePage.startsWith('report'))}
                >
                  <TrendingUp className="w-3.5 h-3.5" /> <span>Reports</span>
                </button>
                <button
                  onClick={() => handleNavClick('settings')}
                  className={navItemClass(activePage === 'settings')}
                >
                  <SettingsIcon className="w-3.5 h-3.5" /> <span>Settings</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-full">
          {/* TOP HEADER */}
          <header className="no-print pt-3 pb-2 px-4 md:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {/* Left side: Page Title and Subtitle */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-white border border-slate-200 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-[11px] text-slate-400 font-normal">
                  Resident Welfare Association · Block 12 FB Area
                </p>
              </div>
            </div>

            {/* Right side: Global Search Bar + Logged-in User Profile */}
            <div className="flex items-center gap-3">
              {/* Search Bar matching screenshot 100% */}
              <div ref={searchContainerRef} className="relative flex-1 sm:w-64 md:w-72">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search member, floor, challan or pho"
                    className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200/90 rounded-lg focus:outline-none outline-none focus:border-slate-400 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Instant Search Popup */}
                {searchFocused && searchQuery.trim().length > 0 && (
                  <div className="absolute right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Matching Members
                    </div>
                    {searchResults.length > 0 ? (
                      searchResults.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => {
                            navigateTo('member-detail', { memberId: m.memberId });
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none transition-colors"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900">
                              {m.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {m.houseNumber} · {m.memberId}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                              m.totalOutstanding > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {m.totalOutstanding > 0
                              ? `Due: ${formatCurrency(m.totalOutstanding)}`
                              : 'Cleared'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-center text-xs text-slate-400">
                        No members found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Section (Administrator · Logged-in user · Avatar 'A') */}
              <div ref={profileContainerRef} className="relative shrink-0">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100/60 transition-colors text-left"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser?.fullName || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Administrator
                    </p>
                  </div>
                  {/* Soft light-blue square with rounded corners and initial */}
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {currentUser?.fullName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </button>

                {/* Profile & Role Switcher Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-40 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">
                        {currentUser?.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {currentUser?.email || 'admin@rwa-block12.org'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          Administrator
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigateTo('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        My Profile
                      </button>
                      {role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            navigateTo('settings');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                          <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                          Association Settings
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* MAIN APPLICATION CONTENT */}
          <main className="flex-1 px-4 md:px-5 pb-4 w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
