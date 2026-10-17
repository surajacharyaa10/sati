import express from 'express';
import { rateLimit } from 'express-rate-limit';
import User from '../module/user.js';
import Otp from '../module/otp.js';
import PasswordReset from '../module/passwordReset.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { avatarUpload, deleteAvatar, saveAvatar } from '../services/avatar.js';
import { hashPassword, verifyPassword } from '../services/password.js';
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
		country: user.country || 'Nepal',
		phoneNumber: user.phoneNumber || '',
		currency: user.currency || (user.country === 'UK' ? 'GBP' : 'NPR'),
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

const signinHandler = async (req, res) => {
	const { email, password } = req.body ?? {};
	if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
		return res.status(400).json({ error: 'Enter your email address and password' });
	}

	try {
		// Check for admin credentials strictly from environment variables
		const adminUsername = process.env.ADMIN_USERNAME;
		const adminPassword = process.env.ADMIN_PASSWORD;

		if (
			adminUsername &&
			adminPassword &&
			email.trim().toLowerCase() === adminUsername.trim().toLowerCase() &&
			password === adminPassword
		) {
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

		const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return res.status(401).json({ error: 'Email or password is incorrect' });
		}

		startSession(res, user.id);
		return res.json({ user: publicUser(user) });
	} catch (error) {
		console.error('Sign-in failed:', error);
		return res.status(500).json({ error: 'Sign-in failed: ' + (error.message || 'Server error') });
	}
};

router.post('/signin', authLimiter, signinHandler);
// Mobile-app compatible alias
router.post('/login', authLimiter, signinHandler);

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
		if (req.body.country) {
			const normalizedCountry = req.body.country === 'UK' ? 'UK' : 'Nepal';
			user.country = normalizedCountry;
			user.currency = normalizedCountry === 'UK' ? 'GBP' : 'NPR';
		}
		if (req.body.phoneNumber !== undefined) {
			user.phoneNumber = String(req.body.phoneNumber).trim();
		}
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

router.post('/change-password', authenticate, async (req, res) => {
	if (req.authUserId.startsWith('admin-')) {
		return res.status(403).json({ error: 'Cannot modify hardcoded admin password from account settings' });
	}

	const { currentPassword, newPassword } = req.body ?? {};
	if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 128) {
		return res.status(400).json({ error: 'New password must be between 6 and 128 characters' });
	}

	try {
		const user = await User.findById(req.authUserId).select('+passwordHash');
		if (!user) {
			return res.status(401).json({ error: 'User not found' });
		}

		if (currentPassword && user.passwordHash) {
			const isMatch = await verifyPassword(currentPassword, user.passwordHash);
			if (!isMatch) {
				return res.status(400).json({ error: 'Current password is incorrect' });
			}
		}

		user.passwordHash = await hashPassword(newPassword);
		await user.save();

		return res.json({ message: 'Password updated successfully' });
	} catch (error) {
		console.error('Password change failed:', error);
		return res.status(500).json({ error: 'Failed to update password' });
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

// ─── Registration with OTP verification ─────────────────────────────────────

// Mobile-app compatible alias for the OTP-based registration flow.
router.post('/signup', async (req, res) => {
	const { name, email, country, phoneNumber, password } = req.body ?? {};

	if (typeof name !== 'string' || !name.trim()) {
		return res.status(400).json({ error: 'Please enter your full name' });
	}

	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		return res.status(400).json({ error: 'Please enter a valid email address' });
	}

	const normalizedCountry = country === 'UK' ? 'UK' : 'Nepal';
	const currency = normalizedCountry === 'UK' ? 'GBP' : 'NPR';

	if (typeof phoneNumber !== 'string' || !phoneNumber.trim() || phoneNumber.trim().length < 6) {
		return res.status(400).json({ error: 'Please enter a valid phone number' });
	}

	if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
		return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
	}

	const normalizedEmail = email.trim().toLowerCase();

	// Check reserved admin username
	if (normalizedEmail === (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase()) {
		return res.status(403).json({ error: 'That email is reserved for the admin account' });
	}

	// Check if already registered
	const existing = await User.findOne({ email: normalizedEmail });
	if (existing) {
		return res.status(409).json({ error: 'An account with this email already exists' });
	}

	try {
		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const passwordHash = await hashPassword(password);

		// Remove any existing pending registration for this email
		await Otp.deleteMany({ email: normalizedEmail });

		await Otp.create({
			email: normalizedEmail,
			otp,
			name: name.trim(),
			passwordHash,
			country: normalizedCountry,
			phoneNumber: phoneNumber.trim(),
			currency,
		});

		// Send email
		await sendOtpEmail(normalizedEmail, otp, name.trim()).catch((err) => {
			console.warn('Could not send email directly, relying on logged code:', err.message);
		});

		return res.json({
			success: true,
			message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
			email: normalizedEmail,
			country: normalizedCountry,
			currency,
		});
	} catch (error) {
		console.error('Failed to initiate signup:', error);
		return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
	}
});

router.post('/send-signup-otp', async (req, res) => {
	const { name, email, country, phoneNumber, password } = req.body ?? {};

	if (typeof name !== 'string' || !name.trim()) {
		return res.status(400).json({ error: 'Please enter your full name' });
	}

	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		return res.status(400).json({ error: 'Please enter a valid email address' });
	}

	const normalizedCountry = country === 'UK' ? 'UK' : 'Nepal';
	const currency = normalizedCountry === 'UK' ? 'GBP' : 'NPR';

	if (typeof phoneNumber !== 'string' || !phoneNumber.trim() || phoneNumber.trim().length < 6) {
		return res.status(400).json({ error: 'Please enter a valid phone number' });
	}

	if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
		return res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
	}

	const normalizedEmail = email.trim().toLowerCase();

	// Check reserved admin username
	if (normalizedEmail === (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase()) {
		return res.status(403).json({ error: 'That email is reserved for the admin account' });
	}

	// Check if already registered
	const existing = await User.findOne({ email: normalizedEmail });
	if (existing) {
		return res.status(409).json({ error: 'An account with this email already exists' });
	}

	try {
		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const passwordHash = await hashPassword(password);

		// Remove any existing pending registration for this email
		await Otp.deleteMany({ email: normalizedEmail });

		await Otp.create({
			email: normalizedEmail,
			otp,
			name: name.trim(),
			passwordHash,
			country: normalizedCountry,
			phoneNumber: phoneNumber.trim(),
			currency,
		});

		// Send email
		await sendOtpEmail(normalizedEmail, otp, name.trim()).catch((err) => {
			console.warn('Could not send email directly, relying on logged code:', err.message);
		});

		return res.json({
			success: true,
			message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
			email: normalizedEmail,
			country: normalizedCountry,
			currency,
		});
	} catch (error) {
		console.error('Failed to initiate signup:', error);
		return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
	}
});

router.post('/verify-signup-otp', async (req, res) => {
	const { email, otp } = req.body ?? {};

	if (!email || !otp) {
		return res.status(400).json({ error: 'Email and verification code are required' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	const normalizedOtp = String(otp).trim();

	try {
		const record = await Otp.findOne({
			email: normalizedEmail,
			otp: normalizedOtp,
		});

		if (!record) {
			return res.status(400).json({ error: 'Invalid or expired verification code' });
		}

		// Double-check if account was created in the meantime
		let user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			user = await User.create({
				name: record.name,
				email: record.email,
				passwordHash: record.passwordHash,
				country: record.country,
				phoneNumber: record.phoneNumber,
				currency: record.currency,
				isVerified: true,
			});
		}

		// Clean up pending OTPs
		await Otp.deleteMany({ email: normalizedEmail });

		return res.status(201).json({
			success: true,
			message: 'Account created successfully! Please sign in with your credentials.',
			user: publicUser(user),
		});
	} catch (error) {
		console.error('OTP verification failed:', error);
		if (error.code === 11000) {
			return res.status(409).json({ error: 'An account with this email already exists' });
		}
		return res.status(500).json({ error: 'Verification failed. Please try again.' });
	}
});

router.post('/resend-signup-otp', async (req, res) => {
	const { email } = req.body ?? {};
	if (!email) {
		return res.status(400).json({ error: 'Email is required' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	try {
		const existingPending = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
		if (!existingPending) {
			return res.status(400).json({ error: 'No pending registration found for this email. Please sign up again.' });
		}

		const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
		existingPending.otp = newOtp;
		existingPending.createdAt = new Date();
		await existingPending.save();

		await sendOtpEmail(normalizedEmail, newOtp, existingPending.name).catch((err) => {
			console.warn('Could not resend email:', err.message);
		});

		return res.json({
			success: true,
			message: `New code sent to ${normalizedEmail}`,
		});
	} catch (error) {
		console.error('Failed to resend OTP:', error);
		return res.status(500).json({ error: 'Could not resend code' });
	}
});

// ─── Password Reset (Forgot Password) ───────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
	const { email } = req.body ?? {};
	if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
		return res.status(400).json({ error: 'Please enter a valid email address' });
	}

	const normalizedEmail = email.trim().toLowerCase();

	try {
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res.status(404).json({ error: 'No account found with this email address' });
		}

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		// Delete old resets for this email
		await PasswordReset.deleteMany({ email: normalizedEmail });

		await PasswordReset.create({
			email: normalizedEmail,
			otp,
			name: user.name || 'there',
		});

		await sendPasswordResetEmail(normalizedEmail, otp, user.name || 'there').catch((err) => {
			console.warn('Could not send password reset email directly:', err.message);
		});

		return res.json({
			success: true,
			message: `A 6-digit password reset code has been sent to ${normalizedEmail}`,
			email: normalizedEmail,
		});
	} catch (error) {
		console.error('Failed to process forgot password:', error);
		return res.status(500).json({ error: 'Failed to send reset code. Please try again.' });
	}
});

router.post('/verify-reset-otp', async (req, res) => {
	const { email, otp } = req.body ?? {};
	if (!email || !otp) {
		return res.status(400).json({ error: 'Email and verification code are required' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	const normalizedOtp = String(otp).trim();

	try {
		const record = await PasswordReset.findOne({
			email: normalizedEmail,
			otp: normalizedOtp,
		});

		if (!record) {
			return res.status(400).json({ error: 'Invalid or expired verification code' });
		}

		return res.json({
			success: true,
			message: 'Code verified successfully',
		});
	} catch (error) {
		console.error('Verify reset OTP failed:', error);
		return res.status(500).json({ error: 'Verification failed' });
	}
});

router.post('/reset-password', async (req, res) => {
	const { email, otp, newPassword } = req.body ?? {};

	if (!email || !otp) {
		return res.status(400).json({ error: 'Email and verification code are required' });
	}

	if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
		return res.status(400).json({ error: 'New password must be between 8 and 128 characters' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	const normalizedOtp = String(otp).trim();

	try {
		const record = await PasswordReset.findOne({
			email: normalizedEmail,
			otp: normalizedOtp,
		});

		if (!record) {
			return res.status(400).json({ error: 'Invalid or expired verification code' });
		}

		const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
		if (!user) {
			return res.status(404).json({ error: 'Account not found' });
		}

		user.passwordHash = await hashPassword(newPassword);
		await user.save();

		// Cleanup reset record
		await PasswordReset.deleteMany({ email: normalizedEmail });

		return res.json({
			success: true,
			message: 'Password reset successfully! Please sign in with your new password.',
			user: publicUser(user),
		});
	} catch (error) {
		console.error('Password reset failed:', error);
		return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
	}
});

router.post('/resend-reset-otp', async (req, res) => {
	const { email } = req.body ?? {};
	if (!email) {
		return res.status(400).json({ error: 'Email is required' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();

	try {
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res.status(404).json({ error: 'No account found with this email' });
		}

		const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

		await PasswordReset.deleteMany({ email: normalizedEmail });
		await PasswordReset.create({
			email: normalizedEmail,
			otp: newOtp,
			name: user.name || 'there',
		});

		await sendPasswordResetEmail(normalizedEmail, newOtp, user.name || 'there').catch((err) => {
			console.warn('Could not resend email:', err.message);
		});

		return res.json({
			success: true,
			message: `New reset code sent to ${normalizedEmail}`,
		});
	} catch (error) {
		console.error('Failed to resend reset OTP:', error);
		return res.status(500).json({ error: 'Could not resend code' });
	}
});

export default router;
