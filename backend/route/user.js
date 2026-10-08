import express from 'express';
import mongoose from 'mongoose';
import User from '../module/user.js';

const router = express.Router();
const editableFields = ['name', 'email'];

const sendDatabaseError = (res, error) => {
	if (error.name === 'ValidationError' || error.name === 'CastError') {
		return res.status(400).json({ error: error.message });
	}

	if (error.code === 11000) {
		return res.status(409).json({ error: 'A user with this email already exists' });
	}

	console.error('User operation failed:', error);
	return res.status(500).json({ error: 'Internal server error' });
};

const validateUserId = (req, res, next) => {
	if (!mongoose.isValidObjectId(req.params.id)) {
		return res.status(400).json({ error: 'Invalid user ID' });
	}

	return next();
};

router.post('/', async (req, res) => {
	try {
		const user = await User.create({
			name: req.body?.name,
			email: req.body?.email,
		});

		return res.status(201).json(user);
	} catch (error) {
		return sendDatabaseError(res, error);
	}
});

router.get('/', async (_req, res) => {
	try {
		const users = await User.find().sort({ createdAt: -1 });
		return res.json(users);
	} catch (error) {
		return sendDatabaseError(res, error);
	}
});

router.get('/:id', validateUserId, async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return res.json(user);
	} catch (error) {
		return sendDatabaseError(res, error);
	}
});

const updateUser = (requireAllFields) => async (req, res) => {
	const body = req.body ?? {};
	const unsupportedFields = Object.keys(body).filter(
		(field) => !editableFields.includes(field),
	);

	if (unsupportedFields.length > 0) {
		return res.status(400).json({ error: 'Only name and email can be updated' });
	}

	if (requireAllFields && editableFields.some((field) => !(field in body))) {
		return res.status(400).json({ error: 'Both name and email are required for PUT' });
	}

	if (editableFields.every((field) => !(field in body))) {
		return res.status(400).json({ error: 'Provide name or email to update' });
	}

	try {
		const user = await User.findByIdAndUpdate(req.params.id, body, {
			new: true,
			runValidators: true,
		});

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return res.json(user);
	} catch (error) {
		return sendDatabaseError(res, error);
	}
};

router.put('/:id', validateUserId, updateUser(true));
router.patch('/:id', validateUserId, updateUser(false));

router.delete('/:id', validateUserId, async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return res.json({ message: 'User deleted successfully' });
	} catch (error) {
		return sendDatabaseError(res, error);
	}
});

export default router;
