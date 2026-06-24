"use client";

import { useGame } from "@/lib/store/gameStore";
import { Button, ActionBar, Card, SectionTitle, Pill } from "@/components/ui";
import { PHASE_LABEL } from "@/lib/ui/format";

export function SeasonRecap() {
  const recap = useGame((s) => s.seasonRecap)!;
  const cont = useGame((s) => s.continueFromSeasonRecap);
  const s = recap.stats;

  const headline: { label: string; value: string }[] = [
    { label: "Apps", value: `${s.appearances}` },
    { label: "Goals", value: `${s.goals}` },
    { label: "Assists", value: `${s.assists}` },
    { label: "Avg Rating", value: s.averageRating ? s.averageRating.toFixed(2) : "—" },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-4 pt-6 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Season {recap.season} Complete
        </p>
        <h1 className="text-2xl font-bold">{recap.clubName}</h1>
        <div className="mt-2 flex justify-center gap-2">
          <Pill color="#a3e635">Now age {recap.age}</Pill>
          <Pill color="var(--accent)">{PHASE_LABEL[recap.newPhase]}</Pill>
        </div>
      </div>

      <div className="scroll-area flex-1 space-y-4 px-4 py-2">
        <Card>
          <div className="grid grid-cols-4 gap-2 text-center">
            {headline.map((h) => (
              <div key={h.label}>
                <p className="text-xl font-bold tabular-nums">{h.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{h.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {recap.awards.length > 0 && (
          <Card>
            <SectionTitle>Awards</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {recap.awards.map((a) => (
                <span key={a} className="rounded-lg bg-[var(--warn)]/15 px-2.5 py-1 text-sm font-semibold text-[var(--warn)]">
                  🏆 {a}
                </span>
              ))}
            </div>
          </Card>
        )}

        {recap.highlights.length > 0 && (
          <Card>
            <SectionTitle>Highlights</SectionTitle>
            <div className="space-y-1.5">
              {recap.highlights.map((h, i) => (
                <p key={i} className="text-sm text-[var(--text)]/90">• {h}</p>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle>End of Season — Aging</SectionTitle>
          {recap.agingNotes.length > 0 ? (
            <div className="space-y-1.5">
              {recap.agingNotes.map((n, i) => {
                const decline = n.includes("declined");
                return (
                  <p key={i} className="text-sm" style={{ color: decline ? "var(--danger)" : "var(--accent)" }}>
                    {decline ? "▼" : "▲"} {n}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">You held your level this year.</p>
          )}
          <p className="mt-3 text-sm text-[var(--muted)]">
            Market value: <span className="font-bold text-[var(--text)]">{recap.marketValue}</span>
          </p>
        </Card>
      </div>

      <ActionBar>
        <Button full onClick={cont}>
          Into the Next Chapter →
        </Button>
      </ActionBar>
    </div>
  );
}
