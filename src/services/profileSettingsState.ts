export function canSaveProfileSettings(
  isDemoMode: boolean,
  userId: string | null | undefined,
  loadedUserId: string | null,
): boolean {
  return isDemoMode || Boolean(userId && loadedUserId === userId);
}
