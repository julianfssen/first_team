/**
 * Match rating + the central outcome-effects table.
 *
 * Every MatchOutcomeType maps to a rating delta, the season-stat deltas it
 * produces, whether it scores/concedes a goal, and narrative text. This keeps
 * moment data lightweight — the data files only name an outcome, the engine
 * owns its consequences.
 */

import type { MatchOutcomeType, SeasonStats } from "./types";
import { RATING_BASE, RATING_MIN, RATING_MAX } from "./constants";
import { clamp, round1 } from "./util";

export type OutcomeEffect = {
  rating: number;
  stats: Partial<SeasonStats>;
  /** Player action directly produces a team goal. */
  teamGoal?: boolean;
  /** Player action directly concedes a goal. */
  opponentGoal?: boolean;
  positive: boolean;
  narrative: string;
};

export const OUTCOME_EFFECTS: Record<MatchOutcomeType, OutcomeEffect> = {
  GOAL: { rating: 1.2, stats: { goals: 1, shots: 1 }, teamGoal: true, positive: true, narrative: "You find the net!" },
  ASSIST: { rating: 1.0, stats: { assists: 1, keyPasses: 1, chancesCreated: 1, passesCompleted: 1 }, teamGoal: true, positive: true, narrative: "A perfectly weighted assist." },
  KEY_PASS: { rating: 0.3, stats: { keyPasses: 1, chancesCreated: 1, passesCompleted: 1 }, positive: true, narrative: "You carve out a chance." },
  DRIBBLE_PAST: { rating: 0.3, stats: { dribblesCompleted: 1 }, positive: true, narrative: "You glide past your man." },
  CROSS_COMPLETED: { rating: 0.3, stats: { crossesCompleted: 1, chancesCreated: 1 }, positive: true, narrative: "An inviting ball into the box." },
  TACKLE_WON: { rating: 0.4, stats: { tackles: 1 }, positive: true, narrative: "A clean, decisive tackle." },
  INTERCEPTION: { rating: 0.3, stats: { interceptions: 1 }, positive: true, narrative: "You read it and step in." },
  BLOCK: { rating: 0.45, stats: { blocks: 1 }, positive: true, narrative: "You throw your body in the way." },
  CLEARANCE: { rating: 0.2, stats: { clearances: 1 }, positive: true, narrative: "You hack the danger clear." },
  AERIAL_WON: { rating: 0.3, stats: { aerialDuelsWon: 1 }, positive: true, narrative: "You win it in the air." },
  SAVE: { rating: 0.5, stats: { saves: 1 }, positive: true, narrative: "A strong save!" },
  PENALTY_SAVE: { rating: 1.3, stats: { saves: 1, penaltySaves: 1 }, positive: true, narrative: "You save the penalty — heroics!" },
  CLEAN_SHEET_ACTION: { rating: 0.3, stats: {}, positive: true, narrative: "Calm, assured defending." },
  GOOD_DECISION: { rating: 0.2, stats: { passesCompleted: 1 }, positive: true, narrative: "A smart, safe choice." },
  NEUTRAL: { rating: 0, stats: {}, positive: true, narrative: "Nothing comes of it." },
  CHANCE_MISSED: { rating: -0.4, stats: { shots: 1 }, positive: false, narrative: "You can't make it count." },
  POSSESSION_LOST: { rating: -0.3, stats: {}, positive: false, narrative: "You give the ball away cheaply." },
  DEFENSIVE_ERROR: { rating: -0.9, stats: { errorsLeadingToGoal: 1 }, opponentGoal: true, positive: false, narrative: "A costly mistake at the back." },
  GK_ERROR: { rating: -1.1, stats: { errorsLeadingToGoal: 1 }, opponentGoal: true, positive: false, narrative: "A goalkeeping error gifts a goal." },
  GOAL_CONCEDED: { rating: -0.6, stats: {}, opponentGoal: true, positive: false, narrative: "You're beaten — a goal conceded." },
  YELLOW_CARD: { rating: -0.3, stats: { yellowCards: 1 }, positive: false, narrative: "Into the book you go." },
  RED_CARD: { rating: -1.5, stats: { redCards: 1 }, positive: false, narrative: "A red card — you're off!" },
  INJURY: { rating: -0.5, stats: {}, positive: false, narrative: "You go down injured." },
};

export type ResolutionTier = "GREAT" | "GOOD" | "OK" | "POOR" | "DISASTER";

const TIER_RATING_BONUS: Record<ResolutionTier, number> = {
  GREAT: 0.3,
  GOOD: 0,
  OK: 0,
  POOR: 0,
  DISASTER: -0.35,
};

export function ratingDeltaForOutcome(outcome: MatchOutcomeType, tier: ResolutionTier): number {
  return round1(OUTCOME_EFFECTS[outcome].rating + TIER_RATING_BONUS[tier]);
}

/** Build the final match rating from base 6.0 + summed moment deltas + context. */
export function finalMatchRating(
  momentDeltas: number[],
  opts: { teamWon: boolean; teamDrew: boolean; cleanSheetBonus: boolean; fatigue: number },
): number {
  let rating = RATING_BASE;
  for (const d of momentDeltas) rating += d;
  if (opts.teamWon) rating += 0.3;
  else if (opts.teamDrew) rating += 0.1;
  if (opts.cleanSheetBonus) rating += 0.4;
  if (opts.fatigue > 80) rating -= 0.3;
  return round1(clamp(rating, RATING_MIN, RATING_MAX));
}
