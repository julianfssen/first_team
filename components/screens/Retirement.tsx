"use client";

import { useGame } from "@/lib/store/gameStore";
import { Button, Card, SectionTitle, Pill, ActionBar } from "@/components/ui";
import { regionName } from "@/lib/ui/format";
import { RETIREMENT_REASON_LABEL as REASON } from "@/lib/game/retirementEngine";
import type { SeasonStats } from "@/lib/game/types";

const TOTAL_LABELS: { k: keyof SeasonStats; label: string }[] = [
  { k: "appearances", label: "Apps" },
  { k: "goals", label: "Goals" },
  { k: "assists", label: "Assists" },
  { k: "cleanSheets", label: "Clean Sheets" },
  { k: "saves", label: "Saves" },
  { k: "tackles", label: "Tackles" },
  { k: "interceptions", label: "Interceptions" },
  { k: "chancesCreated", label: "Chances" },
];

export function Retirement() {
  const career = useGame((s) => s.career)!;
  const setScreen = useGame((s) => s.setScreen);
  const recap = career.retirementRecap;

  if (!recap) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Button onClick={() => setScreen("LANDING")}>Back to Menu</Button>
      </div>
    );
  }

  const totals = recap.careerStats;
  const shownTotals = TOTAL_LABELS.filter(({ k }) => (totals[k] ?? 0) > 0).slice(0, 6);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-6 pt-10 pb-4 text-center">
        <div className="mb-2 text-4xl">🎖️</div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          {REASON[recap.reason]}
        </p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-[var(--accent)]">
          {recap.legacyTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{career.player.name} · {recap.careerSpan}</p>
      </div>

      <div className="scroll-area flex-1 space-y-4 px-4 py-2">
        <Card>
          <SectionTitle>Career Totals</SectionTitle>
          <div className="grid grid-cols-3 gap-3 text-center">
            {shownTotals.map(({ k, label }) => (
              <div key={k}>
                <p className="text-2xl font-bold tabular-nums">{totals[k]}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p>
              </div>
            ))}
            <div>
              <p className="text-2xl font-bold tabular-nums">{totals.averageRating.toFixed(2)}</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Avg Rating</p>
            </div>
          </div>
        </Card>

        {(recap.internationalStats.caps > 0) && (
          <Card>
            <SectionTitle>International</SectionTitle>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold tabular-nums">{recap.internationalStats.caps}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Caps</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{recap.internationalStats.goals}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Goals</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{recap.internationalStats.tournamentsPlayed}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Tournaments</p>
              </div>
            </div>
          </Card>
        )}

        {recap.trophies.length > 0 && (
          <Card>
            <SectionTitle>Trophies & Awards</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {[...recap.trophies, ...recap.awards].map((t, i) => (
                <span key={i} className="rounded-lg bg-[var(--warn)]/15 px-2.5 py-1 text-sm font-semibold text-[var(--warn)]">
                  🏆 {t}
                </span>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle>The Journey</SectionTitle>
          <p className="text-sm text-[var(--muted)]">Clubs</p>
          <p className="mb-2 text-sm">{recap.clubsPlayedFor.join(" · ")}</p>
          <p className="text-sm text-[var(--muted)]">Regions</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {recap.regionsPlayedIn.map((r) => (
              <Pill key={r}>{regionName(r)}</Pill>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Legacy</SectionTitle>
          <div className="space-y-1.5 text-sm">
            {recap.bestSeason && (
              <p>
                <span className="text-[var(--muted)]">Best season: </span>
                Season {recap.bestSeason.season} ({recap.bestSeason.stats.averageRating.toFixed(2)} avg) at{" "}
                {recap.bestSeason.clubName}
              </p>
            )}
            <p>
              <span className="text-[var(--muted)]">Peak market value: </span>
              {recap.highestMarketValue}
            </p>
            <p>
              <span className="text-[var(--muted)]">Final reputation: </span>
              {recap.finalReputation}
            </p>
            {recap.iconicMoment && (
              <p>
                <span className="text-[var(--muted)]">Iconic moment: </span>
                {recap.iconicMoment}
              </p>
            )}
          </div>
        </Card>
      </div>

      <ActionBar>
        <Button full onClick={() => setScreen("LANDING")}>
          New Career
        </Button>
      </ActionBar>
    </div>
  );
}
