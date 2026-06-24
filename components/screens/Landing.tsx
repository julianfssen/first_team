"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import { listSaves } from "@/lib/game/saveEngine";
import type { SaveSlot } from "@/lib/game/types";
import { Button } from "@/components/ui";
import { POSITION_LABEL } from "@/lib/ui/format";

export function Landing() {
  const setScreen = useGame((s) => s.setScreen);
  const loadSlot = useGame((s) => s.loadSlot);
  const [saves, setSaves] = useState<SaveSlot[]>([]);

  useEffect(() => {
    // Saves live in localStorage, so they can only be read after mount (the
    // server render has no access). This deliberately runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaves(listSaves());
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col px-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-3 text-5xl">⚽</div>
        <h1 className="text-4xl font-black tracking-tight">
          FIRST <span className="text-[var(--accent)]">TEAM</span>
        </h1>
        <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
          Create a 16-year-old footballer. Live their whole career — training, match moments,
          transfers across the world, and a legacy to retire on.
        </p>
      </div>

      <div className="space-y-3 pb-10">
        <Button full onClick={() => setScreen("CREATE")}>
          New Career
        </Button>

        {saves.length > 0 && (
          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Continue
            </p>
            {saves.map((slot) => (
              <button
                key={slot.id}
                onClick={() => loadSlot(slot.id)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition hover:border-[var(--accent)]/60"
              >
                <div>
                  <p className="font-semibold">{slot.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {POSITION_LABEL[slot.career.position]} · Age {slot.career.age} · Season{" "}
                    {slot.career.season}
                    {slot.career.retired ? " · Retired" : ""}
                  </p>
                </div>
                <span className="text-[var(--accent)]">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
