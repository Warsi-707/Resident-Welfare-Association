import { prisma } from '../server/db';
import jwt from 'jsonwebtoken';
import express from 'express';
import challansRouter from '../server/routes/challans';

async function testBulkGenerate() {
  console.log('=== Testing Bulk Generate & WhatsApp Delivery ===\n');

  const app = express();
  app.use(express.json());
  app.use('/api/challans', challansRouter);

  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminUser) throw new Error('No admin user');

  const token = jwt.sign(
    { id: adminUser.id, username: adminUser.username, fullName: adminUser.fullName, role: 'ADMIN' },
    process.env.JWT_SECRET || 'rwa-super-secret-jwt-key-2026-change-in-production',
    { expiresIn: '1h' }
  );

  const server = app.listen(3098, async () => {
    try {
      const res = await fetch('http://localhost:3098/api/challans/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: 'November',
          year: 2026,
          dueDate: '2026-11-10',
          target: 'all',
        }),
      });

      const data = await res.json() as any;
      console.log('Bulk Generation Result:');
      console.log('Status:', res.status);
      console.log('Summary:', data.whatsappSummary);
      console.log('Generated Count:', data.count);

      server.close();
      console.log('\n=== Bulk Generation Test Completed Successfully! ===');
      process.exit(0);
    } catch (e) {
      server.close();
      console.error('Error during bulk generation test:', e);
      process.exit(1);
    }
  });
}

testBulkGenerate().catch(console.error);
