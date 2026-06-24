"use client";

import { useGame } from "@/lib/store/gameStore";
import { ScreenHeader } from "@/components/ui";
import type { TimelineEntryType } from "@/lib/game/types";

const ICON: Record<TimelineEntryType, string> = {
  DEBUT: "🎬",
  FIRST_GOAL: "⚽",
  TRANSFER: "✈️",
  INJURY: "🩹",
  TROPHY: "🏆",
  CALL_UP: "🌍",
  AWARD: "🥇",
  POSITION_CHANGE: "🔄",
  TRAIT_UNLOCKED: "⭐",
  MILESTONE: "📌",
  RETIREMENT: "🎖️",
};

export function CareerTimeline() {
  const career = useGame((s) => s.career)!;
  const setScreen = useGame((s) => s.setScreen);
  const entries = [...career.timeline].reverse();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader
        title="Career Timeline"
        subtitle={`${entries.length} moments`}
        right={
          <button onClick={() => setScreen("HUB")} className="text-sm text-[var(--muted)]">
            Back
          </button>
        }
      />
      <div className="scroll-area flex-1 px-4 py-2">
        <div className="relative ml-3 border-l border-[var(--border)] pl-5">
          {entries.map((e) => (
            <div key={e.id} className="relative pb-5">
              <span className="absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs">
                {ICON[e.type]}
              </span>
              <p className="text-sm">{e.text}</p>
              <p className="text-[11px] text-[var(--muted)]">
                Age {e.age} · Season {e.season}
              </p>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Your story is just beginning.</p>
          )}
        </div>
      </div>
    </div>
  );
}
