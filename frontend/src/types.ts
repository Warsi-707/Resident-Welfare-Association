export type UserRole = 'ADMIN' | 'COLLECTION_STAFF' | 'MEMBER';

export type MemberStatus = 'Active' | 'Inactive';

export type ChallanStatus = 'Unpaid' | 'Partial Paid' | 'Paid';

export type PaymentType = 'Full Paid' | 'Partial Paid';

export type PaymentMethod = 'Cash' | 'Online' | 'Bank Transfer' | 'Cheque';

export type StaffStatus = 'Active' | 'Inactive';

export type PaymentRecordStatus = 'Valid' | 'Voided';

export const FLOOR_OPTIONS = [
  'Basement',
  'Ground',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th Floor',
  '6th Floor',
  '7th Floor',
  '8th Floor',
  '9th Floor',
  '10th Floor',
  'Rooftop',
];

export type FloorOption = (typeof FLOOR_OPTIONS)[number];

export interface User {
  id: string;
  username: string;
  fullName: string;
  name?: string;
  role: UserRole;
  memberId?: string;
  contactNumber?: string;
  email?: string;
}

export interface Member {
  id: string;
  memberId: string; // e.g. RWA-2024-001
  memberCode?: string;
  fullName: string;
  name?: string;
  houseNumber: string;
  address: string;
  contactNumber: string;
  phone?: string;
  email?: string;
  plotNumber?: string;
  block?: string;
  monthlyDueAmount?: number;
  monthlyAmount: number;
  joiningDate: string;
  status: MemberStatus;
  username: string;
  password?: string;
  previousDues: number;
  currentMonthDue: number;
  totalOutstanding: number;
  totalPaid: number;
  memberType?: string; // e.g. 'RESIDENTIAL' | 'COMMERCIAL'
  floors?: string[]; // e.g. ['Ground', '1st Floor']
}

export interface Challan {
  id: string;
  challanNumber: string; // e.g. CH-2024-09-001
  memberId: string;
  memberName: string;
  houseNumber: string;
  address: string;
  month: string; // e.g. "September 2024"
  monthKey: string; // e.g. "2024-09"
  year: number;
  monthName: string;
  baseAmount?: number;
  monthlyAmount: number;
  monthlyDueAmount?: number;
  arrearsAmount?: number;
  previousDues: number;
  totalAmount?: number;
  totalOutstanding: number;
  totalPayable?: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: ChallanStatus;
  generatedDate: string;
  issueDate?: string;
  contactNumber?: string;
  whatsappStatus?: 'PENDING' | 'SENT' | 'FAILED' | 'DELIVERED' | 'READ';
  whatsappSentAt?: string | null;
  whatsappMessageId?: string | null;
  whatsappError?: string | null;
  allocations?: Array<{
    id: string;
    receiptNumber: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
  }>;
}

export interface BulkChallanResult {
  success: boolean;
  count: number;
  totalAmount: number;
  whatsappSummary: {
    generated: number;
    sent: number;
    failed: number;
    duplicatesSkipped: number;
    failures: Array<{
      challanNumber?: string;
      memberId: string;
      memberName: string;
      contactNumber?: string;
      reason: string;
    }>;
  };
  challans: Challan[];
}

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. REC-2024-09-001
  paymentNumber?: string;
  challanId?: string;
  challanNumber?: string;
  referenceNumber?: string;
  memberId: string;
  memberName: string;
  houseNumber: string;
  paymentDate: string;
  paymentTime?: string;
  amount?: number;
  paidAmount: number;
  previousDues?: number;
  totalOutstanding?: number;
  remainingBalance?: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  month?: string;
  relevantMonth?: string; // e.g. "September 2024"
  collectedBy: string;
  collectedByName?: string;
  collectedByRole?: string;
  staffUsername?: string;
  staffId?: string;
  notes?: string;
  status: PaymentRecordStatus;
  isVoid?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface Staff {
  id: string;
  fullName: string;
  name?: string;
  staffId?: string;
  contactNumber: string;
  phone?: string;
  email?: string;
  username: string;
  password?: string;
  role: 'Collection Staff' | 'Staff' | 'Admin';
  status: StaffStatus;
  joiningDate: string;
  totalCollectionsCount?: number;
  totalAmountCollected?: number;
  totalCollected?: number;
}

export interface LedgerEntry {
  id: string;
  memberId: string;
  date: string;
  month: string;
  reference: string;
  description: string;
  debit: number; // Charges incurred
  credit: number; // Payments made
  runningBalance: number;
}

export interface ActivityLog {
  id: string;
  user?: string;
  userName?: string;
  performedBy?: string;
  role?: string;
  userRole?: string;
  action: string;
  module?: string;
  description?: string;
  details?: string;
  date?: string;
  time?: string;
  timestamp: string | number;
}

export interface AssociationSettings {
  organizationName: string;
  associationShortName?: string;
  registrationNumber?: string;
  address: string;
  contactNumber: string;
  helplineNumber?: string;
  email?: string;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  defaultMonthlyAmount?: number;
  dueDayOfMonth?: number;
  currency: string;
  defaultDueDay: number;
  billingDueDay?: number;
  challanTerms?: string;
  challanFooter: string;
  receiptFooter: string;
  logoUrl?: string | null;
  challanCopies?: number;
  challanPrintCopies?: number;
  whatsappSenderNumber?: string;
  whatsappAccessToken?: string;
  whatsappPhoneNumberId?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}
