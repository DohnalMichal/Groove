"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadHabits, saveHabits, type Habit } from "@/lib/storage";
import { todayKey } from "@/lib/date";

const UNDO_TIMEOUT_MS = 5000;

type PendingDelete = {
  habit: Habit;
  index: number;
  expiresAt: number;
};

export type UseHabitsReturn = {
  habits: Habit[];
  isHydrated: boolean;
  pendingUndo: PendingDelete | null;
  addHabit: (name: string) => void;
  toggleHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  undoDelete: () => void;
};

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<PendingDelete | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setHabits(loadHabits());
    setIsHydrated(true);
  }, []);

  // Persist on change (post-hydration only)
  useEffect(() => {
    if (!isHydrated) return;
    saveHabits(habits);
  }, [habits, isHydrated]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const addHabit = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      completions: {},
    };
    setHabits((prev) => [newHabit, ...prev]);
  }, []);

  const toggleHabit = useCallback((id: string) => {
    const key = todayKey();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const completions = { ...h.completions };
        if (completions[key]) {
          delete completions[key];
        } else {
          completions[key] = true;
        }
        return { ...h, completions };
      })
    );
  }, []);

  const deleteHabit = useCallback(
    (id: string) => {
      // Commit any prior pending undo permanently before starting a new one.
      clearUndoTimer();

      let removed: Habit | null = null;
      let removedIndex = -1;
      setHabits((prev) => {
        const idx = prev.findIndex((h) => h.id === id);
        if (idx === -1) return prev;
        removed = prev[idx];
        removedIndex = idx;
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });

      // setState is async; queue undo registration after commit
      queueMicrotask(() => {
        if (!removed || removedIndex === -1) return;
        setPendingUndo({
          habit: removed,
          index: removedIndex,
          expiresAt: Date.now() + UNDO_TIMEOUT_MS,
        });
        undoTimerRef.current = window.setTimeout(() => {
          setPendingUndo(null);
          undoTimerRef.current = null;
        }, UNDO_TIMEOUT_MS);
      });
    },
    [clearUndoTimer]
  );

  const undoDelete = useCallback(() => {
    setPendingUndo((current) => {
      if (!current) return null;
      clearUndoTimer();
      setHabits((prev) => {
        const next = [...prev];
        const insertAt = Math.min(current.index, next.length);
        next.splice(insertAt, 0, current.habit);
        return next;
      });
      return null;
    });
  }, [clearUndoTimer]);

  // Cleanup timer on unmount
  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  return {
    habits,
    isHydrated,
    pendingUndo,
    addHabit,
    toggleHabit,
    deleteHabit,
    undoDelete,
  };
}
