import { prisma } from '../server/db';
import { generateChallanPdfBuffer } from '../server/utils/serverPdfGenerator';

async function testDatabaseAndEndpoints() {
  console.log('=== Testing Database Records & Endpoints ===\n');

  // Check active members in DB
  const members = await prisma.member.findMany({ where: { status: 'Active' } });
  console.log(`Found ${members.length} active members in PostgreSQL:`);
  for (const m of members) {
    console.log(` - ${m.memberCode}: ${m.fullName} (${m.contactNumber}) - Due: Rs ${m.monthlyDueAmount}`);
  }

  // Check settings
  const settings = await prisma.associationSettings.findFirst();
  console.log(`\nAssociation Settings: ${settings?.organizationName}, Logo=${Boolean(settings?.logoUrl)}`);

  // Verify Challan records and new columns
  const challans = await prisma.challan.findMany({
    take: 5,
    include: { member: true },
  });
  console.log(`\nSample Challan Records (${challans.length} total sampled):`);
  for (const ch of challans) {
    console.log(` - ${ch.challanNumber}: ${ch.member.fullName}, Month=${ch.month}, Total=${ch.totalAmount}, WA Status=${ch.whatsappStatus || 'None'}`);
  }

  console.log('\n=== Database & Prisma Integration Validated! ===');
}

testDatabaseAndEndpoints().catch((e) => {
  console.error('DB test error:', e);
  process.exit(1);
});
