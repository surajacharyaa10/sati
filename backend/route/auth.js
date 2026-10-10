import express from 'express';
import { rateLimit } from 'express-rate-limit';
import User from '../module/user.js';
import { avatarUpload, deleteAvatar, saveAvatar } from '../services/avatar.js';
import { verifyPassword } from '../services/password.js';
import { authenticate, endSession, isUserAdmin, startSession } from '../services/session.js';

const router = express.Router();
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { error: 'Too many sign-in attempts. Please try again later.' },
	// Admin attempts use their own counter bucket so a locked-out user
	// account can never block the admin sign-in path.
	keyGenerator: (req) => {
		const email = req.body && typeof req.body.email === 'string' ? req.body.email.trim() : '';
		return email && email === process.env.ADMIN_USERNAME ? `admin:${req.ip}` : `user:${req.ip}`;
	},
});

const publicUser = (user, isAdminOverride) => {
	const adminUsername = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
	const userEmail = (user.email || '').trim().toLowerCase();
	const envEmails = (process.env.ADMIN_EMAILS || '')
		.split(',')
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean);
	const allowedAdmins = [adminUsername, ...envEmails].filter(Boolean);

	const isAdmin = Boolean(
		isAdminOverride ||
		user.role === 'admin' ||
		(user.id && String(user.id).startsWith('admin-')) ||
		(userEmail && allowedAdmins.includes(userEmail))
	);

	return {
		id: user.id || user._id,
		name: user.name,
		email: user.email,
		avatarUrl: user.avatarUrl ?? null,
		role: isAdmin ? 'admin' : (user.role || 'customer'),
		isAdmin,
	};
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

	// Check for admin credentials from environment variables
	const adminUsername = process.env.ADMIN_USERNAME;
	const adminPassword = process.env.ADMIN_PASSWORD;
	
	if (adminUsername && adminPassword && 
	    email.trim() === adminUsername && 
	    password === adminPassword) {
		// Create admin user object
		const adminUser = {
			id: 'admin-' + Date.now(), // Temporary ID for admin session
			name: 'Administrator',
			email: adminUsername,
			avatarUrl: null
		};
		
		startSession(res, adminUser.id);
		return res.json({ user: publicUser(adminUser, true) });
	}

	try {
		const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return res.status(401).json({ error: 'Email or password is incorrect' });
		}

		startSession(res, user.id);
		return res.json({ user: publicUser(user) });
	} catch (error) {
		console.error('Sign-in failed:', error);
		return res.status(503).json({ error: 'Sign-in is temporarily unavailable' });
	}
});

router.get('/me', authenticate, async (req, res) => {
	// Admin sessions use a non-ObjectId id ("admin-<timestamp>"), which would
	// throw a CastError in User.findById. Handle them before the DB lookup.
	if (req.authUserId.startsWith('admin-')) {
		const adminUser = {
			id: req.authUserId,
			name: 'Administrator',
			email: process.env.ADMIN_USERNAME,
			avatarUrl: null
		};
		return res.json({ user: publicUser(adminUser, true) });
	}

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
	// Prevent profile modification for admin sessions
	if (req.authUserId.startsWith('admin-')) {
		return res.status(403).json({ error: 'Cannot modify admin profile' });
	}
	
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
	endSession(res);
	return res.status(204).end();
});

// Admin session check. Verifies hardcoded admin session or database admin user.
router.get('/admin', authenticate, async (req, res) => {
	const isAdmin = await isUserAdmin(req.authUserId);
	if (!isAdmin) {
		return res.status(403).json({ error: 'Admin access required' });
	}

	if (req.authUserId.startsWith('admin-')) {
		return res.json({
			user: {
				id: req.authUserId,
				name: 'Administrator',
				email: process.env.ADMIN_USERNAME,
				avatarUrl: null,
				role: 'admin',
				isAdmin: true,
			},
		});
	}

	try {
		const user = await User.findById(req.authUserId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}
		return res.json({
			user: publicUser(user, true),
		});
	} catch (error) {
		console.error('Admin verification failed:', error);
		return res.status(500).json({ error: 'Unable to check admin status' });
	}
});

export default router;
