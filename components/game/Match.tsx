"use client";

import type { MatchContext, MatchMoment } from "@/lib/game/types";
import { clubLabel } from "@/lib/game/world";
import { Pill } from "@/components/ui";
import { ChoiceCard, RiskBadge } from "./Cards";
import { pretty } from "@/lib/ui/format";

const IMPORTANCE_COLOR: Record<string, string> = {
  LOW: "var(--muted)",
  MEDIUM: "#a3e635",
  HIGH: "var(--warn)",
  CLUTCH: "var(--danger)",
};

export function MatchScoreboard({
  ctx,
  teamScore,
  opponentScore,
  clubId,
}: {
  ctx: MatchContext;
  teamScore?: number;
  opponentScore?: number;
  clubId: string;
}) {
  const showScore = teamScore !== undefined && opponentScore !== undefined;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Pill>{pretty(ctx.competition)}</Pill>
        <Pill color={IMPORTANCE_COLOR[ctx.importance]}>{ctx.importance}</Pill>
        <Pill>{ctx.homeAway}</Pill>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Team name={clubLabel(clubId)} align="left" />
        <div className="shrink-0 px-2 text-center">
          {showScore ? (
            <span className="text-3xl font-extrabold tabular-nums">
              {teamScore} <span className="text-[var(--muted)]">–</span> {opponentScore}
            </span>
          ) : (
            <span className="text-2xl font-bold text-[var(--muted)]">vs</span>
          )}
        </div>
        <Team name={ctx.opponentName} align="right" />
      </div>
      {!showScore && (
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          {ctx.isStarter ? "You start today." : "You're on the bench — ready to make an impact."}
        </p>
      )}
    </div>
  );
}

function Team({ name, align }: { name: string; align: "left" | "right" }) {
  return (
    <div className={`min-w-0 flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <p className="truncate text-sm font-bold leading-tight">{name}</p>
    </div>
  );
}

export function MatchMomentCard({
  moment,
  onChoose,
  index,
  total,
}: {
  moment: MatchMoment;
  onChoose: (choiceId: string) => void;
  index: number;
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span
          className="rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-sm font-bold tabular-nums"
          style={{ color: IMPORTANCE_COLOR[moment.importance] }}
        >
          {moment.minute}&apos;
        </span>
        <span className="text-xs text-[var(--muted)]">
          Moment {index + 1} / {total}
        </span>
      </div>
      <div>
        <h2 className="text-lg font-bold">{moment.title}</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-[var(--text)]/90">{moment.description}</p>
      </div>
      <div className="space-y-2 pt-1">
        {moment.choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            label={choice.label}
            right={<RiskBadge risk={choice.risk} />}
            onClick={() => onChoose(choice.id)}
          />
        ))}
      </div>
    </div>
  );
}
