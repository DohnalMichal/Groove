# Habit Tracker — Design Spec

**Status:** approved
**Date:** 2026-05-01
**Project:** `skibidi-projekt`

## Účel

Portfolio-grade habit tracker s retro groovy vizuální identitou. Cíl je vizuálně silný showcase — nenajedná se nijaký reálný uživatel, žádný backend, žádné účty.

App name je **Groove** (zobrazeno v Headeru a v `<title>` metadat).

## Rozsah

### Cílový rozsah (in-scope)
- Vytvořit habit (název)
- Smazat habit (s undo toastem)
- Přepnout dnešní stav `splněno / nesplněno`
- Zobrazit current streak (kolik dní v řadě bylo splněno)
- Persistence v `localStorage` (přežije refresh)
- Empty state
- Modal pro Add
- Kebab menu pro Delete

### Mimo rozsah (explicitly out-of-scope)
- Editace názvu existujícího habitu
- Týdenní/měsíční přehledy, heatmapa, statistiky
- Best streak, total dní, průměrné completion %
- Kategorie / tagy
- Poznámky k záznamu
- Archivace
- Týdenní cíle ("3× týdně")
- Backend, auth, multi-device sync
- Push notifikace, reminders
- Tmavý režim
- Lokalizace (UI je v češtině, hard-coded)
- Test suite (kód je strukturován tak, aby se to dalo doplnit, ale runner se neinstaluje)

## Tech stack

- **Framework:** Next.js 16.2.4 (App Router)
- **React:** 19.2.4
- **Styling:** Tailwind v4 (`@import "tailwindcss"` v `globals.css`)
- **Persistence:** `localStorage`
- **Externí libs nad rámec defaultů:** žádné (vanilla — žádný Zustand, sonner, framer-motion, atd.)
- **Font:** Space Grotesk přes `next/font/google` (nahrazuje defaultní Geist v `app/layout.tsx`)

## Designový systém

(Plně definován v `AGENTS.md` na úrovni projektu, sem přepsán pro úplnost.)

### Barvy
| Token | Hex | Použití |
|---|---|---|
| Primary | `#E85D04` | hlavní akce, completion state, current-streak pill |
| Secondary | `#9D4EDD` | akcenty (alternativní streak pill, modal headline accent) |
| Background | `#FFF8F0` | `<body>` |
| Surface | `#FFFFFF` | karty, inputy, modal panel |
| Text Primary | `#1A1A1A` | hlavní text |
| Text Secondary | `#6B6B6B` | sekundární text, datum, "dní v řadě" |
| Border | `#E0D5C7` | subtle borders na inputech a kartách |
| Success | `#2D6A4F` | rezervováno (zatím nepoužito) |
| Warning | `#E85D04` | stejné jako primary |
| Error | `#D00000` | destructive akce v kebab menu, error states |

### Typografie
- Font: **Space Grotesk** (regular 400, medium 500, bold 700)
- Nadpisy: bold, `letter-spacing: -0.02em` (tight tracking)
- Tělo: regular
- Velikosti: `12 / 14 / 16 / 20 / 24 / 32 / 40 / 48 px`

### Spacing
Škála 4px: `4, 8, 12, 16, 24, 32, 48, 64`. V Tailwindu odpovídá `1, 2, 3, 4, 6, 8, 12, 16`.

### Radius
- Small: `4px` (Tailwind `rounded-sm` přepsaný)
- Medium: `12px` (`rounded-xl` ekvivalent)
- Large: `24px` (`rounded-3xl` ekvivalent)
- Full: `9999px` (pills, kruhový check)

### Stíny
- Subtle: `0 2px 4px rgba(232, 93, 4, 0.08)` — výchozí karty
- Medium: `0 4px 16px rgba(232, 93, 4, 0.12)` — hover, modal

### Komponenty (vzory)
- Tlačítka: výška `48px`, padding `16px / 24px`, `hover:scale-[1.02]`, `active:scale-[0.98]`
- Inputy: výška `48px`, padding `16px`, border `2px`, focus border = primary
- Karty: padding `24px`, medium shadow, large radius

### Pravidla
1. Žádné barvy mimo paletu
2. Vždy spacing scale
3. Interaktivní prvky dostávají scale-hover
4. Velkorysý whitespace

## Architektura

```
app/
  layout.tsx        # root layout, Space Grotesk font, globální CSS, body bg
  page.tsx          # tenký RSC wrapper, jen render <HabitTrackerApp />
  globals.css       # Tailwind import + design tokens jako CSS variables (theme inline)

components/
  HabitTrackerApp.tsx   # 'use client' — top-level state, drží habits + undo state
  Header.tsx            # název "Groove" + dnešní datum
  HabitCard.tsx         # jeden habit (název, streak, toggle, kebab)
  KebabMenu.tsx         # ⋯ button + dropdown s "Smazat"
  AddHabitModal.tsx     # modal s inputem na nový habit
  EmptyState.tsx        # když nejsou habits — illustration + CTA "Přidat první habit"
  UndoToast.tsx         # bottom-fixed toast s "Vrátit"

lib/
  storage.ts        # load/save habits do localStorage (s try/catch + version key)
  streak.ts         # computeStreak(habit, today) — pure fn
  date.ts           # todayKey() = 'YYYY-MM-DD' v lokální TZ

hooks/
  useHabits.ts      # custom hook: state + CRUD + toggle + persistence + undo
```

**Boundary rationale:**
- `lib/streak.ts` a `lib/date.ts` jsou pure funkce → testovatelné izolovaně, žádná závislost na React/DOM/storage
- `lib/storage.ts` je jediný entry-point k `localStorage` → snadná výměna implementace (SessionStorage, IndexedDB, fetch)
- `useHabits.ts` schovává perzistenci a undo logiku → komponenty jsou hloupé view, dostávají props a callbacky
- Jediný `'use client'` strom (`HabitTrackerApp` a vše pod ním); `app/page.tsx` zůstává RSC, takže Next.js 16 streaming funguje pro shell

## Komponenty: API

```ts
// components/HabitTrackerApp.tsx
// 'use client'
// Props: žádné. Volá useHabits() interně.

// components/Header.tsx
type HeaderProps = { today: Date }

// components/HabitCard.tsx
type HabitCardProps = {
  habit: Habit;
  doneToday: boolean;
  streak: number;
  onToggle: () => void;
  onDelete: () => void;
}

// components/KebabMenu.tsx
type KebabMenuProps = {
  items: Array<{ label: string; onClick: () => void; destructive?: boolean }>;
}

// components/AddHabitModal.tsx
type AddHabitModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

// components/EmptyState.tsx
type EmptyStateProps = { onAdd: () => void }

// components/UndoToast.tsx
type UndoToastProps = {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;  // volá se po expiraci timeru
}
```

## Data model

Typy žijí v `lib/storage.ts` (jeden entry point pro tvary perzistovaných dat).

```ts
type Habit = {
  id: string;            // crypto.randomUUID()
  name: string;
  createdAt: string;     // ISO 8601
  completions: Record<string, true>;  // { 'YYYY-MM-DD': true }
};

type StorageShape = {
  version: 1;
  habits: Habit[];
};

const STORAGE_KEY = 'groove.habits.v1';
```

## Algoritmus: computeStreak

```ts
// lib/streak.ts
function computeStreak(habit: Habit, today: Date): number {
  // Začneme s `today`. Pokud je dnes `done`, počítáme od dneška.
  // Pokud dnes není `done`, počítáme od včerejška (uživatel ještě může stihnout dnes).
  let cursor = new Date(today);
  if (!habit.completions[toKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let count = 0;
  while (habit.completions[toKey(cursor)]) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
```

`toKey(date)` formátuje `YYYY-MM-DD` v lokální TZ (žádné UTC posuny).

## Klíčové interakce

| Akce | UX | Storage effect |
|---|---|---|
| Klik kdekoli na kartě | `toggle(habit.id)` — `completions[todayKey]` se přepne | save() |
| Klik na ⋯ kebab | otevře dropdown, `e.stopPropagation()` na rodiče | — |
| Smazat z kebabu | habit zmizí z UI, undo toast 5s, po expiraci permanent | save() až po expiraci |
| Klik "Vrátit" v toastu | habit se vrátí na původní pozici | save() |
| Klik "+ Přidat habit" | otevře `AddHabitModal` | — |
| Submit modalu (Enter / "Uložit") | nová karta na začátku seznamu, modal se zavře | save() |
| Empty state CTA | otevře modal | — |

## Stav v `useHabits`

```ts
type UndoEntry = { habit: Habit; index: number; timeoutId: number };

const [habits, setHabits] = useState<Habit[]>([]);
const [pendingUndo, setPendingUndo] = useState<UndoEntry | null>(null);
const [isHydrated, setIsHydrated] = useState(false);

// Hydration: useEffect → load → setHabits → setIsHydrated(true)
// Persistence: useEffect na [habits] → save (až po hydration)
// CRUD: addHabit, deleteHabit (vytvoří undo entry), undoDelete, toggleHabit
```

## Edge cases

- **Hydration:** server render → neutrální skeleton (žádné karty, žádný empty state — jen Header). `useEffect` na clientu nahraje z `localStorage` → set `isHydrated`. Tím se zabrání flash empty state pro vraceného uživatele.
- **Půlnoc během session:** state nepřepočítává `setInterval`. Datum/streak se přehodnotí při dalším renderu (toggle, focus, refresh). Pro portfolio scope dostatečné.
- **localStorage nedostupný / hodí výjimku** (Safari private mode, server context): try/catch v `storage.ts`, fallback no-op (in-memory only). UX se neláme.
- **Duplicitní jména habits:** povoleno bez varování (uživatel si ví sám).
- **Prázdné / whitespace-only jméno v modalu:** "Uložit" je `disabled`. Trim na submit.
- **Velmi dlouhý název:** truncate v UI s `text-overflow: ellipsis`. Žádná hard limit délky.
- **Rapid undo race:** pokud uživatel smaže další habit než vyprší předchozí undo, předchozí undo permanentně commit (ne queue) — jen jeden toast může být live.

## Animace

Vše čistě CSS / Tailwind, žádný `framer-motion`.

| Element | Animace |
|---|---|
| Tlačítka | `transition-transform hover:scale-[1.02] active:scale-[0.98]` |
| Karty | `transition-shadow hover:shadow-medium` |
| Toggle check | `transition-colors duration-200` (fill primary) |
| Modal backdrop | `transition-opacity` (0 → 1) |
| Modal panel | `transition-[opacity,transform] scale-95 → scale-100` |
| Toast | slide-up `translate-y-full → 0`, dismiss naopak |
| Karta při delete | `transition-[opacity,max-height] opacity-0 max-h-0` |

## Layout

- Hlavní content je centered, `max-w-md` (~448px) pro mobile-first feel
- Padding: `px-6 py-8` na mobilu, `py-16` na desktop
- Karty stack vertikálně s `gap-4`
- Header sticky? **Ne** — pro minimum scope plain header nahoře
- Modal: full-viewport overlay, panel `max-w-md` centrovaný, padding `32px`
- Toast: `fixed bottom-6 left-1/2 -translate-x-1/2`

## Empty state

Když `habits.length === 0` (po hydration):
- Velký emoji nebo SVG illustration (např. 🌱 — nebo placeholder; konkrétní volba v implementaci)
- Headline: "Začni nový habit"
- Subtitle: "Přidej první návyk a sleduj svůj streak"
- CTA tlačítko: "Přidat habit" (primary)

## Strukturální předpoklady (Next.js 16 specifické)

- `app/page.tsx` zůstává server component — render `<HabitTrackerApp />`
- `'use client'` directiva jen v `components/HabitTrackerApp.tsx` (a kaskáduje se na child)
- Font: `next/font/google`'s `Space_Grotesk`, exportovaný jako CSS variable v root layoutu, použitý v `<html className={spaceGrotesk.variable} />` a referencovaný v `globals.css` jako `--font-sans`
- Žádné Server Actions, žádný Route Handler, žádný API route

## Mimo rozsah pro tento spec (záměrně odložené)

- Tmavý režim
- Real-time sync mezi tabs (`storage` event)
- Keyboard shortcuts
- Drag & drop reordering habits
- A11y audit (základní semantic HTML a ARIA pro modal/toast bude, ale ne plný audit)

## Acceptance criteria

1. `npm run dev` spustí dev server bez chyb a varování
2. Hlavní stránka renderuje s retro groovy paletou, Space Grotesk fontem, krémovým pozadím
3. Empty state je vidět při prázdném `localStorage`
4. Klik na "+ Přidat habit" otevře modal; submit přidá kartu, modal se zavře
5. Klik na kartu přepíná `done` state; karta dostane orange accent border
6. Streak number reflektuje skutečný count po-sobě jdoucích `done` dnů
7. Kebab → Smazat → karta zmizí, toast se objeví; klik Vrátit ji přidá zpět; bez kliku se po 5s permanentně smaže
8. Refresh stránky → habits zůstanou (pokud nebyly smazány a undo proběhl)
9. `next build` projde bez chyb
