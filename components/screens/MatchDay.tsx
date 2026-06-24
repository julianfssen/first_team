"use client";

import { useGame } from "@/lib/store/gameStore";
import { MatchScoreboard } from "@/components/game/Match";
import { StatBar } from "@/components/game/Bars";
import { Button, ActionBar, Card, SectionTitle } from "@/components/ui";

export function MatchDay() {
  const career = useGame((s) => s.career)!;
  const ctx = useGame((s) => s.matchContext)!;
  const log = useGame((s) => s.weekLog);
  const kickOff = useGame((s) => s.kickOff);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-4 pt-6 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Matchday</p>
        <h1 className="text-xl font-bold">Season {career.season} · Week {career.week}</h1>
      </div>

      <div className="scroll-area flex-1 space-y-4 px-4 py-2">
        <MatchScoreboard ctx={ctx} clubId={career.clubId} />

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Opponent strength</p>
            <p className="text-lg font-bold">{ctx.opponentStrength}</p>
          </Card>
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Your role</p>
            <p className="text-lg font-bold">{ctx.isStarter ? "Starter" : "Substitute"}</p>
          </Card>
        </div>

        <Card>
          <SectionTitle>Matchday Condition</SectionTitle>
          <div className="space-y-2">
            <StatBar label="Form" value={career.status.form} />
            <StatBar label="Fatigue" value={career.status.fatigue} invert />
            <StatBar label="Confidence" value={career.status.confidence} />
          </div>
        </Card>

        {log.length > 0 && (
          <Card>
            <SectionTitle>This Week</SectionTitle>
            {log.map((line, i) => (
              <p key={i} className="text-xs text-[var(--muted)]">
                • {line}
              </p>
            ))}
          </Card>
        )}
      </div>

      <ActionBar>
        <Button full onClick={kickOff}>
          Kick Off ⚽
        </Button>
      </ActionBar>
    </div>
  );
}
