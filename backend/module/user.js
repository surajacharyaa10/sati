import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 100,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		passwordHash: {
			type: String,
			required: true,
			select: false,
		},
		avatarUrl: {
			type: String,
			default: null,
		},
		avatarPublicId: {
			type: String,
			default: null,
			select: false,
		},
		role: {
			type: String,
			enum: ['customer', 'admin'],
			default: 'customer',
		},
		country: {
			type: String,
			enum: ['Nepal', 'UK'],
			default: 'Nepal',
		},
		phoneNumber: {
			type: String,
			default: '',
			trim: true,
		},
		currency: {
			type: String,
			enum: ['NPR', 'GBP'],
			default: 'NPR',
		},
		isVerified: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform(_document, user) {
				delete user.passwordHash;
				delete user.__v;
				return user;
			},
		},
	},
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
