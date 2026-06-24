"use client";

import type { MatchMomentResult, TraitId, Risk } from "@/lib/game/types";
import { Pill, cx } from "@/components/ui";
import { riskColor, traitName, traitDescription, outcomeIsPositive, ratingColor } from "@/lib/ui/format";

export function RiskBadge({ risk }: { risk: Risk }) {
  return <Pill color={riskColor(risk)}>{risk} risk</Pill>;
}

export function ChoiceCard({
  label,
  description,
  right,
  onClick,
  disabled,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "group flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition",
        "hover:border-[var(--accent)]/60 hover:bg-[var(--surface-2)] active:scale-[0.99] disabled:opacity-40",
      )}
    >
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {description && <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </button>
  );
}

export function HeadlineCard({ headline }: { headline: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
        Back Pages
      </p>
      <p className="mt-1 font-serif text-lg font-semibold italic leading-snug">“{headline}”</p>
    </div>
  );
}

export function TraitBadge({ id, unlocked = true }: { id: TraitId; unlocked?: boolean }) {
  return (
    <span
      title={traitDescription(id)}
      className={cx(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold",
        unlocked
          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
          : "bg-[var(--surface-2)] text-[var(--muted)]",
      )}
    >
      {traitName(id)}
    </span>
  );
}

export function MomentResultBanner({ result }: { result: MatchMomentResult }) {
  const positive = outcomeIsPositive(result.outcome);
  const color = positive ? "var(--accent)" : "var(--danger)";
  return (
    <div
      className="animate-pop rounded-2xl border p-4 text-center"
      style={{
        borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      <p className="text-2xl font-extrabold tracking-tight" style={{ color }}>
        {result.outcome.replace(/_/g, " ")}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">{result.narrative}</p>
      <p className="mt-2 text-xs font-semibold" style={{ color }}>
        Rating {result.ratingDelta >= 0 ? "+" : ""}
        {result.ratingDelta.toFixed(1)} · {result.tier}
      </p>
    </div>
  );
}

export function RatingPill({ rating }: { rating: number }) {
  const color = ratingColor(rating);
  return (
    <span
      className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums"
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)` }}
    >
      {rating.toFixed(1)}
    </span>
  );
}
