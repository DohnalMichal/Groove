"use client";

import { KebabMenu } from "./KebabMenu";
import type { Habit } from "@/lib/storage";

type HabitCardProps = {
  habit: Habit;
  doneToday: boolean;
  streak: number;
  onToggle: () => void;
  onDelete: () => void;
};

export function HabitCard({
  habit,
  doneToday,
  streak,
  onToggle,
  onDelete,
}: HabitCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={doneToday}
      className={`bg-white rounded-3xl p-6 cursor-pointer select-none border-2 shadow-subtle transition-[transform,box-shadow,border-color] hover:scale-[1.02] hover:shadow-medium active:scale-[0.99] ${
        doneToday
          ? "border-primary"
          : "border-transparent"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-lg tracking-tight truncate pr-3">
          {habit.name}
        </span>
        <div className="flex items-center gap-2">
          <CheckCircle done={doneToday} />
          <KebabMenu
            ariaLabel={`Možnosti pro ${habit.name}`}
            items={[
              { label: "Smazat", onClick: onDelete, destructive: true },
            ]}
          />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[40px] font-bold leading-none tracking-tight text-secondary">
          {streak}
        </span>
        <span className="text-sm text-text-secondary">
          {streak === 1 ? "den v řadě" : streak >= 2 && streak <= 4 ? "dny v řadě" : "dní v řadě"}
        </span>
      </div>
    </div>
  );
}

function CheckCircle({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
        done
          ? "bg-primary border-primary text-white"
          : "border-border bg-white"
      }`}
    >
      {done && <span className="text-sm font-bold leading-none">✓</span>}
    </span>
  );
}
