import { ProfileSettingsValidationError } from '../middleware/safeErrors.js';

export interface UserPreferences {
  pushNotifications: boolean;
  highMatchAlerts: boolean;
  emailSummaries: boolean;
  autoSaveHighMatches: boolean;
}

export interface UserProfileSettings {
  id: string;
  email: string;
  fullName: string;
  preferences: UserPreferences;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  pushNotifications: false,
  highMatchAlerts: true,
  emailSummaries: true,
  autoSaveHighMatches: false,
};

function readPreferences(value: unknown): UserPreferences {
  const stored = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    pushNotifications: typeof stored.pushNotifications === 'boolean' ? stored.pushNotifications : DEFAULT_USER_PREFERENCES.pushNotifications,
    highMatchAlerts: typeof stored.highMatchAlerts === 'boolean' ? stored.highMatchAlerts : DEFAULT_USER_PREFERENCES.highMatchAlerts,
    emailSummaries: typeof stored.emailSummaries === 'boolean' ? stored.emailSummaries : DEFAULT_USER_PREFERENCES.emailSummaries,
    autoSaveHighMatches: typeof stored.autoSaveHighMatches === 'boolean' ? stored.autoSaveHighMatches : DEFAULT_USER_PREFERENCES.autoSaveHighMatches,
  };
}

export async function getUserProfileSettings(client: any, userId: string): Promise<UserProfileSettings | null> {
  if (!client || !userId) throw new Error('Authenticated profile storage is unavailable.');
  const { data, error } = await client.from('profiles')
    .select('id,email,full_name,preferences')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load profile settings: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    email: data.email || '',
    fullName: data.full_name || '',
    preferences: readPreferences(data.preferences),
  };
}

export async function getScanPreferences(client: any, userId: string): Promise<UserPreferences> {
  if (!client || !userId) return { ...DEFAULT_USER_PREFERENCES };
  const { data, error } = await client.from('profiles')
    .select('preferences')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load saved scan preferences: ${error.message}`);
  return readPreferences(data?.preferences);
}

export async function saveUserProfileSettings(
  client: any,
  userId: string,
  input: { fullName: unknown; preferences: unknown },
): Promise<UserProfileSettings> {
  if (!client || !userId) throw new Error('Authenticated profile storage is unavailable.');
  if (typeof input.fullName !== 'string' || !input.fullName.trim() || input.fullName.trim().length > 120) {
    throw new ProfileSettingsValidationError('Full name must contain 1 to 120 characters.');
  }
  if (!input.preferences || typeof input.preferences !== 'object') {
    throw new ProfileSettingsValidationError('Profile preferences are invalid.');
  }
  const candidate = input.preferences as Record<string, unknown>;
  const keys = Object.keys(DEFAULT_USER_PREFERENCES) as Array<keyof UserPreferences>;
  if (keys.some((key) => typeof candidate[key] !== 'boolean')) {
    throw new ProfileSettingsValidationError('Every profile preference must be a boolean value.');
  }
  const preferences = readPreferences(candidate);
  const { data, error } = await client.from('profiles')
    .update({ full_name: input.fullName.trim(), preferences, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id,email,full_name,preferences')
    .maybeSingle();
  if (error) throw new Error(`Could not save profile settings: ${error.message}`);
  if (!data) throw new Error('No profile was updated for this authenticated account.');
  return {
    id: data.id,
    email: data.email || '',
    fullName: data.full_name || '',
    preferences: readPreferences(data.preferences),
  };
}
