import app from '../app';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel handler crash:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: err?.message || String(err),
      });
    }
  }
}
