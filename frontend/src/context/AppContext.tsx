import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  Member,
  Challan,
  Payment,
  Staff,
  ActivityLog,
  AssociationSettings,
  ToastMessage,
  LedgerEntry,
} from '../types';
import { api } from '../services/api';
import {
  INITIAL_STAFF,
  INITIAL_SETTINGS,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  activePage: string;
  pageParams: Record<string, any>;
  members: Member[];
  challans: Challan[];
  payments: Payment[];
  staffList: Staff[];
  staff: Staff[];
  activityLogs: ActivityLog[];
  settings: AssociationSettings;
  toasts: ToastMessage[];
  sidebarCollapsed: boolean;
  isLoading: boolean;

  // Actions
  setCurrentUser: (user: User | null) => void;
  navigateTo: (page: string, params?: Record<string, any>) => void;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  login: (username: string, forcedRole?: UserRole, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole, memberId?: string) => void;

  // Members
  addMember: (memberData: any) => Promise<string>;
  updateMember: (memberId: string, memberData: Partial<Member>) => Promise<void>;
  toggleMemberStatus: (memberId: string) => Promise<void>;
  deleteMember: (memberId: string) => Promise<boolean>;

  // Challans
  generateChallans: (options: {
    month: string;
    year?: number;
    dueDate: string;
    target?: 'all' | 'selected' | 'single';
    memberId?: string;
    memberIds?: string[];
  }) => Promise<any>;
  sendChallanWhatsApp: (challanId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  deleteChallan: (challanId: string) => Promise<boolean>;

  // Payments
  collectPayment: (options: {
    memberId: string;
    paymentType?: 'Full Paid' | 'Partial Paid';
    paymentMethod?: 'Cash' | 'Online';
    paymentDate: string;
    paidAmount: number;
    notes?: string;
    referenceNumber?: string;
    challanId?: string;
  }) => any;
  voidPayment: (paymentId: string, reason: string) => Promise<void>;

  // Staff
  addStaff: (staffData: any) => Promise<void>;
  updateStaff: (staffId: string, staffData: Partial<Staff>) => Promise<void>;
  toggleStaffStatus: (staffId: string) => Promise<void>;

  // Settings
  updateSettings: (newSettings: Partial<AssociationSettings>) => Promise<void>;
  uploadLogo: (base64: string, filename?: string) => Promise<string>;
  removeLogo: () => Promise<void>;

  // Helpers
  getMemberLedger: (memberId: string) => LedgerEntry[];
  getMember: (memberId: string) => Member | undefined;
  getChallan: (challanId: string) => Challan | undefined;
  getPayment: (paymentId: string) => Payment | undefined;

  // UI
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  resetToSampleData: () => void;
  resetDatabase: (wipeMembers?: boolean) => Promise<any>;
  clearAllData: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session initialization: only restore user if a valid auth token is present
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const token = localStorage.getItem('rwa_auth_token');
    const savedUser = localStorage.getItem('rwa_current_user');
    if (token && savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && u.id) return u;
      } catch {}
    }
    return null;
  });

  const [activePage, setActivePage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Entities state - PostgreSQL via Express REST API is the source of truth
  const [members, setMembers] = useState<Member[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<AssociationSettings>(INITIAL_SETTINGS);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for session expired events from apiFetch
  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setMembers([]);
      setChallans([]);
      setPayments([]);
      addToast({
        type: 'warning',
        title: 'Session Expired',
        description: 'Your session has expired. Please sign in again.',
      });
    };

    window.addEventListener('rwa:session-expired', handleSessionExpired);
    return () => window.removeEventListener('rwa:session-expired', handleSessionExpired);
  }, [addToast]);

  // Refresh all entities from PostgreSQL backend
  const refreshData = useCallback(async () => {
    const token = localStorage.getItem('rwa_auth_token');
    if (!token) {
      return;
    }

    try {
      const [
        fetchedMembers,
        fetchedChallans,
        fetchedPayments,
        fetchedStaff,
        fetchedLogs,
        fetchedSettings,
      ] = await Promise.all([
        api.getMembers().catch((e) => {
          console.warn('Members fetch failed:', e);
          return [] as Member[];
        }),
        api.getChallans().catch((e) => {
          console.warn('Challans fetch failed:', e);
          return [] as Challan[];
        }),
        api.getPayments().catch((e) => {
          console.warn('Payments fetch failed:', e);
          return [] as Payment[];
        }),
        api.getStaff().catch((e) => {
          console.warn('Staff fetch failed:', e);
          return [] as Staff[];
        }),
        api.getActivityLogs().catch((e) => {
          console.warn('Activity logs fetch failed:', e);
          return [] as ActivityLog[];
        }),
        api.getSettings().catch((e) => {
          console.warn('Settings fetch failed:', e);
          return null;
        }),
      ]);

      if (Array.isArray(fetchedMembers)) {
        setMembers(fetchedMembers);
      }
      if (Array.isArray(fetchedChallans)) {
        setChallans(fetchedChallans);
      }
      if (Array.isArray(fetchedPayments)) {
        setPayments(fetchedPayments);
      }
      if (Array.isArray(fetchedStaff) && fetchedStaff.length > 0) {
        setStaffList(fetchedStaff);
      }
      if (Array.isArray(fetchedLogs)) {
        setActivityLogs(fetchedLogs);
      }
      if (fetchedSettings && fetchedSettings.organizationName) {
        setSettings(fetchedSettings);
      }
    } catch (err) {
      console.error('Error refreshing data from PostgreSQL backend:', err);
    }
  }, []);

  // Initial load: verify token with /api/auth/me and load data
  useEffect(() => {
    const token = localStorage.getItem('rwa_auth_token');
    if (token) {
      setIsLoading(true);
      api.getMe()
        .then((user) => {
          setCurrentUser(user);
          localStorage.setItem('rwa_current_user', JSON.stringify(user));
          return refreshData();
        })
        .catch(() => {
          // Token is invalid or expired
          localStorage.removeItem('rwa_auth_token');
          localStorage.removeItem('rwa_current_user');
          setCurrentUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setCurrentUser(null);
    }
  }, [refreshData]);

  const navigateTo = (page: string, params: Record<string, any> = {}) => {
    setActivePage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (username: string, _forcedRole?: UserRole, password?: string): Promise<boolean> => {
    if (!username.trim() || !password?.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Username and password are required.',
      });
      return false;
    }

    try {
      setIsLoading(true);
      const authRes = await api.login(username.trim(), password.trim());
      setCurrentUser(authRes.user);
      setActivePage('dashboard');
      setPageParams({});
      addToast({
        type: 'success',
        title: 'Authenticated Successfully',
        description: `Welcome back, ${authRes.user.fullName}`,
      });
      await refreshData();
      return true;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sign In Failed',
        description: err.message || 'Invalid username or password.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
    setMembers([]);
    setChallans([]);
    setPayments([]);
    setActivePage('dashboard');
    setPageParams({});
    addToast({
      type: 'info',
      title: 'Signed out',
      description: 'You have been logged out of your session.',
    });
  };

  const switchRole = async (_role?: UserRole, _memberId?: string) => {
    // Role switcher disabled in secure authenticated mode
  };

  const addMember = async (data: any): Promise<string> => {
    try {
      const created = await api.addMember(data);
      await refreshData();
      return created.memberId;
    } catch (err: any) {
      console.error('Member add error:', err);
      addToast({
        type: 'error',
        title: 'Failed to Add Member',
        description: err.message || 'Database error while creating member.',
      });
      throw err;
    }
  };

  const updateMember = async (memberId: string, updateData: Partial<Member>) => {
    const target = members.find((m) => m.memberId === memberId || m.id === memberId);
    if (!target) return;

    try {
      await api.updateMember(target.id, updateData);
      await refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update failed', description: err.message });
      throw err;
    }
  };

  const toggleMemberStatus = async (memberId: string) => {
    const target = members.find((m) => m.memberId === memberId || m.id === memberId);
    if (!target) return;

    const newStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await api.toggleMemberStatus(target.id);
      addToast({
        type: 'info',
        title: `Member ${newStatus}`,
        description: `${target.fullName} status updated to ${newStatus}.`,
      });
      await refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', description: err.message });
      throw err;
    }
  };

  const deleteMember = async (memberId: string): Promise<boolean> => {
    const target = members.find((m) => m.memberId === memberId || m.id === memberId);
    if (!target) return false;

    try {
      const res = await api.deleteMember(target.id);
      addToast({
        type: 'success',
        title: 'Member Removed',
        description: res.message || `Resident ${target.fullName} (${target.memberId}) was removed.`,
      });
      await refreshData();
      return true;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Cannot Delete Member',
        description: err.message || 'Financial history exists. Please deactivate member instead.',
      });
      return false;
    }
  };

  const generateChallans = async (options: {
    month: string;
    year?: number;
    dueDate: string;
    target?: 'all' | 'selected' | 'single';
    memberId?: string;
    memberIds?: string[];
  }): Promise<any> => {
    let monthName = options.month;
    let yearNum = options.year || new Date().getFullYear();
    if (options.month.includes(' ')) {
      const parts = options.month.split(' ');
      monthName = parts[0];
      yearNum = parseInt(parts[1], 10) || yearNum;
    }

    const payloadTarget = options.target || (options.memberId ? 'single' : 'all');
    const memberIdsList = options.memberIds || (options.memberId ? [options.memberId] : []);

    try {
      // Call server API for transactional generation with real dynamic arrears calculation and independent WhatsApp delivery
      const res = await api.generateChallans({
        month: monthName,
        year: yearNum,
        dueDate: options.dueDate,
        target: payloadTarget,
        memberIds: memberIdsList,
      });

      const summary = res.whatsappSummary;
      const toastMsg = summary
        ? `Generated ${res.count} challans. WhatsApp: ${summary.sent} sent, ${summary.failed} failed.`
        : `Generated ${res.count} monthly vouchers for ${monthName} ${yearNum} in database.`;

      addToast({
        type: summary && summary.failed > 0 ? 'warning' : 'success',
        title: 'Challans Generated',
        description: toastMsg,
      });

      await refreshData();
      return res;
    } catch (err: any) {
      console.error('Error generating challans:', err);
      addToast({ type: 'error', title: 'Generation failed', description: err.message });
      throw err;
    }
  };

  const sendChallanWhatsApp = async (challanId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await api.sendChallanWhatsApp(challanId);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'WhatsApp Dispatched',
          description: res.message || 'Challan sent successfully to WhatsApp.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'WhatsApp Delivery Failed',
          description: res.error || 'Failed to send challan via WhatsApp.',
        });
      }
      await refreshData();
      return res;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'WhatsApp Delivery Failed',
        description: err.message || 'Failed to send challan via WhatsApp.',
      });
      await refreshData();
      return { success: false, error: err.message };
    }
  };

  const deleteChallan = async (challanId: string): Promise<boolean> => {
    const target = challans.find((c) => c.id === challanId || c.challanNumber === challanId);
    if (!target) return false;

    if (target.paidAmount > 0 || target.status === 'Paid' || target.status === 'Partial Paid') {
      addToast({
        type: 'error',
        title: 'Cannot Delete Challan',
        description: 'This challan has payment history and cannot be deleted.',
      });
      return false;
    }

    try {
      const res = await api.deleteChallan(target.id);
      addToast({
        type: 'success',
        title: 'Challan Deleted',
        description: res.message || `Challan ${target.challanNumber} permanently deleted from database.`,
      });
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Delete challan error:', err);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: err.message || 'This challan has payment history and cannot be deleted.',
      });
      return false;
    }
  };

  const collectPayment = (options: {
    memberId: string;
    paymentType?: 'Full Paid' | 'Partial Paid';
    paymentMethod?: 'Cash' | 'Online';
    paymentDate: string;
    paidAmount: number;
    notes?: string;
    referenceNumber?: string;
    challanId?: string;
  }): any => {
    const member = members.find((m) => m.memberId === options.memberId || m.id === options.memberId);
    const memberCode = member ? member.memberId : options.memberId;
    const receiptSerial = String(payments.length + 1).padStart(3, '0');
    const receiptNumber = `REC-${new Date().getFullYear()}-${receiptSerial}`;

    // Send to server: execute transactional "oldest due first" allocation in PostgreSQL
    api.collectPayment({
      memberId: memberCode,
      paidAmount: options.paidAmount,
      paymentDate: options.paymentDate,
      paymentType: options.paymentType || 'Full Paid',
      paymentMethod: options.paymentMethod || 'Cash',
      notes: options.notes,
      referenceNumber: options.referenceNumber,
      challanId: options.challanId,
    })
      .then((saved: any) => {
        const waNote = saved.whatsappSent
          ? `Receipt ${saved.receiptNumber} generated & sent to member's WhatsApp automatically! ✅`
          : `Receipt ${saved.receiptNumber} generated and recorded in system.`;
        addToast({
          type: 'success',
          title: 'Payment Recorded',
          description: waNote,
        });
        refreshData();
      })
      .catch((err) => {
        console.error('Payment error:', err);
        addToast({ type: 'error', title: 'Payment recording failed', description: err.message });
      });

    const returnVal = Object.assign(receiptNumber, {
      id: `pay-${Date.now()}`,
      receiptNumber,
      paidAmount: options.paidAmount,
      valueOf: () => receiptNumber,
      toString: () => receiptNumber,
    });
    return returnVal;
  };

  const voidPayment = async (paymentId: string, reason: string) => {
    const payment = payments.find((p) => p.id === paymentId || p.receiptNumber === paymentId);
    const targetId = payment ? payment.id : paymentId;

    try {
      await api.voidPayment(targetId, reason);
      addToast({
        type: 'warning',
        title: 'Payment Voided',
        description: `Receipt ${payment?.receiptNumber || targetId} voided and challan allocations reversed in database.`,
      });
      await refreshData();
    } catch (err: any) {
      console.warn('API void error or local prototype mode:', err);
      // Ensure in-memory state is updated immediately in prototype mode
      setChallans((prev) =>
        prev.map((c) => {
          if (
            (payment && ((payment as any).challanId === c.id || (payment as any).challanNumber === c.challanNumber || payment.memberId === c.memberId)) ||
            c.id === paymentId ||
            c.challanNumber === paymentId
          ) {
            const fullAmt = c.totalAmount ?? c.totalOutstanding ?? c.monthlyAmount;
            return {
              ...c,
              paidAmount: 0,
              balance: fullAmt,
              status: 'Unpaid',
            };
          }
          return c;
        })
      );
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === targetId || p.receiptNumber === targetId) {
            return {
              ...p,
              status: 'Voided' as const,
              isVoid: true,
              voidReason: reason,
              voidedAt: new Date().toISOString(),
              voidedBy: currentUser?.fullName || 'Administrator',
            };
          }
          return p;
        })
      );
      await refreshData().catch(() => {});
    }
  };

  const addStaff = async (staffData: any) => {
    try {
      const created = await api.addStaff(staffData);
      addToast({
        type: 'success',
        title: 'Staff Member Created',
        description: `${created.fullName} created in PostgreSQL.`,
      });
      await refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Staff creation failed', description: err.message });
      throw err;
    }
  };

  const updateStaff = async (staffId: string, staffData: Partial<Staff>) => {
    try {
      await api.updateStaff(staffId, staffData);
      addToast({
        type: 'success',
        title: 'Staff Updated',
        description: 'Staff member records saved to PostgreSQL.',
      });
      await refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Staff update failed', description: err.message });
      throw err;
    }
  };

  const toggleStaffStatus = async (staffId: string) => {
    const target = staffList.find((s) => s.id === staffId);
    if (!target) return;

    const newStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await api.toggleStaffStatus(staffId);
      addToast({
        type: 'info',
        title: `Staff ${newStatus}`,
        description: `${target.fullName} status updated to ${newStatus}.`,
      });
      await refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', description: err.message });
      throw err;
    }
  };

  const updateSettings = async (newSettings: Partial<AssociationSettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      addToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Association configuration updated in PostgreSQL.',
      });
      await refreshData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Settings update failed', description: err.message });
      throw err;
    }
  };

  const uploadLogo = async (base64: string, filename?: string): Promise<string> => {
    try {
      const res = await api.uploadLogo(base64, filename);
      setSettings(res.settings);
      addToast({
        type: 'success',
        title: 'Logo Uploaded',
        description: 'Association logo successfully updated across all documents.',
      });
      await refreshData();
      return res.logoUrl;
    } catch (err: any) {
      console.error('Upload logo error:', err);
      addToast({
        type: 'error',
        title: 'Upload Failed',
        description: err.message || 'Could not upload logo.',
      });
      throw err;
    }
  };

  const removeLogo = async (): Promise<void> => {
    try {
      const res = await api.removeLogo();
      setSettings(res.settings);
      addToast({
        type: 'info',
        title: 'Logo Removed',
        description: 'Association logo removed from document templates.',
      });
      await refreshData();
    } catch (err: any) {
      console.error('Remove logo error:', err);
      addToast({
        type: 'error',
        title: 'Action Failed',
        description: err.message || 'Could not remove logo.',
      });
      throw err;
    }
  };

  const getMemberLedger = (memberId: string): LedgerEntry[] => {
    const member = members.find((m) => m.memberId === memberId || m.id === memberId);
    if (!member) return [];

    const memberChallans = challans.filter((c) => c.memberId === member.memberId || c.memberId === member.id);
    const memberPayments = payments.filter((p) => (p.memberId === member.memberId || p.memberId === member.id) && p.status === 'Valid');

    type RawEntry = {
      date: string;
      month: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    };

    const raw: RawEntry[] = [];

    memberChallans.forEach((c) => {
      raw.push({
        date: c.generatedDate,
        month: c.month,
        reference: c.challanNumber,
        description: `Monthly Maintenance Bill (${c.month})`,
        debit: c.monthlyAmount,
        credit: 0,
      });
    });

    memberPayments.forEach((p) => {
      raw.push({
        date: p.paymentDate,
        month: p.relevantMonth,
        reference: p.receiptNumber,
        description: `Payment received (${p.paymentMethod} - ${p.paymentType})`,
        debit: 0,
        credit: p.paidAmount,
      });
    });

    raw.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    return raw.map((entry, idx) => {
      running += entry.debit - entry.credit;
      return {
        id: `led-${idx + 1}`,
        memberId: member.memberId,
        date: entry.date,
        month: entry.month,
        reference: entry.reference,
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        runningBalance: running,
      };
    });
  };

  const getMember = (memberId: string) =>
    members.find((m) => m.memberId === memberId || m.id === memberId);

  const getChallan = (challanId: string) =>
    challans.find((c) => c.id === challanId || c.challanNumber === challanId);

  const getPayment = (paymentId: string) =>
    payments.find((p) => p.id === paymentId || p.receiptNumber === paymentId);

  const clearAllData = async () => {
    setMembers([]);
    setChallans([]);
    setPayments([]);
    setActivityLogs([]);
    addToast({
      type: 'info',
      title: 'Data Cleared',
      description: 'All records have been cleared for a fresh start.',
    });
  };

  const resetToSampleData = () => {
    refreshData();
  };

  const resetDatabase = async (wipeMembers = true) => {
    try {
      const res = await api.resetDatabase({ wipeMembers });
      if (wipeMembers) {
        setMembers([]);
      }
      setChallans([]);
      setPayments([]);
      addToast({
        type: 'success',
        title: 'Database Reset',
        description: res.message || 'Backend PostgreSQL database reset successfully.',
      });
      await refreshData();
      return res;
    } catch (err: any) {
      console.error('Reset database error:', err);
      addToast({
        type: 'error',
        title: 'Reset Failed',
        description: err.message || 'Failed to reset database.',
      });
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activePage,
        pageParams,
        members,
        challans,
        payments,
        staffList,
        staff: staffList,
        activityLogs,
        settings,
        toasts,
        sidebarCollapsed,
        isLoading,
        setCurrentUser,
        navigateTo,
        setSidebarCollapsed,
        login,
        logout,
        switchRole,
        addMember,
        updateMember,
        toggleMemberStatus,
        deleteMember,
        generateChallans,
        sendChallanWhatsApp,
        deleteChallan,
        collectPayment,
        voidPayment,
        addStaff,
        updateStaff,
        toggleStaffStatus,
        updateSettings,
        uploadLogo,
        removeLogo,
        getMemberLedger,
        getMember,
        getChallan,
        getPayment,
        addToast,
        removeToast,
        resetToSampleData,
        resetDatabase,
        clearAllData,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
