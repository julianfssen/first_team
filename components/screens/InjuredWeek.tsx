"use client";

import { useGame } from "@/lib/store/gameStore";
import { Button, ActionBar } from "@/components/ui";

export function InjuredWeek() {
  const career = useGame((s) => s.career)!;
  const log = useGame((s) => s.weekLog);
  const cont = useGame((s) => s.continueFromInjured);
  const injury = career.injury;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 text-5xl">🩹</div>
        <h1 className="text-2xl font-bold">On the Treatment Table</h1>
        <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
          {injury
            ? `You're sidelined with a ${injury.name}. ${injury.weeksRemaining} week(s) until you're back.`
            : "You missed this week's match."}
        </p>
        {log.length > 0 && (
          <div className="mt-5 w-full max-w-xs space-y-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left">
            {log.map((line, i) => (
              <p key={i} className="text-xs text-[var(--muted)]">
                • {line}
              </p>
            ))}
          </div>
        )}
      </div>
      <ActionBar>
        <Button full onClick={cont}>
          Advance Week
        </Button>
      </ActionBar>
    </div>
  );
}
