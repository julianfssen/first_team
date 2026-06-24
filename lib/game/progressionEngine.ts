/**
 * Attribute progression from training.
 *
 * Growth is gated by an age-based multiplier (fast when young, near-zero in the
 * mid-30s), professionalism, club development quality, and diminishing returns
 * as an attribute approaches its ceiling.
 */

import type { Career, AttributeKey } from "./types";
import { clampAttr } from "./util";
import { hasTrait } from "./effects";
import { getClub } from "./world";

/** Age-based training growth multiplier. */
export function growthMultiplier(career: Career): number {
  const age = career.age;
  let m: number;
  if (age <= 18) m = 1.4;
  else if (age <= 20) m = 1.2;
  else if (age <= 24) m = 1.0;
  else if (age <= 29) m = 0.7;
  else if (age <= 32) m = 0.45;
  else if (age <= 36) m = 0.22;
  else m = 0.1;

  // Late Bloomer keeps developing through the mid-career plateau.
  if (hasTrait(career, "LATE_BLOOMER") && age >= 23 && age <= 33) m += 0.3;
  // Wonderkids spike early.
  if (hasTrait(career, "WONDERKID") && age <= 23) m += 0.25;

  // Professionalism scales effective training (0.85x – 1.15x).
  m *= 0.85 + (career.attributes.professionalism / 100) * 0.3;

  // Club development quality (0.9x – 1.2x).
  const club = getClub(career.clubId);
  if (club) m *= 0.9 + (club.developmentQuality / 100) * 0.3;

  // Heavy fatigue suppresses gains.
  if (career.status.fatigue > 80) m *= 0.6;
  else if (career.status.fatigue > 60) m *= 0.85;

  return m;
}

/**
 * Apply training growth (in "raw points") to attributes, scaled by the growth
 * multiplier and diminishing returns. Returns a log of attributes that moved.
 */
export function applyTraining(
  career: Career,
  growth: Partial<Record<AttributeKey, number>>,
): { key: AttributeKey; delta: number }[] {
  const m = growthMultiplier(career);
  const changes: { key: AttributeKey; delta: number }[] = [];
  for (const key in growth) {
    const k = key as AttributeKey;
    const raw = (growth[k] ?? 0) * m;
    if (raw === 0) continue;
    const current = career.attributes[k];
    // Diminishing returns: the higher the attribute, the slower it grows.
    const ceilingFactor = raw > 0 ? Math.max(0.15, (100 - current) / 70) : 1;
    const delta = raw * ceilingFactor;
    const before = career.attributes[k];
    career.attributes[k] = clampAttr(before + delta);
    const applied = career.attributes[k] - before;
    if (Math.abs(applied) >= 0.05) changes.push({ key: k, delta: applied });
  }
  return changes;
}
