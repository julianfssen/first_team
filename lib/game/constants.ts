/**
 * Tunable game constants. Kept in one place so balancing is easy.
 */

import type { Position, PositionFamily, CareerPhase } from "./types";

export const START_AGE = 16;
export const FORCED_RETIREMENT_AGE = 45;

/** Matches (and training weeks) per season. */
export const SEASON_WEEKS = 26;

/** Minutes for a full match. */
export const FULL_MATCH_MINUTES = 90;

export const ATTR_MIN = 1;
export const ATTR_MAX = 99;
export const STATUS_MIN = 0;
export const STATUS_MAX = 100;

export const RATING_MIN = 3.0;
export const RATING_MAX = 10.0;
export const RATING_BASE = 6.0;

// ---------------------------------------------------------------------------
// Position → family mapping
// ---------------------------------------------------------------------------

export const POSITION_FAMILY: Record<Position, PositionFamily> = {
  GK: "GOALKEEPER",
  CB: "CENTRE_BACK",
  LB: "FULLBACK",
  RB: "FULLBACK",
  LWB: "WINGBACK",
  RWB: "WINGBACK",
  CDM: "DEFENSIVE_MIDFIELDER",
  CM: "CENTRAL_MIDFIELDER",
  CAM: "ATTACKING_MIDFIELDER",
  LW: "WINGER",
  RW: "WINGER",
  ST: "STRIKER",
  CF: "STRIKER",
};

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Goalkeeper",
  CB: "Centre Back",
  LB: "Left Back",
  RB: "Right Back",
  LWB: "Left Wing-Back",
  RWB: "Right Wing-Back",
  CDM: "Defensive Midfielder",
  CM: "Central Midfielder",
  CAM: "Attacking Midfielder",
  LW: "Left Winger",
  RW: "Right Winger",
  ST: "Striker",
  CF: "Centre Forward",
};

export const FAMILY_LABEL: Record<PositionFamily, string> = {
  GOALKEEPER: "Goalkeeper",
  CENTRE_BACK: "Centre Back",
  FULLBACK: "Fullback",
  WINGBACK: "Wing-Back",
  DEFENSIVE_MIDFIELDER: "Defensive Midfielder",
  CENTRAL_MIDFIELDER: "Central Midfielder",
  ATTACKING_MIDFIELDER: "Attacking Midfielder",
  WINGER: "Winger",
  STRIKER: "Striker",
};

export function positionFamily(position: Position): PositionFamily {
  return POSITION_FAMILY[position];
}

// ---------------------------------------------------------------------------
// Career phases by age
// ---------------------------------------------------------------------------

export function phaseForAge(age: number): CareerPhase {
  if (age <= 20) return "PROSPECT";
  if (age <= 27) return "RISING_PLAYER";
  if (age <= 32) return "PRIME";
  if (age <= 38) return "VETERAN";
  return "FINAL_CHAPTER";
}

export const PHASE_LABEL: Record<CareerPhase, string> = {
  PROSPECT: "Prospect",
  RISING_PLAYER: "Rising Player",
  PRIME: "Prime",
  VETERAN: "Veteran",
  FINAL_CHAPTER: "Final Chapter",
};
