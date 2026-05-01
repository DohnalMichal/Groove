import { toKey } from "./date";

export type Completions = Record<string, true>;

/**
 * Compute current streak: number of consecutive days (going backwards from `today`)
 * where `completions[YYYY-MM-DD]` is true.
 *
 * If today is not completed, start counting from yesterday — the user might still
 * complete it today, so we don't punish them mid-day.
 *
 * Examples:
 *   completions = { "2026-04-30": true, "2026-04-29": true }
 *   today       = 2026-05-01 (not done)
 *   → returns 2
 *
 *   completions = { "2026-05-01": true, "2026-04-30": true, "2026-04-28": true }
 *   today       = 2026-05-01
 *   → returns 2 (gap on 04-29 breaks the streak)
 */
export function computeStreak(completions: Completions, today: Date): number {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!completions[toKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let count = 0;
  while (completions[toKey(cursor)]) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
