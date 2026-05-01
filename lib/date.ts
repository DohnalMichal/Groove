/**
 * Format a Date as YYYY-MM-DD in the local timezone.
 *
 * Examples:
 *   toKey(new Date(2026, 4, 1))  // "2026-05-01"
 *   toKey(new Date(2026, 0, 5))  // "2026-01-05"
 */
export function toKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toKey(new Date());
}
