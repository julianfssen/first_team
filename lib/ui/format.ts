import type {
  AttributeKey,
  Region,
  StatusKey,
  TraitId,
  MatchOutcomeType,
} from "@/lib/game/types";
import { REGIONS } from "@/data/regions";
import { TRAITS } from "@/data/traits";

export { POSITION_LABEL, FAMILY_LABEL, PHASE_LABEL } from "@/lib/game/constants";

/** Turn SNAKE_CASE / kebab into Title Case words. */
export function pretty(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function regionName(region: Region): string {
  return REGIONS[region]?.name ?? pretty(region);
}

export const ATTRIBUTE_LABEL: Record<AttributeKey, string> = {
  finishing: "Finishing",
  passing: "Passing",
  dribbling: "Dribbling",
  pace: "Pace",
  strength: "Strength",
  stamina: "Stamina",
  defending: "Defending",
  positioning: "Positioning",
  composure: "Composure",
  professionalism: "Professionalism",
  goalkeeping: "Goalkeeping",
  aerialAbility: "Aerial",
  workRate: "Work Rate",
  vision: "Vision",
  leadership: "Leadership",
};

/** label + whether a HIGH value is bad (for colouring). */
export const STATUS_META: Record<StatusKey, { label: string; invert: boolean }> = {
  form: { label: "Form", invert: false },
  fatigue: { label: "Fatigue", invert: true },
  confidence: { label: "Confidence", invert: false },
  morale: { label: "Morale", invert: false },
  coachTrust: { label: "Coach Trust", invert: false },
  teamChemistry: { label: "Chemistry", invert: false },
  reputation: { label: "Reputation", invert: false },
  mediaPressure: { label: "Media Pressure", invert: true },
  injuryRisk: { label: "Injury Risk", invert: true },
};

const TRAIT_NAME = new Map<TraitId, string>(TRAITS.map((t) => [t.id, t.name]));
export function traitName(id: TraitId): string {
  return TRAIT_NAME.get(id) ?? pretty(id);
}
const TRAIT_DESC = new Map<TraitId, string>(TRAITS.map((t) => [t.id, t.description]));
export function traitDescription(id: TraitId): string {
  return TRAIT_DESC.get(id) ?? "";
}

/** A 0-100 value → text colour, optionally inverted (high = bad). */
export function valueColor(value: number, invert = false): string {
  const v = invert ? 100 - value : value;
  if (v >= 75) return "var(--accent)";
  if (v >= 50) return "#a3e635";
  if (v >= 30) return "var(--warn)";
  return "var(--danger)";
}

export function ratingColor(rating: number): string {
  if (rating >= 8) return "var(--accent)";
  if (rating >= 7) return "#a3e635";
  if (rating >= 6) return "var(--warn)";
  return "var(--danger)";
}

/** Positive vs negative match outcome (for colouring narrative & banners). */
const POSITIVE_OUTCOMES = new Set<MatchOutcomeType>([
  "GOAL", "ASSIST", "KEY_PASS", "DRIBBLE_PAST", "CROSS_COMPLETED", "TACKLE_WON",
  "INTERCEPTION", "BLOCK", "CLEARANCE", "AERIAL_WON", "SAVE", "PENALTY_SAVE",
  "CLEAN_SHEET_ACTION", "GOOD_DECISION",
]);
export function outcomeIsPositive(outcome: MatchOutcomeType): boolean {
  return POSITIVE_OUTCOMES.has(outcome);
}

export function riskColor(risk: "LOW" | "MEDIUM" | "HIGH"): string {
  return risk === "HIGH" ? "var(--danger)" : risk === "MEDIUM" ? "var(--warn)" : "var(--accent)";
}

export function money(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}
