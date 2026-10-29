export const appViewValues = [
  'dashboard',
  'discover',
  'recommended',
  'saved',
  'resume',
  'applications',
  'schedule',
  'notifications',
  'settings',
] as const;

export type AppView = (typeof appViewValues)[number];

export function isSafeAppView(value: string | null | undefined): value is AppView {
  return typeof value === 'string' && (appViewValues as readonly string[]).includes(value);
}

export function resolveNotificationDestination(
  link: string | undefined,
  type: 'match' | 'scan' | 'followup' | 'system' = 'system',
  baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com'
): AppView {
  const defaultForType: Record<typeof type, AppView> = {
    match: 'recommended',
    scan: 'discover',
    followup: 'applications',
    system: 'dashboard',
  };

  const fallback = defaultForType[type] ?? 'dashboard';
  const raw = typeof link === 'string' ? link.trim() : '';

  if (!raw) return fallback;

  if (isSafeAppView(raw)) return raw;

  try {
    const candidate = new URL(raw, baseOrigin);
    if (candidate.origin !== baseOrigin) return fallback;
    const viewParam = candidate.searchParams.get('view');
    if (isSafeAppView(viewParam)) return viewParam;
    if (candidate.pathname === '/' || candidate.pathname === '') {
      return fallback;
    }
    if (candidate.pathname.startsWith('/')) {
      return fallback;
    }
  } catch {
    // Invalid URL string or malformed relative destination. Fall back to the notification type's destination.
  }

  if (raw.startsWith('job-') || raw.startsWith('/job-')) return fallback;

  return fallback;
}
