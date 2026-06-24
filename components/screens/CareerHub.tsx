"use client";

import { useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import type { Career } from "@/lib/game/types";
import { PlayerCard } from "@/components/game/PlayerCard";
import { AttributeGrid, StatusGrid } from "@/components/game/Bars";
import { TraitBadge } from "@/components/game/Cards";
import { Button, Card, SectionTitle, ActionBar } from "@/components/ui";
import { ratingColor } from "@/lib/ui/format";

type StatItem = { label: string; value: string };

function seasonStatItems(career: Career): StatItem[] {
  const s = career.seasonStats;
  const fam = career.positionFamily;
  const base: StatItem[] = [
    { label: "Apps", value: `${s.appearances}` },
    { label: "Avg", value: s.averageRating ? s.averageRating.toFixed(2) : "—" },
  ];
  if (fam === "GOALKEEPER") {
    base.push({ label: "Clean Sheets", value: `${s.cleanSheets}` }, { label: "Saves", value: `${s.saves}` });
  } else if (fam === "CENTRE_BACK" || fam === "FULLBACK" || fam === "WINGBACK") {
    base.push({ label: "Tackles", value: `${s.tackles}` }, { label: "Clean Sheets", value: `${s.cleanSheets}` });
  } else {
    base.push({ label: "Goals", value: `${s.goals}` }, { label: "Assists", value: `${s.assists}` });
  }
  return base;
}

export function CareerHub() {
  const career = useGame((s) => s.career)!;
  const startWeek = useGame((s) => s.startWeek);
  const setScreen = useGame((s) => s.setScreen);
  const saveManual = useGame((s) => s.saveManual);
  const retire = useGame((s) => s.retire);

  const [savedAt, setSavedAt] = useState(false);
  const [confirmRetire, setConfirmRetire] = useState(false);

  const unlocked = career.traits.filter((t) => t.unlocked).map((t) => t.traitId);
  const isKeeper = career.positionFamily === "GOALKEEPER";
  const stats = seasonStatItems(career);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <h1 className="text-lg font-bold">Career Hub</h1>
        <div className="flex gap-3 text-sm text-[var(--muted)]">
          <button onClick={() => setScreen("TIMELINE")}>Timeline</button>
          <button
            onClick={() => {
              saveManual(1);
              setSavedAt(true);
              setTimeout(() => setSavedAt(false), 1500);
            }}
          >
            {savedAt ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>

      <div className="scroll-area flex-1 space-y-4 px-4 pb-4">
        <PlayerCard career={career} />

        {career.injury && (
          <Card className="border-[var(--danger)]/40 bg-[var(--danger)]/10">
            <p className="text-sm font-semibold text-[var(--danger)]">
              🩹 Injured: {career.injury.name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {career.injury.weeksRemaining} week(s) until return.
            </p>
          </Card>
        )}

        <Card>
          <SectionTitle>This Season</SectionTitle>
          <div className="grid grid-cols-4 gap-2 text-center">
            {stats.map((st) => (
              <div key={st.label}>
                <p
                  className="text-xl font-bold tabular-nums"
                  style={st.label === "Avg" ? { color: ratingColor(career.seasonStats.averageRating || 6) } : undefined}
                >
                  {st.value}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{st.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Status</SectionTitle>
          <StatusGrid status={career.status} />
        </Card>

        <Card>
          <SectionTitle>Attributes</SectionTitle>
          <AttributeGrid attributes={career.attributes} isKeeper={isKeeper} />
        </Card>

        {unlocked.length > 0 && (
          <Card>
            <SectionTitle>Traits</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {unlocked.map((id) => (
                <TraitBadge key={id} id={id} />
              ))}
            </div>
          </Card>
        )}

        <div className="pt-1">
          {confirmRetire ? (
            <Card className="space-y-3 border-[var(--danger)]/40">
              <p className="text-sm">Retire now and end your career? This cannot be undone.</p>
              <div className="flex gap-2">
                <Button variant="danger" full onClick={() => retire("PLAYER_CHOICE")}>
                  Confirm Retire
                </Button>
                <Button variant="ghost" full onClick={() => setConfirmRetire(false)}>
                  Keep Playing
                </Button>
              </div>
            </Card>
          ) : (
            <button
              onClick={() => setConfirmRetire(true)}
              className="w-full py-2 text-center text-xs text-[var(--muted)] underline-offset-2 hover:underline"
            >
              Retire from football
            </button>
          )}
        </div>
      </div>

      <ActionBar>
        <Button full onClick={startWeek}>
          Continue → Week {career.week}
        </Button>
      </ActionBar>
    </div>
  );
}
