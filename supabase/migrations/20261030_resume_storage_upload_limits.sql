-- Keep resume uploads private and enforce the same supported types and size limit
-- at the storage boundary, including uploads made directly by the browser client.
UPDATE storage.buckets
SET
  public = FALSE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/octet-stream'
  ]
WHERE id = 'resumes';
