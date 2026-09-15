import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AllMembersPage } from './components/members/AllMembersPage';
import { AddMemberPage } from './components/members/AddMemberPage';
import { EditMemberPage } from './components/members/EditMemberPage';
import { MemberDetailPage } from './components/members/MemberDetailPage';
import { AllChallansPage } from './components/challans/AllChallansPage';
import { GenerateChallanPage } from './components/challans/GenerateChallanPage';
import { ChallanDetailPage } from './components/challans/ChallanDetailPage';
import { CollectPaymentPage } from './components/payments/CollectPaymentPage';
import { PaymentHistoryPage } from './components/payments/PaymentHistoryPage';
import { ReversalAuditPage } from './components/payments/ReversalAuditPage';
import { ReceiptDetailPage } from './components/payments/ReceiptDetailPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { MonthlyCollectionReportPage } from './components/reports/MonthlyCollectionReportPage';
import { PaymentStatusReportPage } from './components/reports/PaymentStatusReportPage';
import { StaffCollectionReportPage } from './components/reports/StaffCollectionReportPage';
import { StaffManagementPage } from './components/admin/StaffManagementPage';
import { ActivityLogsPage } from './components/admin/ActivityLogsPage';
import { SettingsPage } from './components/admin/SettingsPage';
import { ToastContainer } from './components/common/ToastContainer';

const AppContent: React.FC = () => {
  const { currentUser, activePage } = useApp();

  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminDashboard />;

      case 'members':
        return <AllMembersPage />;

      case 'add-member':
        return (
          <>
            <AllMembersPage />
            <AddMemberPage />
          </>
        );

      case 'edit-member':
        return (
          <>
            <AllMembersPage />
            <EditMemberPage />
          </>
        );

      case 'member-detail':
        return <MemberDetailPage />;

      case 'challans':
        return <AllChallansPage />;

      case 'generate-challan':
        return <GenerateChallanPage />;

      case 'challan-detail':
        return <ChallanDetailPage />;

      case 'collect-payment':
        return <CollectPaymentPage />;

      case 'reversals':
      case 'payment-history':
        return <ReversalAuditPage />;

      case 'receipt-detail':
        return <ReceiptDetailPage />;

      case 'reports':
        return <ReportsPage />;

      case 'report-monthly':
        return <MonthlyCollectionReportPage />;

      case 'report-paid':
      case 'report-partial':
      case 'report-unpaid':
        return <PaymentStatusReportPage />;

      case 'report-staff':
        return <StaffCollectionReportPage />;

      case 'staff':
        return <StaffManagementPage />;

      case 'activity-logs':
        return <ActivityLogsPage />;

      case 'settings':
        return <SettingsPage />;

      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AppLayout>
      {renderActivePage()}
      <ToastContainer />
    </AppLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
