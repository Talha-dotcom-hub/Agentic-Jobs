export const MIN_RESUME_MATCH_SCORE = 85;

export function isQualifyingMatchScore(score: unknown): score is number {
  return typeof score === 'number' &&
    Number.isFinite(score) &&
    score > MIN_RESUME_MATCH_SCORE;
}
