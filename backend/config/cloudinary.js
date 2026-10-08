import { v2 as cloudinary } from 'cloudinary';

export const getCloudinary = () => {
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
		secure: true,
	});

	const config = cloudinary.config();
	if (!config.cloud_name || !config.api_key || !config.api_secret) {
		throw new Error('Cloudinary credentials are not configured');
	}

	return cloudinary;
};