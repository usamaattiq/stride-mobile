import { uploadApi } from '@/services/api/uploadApi';
import type { PresignUploadResult, UploadPurpose } from '@/services/api/uploadApi.types';

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
  const blob = await readLocalUriAsBlob(localUri);
  const contentType = resolveContentType(localUri, blob, options.contentType);
  const filename =
    options.filename ?? filenameFromUri(localUri, `${options.purpose}.jpg`);

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
