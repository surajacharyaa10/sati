import { randomUUID } from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { getCloudinary } from '../config/cloudinary.js';

const notificationFolder = 'sati/notifications';

export const notificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3, parts: 4 },
});

export const saveNotificationImage = async (buffer) => {
  let normalizedImage;
  try {
    const image = sharp(buffer, { limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) {
      throw new Error('Unsupported image format');
    }

    normalizedImage = await image
      .rotate()
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    const error = new Error('Photo must be a valid JPEG, PNG, or WebP image');
    error.code = 'INVALID_IMAGE';
    throw error;
  }

  const cloudinary = getCloudinary();
  const publicId = `${notificationFolder}/${randomUUID()}`;
  const result = await new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'image', format: 'webp' },
      (error, response) => (error ? reject(error) : resolve(response)),
    );
    upload.end(normalizedImage);
  });

  return { url: result.secure_url, publicId: result.public_id };
};
