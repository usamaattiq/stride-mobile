export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'UNKNOWN_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'SESSION_REVOKED'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'USER_NOT_FOUND'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_DELIVERY_FAILED'
  | 'RATE_LIMITED'
  | 'ACCOUNT_DELETION_BLOCKED'
  | 'INSUFFICIENT_CREDITS'
  | (string & {});

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const AUTH_SESSION_ENDED_CODES = new Set<string>([
  'SESSION_REVOKED',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'UNAUTHORIZED',
]);

export function isSessionRevokedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'SESSION_REVOKED';
}

/** Token is unusable — sign the user out. Includes expiry, invalid JWT, and generic 401. */
export function isAuthSessionEndedError(error: unknown): boolean {
  return error instanceof ApiError && AUTH_SESSION_ENDED_CODES.has(error.code);
}

export function isApiErrorWithCode(error: unknown, code: ApiErrorCode): boolean {
  return error instanceof ApiError && error.code === code;
}
