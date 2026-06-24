"use client";

import { useGame } from "@/lib/store/gameStore";
import { getClub, clubLabel } from "@/lib/game/world";
import { Button, Card, Pill, ActionBar } from "@/components/ui";
import { pretty, regionName } from "@/lib/ui/format";
import type { TransferOffer } from "@/lib/game/types";

function OfferCard({ offer, onAccept }: { offer: TransferOffer; onAccept: () => void }) {
  const club = getClub(offer.clubId);
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{club?.name ?? "Club"}</p>
          <p className="text-xs text-[var(--muted)]">
            {club ? `${regionName(club.region)} · ${club.country}` : ""}
          </p>
        </div>
        <Pill color="var(--accent)">{pretty(offer.role)}</Pill>
      </div>

      <p className="text-sm text-[var(--text)]/85">{offer.reason}</p>

      <div className="grid grid-cols-4 gap-2 text-center">
        <Metric label="Wage" value={`${offer.wage}`} />
        <Metric label="Years" value={`${offer.contractYears}`} />
        <Metric label="Minutes" value={`${offer.expectedMinutes}%`} />
        <Metric label="Prestige" value={offer.prestigeGain > 0 ? `+${offer.prestigeGain}` : "—"} />
      </div>

      <Button full variant="primary" onClick={onAccept}>
        Sign for {club?.name ?? "club"}
      </Button>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-base font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{label}</p>
    </div>
  );
}

export function TransferWindow() {
  const career = useGame((s) => s.career)!;
  const offers = useGame((s) => s.transferOffers);
  const accept = useGame((s) => s.acceptOffer);
  const decline = useGame((s) => s.declineOffers);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="px-4 pt-6 pb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Transfer Window</p>
        <h1 className="text-xl font-bold">{offers.length} offer{offers.length === 1 ? "" : "s"} on the table</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Currently at {clubLabel(career.clubId)}</p>
      </div>

      <div className="scroll-area flex-1 space-y-3 px-4 py-2">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} onAccept={() => accept(offer)} />
        ))}
      </div>

      <ActionBar>
        <Button full variant="ghost" onClick={decline}>
          Stay at {clubLabel(career.clubId)}
        </Button>
      </ActionBar>
    </div>
  );
}
