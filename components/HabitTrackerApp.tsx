"use client";

import { useMemo, useState } from "react";
import { todayKey } from "@/lib/date";
import { computeStreak } from "@/lib/streak";
import { useHabits } from "@/hooks/useHabits";
import { AddHabitModal } from "./AddHabitModal";
import { EmptyState } from "./EmptyState";
import { HabitCard } from "./HabitCard";
import { Header } from "./Header";
import { UndoToast } from "./UndoToast";

export function HabitTrackerApp() {
  const {
    habits,
    isHydrated,
    pendingUndo,
    addHabit,
    toggleHabit,
    deleteHabit,
    undoDelete,
  } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const tKey = todayKey();

  return (
    <main className="mx-auto max-w-md px-6 py-8 sm:py-16">
      <Header today={today} />

      {!isHydrated ? (
        <div className="h-32" aria-hidden="true" />
      ) : habits.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                doneToday={Boolean(habit.completions[tKey])}
                streak={computeStreak(habit.completions, today)}
                onToggle={() => toggleHabit(habit.id)}
                onDelete={() => deleteHabit(habit.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-6 w-full h-12 rounded-xl bg-primary text-white font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            + Přidat habit
          </button>
        </>
      )}

      <AddHabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={addHabit}
      />

      {pendingUndo && (
        <UndoToast
          message={`Smazáno · ${pendingUndo.habit.name}`}
          onUndo={undoDelete}
        />
      )}
    </main>
  );
}
