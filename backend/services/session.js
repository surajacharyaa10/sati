import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

const cookieName = 'sati_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const developmentSecret = randomBytes(32).toString('hex');

const getSigningSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return developmentSecret;
};

const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
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
