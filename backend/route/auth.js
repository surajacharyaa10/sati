import { randomBytes } from 'node:crypto';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import User from '../module/user.js';
import { avatarUpload, deleteAvatar, saveAvatar } from '../services/avatar.js';
import { verifyPassword } from '../services/password.js';

const router = express.Router();
const cookieName = 'sati_session';
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;
const developmentSecret = randomBytes(32).toString('hex');
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { error: 'Too many sign-in attempts. Please try again later.' },
});

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

const publicUser = (user) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	avatarUrl: user.avatarUrl ?? null,
});

const authenticate = (req, res, next) => {
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

const parseAvatar = (req, res, next) => {
	avatarUpload.single('photo')(req, res, (error) => {
		if (!error) return next();

		const message = error.code === 'LIMIT_FILE_SIZE'
			? 'Photo must be 5 MB or smaller'
			: 'Upload one JPEG, PNG, or WebP photo';
		return res.status(400).json({ error: message });
	});
};

router.post('/signin', authLimiter, async (req, res) => {
	const { email, password } = req.body ?? {};
	if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
		return res.status(400).json({ error: 'Enter your email address and password' });
	}

	try {
		const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return res.status(401).json({ error: 'Email or password is incorrect' });
		}

		const token = jwt.sign({}, getSigningSecret(), {
			subject: user.id,
			issuer: 'sati-backend',
			expiresIn: '7d',
		});

		res.cookie(cookieName, token, sessionCookieOptions());
		return res.json({ user: publicUser(user) });
	} catch (error) {
		console.error('Sign-in failed:', error);
		return res.status(503).json({ error: 'Sign-in is temporarily unavailable' });
	}
});

router.get('/me', authenticate, async (req, res) => {
	try {
		const user = await User.findById(req.authUserId);
		if (!user) {
			return res.status(401).json({ error: 'Not signed in' });
		}

		return res.json({ user: publicUser(user) });
	} catch (error) {
		console.error('Profile lookup failed:', error);
		return res.status(500).json({ error: 'Unable to load your profile' });
	}
});

router.patch('/profile', authenticate, parseAvatar, async (req, res) => {
	const { name, email, removePhoto } = req.body ?? {};
	if (
		typeof name !== 'string' || !name.trim() || name.trim().length > 100 ||
		typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
	) {
		return res.status(400).json({ error: 'Enter a name and valid email address' });
	}
	if (removePhoto !== undefined && !['true', 'false'].includes(removePhoto)) {
		return res.status(400).json({ error: 'Invalid photo removal value' });
	}
	if (req.file && removePhoto === 'true') {
		return res.status(400).json({ error: 'Choose a photo or remove the current photo, not both' });
	}

	let nextAvatar;
	if (req.file) {
		try {
			nextAvatar = await saveAvatar(req.file.buffer);
		} catch (error) {
			if (error.code === 'INVALID_AVATAR') {
				return res.status(400).json({ error: error.message });
			}
			console.error('Cloudinary avatar upload failed:', error);
			return res.status(502).json({ error: 'Photo upload failed. Check Cloudinary configuration and try again.' });
		}
	}

	try {
		const user = await User.findById(req.authUserId).select('+avatarPublicId');
		if (!user) {
			if (nextAvatar) await deleteAvatar(nextAvatar.publicId);
			return res.status(401).json({ error: 'Not signed in' });
		}

		const previousAvatarPublicId = user.avatarPublicId;
		user.name = name.trim();
		user.email = email.trim().toLowerCase();
		if (nextAvatar) {
			user.avatarUrl = nextAvatar.url;
			user.avatarPublicId = nextAvatar.publicId;
		} else if (removePhoto === 'true') {
			user.avatarUrl = null;
			user.avatarPublicId = null;
		}

		await user.save();
		if (previousAvatarPublicId && previousAvatarPublicId !== user.avatarPublicId) {
			await deleteAvatar(previousAvatarPublicId).catch((error) => {
				console.error('Old profile photo cleanup failed:', error);
			});
		}

		return res.json({ user: publicUser(user) });
	} catch (error) {
		if (nextAvatar) await deleteAvatar(nextAvatar.publicId).catch(() => {});
		if (error.code === 11000) {
			return res.status(409).json({ error: 'An account with this email already exists' });
		}
		if (error.name === 'ValidationError') {
			return res.status(400).json({ error: 'Enter a valid name and email address' });
		}

		console.error('Profile update failed:', error);
		return res.status(500).json({ error: 'Unable to update your profile' });
	}
});

router.post('/signout', (_req, res) => {
	const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions();
	res.clearCookie(cookieName, clearOptions);
	return res.status(204).end();
});

export default router;
