import app from './app';
import express from 'express';
import path from 'path';
import { startAutoBillingScheduler } from './server/utils/autoBillingCron';
import { connectWhatsApp } from './server/utils/baileysBridge';

// Local & Standalone Server Startup Function
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Vite Middleware in Development / Static Files in Production
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
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
    // Local-only background services
    if (!process.env.VERCEL) {
      startAutoBillingScheduler();
      connectWhatsApp().catch((err) => {
        console.warn('[WhatsApp] Auto-connect failed (library may not be installed yet):', err.message);
      });
    }
  });
}

// Auto-start server when executed directly in local development
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app, startServer };
export default app;
