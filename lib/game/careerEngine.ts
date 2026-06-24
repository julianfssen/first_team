/**
 * Career-level orchestration helpers: totals, phase, position change and
 * retirement gating.
 */

import type { Career, Position, SeasonStats } from "./types";
import { clone, emptySeasonStats, round1, applyStatusDelta } from "./util";
import { POSITION_FAMILY, FORCED_RETIREMENT_AGE, FAMILY_LABEL, POSITION_LABEL } from "./constants";
import { pushTimeline } from "./timeline";

/** Live career totals = completed seasons + the in-progress season. */
export function careerTotals(career: Career): SeasonStats {
  const total = emptySeasonStats();
  const add = (src: SeasonStats) => {
    for (const key in src) {
      const k = key as keyof SeasonStats;
      if (k === "averageRating") continue;
      total[k] += src[k];
    }
  };
  add(career.careerStats);
  add(career.seasonStats);
  // Weighted average rating across completed seasons + current.
  const ratingSum =
    career.seasonHistory.reduce((s, r) => s + r.stats.ratingSum, 0) + career.seasonStats.ratingSum;
  total.averageRating = total.appearances > 0 ? round1(ratingSum / total.appearances) : 0;
  return total;
}

export function changePosition(career: Career, newPosition: Position): Career {
  const c = clone(career);
  if (c.position === newPosition) return c;
  const newFamily = POSITION_FAMILY[newPosition];
  const oldFamilyLabel = FAMILY_LABEL[c.positionFamily];
  c.position = newPosition;
  c.positionFamily = newFamily;
  // Adapting to a new role temporarily dents chemistry and coach trust.
  applyStatusDelta(c.status, "teamChemistry", -6);
  applyStatusDelta(c.status, "coachTrust", -4);
  pushTimeline(
    c,
    "POSITION_CHANGE",
    `Converted from ${oldFamilyLabel} to ${POSITION_LABEL[newPosition]}.`,
  );
  return c;
}

export function isForcedRetirement(career: Career): boolean {
  return career.age >= FORCED_RETIREMENT_AGE;
}

/** Reasons the game would gently suggest hanging up the boots. */
export function retirementSuggestionReasons(career: Career): string[] {
  const reasons: string[] = [];
  const last = career.seasonHistory[career.seasonHistory.length - 1];
  if (career.age >= 36) reasons.push("You're well into your veteran years.");
  if (career.attributes.stamina < 45) reasons.push("Your stamina is fading badly.");
  if (career.careerStats.injuries >= 5) reasons.push("Injuries have piled up over the years.");
  if (last && last.stats.appearances < 8 && career.age >= 33) {
    reasons.push("Your playing time has dried up.");
  }
  if (career.status.morale < 30) reasons.push("Your motivation is at a low ebb.");
  return reasons;
}

export function retirementSuggested(career: Career): boolean {
  return career.age > 35 && retirementSuggestionReasons(career).length >= 2;
}
