import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { uploadApi } from '@/services/api/uploadApi';
import type { PresignUploadResult, UploadPurpose } from '@/services/api/uploadApi.types';

/** Longest edge after resize — enough for docs/photos, small enough for S3. */
const MAX_UPLOAD_EDGE = 1600;
const JPEG_QUALITY = 0.72;

function guessContentType(uri: string, fallback = 'image/jpeg'): string {
  const lower = uri.toLowerCase().split('?')[0] ?? uri;
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return fallback;
}

function filenameFromUri(uri: string, fallback: string): string {
  const path = uri.split('?')[0] ?? uri;
  const last = path.split('/').pop();
  if (last && /\.[a-z0-9]{1,8}$/i.test(last)) {
    return last;
  }
  return fallback;
}

function jpegFilename(filename: string): string {
  return filename.replace(/\.[a-z0-9]{1,8}$/i, '') + '.jpg';
}

/** Copy/resize to a cache JPEG so pickers and uploads use a readable local file. */
export async function prepareLocalImage(localUri: string): Promise<string> {
  const probeContext = ImageManipulator.manipulate(localUri);
  let width = 0;
  let height = 0;
  try {
    const probed = await probeContext.renderAsync();
    width = probed.width;
    height = probed.height;
    probed.release();
  } finally {
    probeContext.release();
  }

  const context = ImageManipulator.manipulate(localUri);
  try {
    const longest = Math.max(width, height);
    if (longest > MAX_UPLOAD_EDGE) {
      const scale = MAX_UPLOAD_EDGE / longest;
      context.resize({
        width: Math.round(width * scale),
        height: Math.round(height * scale),
      });
    }

    const image = await context.renderAsync();
    try {
      const saved = await image.saveAsync({
        compress: JPEG_QUALITY,
        format: SaveFormat.JPEG,
      });
      return saved.uri;
    } finally {
      image.release();
    }
  } finally {
    context.release();
  }
}

async function readLocalUriAsBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected image');
  }
  return response.blob();
}

function resolveContentType(uri: string, blob: Blob, override?: string): string {
  if (override) {
    return override;
  }
  if (blob.type && blob.type.startsWith('image/')) {
    return blob.type === 'image/jpg' ? 'image/jpeg' : blob.type;
  }
  return guessContentType(uri);
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  body: Blob,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      detail
        ? `Upload failed (${response.status}): ${detail.slice(0, 200)}`
        : `Upload failed (${response.status})`,
    );
  }
}

export async function uploadLocalFileToPresignedUrl(
  localUri: string,
  options: {
    purpose: UploadPurpose;
    contentType?: string;
    filename?: string;
    /** Signup flow — OTP must already be verified for this phone. */
    signupPhone?: {
      countryCode: string;
      countryCallingCode: string;
      phoneDigits: string;
    };
  },
): Promise<PresignUploadResult> {
  let uploadUri = localUri;
  try {
    uploadUri = await prepareLocalImage(localUri);
  } catch {
    uploadUri = localUri;
  }

  const blob = await readLocalUriAsBlob(uploadUri);
  const compressed = uploadUri !== localUri;
  const contentType = compressed
    ? 'image/jpeg'
    : resolveContentType(uploadUri, blob, options.contentType);
  const filename = compressed
    ? jpegFilename(options.filename ?? filenameFromUri(localUri, `${options.purpose}.jpg`))
    : (options.filename ?? filenameFromUri(localUri, `${options.purpose}.jpg`));

  const presign = options.signupPhone
    ? await uploadApi.presignSignup({
        ...options.signupPhone,
        purpose: options.purpose as 'avatar' | 'nic_front' | 'nic_back',
        contentType,
        filename,
      })
    : await uploadApi.presign({
        purpose: options.purpose,
        contentType,
        filename,
      });

  await uploadFileToPresignedUrl(presign.uploadUrl, blob, contentType);
  return presign;
}

export function isRemoteMediaUrl(uri: string | null | undefined): boolean {
  if (!uri) return false;
  return /^https?:\/\//i.test(uri);
}
