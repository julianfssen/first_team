"use client";

import { useRef } from "react";
import type { SkillChallenge, SkillInput } from "@/lib/game/types";
import { Button, cx } from "@/components/ui";
import { clamp } from "@/lib/game/util";

export function SkillChallengeView({
  challenge,
  onComplete,
  onCancel,
}: {
  challenge: SkillChallenge;
  onComplete: (input: SkillInput) => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-pop rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface-2)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--accent)]">{challenge.label}</p>
        <button onClick={onCancel} className="text-xs text-[var(--muted)]">
          ← back
        </button>
      </div>
      <p className="mb-3 text-xs text-[var(--muted)]">{challenge.prompt}</p>
      {challenge.kind === "AIM" ? (
        <Aim challenge={challenge} onComplete={onComplete} />
      ) : (
        <Timing challenge={challenge} onComplete={onComplete} />
      )}
    </div>
  );
}

function Aim({ challenge, onComplete }: { challenge: SkillChallenge; onComplete: (input: SkillInput) => void }) {
  const zones = challenge.zones ?? 5;
  const covered = new Set(challenge.keeperZones ?? []);
  return (
    <div>
      {/* The goal frame */}
      <div className="rounded-md border-2 border-[var(--border)] border-b-0 p-1.5">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${zones}, 1fr)` }}>
          {Array.from({ length: zones }).map((_, i) => {
            const isCovered = covered.has(i);
            const corner = i === 0 || i === zones - 1;
            return (
              <button
                key={i}
                onClick={() => onComplete({ value: i })}
                className={cx(
                  "flex h-16 items-center justify-center rounded-md border text-2xl transition active:scale-95",
                  isCovered
                    ? "border-[var(--danger)]/50 bg-[var(--danger)]/15"
                    : "border-[var(--accent)]/50 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/25",
                )}
                aria-label={isCovered ? "keeper covering" : corner ? "corner" : "central"}
              >
                {isCovered ? "🧤" : corner ? "◎" : "○"}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-[var(--muted)]">
        Tap a target · 🧤 keeper · ◎ corner (best) · ○ central
      </p>
    </div>
  );
}

function Timing({ challenge, onComplete }: { challenge: SkillChallenge; onComplete: (input: SkillInput) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const center = challenge.sweetCenter ?? 0.5;
  const width = challenge.sweetWidth ?? 0.25;
  const greenLeft = clamp(center - width / 2, 0, 1) * 100;
  const greenW = clamp(width, 0, 1) * 100;

  function stop() {
    const track = trackRef.current;
    const marker = markerRef.current;
    if (!track || !marker) {
      onComplete({ value: 0.5 });
      return;
    }
    const t = track.getBoundingClientRect();
    const m = marker.getBoundingClientRect();
    const pos = clamp((m.left + m.width / 2 - t.left) / t.width, 0, 1);
    onComplete({ value: pos });
  }

  return (
    <div>
      <div ref={trackRef} className="relative mb-3 h-9 overflow-hidden rounded-md bg-[var(--surface)]">
        <div
          className="absolute top-0 h-full bg-[var(--accent)]/30"
          style={{ left: `${greenLeft}%`, width: `${greenW}%` }}
        />
        <div ref={markerRef} className="skill-marker absolute top-0 -ml-[2px] h-full w-1 rounded bg-[var(--text)]" />
      </div>
      <Button full onClick={stop}>
        STOP
      </Button>
    </div>
  );
}
