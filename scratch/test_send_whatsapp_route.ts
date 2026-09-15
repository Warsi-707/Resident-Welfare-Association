import express from 'express';
import challansRouter from '../server/routes/challans';
import jwt from 'jsonwebtoken';
import { prisma } from '../server/db';

async function testRoute() {
  console.log('=== Testing POST /api/challans/:id/send-whatsapp route ===\n');

  const app = express();
  app.use(express.json());
  app.use('/api/challans', challansRouter);

  // Get admin user from database to generate a real test JWT
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) throw new Error('No admin user found');

  const token = jwt.sign(
    {
      id: adminUser.id,
      username: adminUser.username,
      fullName: adminUser.fullName,
      role: adminUser.role,
    },
    process.env.JWT_SECRET || 'rwa-super-secret-jwt-key-2026-change-in-production',
    { expiresIn: '1h' }
  );

  // Find a sample challan
  const sampleChallan = await prisma.challan.findFirst();
  if (!sampleChallan) throw new Error('No challan found in DB');

  console.log(`Found sample challan: ${sampleChallan.challanNumber} (ID: ${sampleChallan.id})`);

  // Start temporary local server to test the route
  const server = app.listen(3099, async () => {
    try {
      // Test 1: Route existence with valid token and valid challan ID
      const res = await fetch(`http://localhost:3099/api/challans/${sampleChallan.id}/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json() as any;
      console.log(`\nTest 1 Result (Valid Challan, No API Key): Status = ${res.status}`);
      console.log('Response JSON:', data);

      const pass1 = (res.status === 503 || res.status === 400) && data.message === 'WhatsApp Business API is not configured.';
      console.log(`[${pass1 ? 'PASS' : 'FAIL'}] Returns structured JSON when WhatsApp API unconfigured.\n`);

      // Test 2: Non-existent challan ID
      const res404 = await fetch(`http://localhost:3099/api/challans/non-existent-id-9999/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data404 = await res404.json() as any;
      console.log(`Test 2 Result (Non-existent Challan): Status = ${res404.status}`);
      console.log('Response JSON:', data404);
      const pass2 = res404.status === 404 && data404.message === 'Challan not found.';
      console.log(`[${pass2 ? 'PASS' : 'FAIL'}] Returns 404 "Challan not found." for unknown challan ID.\n`);

      server.close();
      if (pass1 && pass2) {
        console.log('=== All Route Tests PASSED! ===');
        process.exit(0);
      } else {
        console.error('Some route tests failed.');
        process.exit(1);
      }
    } catch (e) {
      server.close();
      console.error('Fetch error:', e);
      process.exit(1);
    }
  });
}

testRoute().catch((e) => {
  console.error('Route test script error:', e);
  process.exit(1);
});
