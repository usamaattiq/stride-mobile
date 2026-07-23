import { ApiError, type ApiErrorCode } from './apiError';

/** Keep inline / dialog errors readable on small screens. */
const MAX_USER_MESSAGE_LENGTH = 90;

/** Codes whose server/Axios messages are technical or not localized. */
const FALLBACK_ONLY_CODES = new Set<ApiErrorCode>([
  'INTERNAL_SERVER_ERROR',
  'UNKNOWN_ERROR',
  'NETWORK_ERROR',
  'OTP_DELIVERY_FAILED',
]);

const TECHNICAL_MESSAGE_PATTERN =
  /(?:\b(?:ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|EAI_AGAIN)\b|timeout of \d+ms|Network Error|Request failed with status code|prisma|TypeError|ReferenceError|at\s+\S+\s*\(|<!DOCTYPE|<html|^\s*Error:)/i;

function isUserFacingMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.length > MAX_USER_MESSAGE_LENGTH) {
    return false;
  }
  if (TECHNICAL_MESSAGE_PATTERN.test(trimmed)) {
    return false;
  }
  if (trimmed.includes('\n')) {
    return false;
  }
  return true;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (FALLBACK_ONLY_CODES.has(error.code)) {
      return fallback;
    }
    if (isUserFacingMessage(error.message)) {
      return error.message.trim();
    }
    return fallback;
  }

  if (error instanceof Error) {
    if (isUserFacingMessage(error.message)) {
      return error.message.trim();
    }
    return fallback;
  }

  return fallback;
}
