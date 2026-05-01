"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type AddHabitModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function AddHabitModal({ open, onClose, onSubmit }: AddHabitModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-habit-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-medium"
      >
        <h2
          id="add-habit-title"
          className="text-2xl font-bold tracking-tight mb-6"
        >
          Nový habit
        </h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Např. Ranní běh"
          className="w-full h-12 px-4 rounded-xl border-2 border-border bg-white focus:border-primary outline-none transition-colors"
          maxLength={80}
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 rounded-xl text-text-secondary font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-12 px-6 rounded-xl bg-primary text-white font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
          >
            Uložit
          </button>
        </div>
      </form>
    </div>
  );
}
