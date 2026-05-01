import type { Completions } from "./streak";

export type Habit = {
  id: string;
  name: string;
  createdAt: string; // ISO 8601
  completions: Completions;
};

export type StorageShape = {
  version: 1;
  habits: Habit[];
};

const STORAGE_KEY = "groove.habits.v1";

export function loadHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StorageShape;
    if (parsed.version !== 1 || !Array.isArray(parsed.habits)) return [];
    return parsed.habits;
  } catch {
    return [];
  }
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StorageShape = { version: 1, habits };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private mode, quota) — silently no-op.
    // App continues to work in-memory; refresh loses data.
  }
}
