const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function retryDelay(response: Response | null, attempt: number): number {
  const retryAfter = response?.headers.get('retry-after');
  const seconds = retryAfter ? Number(retryAfter) : NaN;
  return Number.isFinite(seconds)
    ? Math.min(2000, Math.max(100, seconds * 1000))
    : Math.min(1000, 100 * (2 ** attempt));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { timeoutMs: number; retries?: number },
): Promise<Response> {
  const retries = Math.max(0, Math.min(options.retries ?? 2, 3));
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
    let response: Response | null = null;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === retries) return response;
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
  }

  throw lastError instanceof Error ? lastError : new Error('External source request failed after retries.');
}
