export default async function handler(req: any, res: any) {
  try {
    const appModule = await import('../app');
    const app = appModule.default || appModule.app;
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel cold start crash:', err);
    return res.status(500).json({
      error: 'COLD_START_CRASH',
      message: err?.message || String(err),
      stack: err?.stack,
      name: err?.name,
    });
  }
}
