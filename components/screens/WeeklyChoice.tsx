"use client";

import { useGame } from "@/lib/store/gameStore";
import { availableWeeklyChoices } from "@/lib/game/weeklyChoices";
import { ChoiceCard } from "@/components/game/Cards";
import { StatBar } from "@/components/game/Bars";
import { ScreenHeader } from "@/components/ui";

export function WeeklyChoice() {
  const career = useGame((s) => s.career)!;
  const chooseWeekly = useGame((s) => s.chooseWeekly);
  const setScreen = useGame((s) => s.setScreen);

  const choices = availableWeeklyChoices(career);
  const injured = !!career.injury && career.injury.weeksRemaining > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader
        title="Weekly Focus"
        subtitle={`Season ${career.season} · Week ${career.week}`}
        right={
          <button onClick={() => setScreen("HUB")} className="text-sm text-[var(--muted)]">
            Back
          </button>
        }
      />

      <div className="space-y-2 px-4 pb-2">
        <StatBar label="Fatigue" value={career.status.fatigue} invert />
        <StatBar label="Form" value={career.status.form} />
        {injured && (
          <p className="rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
            You&apos;re injured — training is reduced and you&apos;ll miss this match.
          </p>
        )}
      </div>

      <div className="scroll-area flex-1 space-y-2 px-4 py-3">
        {choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            label={choice.label}
            description={choice.description}
            onClick={() => chooseWeekly(choice.id)}
          />
        ))}
      </div>
    </div>
  );
}
