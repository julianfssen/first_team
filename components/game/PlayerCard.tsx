"use client";

import type { Career } from "@/lib/game/types";
import { overallRating } from "@/lib/game/weights";
import { clubLabel, getClub } from "@/lib/game/world";
import { POSITION_LABEL, PHASE_LABEL, regionName } from "@/lib/ui/format";
import { valueColor } from "@/lib/ui/format";
import { Pill } from "@/components/ui";

export function PlayerCard({ career, compact = false }: { career: Career; compact?: boolean }) {
  const overall = overallRating(career.attributes, career.positionFamily);
  const club = getClub(career.clubId);
  const color = valueColor(overall);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] p-4">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-2 font-bold"
          style={{ borderColor: color, color }}
        >
          <span className="text-2xl leading-none tabular-nums">{overall}</span>
          <span className="text-[9px] uppercase tracking-widest text-[var(--muted)]">OVR</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-bold">{career.player.name}</h2>
          </div>
          <p className="truncate text-sm text-[var(--muted)]">
            {clubLabel(career.clubId)}
            {club ? ` · ${club.country}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill color="var(--accent)">{POSITION_LABEL[career.position]}</Pill>
            <Pill color="#a3e635">Age {career.age}</Pill>
            <Pill>{PHASE_LABEL[career.phase]}</Pill>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center">
          <Stat label="Season" value={`S${career.season}·W${career.week}`} />
          <Stat label="Region" value={regionName(club?.region ?? career.startingRegion)} />
          <Stat label="Value" value={`${(career.marketValue / 1).toFixed(0)}`} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p>
    </div>
  );
}
