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
    return { path: `resumes/${userId}/${file.name}`, error: null };
  }

  // Enforce size limit (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds maximum permitted limit of 5MB.');
  }

  // Allowed MIME types
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
  ];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
    throw new Error('Invalid file format. Permitted formats: PDF, TXT, DOCX, MD.');
  }

  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}_resume.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
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
