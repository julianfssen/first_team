"use client";

import { useMemo, useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import type { Career, MatchContext, MatchState, SkillInput } from "@/lib/game/types";
import { getPassage } from "@/lib/game/passages";
import { buildSkillChallenge, scoreSkillInput, tierFromAccuracy } from "@/lib/game/skillEngine";
import { SkillChallengeView } from "@/components/game/Skill";
import { Button, Card, ScreenHeader, cx } from "@/components/ui";
import { ratingColor } from "@/lib/ui/format";

const QUALITIES = [
  { id: "me", label: "My player", value: null },
  { id: "poor", label: "Poor (40)", value: 40 },
  { id: "avg", label: "Average (62)", value: 62 },
  { id: "elite", label: "Elite (88)", value: 88 },
] as const;

type Quality = (typeof QUALITIES)[number]["id"];

const SHOT_PASSAGE = "st-through-on-goal";
const SHOT_CHOICE = "shoot-low";

function testCareer(base: Career, finishing: number | null): Career {
  if (finishing == null) return base;
  const c = structuredClone(base);
  c.attributes.finishing = finishing;
  c.attributes.composure = finishing;
  c.attributes.positioning = finishing;
  return c;
}

function practiceState(career: Career, n: number): MatchState {
  const ctx: MatchContext = {
    matchId: `practice-${n}`,
    season: 1,
    week: 1,
    competition: "LEAGUE",
    importance: "MEDIUM",
    opponentName: "Practice XI",
    opponentStrength: 60,
    homeAway: "HOME",
    isStarter: true,
  };
  return {
    matchId: ctx.matchId,
    context: ctx,
    minute: 45,
    teamScore: 0,
    oppScore: 0,
    momentum: 0,
    stamina: 75,
    matchConfidence: 0,
    onPitch: true,
    cameOnAsSub: false,
    exitMinute: null,
    plan: [],
    queueIndex: 0,
    momentResults: [],
    pendingPassage: {
      template: getPassage(SHOT_PASSAGE)!,
      stageIndex: 0,
      importance: "MEDIUM",
      minute: 45,
      slotIndex: 1,
    },
    finished: false,
  };
}

type Result = {
  goal: boolean;
  tier: string;
  accuracy: number;
  shotType: string;
  input: SkillInput;
};

export function Practice() {
  const career = useGame((s) => s.career)!;
  const setScreen = useGame((s) => s.setScreen);

  const [quality, setQuality] = useState<Quality>("me");
  const [n, setN] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [tally, setTally] = useState({ goals: 0, shots: 0 });

  const finishing = QUALITIES.find((q) => q.id === quality)!.value;
  const c = useMemo(() => testCareer(career, finishing), [career, finishing]);
  const challenge = useMemo(
    () => buildSkillChallenge(c, practiceState(c, n), SHOT_CHOICE)!,
    [c, n],
  );

  function onComplete(input: SkillInput) {
    const accuracy = scoreSkillInput(challenge, input);
    const tier = tierFromAccuracy(accuracy);
    const goal = tier === "GREAT" || tier === "GOOD";
    setResult({ goal, tier, accuracy, shotType: challenge.shotType ?? "NORMAL", input });
    setTally((t) => ({ goals: t.goals + (goal ? 1 : 0), shots: t.shots + 1 }));
  }

  function nextShot() {
    setResult(null);
    setN((v) => v + 1);
  }

  function reset(q: Quality) {
    setQuality(q);
    setResult(null);
    setN((v) => v + 1);
    setTally({ goals: 0, shots: 0 });
  }

  const pct = tally.shots > 0 ? Math.round((tally.goals / tally.shots) * 100) : 0;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScreenHeader
        title="Shot Practice"
        subtitle="Debug the shot feel — no match needed"
        right={
          <button onClick={() => setScreen("HUB")} className="text-sm text-[var(--muted)]">
            Back
          </button>
        }
      />

      <div className="scroll-area flex-1 space-y-3 px-4 py-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Test as finisher
          </p>
          <div className="flex flex-wrap gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q.id}
                onClick={() => reset(q.id)}
                className={cx(
                  "rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-95",
                  quality === q.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)]",
                )}
              >
                {q.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            Finishing {Math.round(c.attributes.finishing)} · {challenge.shotType?.replace(/_/g, " ").toLowerCase()} ·
            window {challenge.windowMs}ms · conversion {pct}% ({tally.goals}/{tally.shots})
          </p>
        </div>

        {result ? (
          <Card className={cx("animate-pop", result.goal ? "border-[var(--accent)]/50" : "border-[var(--danger)]/50")}>
            <p
              className="text-3xl font-black tracking-tight"
              style={{ color: result.goal ? "var(--accent)" : "var(--danger)" }}
            >
              {result.goal ? "GOAL!" : "SAVED"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <Debug label="Tier" value={result.tier} />
              <Debug label="Accuracy" value={`${Math.round(result.accuracy * 100)}%`} color={ratingColor(result.accuracy * 10)} />
              <Debug label="Aim" value={result.input.value.toFixed(2)} />
              <Debug label="Power" value={`${Math.round((result.input.power ?? 0) * 100)}%`} />
              <Debug label="Timing" value={`${Math.round((result.input.timing ?? 0) * 100)}%`} />
              <Debug label="Shot" value={result.shotType.replace(/_/g, " ").toLowerCase()} />
            </div>
            <Button full className="mt-3" onClick={nextShot}>
              Next shot →
            </Button>
          </Card>
        ) : (
          <SkillChallengeView
            key={`${quality}-${n}`}
            challenge={challenge}
            onComplete={onComplete}
            onCancel={() => setScreen("HUB")}
          />
        )}
      </div>
    </div>
  );
}

function Debug({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-semibold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}
