/**
 * Injury system.
 *
 * Injury risk rises with fatigue, age, low stamina, low professionalism and
 * injury history. Severity determines weeks out. While injured the player is
 * unavailable for matches and recovers one week at a time.
 */

import type { Career, Injury, InjurySeverity } from "./types";
import { rng } from "./rng";
import { clamp } from "./util";
import { hasTrait } from "./effects";

const SEVERITY_WEEKS: Record<InjurySeverity, [number, number]> = {
  MINOR: [1, 2],
  MODERATE: [2, 6],
  MAJOR: [5, 12],
  CAREER_THREATENING: [20, 40],
};

const SEVERITY_NAMES: Record<InjurySeverity, string[]> = {
  MINOR: ["minor knock", "dead leg", "bruised ankle", "tight calf"],
  MODERATE: ["hamstring strain", "groin strain", "sprained ankle", "knee swelling"],
  MAJOR: ["torn hamstring", "ankle ligament damage", "fractured metatarsal", "medial knee ligament tear"],
  CAREER_THREATENING: ["ACL rupture", "achilles tendon rupture", "serious knee reconstruction"],
};

export function createInjury(career: Career, severity: InjurySeverity): Injury {
  const r = rng(career.seed, "injury", career.season, career.week, career.seasonStats.injuries);
  const [lo, hi] = SEVERITY_WEEKS[severity];
  const weeksOut = r.int(lo, hi);
  const name = r.pick(SEVERITY_NAMES[severity]);
  return {
    id: `inj-${career.season}-${career.week}-${career.seasonStats.injuries}`,
    name,
    severity,
    weeksOut,
    weeksRemaining: weeksOut,
    season: career.season,
  };
}

/**
 * Probability (0-1) of an injury occurring during a given match/week, before
 * the severity roll. Driven by fatigue, age, stamina and professionalism.
 */
export function injuryProbability(career: Career, intensity = 1): number {
  const { fatigue, injuryRisk } = career.status;
  const { stamina, professionalism } = career.attributes;
  let p = 0.015; // baseline
  p += (fatigue / 100) * 0.06; // fatigue dominates
  p += (injuryRisk / 100) * 0.05;
  p += Math.max(0, career.age - 30) * 0.0035; // age ramp
  p += Math.max(0, 60 - stamina) * 0.0007;
  p += Math.max(0, 60 - professionalism) * 0.0005;
  if (hasTrait(career, "INJURY_PRONE")) p += 0.03;
  if (hasTrait(career, "PROFESSIONAL")) p -= 0.01;
  p *= intensity;
  return clamp(p, 0, 0.5);
}

/** Roll severity weighted toward minor injuries; major/career-threatening are rare. */
export function rollSeverity(career: Career, key: string): InjurySeverity {
  const r = rng(career.seed, "injury-severity", key);
  const ageFactor = clamp((career.age - 28) / 20, 0, 1);
  const roll = r.float();
  // Older players skew toward more serious injuries.
  if (roll < 0.55 - ageFactor * 0.2) return "MINOR";
  if (roll < 0.85 - ageFactor * 0.1) return "MODERATE";
  if (roll < 0.97) return "MAJOR";
  return "CAREER_THREATENING";
}

export function isInjured(career: Career): boolean {
  return !!career.injury && career.injury.weeksRemaining > 0;
}

/** Advance injury recovery by one week. Returns true if the player just recovered. */
export function tickInjuryRecovery(career: Career): boolean {
  if (!career.injury) return false;
  if (career.injury.weeksRemaining > 0) {
    career.injury.weeksRemaining -= 1;
    if (career.injury.weeksRemaining <= 0) {
      career.injury = undefined;
      return true;
    }
  }
  return false;
}
