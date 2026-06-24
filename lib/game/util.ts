import type { SeasonStats, Attributes, PlayerStatus, AttributeKey, StatusKey } from "./types";
import { ATTR_MIN, ATTR_MAX, STATUS_MIN, STATUS_MAX } from "./constants";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function clampAttr(value: number): number {
  return clamp(value, ATTR_MIN, ATTR_MAX);
}

export function clampStatus(value: number): number {
  return clamp(value, STATUS_MIN, STATUS_MAX);
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Deep clone used at the boundary of each public engine function. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function emptySeasonStats(): SeasonStats {
  return {
    appearances: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    assists: 0,
    shots: 0,
    keyPasses: 0,
    ratingSum: 0,
    averageRating: 0,
    yellowCards: 0,
    redCards: 0,
    injuries: 0,
    saves: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    penaltySaves: 0,
    errorsLeadingToGoal: 0,
    tackles: 0,
    interceptions: 0,
    blocks: 0,
    clearances: 0,
    aerialDuelsWon: 0,
    passesCompleted: 0,
    progressivePasses: 0,
    chancesCreated: 0,
    dribblesCompleted: 0,
    crossesCompleted: 0,
  };
}

const NON_ADDITIVE_STAT_KEYS = new Set<keyof SeasonStats>(["averageRating"]);

/** Add `delta` stats into `target` in place (skips derived fields). */
export function addStats(target: SeasonStats, delta: Partial<SeasonStats>): void {
  for (const key in delta) {
    const k = key as keyof SeasonStats;
    if (NON_ADDITIVE_STAT_KEYS.has(k)) continue;
    target[k] += delta[k] ?? 0;
  }
}

/** Recompute averageRating from ratingSum / appearances. */
export function recomputeAverageRating(stats: SeasonStats): void {
  stats.averageRating =
    stats.appearances > 0 ? round1(stats.ratingSum / stats.appearances) : 0;
}

export function applyAttributeDelta(
  attributes: Attributes,
  key: AttributeKey,
  delta: number,
): void {
  attributes[key] = clampAttr(attributes[key] + delta);
}

export function applyStatusDelta(
  status: PlayerStatus,
  key: StatusKey,
  delta: number,
): void {
  status[key] = clampStatus(status[key] + delta);
}
