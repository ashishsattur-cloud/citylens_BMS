import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const uploadDir = path.resolve('uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
export const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024, files: 3 }, fileFilter: (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
  cb(null, true);
} });
export async function normalizeUploadedFiles(files = []) {
  const cloudReady = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (cloudReady) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    const results = await Promise.all(files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'citylens/reports', resource_type: 'image' });
      fs.unlink(file.path, () => {});
      return { url: result.secure_url, publicId: result.public_id };
    }));
    return results;
  }
  return files.map((file) => ({ url: `/uploads/${path.basename(file.path)}`, publicId: '' }));
}
