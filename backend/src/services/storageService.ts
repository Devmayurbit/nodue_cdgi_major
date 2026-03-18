import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { config } from '../config';

type ResourceType = 'auto' | 'raw' | 'image' | 'video';

export interface StoredFile {
  url: string;
  provider: 'local' | 'cloudinary';
}

const uploadsRoot = path.join(__dirname, '../../uploads');
const cloudinaryEnabled =
  config.storage.provider === 'cloudinary' &&
  !!config.storage.cloudinary.cloudName &&
  !!config.storage.cloudinary.apiKey &&
  !!config.storage.cloudinary.apiSecret;

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: config.storage.cloudinary.cloudName,
    api_key: config.storage.cloudinary.apiKey,
    api_secret: config.storage.cloudinary.apiSecret,
    secure: true,
  });
}

const normalizeSlashes = (value: string): string => value.replace(/\\/g, '/');

const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeBaseName = (name: string): string => {
  return name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

const generateLocalName = (originalName: string): string => {
  const ext = path.extname(originalName || '').toLowerCase();
  const base = sanitizeBaseName(path.basename(originalName || 'file', ext)) || 'file';
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`;
};

const uploadBufferToCloudinary = async (
  buffer: Buffer,
  options: UploadApiOptions
): Promise<StoredFile> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result?.secure_url) {
        reject(error || new Error('Cloudinary upload failed.'));
        return;
      }

      resolve({
        url: result.secure_url,
        provider: 'cloudinary',
      });
    });

    stream.end(buffer);
  });
};

const writeBufferToLocal = async (buffer: Buffer, originalName: string, folder: string): Promise<StoredFile> => {
  const dir = path.join(uploadsRoot, folder);
  ensureDir(dir);

  const fileName = generateLocalName(originalName);
  const fullPath = path.join(dir, fileName);
  await fs.promises.writeFile(fullPath, buffer);

  return {
    url: normalizeSlashes(path.join(folder, fileName)),
    provider: 'local',
  };
};

export const uploadMulterFile = async (
  file: Express.Multer.File,
  options?: { folder?: string; resourceType?: ResourceType }
): Promise<StoredFile> => {
  const folder = options?.folder || 'attachments';
  const resourceType = options?.resourceType || 'auto';

  if (cloudinaryEnabled) {
    const publicIdBase = sanitizeBaseName(path.basename(file.originalname || 'file', path.extname(file.originalname || '')));
    const publicId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${publicIdBase || 'file'}`;

    return uploadBufferToCloudinary(file.buffer, {
      resource_type: resourceType,
      folder: `${config.storage.cloudinary.folder}/${folder}`,
      public_id: publicId,
      overwrite: false,
    });
  }

  return writeBufferToLocal(file.buffer, file.originalname || 'file', folder);
};

export const uploadLocalFile = async (
  filePath: string,
  options?: { folder?: string; resourceType?: ResourceType; fileName?: string }
): Promise<StoredFile> => {
  const folder = options?.folder || 'certificates';
  const resourceType = options?.resourceType || 'raw';
  const fileName = options?.fileName || path.basename(filePath);

  if (cloudinaryEnabled) {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: resourceType,
      folder: `${config.storage.cloudinary.folder}/${folder}`,
      public_id: sanitizeBaseName(path.basename(fileName, path.extname(fileName))) || generateLocalName(fileName),
      overwrite: false,
      use_filename: true,
      unique_filename: true,
    });

    return {
      url: result.secure_url,
      provider: 'cloudinary',
    };
  }

  const relative = normalizeSlashes(path.relative(uploadsRoot, filePath));
  return {
    url: relative,
    provider: 'local',
  };
};

export const isRemoteUrl = (value: string): boolean => /^https?:\/\//i.test(value);

export const usingCloudStorage = (): boolean => cloudinaryEnabled;
