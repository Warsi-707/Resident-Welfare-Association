import fs from 'fs';
import { generateChallanPdfBuffer } from '../server/utils/serverPdfGenerator';

async function main() {
  const sampleChallan = {
    id: 'ch-test-1',
    challanNumber: 'CH-2026-NOV-013',
    memberId: 'RWA-001',
    memberName: 'Khuzaima',
    houseNumber: 'Bhittai colony korangi crossing karachi',
    address: 'Bhittai colony korangi crossing karachi',
    month: 'November 2026',
    dueDate: '2026-11-10',
    totalAmount: 8000,
    monthlyAmount: 8000,
    paidAmount: 8000,
    balance: 0,
    status: 'Paid',
  };

  const sampleMember = {
    fullName: 'Khuzaima',
    contactNumber: '03178246707',
    memberType: 'RESIDENTIAL',
    floors: ['1st Floor'],
    address: 'Bhittai colony korangi crossing karachi',
  };

  const sampleSettings = {
    organizationName: 'Resident Welfare Association',
    address: 'Block 12 FB Area, Karachi',
    contactNumber: '0317-8246707',
    challanFooter: 'Monthly security services fee. Please pay before the due date.',
    logoUrl: null,
  };

  const pdfBuf = await generateChallanPdfBuffer(sampleChallan, sampleMember, sampleSettings);
  fs.writeFileSync('scratch/sample_executive_challan.pdf', pdfBuf);
  console.log('✅ Generated sample_executive_challan.pdf successfully! Size:', pdfBuf.length, 'bytes');
}

main().catch(console.error);
