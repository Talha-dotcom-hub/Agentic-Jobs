import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPersistedResume,
  isOwnedResumeStoragePath,
  removeResumeStorageObject,
  savePersistedResume,
  verifyResumeStorageObject,
  StoredResumeRecord,
} from '../server/resume/resumeManager.js';

function makeRecord(userId: string, text: string, storagePath: string): StoredResumeRecord {
  return {
    userId,
    text,
    name: 'resume.pdf',
    storagePath,
    lastUpdated: new Date().toISOString(),
    extractedSkills: ['TypeScript'],
    parsedRole: 'Software Engineer',
    profile: {
      headline: 'Software Engineer',
      skills: ['TypeScript'],
      technicalTools: ['TypeScript'],
      qualifications: [],
      certifications: [],
      experience: [],
      education: [],
      projects: [],
      languages: [],
      domains: [],
    },
    extractionStatus: 'completed',
    profileVersion: 1,
  };
}

function makeClient(initialRecord?: StoredResumeRecord, options: { failProfileWrite?: boolean } = {}) {
  let resumeRow: Record<string, any> | null = initialRecord ? {
    user_id: initialRecord.userId,
    content_text: initialRecord.text,
    file_name: initialRecord.name,
    storage_path: initialRecord.storagePath,
    extracted_skills: initialRecord.extractedSkills,
    structured_profile: initialRecord.profile,
    profile_version: initialRecord.profileVersion,
    extraction_status: initialRecord.extractionStatus,
    updated_at: initialRecord.lastUpdated,
  } : null;
  const calls: Array<{ table: string; operation: string; userId?: string; row?: Record<string, any> }> = [];
  let failProfileWrite = options.failProfileWrite || false;

  const client = {
    from(table: string) {
      let userId: string | undefined;
      return {
        select() { calls.push({ table, operation: 'select' }); return this; },
        eq(column: string, value: string) {
          if (column === 'user_id') userId = value;
          return this;
        },
        maybeSingle: async () => ({
          data: table === 'resumes' && resumeRow?.user_id === userId ? { ...resumeRow } : null,
          error: null,
        }),
        upsert: async (row: Record<string, any>) => {
          calls.push({ table, operation: 'upsert', userId: row.user_id, row });
          if (table === 'resumes') resumeRow = { ...row };
          if (table === 'professional_profiles' && failProfileWrite) {
            failProfileWrite = false;
            return { error: { message: 'profile table unavailable' } };
          }
          return { error: null };
        },
        delete() {
          return {
            eq: async (_column: string, value: string) => {
              calls.push({ table, operation: 'delete', userId: value });
              if (table === 'resumes' && resumeRow?.user_id === value) resumeRow = null;
              return { error: null };
            },
          };
        },
      };
    },
    storage: {
      from(bucket: string) {
        return {
          list: async (folder: string, options: { search: string }) => ({
            data: bucket === 'resumes' && folder === 'user-a' ? [{ name: options.search }] : [],
            error: null,
          }),
          remove: async (paths: string[]) => {
            calls.push({ table: `storage:${bucket}`, operation: 'remove', userId: paths[0]?.split('/')[0] });
            return { error: null };
          },
        };
      },
    },
    readResume: () => resumeRow,
    calls,
  };
  return client;
}

describe('Resume persistent storage ownership and metadata', () => {
  test('saves the private storage path with resume text and restores it from the authenticated record', async () => {
    const client = makeClient();
    const saved = await savePersistedResume(makeRecord('user-a', 'Resume text with sufficient length.', 'user-a/123_resume.pdf'), client);
    const restored = await getPersistedResume('user-a', client);

    assert.equal(saved.storagePath, 'user-a/123_resume.pdf');
    assert.equal(restored?.text, 'Resume text with sufficient length.');
    assert.equal(restored?.storagePath, 'user-a/123_resume.pdf');
    assert.equal(client.readResume()?.user_id, 'user-a');
    assert.equal(client.readResume()?.storage_path, 'user-a/123_resume.pdf');
  });

  test('rejects malformed or cross-user storage paths before any storage query', async () => {
    const client = makeClient();
    assert.equal(isOwnedResumeStoragePath('user-a', 'user-b/123_resume.pdf'), false);
    assert.equal(isOwnedResumeStoragePath('user-a', 'user-a/../123_resume.pdf'), false);
    await assert.rejects(verifyResumeStorageObject('user-a', 'user-b/123_resume.pdf', client), /does not belong/);
    assert.equal(client.calls.length, 0);
  });

  test('verifies upload existence and only removes an object scoped to the matching owner', async () => {
    const client = makeClient();
    await verifyResumeStorageObject('user-a', 'user-a/123_resume.pdf', client);
    assert.equal(await removeResumeStorageObject('user-a', 'user-a/123_resume.pdf', client), null);
    await assert.rejects(removeResumeStorageObject('user-a', 'user-b/123_resume.pdf', client), /Refusing to remove/);
    assert.equal(client.calls.filter((call) => call.operation === 'remove').length, 1);
  });

  test('rolls back the resume row if structured profile persistence fails during replacement', async () => {
    const previous = makeRecord('user-a', 'Previously persisted resume text.', 'user-a/111_resume.pdf');
    const client = makeClient(previous, { failProfileWrite: true });

    await assert.rejects(
      savePersistedResume(makeRecord('user-a', 'Replacement resume text.', 'user-a/222_resume.pdf'), client),
      /previous resume was restored/,
    );
    assert.equal(client.readResume()?.content_text, 'Previously persisted resume text.');
    assert.equal(client.readResume()?.storage_path, 'user-a/111_resume.pdf');
  });
});
