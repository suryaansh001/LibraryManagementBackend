import prisma from '../../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../../config/env.js';
import { UnauthorizedError, NotFoundError } from '../../lib/errors.js';
import { loginSchema } from './auth.schema.js';

export async function loginController(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { library: { select: { id: true, name: true, capacity: true, defaultMonthlyFee: true } } },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.id, libraryId: user.libraryId, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, library: user.library } });
  } catch (e) {
    next(e);
  }
}

export async function logoutController(req, res, next) {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  } catch (e) {
    next(e);
  }
}

export async function meController(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { library: { select: { id: true, name: true, capacity: true, defaultMonthlyFee: true } } },
    });

    if (!user) throw new NotFoundError('User not found');
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, library: user.library } });
  } catch (e) {
    next(e);
  }
}
