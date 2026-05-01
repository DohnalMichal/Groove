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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-text-primary text-white rounded-xl px-5 py-3 shadow-medium"
      style={{ animation: "groove-toast-in 200ms ease-out" }}
    >
      <span className="text-sm">{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="text-sm font-bold text-primary transition-transform hover:scale-[1.05] active:scale-[0.95]"
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
