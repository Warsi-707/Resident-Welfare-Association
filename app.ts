import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

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

// 1. Initialize Express Application
const app = express();

// 2. Safe Uploads directory initialization (with fallback for read-only serverless filesystems)
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  // Gracefully handle read-only environments
}

// 3. Core Request Parsers & Security Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. URL Normalization Middleware for Vercel Serverless & Proxy Compatibility
app.use((req, _res, next) => {
  // If Vercel rewrote the path to /api/index, restore the original requested path
  const matchedPath =
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-now-route-matches'] as string) ||
    (req.headers['x-forwarded-uri'] as string);

  if (
    matchedPath &&
    matchedPath.startsWith('/api') &&
    !matchedPath.startsWith('/api/index') &&
    !matchedPath.includes('[')
  ) {
    req.url = matchedPath;
  }

  // Normalize duplicate /api/api/ -> /api/
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }
  // If hosting platform stripped /api prefix, restore it for Express route matching (Vercel serverless functions)
  else if (
    process.env.VERCEL &&
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/uploads') &&
    !req.url.startsWith('/whatsapp-')
  ) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// 5. Serve uploaded files (e.g. organization logo)
app.use('/uploads', express.static(uploadsDir));

// 6. Performance profiling middleware for timing API response times
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    const start = performance.now();
    res.on('finish', () => {
      const duration = (performance.now() - start).toFixed(2);
      console.log(`[PERF] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

// 7. Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'RWA Collection & Reporting API', timestamp: new Date() });
});

// 7. REST API Routes
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

// 8. Dedicated WhatsApp Connection & QR Scan Portal
app.get('/whatsapp-scan', (_req, res) => res.send(getWhatsAppScanHtml()));
app.get('/whatsapp-connect', (_req, res) => res.send(getWhatsAppScanHtml()));

// 9. Global Express Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express Server Error]:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', message: err?.message || String(err) });
  }
});

// 10. Fallback 404 handler for API routes
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    if (!res.headersSent) {
      res.status(404).json({
        error: 'Endpoint not found',
        method: req.method,
        url: req.url,
      });
    }
  } else {
    next();
  }
});

export { app };
export default app;
