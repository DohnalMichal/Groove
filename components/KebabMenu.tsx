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
        className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-background transition-colors"
      >
        <span className="text-xl leading-none">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 min-w-[160px] bg-white border border-border rounded-xl shadow-medium py-2 z-10"
        >
          {items.map((item) => (
            <button
              type="button"
              key={item.label}
              role="menuitem"
              onClick={(e) => handleItemClick(e, item)}
              className={`block w-full text-left px-4 py-2 text-sm transition-colors hover:bg-background ${
                item.destructive
                  ? "text-error"
                  : "text-text-primary"
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
