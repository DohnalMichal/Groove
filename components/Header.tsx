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
