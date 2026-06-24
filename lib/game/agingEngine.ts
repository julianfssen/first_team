/**
 * Aging.
 *
 * Applied at the end of each season. Physical attributes (pace, stamina,
 * strength) peak early and decline after ~30; mental/technical attributes
 * (composure, positioning, leadership, vision, professionalism, passing) hold
 * or keep improving into the mid-30s. This enables late-career reinvention.
 */

import type { Career, AttributeKey, Attributes } from "./types";
import { clampAttr, clone } from "./util";
import { rng, Rng } from "./rng";
import { hasTrait } from "./effects";
import { phaseForAge } from "./constants";

const PHYSICAL: AttributeKey[] = ["pace", "stamina", "strength"];
const MENTAL: AttributeKey[] = [
  "composure", "positioning", "leadership", "vision", "professionalism", "passing",
];
const TECHNICAL: AttributeKey[] = [
  "finishing", "dribbling", "defending", "goalkeeping", "aerialAbility", "workRate",
];

/** Per-year physical decline magnitude (positive number = points lost). */
function physicalDecline(age: number): number {
  if (age <= 30) return 0;
  if (age <= 32) return 1.5;
  if (age <= 36) return 3;
  if (age <= 40) return 4.5;
  return 6;
}

/** Per-year change to a mental attribute (can be positive). */
function mentalGrowth(age: number): number {
  if (age <= 32) return 1.4;
  if (age <= 36) return 0.7;
  if (age <= 40) return 0.2;
  return 0;
}

/** Per-year change to a technical attribute. */
function technicalChange(age: number): number {
  if (age <= 24) return 1.2;
  if (age <= 30) return 0.6;
  if (age <= 33) return 0;
  if (age <= 37) return -1;
  return -2;
}

function adjust(attrs: Attributes, key: AttributeKey, delta: number): void {
  attrs[key] = clampAttr(attrs[key] + delta);
}

/** Returns the human-readable notes for the changes aging produced. */
export function agingNotes(before: Attributes, after: Attributes): string[] {
  const notes: string[] = [];
  const labels: Partial<Record<AttributeKey, string>> = {
    pace: "Pace", stamina: "Stamina", strength: "Strength",
    composure: "Composure", positioning: "Positioning", leadership: "Leadership",
    vision: "Vision", finishing: "Finishing", dribbling: "Dribbling",
  };
  for (const key in labels) {
    const k = key as AttributeKey;
    const diff = Math.round(after[k] - before[k]);
    if (diff <= -2) notes.push(`${labels[k]} declined ${diff}.`);
    else if (diff >= 2) notes.push(`${labels[k]} improved +${diff}.`);
  }
  return notes;
}

export function applyAging(career: Career): Career {
  const c = clone(career);
  c.age += 1;
  const age = c.age;
  const r: Rng = rng(c.seed, "aging", c.season, age);

  const declineFactor = hasTrait(c, "PROFESSIONAL") ? 0.8 : 1;
  const lateBloomer = hasTrait(c, "LATE_BLOOMER");

  const physBase = physicalDecline(age) * declineFactor;
  for (const key of PHYSICAL) {
    if (age <= 23) {
      adjust(c.attributes, key, 1 + r.noise(0.6)); // still maturing physically
    } else {
      const d = physBase * (0.7 + r.float() * 0.6);
      adjust(c.attributes, key, -(lateBloomer && age <= 33 ? d * 0.6 : d));
    }
  }

  const mentBase = mentalGrowth(age);
  for (const key of MENTAL) {
    adjust(c.attributes, key, mentBase * (0.6 + r.float() * 0.8));
  }

  const techBase = technicalChange(age);
  for (const key of TECHNICAL) {
    // Goalkeepers age more gracefully on the goalkeeping attribute.
    const mod = key === "goalkeeping" && c.positionFamily === "GOALKEEPER" ? techBase + 0.8 : techBase;
    adjust(c.attributes, key, mod * (0.7 + r.float() * 0.6));
  }

  c.phase = phaseForAge(age);
  return c;
}
