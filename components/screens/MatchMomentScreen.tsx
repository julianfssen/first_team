"use client";

import { useGame } from "@/lib/store/gameStore";
import { MatchMomentCard } from "@/components/game/Match";
import { MomentResultBanner } from "@/components/game/Cards";
import { Button, ActionBar, Pill } from "@/components/ui";
import { pretty } from "@/lib/ui/format";

export function MatchMomentScreen() {
  const ctx = useGame((s) => s.matchContext)!;
  const moments = useGame((s) => s.moments);
  const index = useGame((s) => s.momentIndex);
  const revealed = useGame((s) => s.revealedResult);
  const resolveMoment = useGame((s) => s.resolveMoment);
  const nextMoment = useGame((s) => s.nextMoment);

  const moment = moments[index];
  const isLast = index === moments.length - 1;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <Pill color="var(--accent)">{pretty(ctx.competition)}</Pill>
        <span className="truncate text-sm text-[var(--muted)]">vs {ctx.opponentName}</span>
      </div>

      <div className="scroll-area flex-1 px-4 py-2">
        {revealed ? (
          <MomentResultBanner result={revealed} />
        ) : (
          <MatchMomentCard
            moment={moment}
            onChoose={resolveMoment}
            index={index}
            total={moments.length}
          />
        )}
      </div>

      {revealed && (
        <ActionBar>
          <Button full onClick={nextMoment}>
            {isLast ? "Final Whistle" : "Play On"}
          </Button>
        </ActionBar>
      )}
    </div>
  );
}
