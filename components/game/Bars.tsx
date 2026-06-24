"use client";

import type { Attributes, PlayerStatus, StatusKey } from "@/lib/game/types";
import { ATTRIBUTE_LABEL, STATUS_META, valueColor } from "@/lib/ui/format";

export function StatBar({
  label,
  value,
  max = 100,
  invert = false,
  showValue = true,
}: {
  label: string;
  value: number;
  max?: number;
  invert?: boolean;
  showValue?: boolean;
}) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  const color = valueColor((value / max) * 100, invert);
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 truncate text-xs text-[var(--muted)]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="bar-fill h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {showValue && (
        <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color }}>
          {Math.round(value)}
        </span>
      )}
    </div>
  );
}

const ATTR_ORDER: (keyof Attributes)[] = [
  "pace", "stamina", "strength", "finishing", "dribbling", "passing",
  "vision", "defending", "positioning", "composure", "aerialAbility",
  "workRate", "professionalism", "leadership", "goalkeeping",
];

export function AttributeGrid({ attributes, isKeeper }: { attributes: Attributes; isKeeper: boolean }) {
  const keys = ATTR_ORDER.filter((k) => (k === "goalkeeping" ? isKeeper : true));
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-5">
      {keys.map((k) => (
        <StatBar key={k} label={ATTRIBUTE_LABEL[k]} value={attributes[k]} />
      ))}
    </div>
  );
}

const STATUS_ORDER: StatusKey[] = [
  "form", "confidence", "morale", "fatigue",
  "coachTrust", "teamChemistry", "reputation", "mediaPressure", "injuryRisk",
];

export function StatusGrid({ status }: { status: PlayerStatus }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-5">
      {STATUS_ORDER.map((k) => (
        <StatBar key={k} label={STATUS_META[k].label} value={status[k]} invert={STATUS_META[k].invert} />
      ))}
    </div>
  );
}
