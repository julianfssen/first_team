"use client";

import { useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import type {
  Background,
  CreateCareerInput,
  Personality,
  Playstyle,
  Position,
  Region,
  StrongFoot,
} from "@/lib/game/types";
import { PLAYABLE_REGIONS, REGIONS } from "@/data/regions";
import { Button, SectionTitle, cx } from "@/components/ui";
import { POSITION_LABEL, pretty, regionName } from "@/lib/ui/format";

const POSITIONS: Position[] = [
  "GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RW", "LW", "CF", "ST",
];
const FEET: StrongFoot[] = ["LEFT", "RIGHT", "BOTH"];
const PLAYSTYLES: Playstyle[] = ["BALANCED", "TECHNICAL", "PHYSICAL", "CREATIVE", "CLINICAL", "DEFENSIVE"];
const PERSONALITIES: Personality[] = ["HUMBLE", "AMBITIOUS", "PROFESSIONAL", "FLASHY", "HOT_HEADED", "LOYAL"];
const BACKGROUNDS: Background[] = [
  "ACADEMY_KID", "STREET_FOOTBALLER", "FUTSAL_PRODIGY", "LATE_BLOOMER",
  "RICH_FAMILY", "WORKING_CLASS", "SCOUTED_SMALL_TOWN", "MULTI_SPORT_ATHLETE",
];

const PERSONALITY_HINT: Record<Personality, string> = {
  HUMBLE: "Strong morale & chemistry, slower fame.",
  AMBITIOUS: "More transfer interest & reputation, risks coach trust.",
  PROFESSIONAL: "Better growth, lower injury risk, less fame.",
  FLASHY: "Dribbling & fame up, more media pressure.",
  HOT_HEADED: "Physical edge, but composure & discipline suffer.",
  LOYAL: "Coach trust & morale, builds loyalty stories.",
};
const BACKGROUND_HINT: Record<Background, string> = {
  ACADEMY_KID: "+ positioning, professionalism, coach trust.",
  STREET_FOOTBALLER: "+ dribbling & flair, − professionalism.",
  FUTSAL_PRODIGY: "+ dribbling & composure, − strength.",
  LATE_BLOOMER: "Lower start, but keeps developing for longer.",
  RICH_FAMILY: "+ composure & professionalism, − work rate.",
  WORKING_CLASS: "+ work rate, stamina, strength.",
  SCOUTED_SMALL_TOWN: "+ work rate & pace, raw composure.",
  MULTI_SPORT_ATHLETE: "+ athleticism, − early technique.",
};
const NATIONS = [
  "Brazil", "Argentina", "Japan", "South Korea", "Australia", "Nigeria", "Ghana",
  "Egypt", "Mexico", "USA", "Canada", "England", "France", "Spain", "Germany",
  "Italy", "Netherlands", "Portugal", "Croatia", "Senegal", "Morocco", "Colombia",
  "Uruguay", "Saudi Arabia", "Qatar", "New Zealand", "Jamaica", "Costa Rica",
];

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cx(
            "rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-95",
            value === opt
              ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]/40",
          )}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  );
}

export function CreatePlayer() {
  const newCareer = useGame((s) => s.newCareer);
  const setScreen = useGame((s) => s.setScreen);

  const [form, setForm] = useState<CreateCareerInput>({
    name: "",
    nationality: "",
    startingRegion: "ASIA_PACIFIC",
    position: "ST",
    strongFoot: "RIGHT",
    playstyle: "BALANCED",
    personality: "AMBITIOUS",
    background: "ACADEMY_KID",
  });

  const update = <K extends keyof CreateCareerInput>(key: K, value: CreateCareerInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const ready = form.name.trim().length > 1 && form.nationality.trim().length > 1;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <h1 className="text-xl font-bold">Create Your Footballer</h1>
        <button onClick={() => setScreen("LANDING")} className="text-sm text-[var(--muted)]">
          Back
        </button>
      </div>

      <div className="scroll-area flex-1 space-y-5 px-4 pb-4">
        <div>
          <SectionTitle>Identity</SectionTitle>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Player name"
            className="mb-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={form.nationality}
            onChange={(e) => update("nationality", e.target.value)}
            placeholder="Nationality (e.g. Brazil)"
            list="nations"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)]"
          />
          <datalist id="nations">
            {NATIONS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        <div>
          <SectionTitle>Starting Region</SectionTitle>
          <ChipGroup
            options={PLAYABLE_REGIONS as Region[]}
            value={form.startingRegion}
            onChange={(v) => update("startingRegion", v)}
            label={(v) => regionName(v)}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">{REGIONS[form.startingRegion].blurb}</p>
        </div>

        <div>
          <SectionTitle>Position</SectionTitle>
          <ChipGroup
            options={POSITIONS}
            value={form.position}
            onChange={(v) => update("position", v)}
            label={(v) => v}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)]">{POSITION_LABEL[form.position]}</p>
        </div>

        <div>
          <SectionTitle>Strong Foot</SectionTitle>
          <ChipGroup options={FEET} value={form.strongFoot} onChange={(v) => update("strongFoot", v)} label={pretty} />
        </div>

        <div>
          <SectionTitle>Playstyle</SectionTitle>
          <ChipGroup options={PLAYSTYLES} value={form.playstyle} onChange={(v) => update("playstyle", v)} label={pretty} />
        </div>

        <div>
          <SectionTitle>Personality</SectionTitle>
          <ChipGroup options={PERSONALITIES} value={form.personality} onChange={(v) => update("personality", v)} label={pretty} />
          <p className="mt-1.5 text-xs text-[var(--muted)]">{PERSONALITY_HINT[form.personality]}</p>
        </div>

        <div>
          <SectionTitle>Background</SectionTitle>
          <ChipGroup options={BACKGROUNDS} value={form.background} onChange={(v) => update("background", v)} label={pretty} />
          <p className="mt-1.5 text-xs text-[var(--muted)]">{BACKGROUND_HINT[form.background]}</p>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg)]/90 p-4 backdrop-blur">
        <Button full disabled={!ready} onClick={() => newCareer({ ...form, name: form.name.trim(), nationality: form.nationality.trim() })}>
          {ready ? "Start Career" : "Enter a name & nationality"}
        </Button>
      </div>
    </div>
  );
}
