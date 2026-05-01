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
      <p className="text-base text-text-secondary mb-8 max-w-xs">
        Přidej první návyk a sleduj svůj streak den po dni.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="h-12 px-6 rounded-xl bg-primary text-white font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Přidat habit
      </button>
    </div>
  );
}
