import { GoogleGenAI } from '@google/genai';

// Verified current Gemini API model identifiers. Some projects may not have legacy 2.5 access.
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
] as const;

export class GeminiFallbackExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiFallbackExhaustedError';
  }
}

function canTryAnotherModel(error: any): boolean {
  const status = Number(error?.status ?? error?.code ?? error?.error?.code ?? 0);
  const message = String(error?.message || error?.error?.message || '').toLowerCase();
  // A project-wide requests/day or billing quota is shared across models; cycling models only adds requests.
  if (/requests per day|per-day quota|daily quota|quota exceeded for project|project-level quota|billing quota|daily request limit/.test(message)) return false;
  // Never disguise invalid credentials or permission failures as model fallback.
  if (/invalid api key|api key not valid|unauthorized|authentication failed|permission denied/.test(message)) return false;
  if (/quota|resource_exhausted|rate.?limit|too many requests|model .*not found|not supported for generatecontent|temporarily unavailable|overloaded/.test(message)) return true;
  return status === 404 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export async function generateWithGeminiFallback(
  apiKey: string,
  request: { contents: any; config?: any },
): Promise<{ response: any; model: string }> {
  if (!apiKey?.trim()) throw new Error('A Gemini API key is required.');
  const ai = new GoogleGenAI({ apiKey });
  let lastError: any;
  const tried: string[] = [];
  for (const model of GEMINI_FALLBACK_MODELS) {
    tried.push(model);
    try {
      const response = await ai.models.generateContent({ model, ...request } as any);
      return { response, model };
    } catch (error: any) {
      lastError = error;
      if (!canTryAnotherModel(error)) throw error;
    }
  }
  const detail = String(lastError?.message || 'All configured fallback models were unavailable.');
  throw new GeminiFallbackExhaustedError(`Gemini rate limits or model availability prevented this AI task. Models tried: ${tried.join(' → ')}. Last error: ${detail}`);
}