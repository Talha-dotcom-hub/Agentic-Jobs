import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function uploadResumeFile(userId: string, file: File) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase must be configured before uploading a resume.');
  }

  if (!userId || file.size === 0) throw new Error('A signed-in account and non-empty resume file are required.');
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds maximum permitted limit of 5MB.');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExtensions = new Set(['pdf', 'docx', 'txt', 'md']);
  const allowedTypes: Record<string, string[]> = {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    txt: ['text/plain', 'application/octet-stream', ''],
    md: ['text/markdown', 'text/plain', 'application/octet-stream', ''],
  };
  if (!allowedExtensions.has(extension) || !allowedTypes[extension].includes(file.type)) {
    throw new Error('Invalid file format. Permitted formats: PDF, TXT, DOCX, MD.');
  }

  const filePath = `${userId}/${Date.now()}_resume.${extension}`;

  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return { path: data.path, error: null };
}

export async function getResumeSignedUrl(path: string) {
  if (!isSupabaseConfigured || !path) return null;

  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(path, 60 * 15); // 15 minute expiry

  if (error) {
    console.warn('Signed URL error:', error);
    return null;
  }
  return data.signedUrl;
}
