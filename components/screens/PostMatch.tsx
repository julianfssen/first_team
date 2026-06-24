"use client";

import { useGame } from "@/lib/store/gameStore";
import { MatchScoreboard } from "@/components/game/Match";
import { HeadlineCard } from "@/components/game/Cards";
import { Button, ActionBar, Card, SectionTitle } from "@/components/ui";
import type { SeasonStats, PlayerStatus } from "@/lib/game/types";
import { STATUS_META, ratingColor } from "@/lib/ui/format";
import { useCountUp } from "@/lib/ui/useCountUp";

function RatingReveal({ rating }: { rating: number }) {
  const value = useCountUp(rating, 900);
  const color = ratingColor(rating);
  return (
    <div className="flex flex-col items-center py-1">
      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Your rating</span>
      <span className="text-5xl font-black tabular-nums" style={{ color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

const STAT_LABELS: Partial<Record<keyof SeasonStats, string>> = {
  goals: "Goals", assists: "Assists", shots: "Shots", keyPasses: "Key Passes",
  saves: "Saves", penaltySaves: "Pen. Saves", cleanSheets: "Clean Sheet",
  tackles: "Tackles", interceptions: "Interceptions", blocks: "Blocks",
  clearances: "Clearances", aerialDuelsWon: "Aerials Won", passesCompleted: "Passes",
  chancesCreated: "Chances", dribblesCompleted: "Dribbles", crossesCompleted: "Crosses",
  yellowCards: "Yellow", redCards: "Red", errorsLeadingToGoal: "Errors", goalsConceded: "Conceded",
};

export function PostMatch() {
  const career = useGame((s) => s.career)!;
  const result = useGame((s) => s.matchResult)!;
  const cont = useGame((s) => s.continueFromPostMatch);

  const statEntries = (Object.keys(STAT_LABELS) as (keyof SeasonStats)[])
    .map((k) => ({ k, v: result.statDeltas[k] ?? 0 }))
    .filter((e) => e.v && e.v !== 0);

  const statusEntries = (Object.keys(result.statusDeltas) as (keyof PlayerStatus)[])
    .map((k) => ({ k, v: Math.round(result.statusDeltas[k] ?? 0) }))
    .filter((e) => e.v && Math.abs(e.v) >= 1 && k_visible(e.k));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-4 pt-5 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Full Time</p>
      </div>

      <div className="scroll-area flex-1 space-y-4 px-4 py-2">
        <MatchScoreboard
          ctx={result.context}
          teamScore={result.teamScore}
          opponentScore={result.opponentScore}
          clubId={career.clubId}
        />

        <RatingReveal rating={result.rating} />

        {(result.subbedOff || result.cameOnAsSub) && (
          <p className="text-center text-xs text-[var(--muted)]">
            {result.subbedOff
              ? `🔻 Substituted — you played ${result.minutesPlayed}'`
              : `🔺 Came off the bench — ${result.minutesPlayed}' played`}
          </p>
        )}

        <HeadlineCard headline={result.headline} />

        {result.momentOfMatch && (
          <Card className="border-[var(--accent)]/40">
            <SectionTitle>⭐ Moment of the Match</SectionTitle>
            <p className="text-[15px] font-medium text-[var(--text)]/90">{result.momentOfMatch}</p>
          </Card>
        )}

        {statEntries.length > 0 && (
          <Card>
            <SectionTitle>Your Match</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {statEntries.map(({ k, v }) => (
                <span
                  key={k}
                  className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-sm font-medium"
                >
                  {STAT_LABELS[k]} <span className="font-bold tabular-nums">{v}</span>
                </span>
              ))}
            </div>
          </Card>
        )}

        {statusEntries.length > 0 && (
          <Card>
            <SectionTitle>Knock-on Effects</SectionTitle>
            <div className="grid grid-cols-2 gap-1.5">
              {statusEntries.map(({ k, v }) => {
                const good = STATUS_META[k].invert ? v < 0 : v > 0;
                return (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">{STATUS_META[k].label}</span>
                    <span style={{ color: good ? "var(--accent)" : "var(--danger)" }} className="font-semibold tabular-nums">
                      {v > 0 ? "+" : ""}
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {result.injury && (
          <Card className="border-[var(--danger)]/40 bg-[var(--danger)]/10">
            <p className="text-sm font-semibold text-[var(--danger)]">
              🩹 {result.injury.name} — out ~{result.injury.weeksOut} weeks
            </p>
          </Card>
        )}
      </div>

      <ActionBar>
        <Button full onClick={cont}>
          Continue
        </Button>
      </ActionBar>
    </div>
  );
}

function k_visible(k: keyof PlayerStatus): boolean {
  return k !== "fatigue"; // fatigue always rises post-match; not interesting to surface here
}
