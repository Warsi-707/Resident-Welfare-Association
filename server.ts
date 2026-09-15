import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'rwa-super-secret-jwt-key-2026-change-in-production';
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRouter from './server/routes/auth';
import membersRouter from './server/routes/members';
import staffRouter from './server/routes/staff';
import challansRouter from './server/routes/challans';
import paymentsRouter from './server/routes/payments';
import dashboardRouter from './server/routes/dashboard';
import reportsRouter from './server/routes/reports';
import settingsRouter from './server/routes/settings';
import activityRouter from './server/routes/activity';
import resetRouter from './server/routes/reset';
import whatsappWebhookRouter from './server/routes/whatsappWebhook';
import whatsappBaileysRouter from './server/routes/whatsappBaileys';
import { getWhatsAppScanHtml } from './server/utils/whatsappScanHtml';
import { startAutoBillingScheduler } from './server/utils/autoBillingCron';
import { connectWhatsApp } from './server/utils/baileysBridge';

import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded files (e.g. organization logo)
  app.use('/uploads', express.static(uploadsDir));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'RWA Collection & Reporting API', timestamp: new Date() });
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/members', membersRouter);
  app.use('/api/staff', staffRouter);
  app.use('/api/challans', challansRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/activity', activityRouter);
  app.use('/api/reset-sample-data', resetRouter);
  app.use('/api/whatsapp', whatsappWebhookRouter);
  app.use('/api/whatsapp', whatsappBaileysRouter);

  // Dedicated WhatsApp Connection & QR Scan Portal (Opens in new tab)
  app.get('/whatsapp-scan', (_req, res) => res.send(getWhatsAppScanHtml()));
  app.get('/whatsapp-connect', (_req, res) => res.send(getWhatsAppScanHtml()));

  // Vite Middleware in Development / Static Files in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RWA Server running on port ${PORT} (host: 0.0.0.0)`);
    startAutoBillingScheduler();
    // Auto-connect WhatsApp Baileys if previous session exists
    connectWhatsApp().catch((err) => {
      console.warn('[WhatsApp] Auto-connect failed (library may not be installed yet):', err.message);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
