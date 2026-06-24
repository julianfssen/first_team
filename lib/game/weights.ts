/**
 * Attribute weighting tables shared across the engine.
 *
 * - FAMILY_WEIGHTS: how much each attribute contributes to a position's overall
 *   ability. Used for the player's "overall" rating and for growth focus.
 * - CHECK_WEIGHTS: per-action attribute weights for resolving match moments
 *   (the SHOOT/PASS/DEFEND/... profiles referenced by moment choices).
 */

import type { AttributeKey, AttributeCheck, PositionFamily } from "./types";

type WeightMap = Partial<Record<AttributeKey, number>>;

/** Weights need not sum to 1; the engine normalises. */
export const FAMILY_WEIGHTS: Record<PositionFamily, WeightMap> = {
  GOALKEEPER: {
    goalkeeping: 0.4,
    positioning: 0.15,
    composure: 0.12,
    aerialAbility: 0.1,
    passing: 0.08,
    leadership: 0.08,
    professionalism: 0.07,
  },
  CENTRE_BACK: {
    defending: 0.28,
    strength: 0.16,
    aerialAbility: 0.14,
    positioning: 0.16,
    composure: 0.1,
    leadership: 0.08,
    pace: 0.08,
  },
  FULLBACK: {
    pace: 0.18,
    stamina: 0.16,
    defending: 0.18,
    passing: 0.14,
    workRate: 0.14,
    positioning: 0.1,
    vision: 0.1,
  },
  WINGBACK: {
    pace: 0.2,
    stamina: 0.18,
    workRate: 0.16,
    passing: 0.14,
    defending: 0.14,
    dribbling: 0.1,
    vision: 0.08,
  },
  DEFENSIVE_MIDFIELDER: {
    defending: 0.22,
    positioning: 0.18,
    passing: 0.16,
    workRate: 0.14,
    strength: 0.12,
    composure: 0.1,
    vision: 0.08,
  },
  CENTRAL_MIDFIELDER: {
    passing: 0.22,
    vision: 0.18,
    stamina: 0.14,
    composure: 0.12,
    positioning: 0.12,
    workRate: 0.12,
    dribbling: 0.1,
  },
  ATTACKING_MIDFIELDER: {
    vision: 0.2,
    passing: 0.18,
    dribbling: 0.16,
    composure: 0.12,
    positioning: 0.1,
    finishing: 0.14,
    pace: 0.1,
  },
  WINGER: {
    pace: 0.2,
    dribbling: 0.2,
    passing: 0.14,
    finishing: 0.14,
    stamina: 0.12,
    composure: 0.1,
    vision: 0.1,
  },
  STRIKER: {
    finishing: 0.28,
    positioning: 0.16,
    composure: 0.14,
    strength: 0.12,
    pace: 0.14,
    aerialAbility: 0.1,
    dribbling: 0.06,
  },
};

export const CHECK_WEIGHTS: Record<AttributeCheck, WeightMap> = {
  SHOOT: { finishing: 0.45, composure: 0.25, positioning: 0.15, pace: 0.05, dribbling: 0.1 },
  PASS: { passing: 0.4, vision: 0.25, composure: 0.15, positioning: 0.1, workRate: 0.1 },
  DRIBBLE: { dribbling: 0.4, pace: 0.25, composure: 0.15, strength: 0.1, vision: 0.1 },
  DEFEND: { defending: 0.4, positioning: 0.25, strength: 0.15, composure: 0.1, workRate: 0.1 },
  AERIAL: { aerialAbility: 0.45, strength: 0.25, positioning: 0.15, defending: 0.08, finishing: 0.07 },
  PHYSICAL: { strength: 0.4, stamina: 0.25, workRate: 0.2, pace: 0.15 },
  COMPOSURE: { composure: 0.45, positioning: 0.25, vision: 0.15, professionalism: 0.15 },
  GK_SAVE: { goalkeeping: 0.45, positioning: 0.2, composure: 0.15, aerialAbility: 0.1, pace: 0.1 },
  GK_DISTRIBUTION: { passing: 0.4, composure: 0.2, vision: 0.2, goalkeeping: 0.1, positioning: 0.1 },
};

/** Status inputs that modify a check, beyond raw attributes. */
export type CheckContext = {
  form: number;
  confidence: number;
  coachTrust: number;
  fatigue: number;
  teamChemistry: number;
};

/**
 * Weighted attribute score (0-100ish) for a given check profile.
 */
export function weightedAttributeScore(
  attributes: Record<AttributeKey, number>,
  weights: WeightMap,
): number {
  let total = 0;
  let sum = 0;
  for (const key in weights) {
    const w = weights[key as AttributeKey] ?? 0;
    total += w;
    sum += w * attributes[key as AttributeKey];
  }
  return total > 0 ? sum / total : 0;
}

/** A player's overall ability for their position family (0-99). */
export function overallRating(
  attributes: Record<AttributeKey, number>,
  family: PositionFamily,
): number {
  return Math.round(weightedAttributeScore(attributes, FAMILY_WEIGHTS[family]));
}
