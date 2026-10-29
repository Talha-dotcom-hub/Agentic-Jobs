export class ProfileSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileSettingsValidationError';
  }
}

export function safeApiErrorMessage(_error: unknown, fallback: string): string {
  return fallback;
}

export function safeErrorMetadata(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== 'object') return { type: typeof error };
  const candidate = error as { name?: unknown; code?: unknown; status?: unknown; statusCode?: unknown };
  const metadata: Record<string, string | number> = {};
  if (typeof candidate.name === 'string' && /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(candidate.name)) {
    metadata.name = candidate.name;
  }
  if (typeof candidate.code === 'string' && /^[A-Z0-9_]{1,32}$/.test(candidate.code)) {
    metadata.code = candidate.code;
  }
  const status = Number(candidate.status ?? candidate.statusCode);
  if (Number.isInteger(status) && status >= 400 && status <= 599) metadata.status = status;
  return metadata;
}

export function logSafeServerError(context: string, error: unknown): void {
  console.error(context, safeErrorMetadata(error));
}

export function profileSettingsApiError(error: unknown): { status: number; message: string } {
  if (error instanceof ProfileSettingsValidationError) {
    return { status: 400, message: error.message };
  }
  return { status: 503, message: 'Could not save profile settings. Please try again.' };
}
