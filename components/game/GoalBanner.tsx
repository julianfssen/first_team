"use client";

import { useMemo } from "react";
import { motion } from "motion/react";

/** A transient celebratory overlay (+ particle burst) flashed on goals / big saves. */
export function GoalBanner({ text, color }: { text: string; color: string }) {
  // Fixed once per mount (the banner is keyed by beat id, so it replays per goal).
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 60 + (i % 4) * 22;
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-28">
      <div className="relative">
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
        <div
          className="animate-pop rounded-2xl px-8 py-4 text-4xl font-black tracking-tight"
          style={{ color, textShadow: `0 0 30px ${color}` }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
