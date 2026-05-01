# Habit Tracker (Groove) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postavit portfolio-grade habit tracker "Groove" s retro groovy vizuální identitou — single-page Next.js 16 app s `localStorage` perzistencí a minimum scope (toggle dnešního stavu, current streak, add habit přes modal, delete s undo toastem).

**Architecture:** Pure client-side React. `app/page.tsx` zůstane Server Component a renderuje jediný `'use client'` strom (`<HabitTrackerApp />`). State a perzistence schované v custom hooku `useHabits`. Pure funkce (`computeStreak`, `todayKey`) izolované v `lib/` pro testovatelnost. Žádný Zustand, žádný framer-motion, žádný sonner — vanilla React + Tailwind v4.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, Tailwind v4, TypeScript strict, Space Grotesk přes `next/font/google`. Žádný test runner — pure funkce ověříme ad-hoc přes `node -e`, UI manuálně přes `npm run dev` v prohlížeči (per spec rozhodnutí).

**Spec:** `docs/superpowers/specs/2026-05-01-habit-tracker-design.md`

---

## File Structure

```
app/
  layout.tsx        # MODIFY — Space Grotesk font, metadata, lang="cs"
  page.tsx          # MODIFY — RSC wrapper, renderuje <HabitTrackerApp />
  globals.css       # MODIFY — Tailwind v4 @theme s design tokens

components/
  HabitTrackerApp.tsx   # CREATE — 'use client', volá useHabits, drží modal/toast state
  Header.tsx            # CREATE — "Groove" + dnešní datum
  HabitCard.tsx         # CREATE — name + streak + toggle + kebab
  KebabMenu.tsx         # CREATE — ⋯ button + dropdown
  AddHabitModal.tsx     # CREATE — overlay + input + submit
  EmptyState.tsx        # CREATE — illustration + CTA
  UndoToast.tsx         # CREATE — fixed-bottom toast s "Vrátit"

lib/
  date.ts           # CREATE — todayKey() pure fn
  streak.ts         # CREATE — computeStreak() pure fn
  storage.ts        # CREATE — types (Habit, StorageShape) + load/save/clear

hooks/
  useHabits.ts      # CREATE — state + CRUD + toggle + persistence + undo
```

**Decomposition rationale:**
- Pure funkce v `lib/` (`date`, `streak`) jsou testovatelné izolovaně bez React/DOM
- `lib/storage.ts` je jediný entry-point k `localStorage` (try/catch, version key)
- `useHabits` schová celou perzistenci a undo logiku — komponenty zůstanou hloupé view
- Každá komponenta má jednu zodpovědnost a je < 100 řádků

---

## Task 1: Foundation — design tokens, font, layout

Nastavit Tailwind v4 s designovými tokeny, Space Grotesk fontem, body backgroundem. Po tomto tasku: `npm run dev` ukáže bílo-krémovou stránku s nadpisem "Groove" a žádnými warningy.

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Přepiš `app/globals.css` s design tokeny**

```css
@import "tailwindcss";

@theme {
  --color-primary: #E85D04;
  --color-secondary: #9D4EDD;
  --color-background: #FFF8F0;
  --color-surface: #FFFFFF;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-border: #E0D5C7;
  --color-success: #2D6A4F;
  --color-warning: #E85D04;
  --color-error: #D00000;

  --font-sans: var(--font-space-grotesk), system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 12px;
  --radius-lg: 24px;
  --radius-full: 9999px;

  --shadow-subtle: 0 2px 4px rgba(232, 93, 4, 0.08);
  --shadow-medium: 0 4px 16px rgba(232, 93, 4, 0.12);
}

body {
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  letter-spacing: -0.01em;
}
```

- [ ] **Step 2: Přepiš `app/layout.tsx` s Space Grotesk a metadata "Groove"**

```tsx
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Groove — habit tracker",
  description: "Build your streak.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Přepiš `app/page.tsx` na placeholder (na konci wireupu se sem napojí HabitTrackerApp)**

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Groove</h1>
      <p className="mt-2 text-sm text-(--color-text-secondary)">
        Foundation OK — komponenty se napojí v posledním tasku.
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Spusť `npm run dev` v pozadí a ověř, že stránka funguje**

Run: `npm run dev` (nech běžet v pozadí během zbylých tasků)
Expected: dev server běží na `http://localhost:3000`, stránka ukazuje "Groove" nadpisem na krémovém pozadí. Žádné errory, žádné warningy v konzoli.

Run: `npx tsc --noEmit`
Expected: žádný output (typecheck projde).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: bootstrap design tokens, Space Grotesk font, Groove placeholder"
```

---

## Task 2: `lib/date.ts` — `todayKey` pure fn

Helper pro formátování data jako `YYYY-MM-DD` v lokální TZ. Žádné UTC konverze (jinak by se streak v UTC-N TZ resetoval o půlnoci UTC, ne o lokální půlnoci).

**Files:**
- Create: `lib/date.ts`

- [ ] **Step 1: Napiš `lib/date.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output. (Funkční ověření proběhne v UI smoke testu v Tasku 14 — `todayKey()` se objeví v `aria-label` pro screen reader a v Headeru jako formátované datum.)

- [ ] **Step 3: Commit**

```bash
git add lib/date.ts
git commit -m "feat: add lib/date.ts with toKey/todayKey helpers"
```

---

## Task 3: `lib/streak.ts` — `computeStreak` pure fn

Spočítá kolik po-sobě jdoucích dnů (od dneška dozadu) má habit splněno. Pokud dnes není done, počítá od včerejška (uživatel ještě může stihnout dnes).

**Files:**
- Create: `lib/streak.ts`

- [ ] **Step 1: Napiš `lib/streak.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck a manual review algoritmu**

Run: `npx tsc --noEmit`
Expected: žádný output.

Pak ručně projdi 5 scénářů na papíře / v hlavě:

| # | completions | today | expected |
|---|---|---|---|
| 1 | `{ 2026-05-01:t, 2026-04-30:t, 2026-04-29:t }` | 2026-05-01 | 3 |
| 2 | `{ 2026-04-30:t, 2026-04-29:t }` | 2026-05-01 | 2 (today not done → start from yesterday) |
| 3 | `{ 2026-05-01:t, 2026-04-30:t, 2026-04-28:t }` | 2026-05-01 | 2 (gap on 04-29 stops loop) |
| 4 | `{}` | 2026-05-01 | 0 |
| 5 | `{ 2026-05-01:t }` | 2026-05-01 | 1 |

Funkční ověření #1 a #4 proběhne v UI smoke testu v Tasku 14 (toggle / empty habit). Pokud algoritmus selže pro některý case, oprav `lib/streak.ts` před pokračováním.

- [ ] **Step 3: Commit**

```bash
git add lib/streak.ts
git commit -m "feat: add computeStreak pure fn"
```

---

## Task 4: `lib/storage.ts` — types + persistence

Typy pro Habit a StorageShape, plus load/save/clear funkce s try/catch fallbackem (Safari private mode, SSR).

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Napiš `lib/storage.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add storage types and load/save with fallback"
```

---

## Task 5: `hooks/useHabits.ts` — state + CRUD + undo

Custom hook, který drží list habits, hydratuje z `localStorage`, persistuje při změně, a spravuje undo timer pro delete.

**Files:**
- Create: `hooks/useHabits.ts`

- [ ] **Step 1: Napiš `hooks/useHabits.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add hooks/useHabits.ts
git commit -m "feat: add useHabits hook with CRUD, persistence, undo timer"
```

---

## Task 6: `components/Header.tsx`

Stateless header s "Groove" titulkem a dnešním datem v češtině.

**Files:**
- Create: `components/Header.tsx`

- [ ] **Step 1: Napiš `components/Header.tsx`**

```tsx
"use client";

type HeaderProps = {
  today: Date;
};

const FORMATTER = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "long",
});

export function Header({ today }: HeaderProps) {
  return (
    <header className="flex items-baseline justify-between mb-8">
      <h1 className="text-[32px] font-bold tracking-tight">Groove</h1>
      <span className="text-sm text-(--color-text-secondary)">
        {FORMATTER.format(today)}
      </span>
    </header>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "feat: add Header component"
```

---

## Task 7: `components/EmptyState.tsx`

Centered illustration, headline a CTA tlačítko když nejsou habits.

**Files:**
- Create: `components/EmptyState.tsx`

- [ ] **Step 1: Napiš `components/EmptyState.tsx`**

```tsx
"use client";

type EmptyStateProps = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <div
        className="w-20 h-20 rounded-full mb-6 flex items-center justify-center text-4xl"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
        }}
        aria-hidden="true"
      >
        🌱
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">
        Začni nový habit
      </h2>
      <p className="text-base text-(--color-text-secondary) mb-8 max-w-xs">
        Přidej první návyk a sleduj svůj streak den po dni.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="h-12 px-6 rounded-xl bg-(--color-primary) text-white font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Přidat habit
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/EmptyState.tsx
git commit -m "feat: add EmptyState component"
```

---

## Task 8: `components/KebabMenu.tsx`

Klikatelný `⋯` button s dropdownem. Dropdown se zavírá na klik mimo (`useEffect` + click listener) a na Escape. Volání `e.stopPropagation()` na trigger button, aby toggle karty neproběhl.

**Files:**
- Create: `components/KebabMenu.tsx`

- [ ] **Step 1: Napiš `components/KebabMenu.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

type MenuItem = {
  label: string;
  onClick: () => void;
  destructive?: boolean;
};

type KebabMenuProps = {
  items: MenuItem[];
  ariaLabel?: string;
};

export function KebabMenu({ items, ariaLabel = "Možnosti" }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleTriggerClick = (e: MouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const handleItemClick = (e: MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setOpen(false);
    item.onClick();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleTriggerClick}
        className="w-8 h-8 rounded-full flex items-center justify-center text-(--color-text-secondary) hover:bg-(--color-background) transition-colors"
      >
        <span className="text-xl leading-none">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 min-w-[160px] bg-white border border-(--color-border) rounded-xl shadow-(--shadow-medium) py-2 z-10"
        >
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              role="menuitem"
              onClick={(e) => handleItemClick(e, item)}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-(--color-background) ${
                item.destructive
                  ? "text-(--color-error)"
                  : "text-(--color-text-primary)"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/KebabMenu.tsx
git commit -m "feat: add KebabMenu with click-outside and Escape close"
```

---

## Task 9: `components/HabitCard.tsx`

Karta jednoho habitu. Klik kdekoli na kartě (kromě kebabu) toggluje. Border zoranžoví když je dnes splněno.

**Files:**
- Create: `components/HabitCard.tsx`

- [ ] **Step 1: Napiš `components/HabitCard.tsx`**

```tsx
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
      className={`bg-white rounded-3xl p-6 cursor-pointer select-none border-2 shadow-(--shadow-subtle) transition-[transform,box-shadow,border-color] hover:scale-[1.02] hover:shadow-(--shadow-medium) active:scale-[0.99] ${
        doneToday
          ? "border-(--color-primary)"
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
        <span className="text-[40px] font-bold leading-none tracking-tight text-(--color-secondary)">
          {streak}
        </span>
        <span className="text-sm text-(--color-text-secondary)">
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
          ? "bg-(--color-primary) border-(--color-primary) text-white"
          : "border-(--color-border) bg-white"
      }`}
    >
      {done && <span className="text-sm font-bold leading-none">✓</span>}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/HabitCard.tsx
git commit -m "feat: add HabitCard with toggle, streak display, kebab"
```

---

## Task 10: `components/AddHabitModal.tsx`

Overlay backdrop + modal panel s inputem. Submit přes Enter nebo button. ESC zavírá. Auto-focus na input při otevření.

**Files:**
- Create: `components/AddHabitModal.tsx`

- [ ] **Step 1: Napiš `components/AddHabitModal.tsx`**

```tsx
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
        className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-(--shadow-medium)"
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
          className="w-full h-12 px-4 rounded-xl border-2 border-(--color-border) bg-white focus:border-(--color-primary) outline-none transition-colors"
          maxLength={80}
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 rounded-xl text-(--color-text-secondary) font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-12 px-6 rounded-xl bg-(--color-primary) text-white font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
          >
            Uložit
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/AddHabitModal.tsx
git commit -m "feat: add AddHabitModal with focus management and ESC close"
```

---

## Task 11: `components/UndoToast.tsx`

Fixed bottom toast s textem a tlačítkem "Vrátit". Sám se nezavírá — parent volá `onDismiss` přes `setTimeout` (timer žije v `useHabits`).

**Files:**
- Create: `components/UndoToast.tsx`

- [ ] **Step 1: Napiš `components/UndoToast.tsx`**

```tsx
"use client";

type UndoToastProps = {
  message: string;
  onUndo: () => void;
};

export function UndoToast({ message, onUndo }: UndoToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-(--color-text-primary) text-white rounded-xl px-5 py-3 shadow-(--shadow-medium)"
      style={{ animation: "groove-toast-in 200ms ease-out" }}
    >
      <span className="text-sm">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="text-sm font-bold text-(--color-primary) transition-transform hover:scale-[1.05] active:scale-[0.95]"
      >
        Vrátit
      </button>
      <style>{`
        @keyframes groove-toast-in {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/UndoToast.tsx
git commit -m "feat: add UndoToast component"
```

---

## Task 12: `components/HabitTrackerApp.tsx`

Top-level klientská komponenta. Volá `useHabits`, drží lokální state pro modal-open, renderuje Header / list / EmptyState / Modal / Toast.

**Files:**
- Create: `components/HabitTrackerApp.tsx`

- [ ] **Step 1: Napiš `components/HabitTrackerApp.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useHabits } from "@/hooks/useHabits";
import { computeStreak } from "@/lib/streak";
import { todayKey } from "@/lib/date";
import { Header } from "./Header";
import { HabitCard } from "./HabitCard";
import { EmptyState } from "./EmptyState";
import { AddHabitModal } from "./AddHabitModal";
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
            className="mt-6 w-full h-12 rounded-xl bg-(--color-primary) text-white font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: žádný output.

- [ ] **Step 3: Commit**

```bash
git add components/HabitTrackerApp.tsx
git commit -m "feat: add HabitTrackerApp top-level component"
```

---

## Task 13: Wire up `app/page.tsx`

Nahradit placeholder z Tasku 1 finálním napojením na `HabitTrackerApp`.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Přepiš `app/page.tsx`**

```tsx
import { HabitTrackerApp } from "@/components/HabitTrackerApp";

export default function Home() {
  return <HabitTrackerApp />;
}
```

- [ ] **Step 2: Typecheck a build**

Run: `npx tsc --noEmit`
Expected: žádný output.

Run: `npm run build`
Expected: build projde bez chyb. Standard Next.js output:
```
✓ Compiled successfully
✓ Generating static pages
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire HabitTrackerApp into root page"
```

---

## Task 14: Manuální browser smoke test

Tohle není automatizovaný test, ale checklist k odbavení v prohlížeči (per spec rozhodnutí — žádný test runner).

**Files:** žádné

- [ ] **Step 1: Spusť dev server (pokud už neběží)**

Run: `npm run dev`
Open: `http://localhost:3000`

- [ ] **Step 2: Empty state checklist**

Otevři DevTools → Application → Local Storage → smaž klíč `groove.habits.v1`. Refresh stránky.

Ověř:
- Krémové pozadí, Space Grotesk font
- Header "Groove" + dnešní datum vpravo (formát "1. května" pro češtinu)
- Empty state s 🌱 v gradientním kruhu, headline "Začni nový habit", podtitulek a tlačítko "Přidat habit"
- Hover na tlačítku → mírné `scale(1.02)`

- [ ] **Step 3: Add habit checklist**

Klik na "Přidat habit":
- Modal se otevře s blur backdrop
- Input má focus
- Submit s prázdným polem → button "Uložit" disabled (40% opacity)
- Napiš "Ranní běh" + Enter → modal se zavře, karta se objeví
- Storage v DevTools obsahuje `groove.habits.v1` s array s jedním habit

- [ ] **Step 4: Toggle checklist**

Klik kdekoli na kartě "Ranní běh":
- Kruhový check vpravo se zaplní oranžovou + ✓
- Border karty zoranžoví
- Streak number "1" se objeví (vlevo dole, fialově)
- Klik znovu → odškrtne, border zmizí, streak "0"

- [ ] **Step 5: Multiple habits + kebab**

Přidej "Číst 30 min" a "Žádný cukr" (3 habits celkem).
- Vidíš 3 karty pod sebou s `gap-4`
- Klik na ⋯ vpravo nahoře karty "Číst 30 min" → dropdown s "Smazat"
- Klik mimo dropdown nebo Escape → dropdown zmizí
- Klik na ⋯ → klik na "Smazat":
  - Karta zmizí
  - Toast se objeví dole: "Smazáno · Číst 30 min · Vrátit"
- Klik "Vrátit" → karta se vrátí na původní pozici (mezi Ranní běh a Žádný cukr)

- [ ] **Step 6: Undo expiration**

Smaž habit → nech toast 5+ sekund → toast zmizí sám → habit je permanentně pryč.
Refresh → habit nezůstal.

- [ ] **Step 7: Persistence**

Přidej 2 habits, jeden zaškrtni, refresh stránky → habits jsou tam, zaškrtnutý zůstal zaškrtnutý, streak je správný.

- [ ] **Step 8: Build check**

Run: `npm run build`
Expected: build projde bez chyb a varování.

- [ ] **Step 9: Final commit (pokud je něco k commitu)**

```bash
git status
# Pokud nic, plán je hotový.
# Pokud něco, vytvoř commit s popisem opravy.
```

---

## Self-review proti specu

Po implementaci ověř proti `docs/superpowers/specs/2026-05-01-habit-tracker-design.md`:

- ✓ Vytvořit habit (Task 10 modal + Task 5 addHabit)
- ✓ Smazat habit s undo (Task 5 deleteHabit + Task 11 toast)
- ✓ Toggle dnešního stavu (Task 5 toggleHabit + Task 9 klik na kartu)
- ✓ Current streak (Task 3 computeStreak + Task 9 zobrazení)
- ✓ localStorage persistence (Task 4 storage + Task 5 useEffect)
- ✓ Empty state (Task 7)
- ✓ Modal pro Add (Task 10)
- ✓ Kebab pro Delete (Task 8)
- ✓ Klik karta = toggle, kebab stopPropagation (Task 8 + Task 9)
- ✓ Undo toast 5s (Task 5 timer + Task 11 view)
- ✓ Empty na hydration (Task 12 isHydrated branch)
- ✓ Strict streak: gap = reset (Task 3 algoritmus)
- ✓ "Dnes neudělaný" počítá od včerejška (Task 3 algoritmus)
- ✓ Designové tokeny (Task 1 globals.css)
- ✓ Space Grotesk font (Task 1 layout.tsx)
- ✓ Žádné externí libs nad rámec defaultu (žádný Zustand, framer-motion, sonner)
- ✓ Single `'use client'` strom (`HabitTrackerApp` ↓; `page.tsx` zůstává RSC)
