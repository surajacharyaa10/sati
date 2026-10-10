import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../module/user.js';

const cookieName = 'sati_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const developmentSecret = randomBytes(32).toString('hex');

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const getSigningSecret = () => {
  return process.env.JWT_SECRET || developmentSecret;
};

const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: sessionDurationMs,
  path: '/',
});

export const startSession = (res, userId) => {
  const token = jwt.sign({}, getSigningSecret(), {
    subject: userId,
    issuer: 'sati-backend',
    expiresIn: '7d',
  });

  res.cookie(cookieName, token, sessionCookieOptions());
};

export const endSession = (res) => {
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions();
  res.clearCookie(cookieName, clearOptions);
};

export const authenticate = (req, res, next) => {
  const token = req.cookies?.[cookieName];
  if (!token) {
    return res.status(401).json({ error: 'Not signed in' });
  }

  try {
    const payload = jwt.verify(token, getSigningSecret(), { issuer: 'sati-backend' });
    if (typeof payload === 'string' || !payload.sub) {
      return res.status(401).json({ error: 'Not signed in' });
    }

    req.authUserId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Not signed in' });
  }
};

export const isUserAdmin = async (authUserId) => {
  if (!authUserId) return false;
  if (typeof authUserId === 'string' && authUserId.startsWith('admin-')) {
    return true;
  }
  if (!mongoose.isValidObjectId(authUserId)) {
    return false;
  }
  try {
    const user = await User.findById(authUserId);
    if (!user) return false;
    if (user.role === 'admin') return true;

    const adminUsername = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const envEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const allowedAdmins = [adminUsername, ...envEmails].filter(Boolean);
    return allowedAdmins.includes(userEmail);
  } catch (error) {
    console.error('Error verifying admin permissions:', error);
    return false;
  }
};

// Allows both hardcoded admin- session IDs and database users with admin role/email
export const requireAdmin = async (req, res, next) => {
  if (await isUserAdmin(req.authUserId)) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
};

