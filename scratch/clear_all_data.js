import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  console.log('Clearing all operational data from PostgreSQL database...');

  // Delete receipts and allocations first
  await prisma.paymentAllocation.deleteMany({});
  await prisma.receipt.deleteMany({});
  
  // Delete payments and challans
  await prisma.payment.deleteMany({});
  await prisma.challan.deleteMany({});
  
  // Delete non-admin users associated with members
  await prisma.user.deleteMany({
    where: {
      role: 'MEMBER'
    }
  });

  // Delete all members
  await prisma.member.deleteMany({});

  // Delete activity logs
  await prisma.activityLog.deleteMany({});

  // Reset Association Settings to default if needed
  await prisma.associationSettings.upsert({
    where: { id: 'default-settings' },
    update: {
      organizationName: 'Resident Welfare Association',
      address: 'Block 12 FB Area',
      contactNumber: '',
      defaultDueDay: 10,
      challanFooter: 'Monthly security services fee. Please pay before the due date.',
    },
    create: {
      id: 'default-settings',
      organizationName: 'Resident Welfare Association',
      address: 'Block 12 FB Area',
      contactNumber: '',
      defaultDueDay: 10,
      challanFooter: 'Monthly security services fee. Please pay before the due date.',
      receiptFooter: 'Official computer-generated receipt issued by Resident Welfare Association.',
    }
  });

  console.log('Data cleared successfully! Members: 0, Challans: 0, Payments: 0, Logs: 0');
  await prisma.$disconnect();
}

clearAllData().catch(console.error);
