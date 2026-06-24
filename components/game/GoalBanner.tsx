"use client";

/** A transient celebratory overlay flashed on goals / big saves. */
export function GoalBanner({ text, color }: { text: string; color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-28">
      <div
        className="animate-pop rounded-2xl px-8 py-4 text-4xl font-black tracking-tight"
        style={{ color, textShadow: `0 0 30px ${color}` }}
      >
        {text}
      </div>
    </div>
  );
}
