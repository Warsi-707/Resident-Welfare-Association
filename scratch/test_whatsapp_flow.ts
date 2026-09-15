import { normalizePhoneNumber, sendChallanViaWhatsApp } from '../server/utils/whatsappService';
import { generateChallanPdfBuffer } from '../server/utils/serverPdfGenerator';

async function runTests() {
  console.log('=== WhatsApp Challan Workflow Automated Tests ===\n');

  // Test 1: Phone Normalization
  console.log('1. Testing Phone Normalization:');
  const testCases = [
    { input: '03001234567', expected: '923001234567' },
    { input: '+923001234567', expected: '923001234567' },
    { input: '00923001234567', expected: '923001234567' },
    { input: '3001234567', expected: '923001234567' },
    { input: '923001234567', expected: '923001234567' },
    { input: '0321-9876543', expected: '923219876543' },
    { input: '+92 333 1122334', expected: '923331122334' },
    { input: '', expected: null },
    { input: 'invalid-phone', expected: null },
    { input: '12345', expected: null },
  ];

  let phoneTestsPassed = true;
  for (const tc of testCases) {
    const res = normalizePhoneNumber(tc.input);
    const pass = res === tc.expected;
    console.log(`   [${pass ? 'PASS' : 'FAIL'}] "${tc.input}" -> "${res}" (expected: "${tc.expected}")`);
    if (!pass) phoneTestsPassed = false;
  }

  if (!phoneTestsPassed) {
    throw new Error('Phone normalization tests failed!');
  }
  console.log('   All Phone normalization test cases PASSED!\n');

  // Test 2: Server-Side PDF Generator
  console.log('2. Testing Server-side Branded PDF Generation:');
  const sampleChallan = {
    id: 'ch-test-01',
    challanNumber: 'CH-2026-OCT-001',
    memberId: 'RWA-2024-001',
    memberName: 'Khuzaima Test',
    houseNumber: 'House # 42, Street 5',
    address: 'Block B, Sector G-11',
    month: 'October 2026',
    dueDate: '2026-10-10',
    baseAmount: 2500,
    arrearsAmount: 500,
    totalAmount: 3000,
    paidAmount: 0,
    balance: 3000,
    status: 'Unpaid',
  };

  const sampleMember = {
    memberCode: 'RWA-2024-001',
    fullName: 'Khuzaima Test',
    houseNumber: 'House # 42, Street 5',
    address: 'Block B, Sector G-11',
    contactNumber: '03001234567',
    memberType: 'RESIDENTIAL',
    floors: ['Ground', '1st Floor'],
  };

  const sampleSettings = {
    organizationName: 'Resident Welfare Association',
    address: 'Central Community Center, Block B, Sector G-11',
    contactNumber: '+92 51 9260100',
    currency: 'Rs.',
  };

  const pdfBuf = await generateChallanPdfBuffer(sampleChallan, sampleMember, sampleSettings);
  const isPdf = Buffer.isBuffer(pdfBuf) && pdfBuf.slice(0, 5).toString() === '%PDF-';
  console.log(`   PDF Generated: Size = ${pdfBuf.length} bytes, Header = ${pdfBuf.slice(0, 8).toString().trim()}`);
  console.log(`   [${isPdf ? 'PASS' : 'FAIL'}] Valid PDF binary buffer generated successfully.\n`);
  if (!isPdf) throw new Error('PDF Generation produced invalid buffer!');

  // Test 3: WhatsApp Dispatch safety when unconfigured
  console.log('3. Testing WhatsApp Dispatch Error Safety (Unconfigured State):');
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;

  const dispatchResult = await sendChallanViaWhatsApp({
    recipientPhone: '03001234567',
    pdfBuffer: pdfBuf,
    challanNumber: sampleChallan.challanNumber,
    memberName: sampleMember.fullName,
    billingMonth: sampleChallan.month,
    totalAmount: sampleChallan.totalAmount,
    dueDate: sampleChallan.dueDate,
  });

  const expectedUnconfigured = !dispatchResult.success && dispatchResult.error === 'WhatsApp Business API is not configured.';
  console.log(`   Dispatch Result: success=${dispatchResult.success}, error="${dispatchResult.error}"`);
  console.log(`   [${expectedUnconfigured ? 'PASS' : 'FAIL'}] Gracefully handled missing credentials without crash or fake success.\n`);
  if (!expectedUnconfigured) throw new Error('Unconfigured WhatsApp check failed!');

  // Test 4: WhatsApp Dispatch with invalid phone number
  console.log('4. Testing WhatsApp Dispatch with Invalid Phone Number:');
  const invalidPhoneResult = await sendChallanViaWhatsApp({
    recipientPhone: 'abc-invalid',
    pdfBuffer: pdfBuf,
    challanNumber: sampleChallan.challanNumber,
    memberName: sampleMember.fullName,
    billingMonth: sampleChallan.month,
    totalAmount: sampleChallan.totalAmount,
    dueDate: sampleChallan.dueDate,
  });

  const expectedInvalid = !invalidPhoneResult.success && invalidPhoneResult.error === 'Invalid or missing WhatsApp number.';
  console.log(`   Invalid Phone Result: success=${invalidPhoneResult.success}, error="${invalidPhoneResult.error}"`);
  console.log(`   [${expectedInvalid ? 'PASS' : 'FAIL'}] Correctly flagged invalid number without stopping workflow.\n`);
  if (!expectedInvalid) throw new Error('Invalid phone check failed!');

  console.log('=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
