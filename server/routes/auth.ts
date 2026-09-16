import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { authenticateToken, generateToken, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { logActivity } from '../utils/logger';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUser = String(username).trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUser, mode: 'insensitive' } },
          { email: { equals: cleanUser, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify bcrypt password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role as any,
      fullName: user.fullName,
      memberId: user.memberId,
      staffId: user.staffId,
    });

    logActivity({
      user: user.fullName,
      role: user.role,
      action: 'User Login',
      module: 'Authentication',
      description: `${user.fullName} (${user.username}) authenticated successfully`,
      ipAddress: req.ip,
    }).catch((err) => console.error('Failed to log activity:', err));

    // Find member code if MEMBER
    let memberCode: string | undefined;
    if (user.memberId) {
      const member = await prisma.member.findUnique({ where: { id: user.memberId } });
      if (member) memberCode = member.memberCode;
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        memberId: memberCode || user.memberId,
        staffId: user.staffId,
        email: user.email,
        contactNumber: user.contactNumber,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Failed to authenticate user',
      message: error?.message || String(error),
      code: error?.code || error?.name
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let memberCode: string | undefined;
    if (user.memberId) {
      const member = await prisma.member.findUnique({ where: { id: user.memberId } });
      if (member) memberCode = member.memberCode;
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        memberId: memberCode || user.memberId,
        staffId: user.staffId,
        email: user.email,
        contactNumber: user.contactNumber,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  if (req.user) {
    await logActivity({
      user: req.user.fullName,
      role: req.user.role,
      action: 'User Logout',
      module: 'Authentication',
      description: `${req.user.fullName} logged out of session`,
      ipAddress: req.ip,
    });
  }
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/demo-accounts (ADMIN or Dev only)
router.get('/demo-accounts', authenticateToken, requireRole(['ADMIN']), async (_req, res): Promise<any> => {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      fullName: true,
      role: true,
      memberId: true,
    },
  });
  return res.json({ accounts: users });
});

export default router;
