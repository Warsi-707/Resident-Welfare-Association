import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  UploadCloud,
  Trash2,
  Building2,
  MessageSquare,
  Send,
  Smartphone,
  Wifi,
  Loader2,
  QrCode,
  RefreshCw,
  PhoneOff,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface WhatsAppStatus {
  connected: boolean;
  connecting: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  lastError: string | null;
}

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    uploadLogo,
    removeLogo,
    currentUser,
    members,
    challans,
    payments,
    clearAllData,
    resetDatabase,
  } = useApp();

  const [associationName, setAssociationName] = useState(
    settings.organizationName || 'Resident Welfare Association'
  );
  const [areaBlock, setAreaBlock] = useState(settings.address || 'Block 12 FB Area');
  const [contactNo, setContactNo] = useState(settings.contactNumber || '');
  const [defaultDueDay, setDefaultDueDay] = useState(settings.defaultDueDay?.toString() || '10');
  const [challanNote, setChallanNote] = useState(
    settings.challanFooter || 'Monthly security services fee. Please pay before the due date.'
  );

  // WhatsApp Baileys state
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({
    connected: false,
    connecting: false,
    qrCode: null,
    phoneNumber: null,
    lastError: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isResettingDb, setIsResettingDb] = useState(false);

  const totalMembers = members.length;
  const totalChallans = challans.length;
  const paymentEntries = payments.filter((p) => p.status === 'Valid' && !p.isVoid).length;
  const reversalRecords = payments.filter((p) => p.status === 'Voided' || p.isVoid).length;

  // ── Helper to open scanner in new tab ──────────────────────
  const openScanTab = () => {
    const token = localStorage.getItem('rwa_token') || '';
    const url = `/whatsapp-scan${token ? '?token=' + encodeURIComponent(token) : ''}`;
    window.open(url, '_blank');
  };

  // ── Poll WhatsApp status every 3s ──────────────────────────
  const fetchWAStatus = async () => {
    try {
      const token = localStorage.getItem('rwa_token');
      const res = await fetch('/api/whatsapp/live-status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchWAStatus();
    pollRef.current = setInterval(fetchWAStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleConnect = async (openNewTab = true) => {
    if (openNewTab) {
      openScanTab();
    }
    setIsConnecting(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem('rwa_token');
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setWaStatus((prev) => ({ ...prev, ...data }));
    } catch (err: any) {
      setWaStatus((prev) => ({ ...prev, lastError: err.message }));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const token = localStorage.getItem('rwa_token');
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setWaStatus({ connected: false, connecting: false, qrCode: null, phoneNumber: null, lastError: null });
      setTestResult(null);
    } catch {}
    setIsDisconnecting(false);
  };

  const handleTestMessage = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, message: 'Phone number daalen (e.g. 03001234567)' });
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem('rwa_token');
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success
          ? `✅ Message sent! ID: ${data.messageId || 'OK'}`
          : `❌ ${data.error || 'Failed'}`,
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size must be under 2MB.');
      return;
    }
    setIsUploadingLogo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          await uploadLogo(base64, file.name);
        }
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (window.confirm('Are you sure you want to remove the association logo?')) {
      await removeLogo();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      organizationName: associationName.trim(),
      address: areaBlock.trim(),
      contactNumber: contactNo.trim(),
      defaultDueDay: parseInt(defaultDueDay, 10) || 10,
      challanFooter: challanNote.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackup = () => {
    const data = {
      settings,
      members,
      challans,
      payments,
      exportedAt: new Date().toISOString(),
      database: 'PostgreSQL',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwa_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            alert('Backup file loaded successfully.');
          }
        } catch {
          alert('Invalid backup JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      '⚠️ RESET ENTIRE DATABASE (BACKEND)?\n\nAre you sure you want to permanently reset the PostgreSQL database?\n\nThis will completely wipe ALL members, challans, payments, receipts, and ledger history from the backend database.\n\nOnly the system administrator account will be preserved.'
    );
    if (!confirmed) return;

    try {
      setIsResettingDb(true);
      await resetDatabase(true);
    } catch (err: any) {
      alert('Failed to reset database: ' + (err?.message || 'Server error'));
    } finally {
      setIsResettingDb(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings successfully saved and updated.</span>
        </div>
      )}

      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column: Association & WhatsApp Settings Card (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Association & Session Details
            </h2>
          </div>

          {/* Association Logo Section */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Association Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Building2 className="w-7 h-7 text-slate-300 mx-auto" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Association Logo
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Appears on challan vouchers, payment receipts, and financial reports.
                </p>
                <span className="text-[10px] text-slate-400 font-medium">PNG, JPG, or WEBP (Max 2MB)</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors">
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>{isUploadingLogo ? 'Uploading...' : settings.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoSelect}
                  disabled={isUploadingLogo}
                  className="hidden"
                />
              </label>
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200/80 shadow-2xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              WHATSAPP BAILEYS CONNECTION PANEL
          ═══════════════════════════════════════════════════ */}
          <div className="p-5 bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/30 border border-emerald-100 rounded-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${waStatus.connected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    WhatsApp Automatic Delivery
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bilkul Free — apna WhatsApp connect karo, challans auto jayenge
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border w-fit shrink-0 ${
                waStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : waStatus.connecting || waStatus.qrCode
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${waStatus.connected ? 'bg-emerald-500 animate-pulse' : waStatus.connecting || waStatus.qrCode ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                {waStatus.connected
                  ? `Connected: ${waStatus.phoneNumber || 'Active'}`
                  : waStatus.qrCode
                  ? 'Scan QR Code'
                  : waStatus.connecting
                  ? 'Connecting...'
                  : 'Disconnected'}
              </span>
            </div>

            {/* QR Code Display */}
            {waStatus.qrCode && !waStatus.connected && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="bg-white p-3 rounded-2xl border-2 border-emerald-200 shadow-md">
                  <img
                    src={waStatus.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-52 h-52 rounded-xl"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-900">📱 WhatsApp Kholein → 3 Dots → Linked Devices → Link a Device</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">QR scan karne ke baad automatic ho jayega — kuch seconds lagenge</p>
                </div>
              </div>
            )}

            {/* Connected Info */}
            {waStatus.connected && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <Wifi className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">WhatsApp Connected ✅</p>
                  <p className="text-[11px] text-emerald-600">
                    Number: +{waStatus.phoneNumber} — Challans is number se automatic jayenge
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {waStatus.lastError && !waStatus.connected && !waStatus.qrCode && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-700">
                ⚠️ {waStatus.lastError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {!waStatus.connected ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleConnect(true)}
                    disabled={isConnecting || waStatus.connecting}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5a] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:shadow-lg cursor-pointer"
                  >
                    {isConnecting || waStatus.connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                    <span>Connect WhatsApp (Open New Tab)</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={openScanTab}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200/80 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open Scanner in New Tab ↗</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openScanTab}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200/80 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open WhatsApp Portal (New Tab)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneOff className="w-3.5 h-3.5" />}
                    <span>Disconnect</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={fetchWAStatus}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Refresh</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <span>💡</span> Click karne se naya tab khulega jahan se mobile WhatsApp se QR code scan kar sakte hain.
            </p>

            {/* Test Message */}
            {waStatus.connected && (
              <div className="pt-3 border-t border-emerald-100/60">
                <p className="text-[11px] font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Test Message Bhejein (verify karein)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="03001234567 ya 923001234567"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestMessage}
                    disabled={isSendingTest}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#1ebe5a] disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Test</span>
                  </button>
                </div>
                {testResult && (
                  <p className={`text-[11px] mt-1.5 font-medium ${testResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {testResult.message}
                  </p>
                )}
              </div>
            )}
          </div>
          {/* ═══════════════════════════════════════════════════
              END WHATSAPP PANEL
          ═══════════════════════════════════════════════════ */}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Association Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Association Name
              </label>
              <input
                type="text"
                value={associationName}
                onChange={(e) => setAssociationName(e.target.value)}
                placeholder="Resident Welfare Association"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
                required
              />
            </div>

            {/* Area / Block */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Area / Block
              </label>
              <input
                type="text"
                value={areaBlock}
                onChange={(e) => setAreaBlock(e.target.value)}
                placeholder="Block 12 FB Area"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
                required
              />
            </div>

            {/* Contact No. & Default Due Day (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Contact No.
                </label>
                <input
                  type="text"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Default Due Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={defaultDueDay}
                  onChange={(e) => setDefaultDueDay(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400"
                  required
                />
              </div>
            </div>

            {/* Current Logged-in User * */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Current Logged-in User *
              </label>
              <input
                type="text"
                readOnly
                value={currentUser?.fullName || 'Administrator'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-700 bg-slate-50 select-none cursor-default focus:outline-none outline-none"
              />
            </div>

            {/* Challan Note */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Challan Note
              </label>
              <textarea
                rows={4}
                value={challanNote}
                onChange={(e) => setChallanNote(e.target.value)}
                placeholder="Monthly security services fee. Please pay before the due date."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none outline-none focus:border-slate-400 resize-y"
              />
            </div>

            {/* Save Settings Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prototype Data Card (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Prototype Data
          </h2>

          {/* Yellow Warning Notice Box */}
          <div className="bg-[#FFFDF0] rounded-xl p-3.5 border border-[#FDE68A]">
            <p className="text-[11px] text-amber-900/90 leading-relaxed font-normal">
              This prototype stores data only in this browser. Reversal audit records are included in backup/restore and are never individually deletable.
            </p>
          </div>

          {/* Count Rows with grey pill background */}
          <div className="space-y-2">
            <div className="bg-slate-50/80 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium text-xs">Total Members</span>
              <span className="font-bold text-slate-900 text-sm">{totalMembers}</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium text-xs">Total Challans</span>
              <span className="font-bold text-slate-900 text-sm">{totalChallans}</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium text-xs">Payment Entries</span>
              <span className="font-bold text-slate-900 text-sm">{paymentEntries}</span>
            </div>
            <div className="bg-slate-50/80 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-slate-500 font-medium text-xs">Reversal Records</span>
              <span className="font-bold text-slate-900 text-sm">{reversalRecords}</span>
            </div>
          </div>

          {/* Backup / Restore / Clear All Data Actions */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleBackup}
                className="w-full py-2 px-3 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors bg-white text-center shadow-2xs cursor-pointer"
              >
                Backup JSON
              </button>
              <button
                type="button"
                onClick={handleRestore}
                className="w-full py-2 px-3 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors bg-white text-center shadow-2xs cursor-pointer"
              >
                Restore JSON
              </button>
            </div>

            {/* Clear Local Data */}
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm('Are you sure you want to clear local view data? (Note: Database records will reload on refresh unless you click Reset Database).');
                if (confirmed) {
                  clearAllData();
                }
              }}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs cursor-pointer transition-colors border border-slate-200 text-center"
            >
              Clear All Data (Local View)
            </button>

            {/* Reset Backend Database */}
            <button
              type="button"
              disabled={isResettingDb}
              onClick={handleResetDatabase}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all border border-rose-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResettingDb ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting Database...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Database (Backend)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 text-center pt-0.5 leading-tight">
              Permanently wipes all PostgreSQL members, challans & payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
