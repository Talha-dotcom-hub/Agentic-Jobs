import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function getEncryptionKey(): Buffer {
  const secret = process.env.GEMINI_CREDENTIALS_ENCRYPTION_KEY;
  if (!secret || secret.trim().length < 32) {
    throw new Error('GEMINI_CREDENTIALS_ENCRYPTION_KEY must be configured as a backend secret with at least 32 characters.');
  }
  return createHash('sha256').update(`agentic-jobs-gemini-key-v1:${secret}`).digest();
}

export function encryptGeminiApiKey(apiKey: string): { ciphertext: string; iv: string; authTag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]).toString('base64');
  return { ciphertext, iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64') };
}

export function decryptGeminiApiKey(row: { encrypted_key: string; iv: string; auth_tag: string }): string {
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(row.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.encrypted_key, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export async function getUserGeminiApiKey(userId: string, supabaseClient?: any): Promise<string | null> {
  if (!supabaseClient || !userId) return null;
  const { data, error } = await supabaseClient
    .from('user_ai_credentials')
    .select('encrypted_key, iv, auth_tag')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return decryptGeminiApiKey(data);
}