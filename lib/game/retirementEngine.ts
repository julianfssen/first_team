/**
 * Retirement & legacy.
 */

import type { Career, RetirementReason, RetirementRecap, SeasonRecord } from "./types";
import { careerTotals } from "./careerEngine";
import { hasTrait } from "./effects";
import { clubLabel } from "./world";
import { START_AGE } from "./constants";

function bestSeason(career: Career): SeasonRecord | undefined {
  return [...career.seasonHistory]
    .filter((s) => s.stats.appearances >= 5)
    .sort((a, b) => b.stats.averageRating - a.stats.averageRating)[0];
}

function iconicMoment(career: Career): string | undefined {
  const priority: Record<string, number> = {
    TROPHY: 5, AWARD: 4, CALL_UP: 3, FIRST_GOAL: 2, POSITION_CHANGE: 1,
  };
  const ranked = [...career.timeline]
    .filter((t) => priority[t.type] !== undefined)
    .sort((a, b) => (priority[b.type] ?? 0) - (priority[a.type] ?? 0));
  return ranked[0]?.text;
}

function deriveLegacyTitle(career: Career): string {
  const totals = careerTotals(career);
  const rep = career.status.reputation;
  const clubs = career.clubsPlayedFor.length;
  const trophies = career.trophies.length;
  const caps = career.internationalStats.caps;
  const family = career.positionFamily;
  const best = bestSeason(career);

  // Highest-priority, most specific stories first.
  if (rep >= 88 && trophies >= 5 && caps >= 40) return "Global Icon";
  if (career.age <= 26 && career.careerStats.injuries >= 5) return "Injury-Ruined Wonderkid";
  if (clubs === 1 && career.seasonHistory.length >= 8) return "One-Club Hero";
  if (caps >= 50 && career.internationalStats.goals >= 15) return "National Legend";
  if (clubs >= 6) return "Journeyman King";
  if (hasTrait(career, "MERCENARY") && rep >= 70) return "Mercenary Superstar";

  if (family === "GOALKEEPER" && totals.cleanSheets >= 60) return "Safe Hands Legend";
  if ((family === "CENTRE_BACK" || family === "FULLBACK") && totals.tackles + totals.clearances >= 400) {
    return "Defensive Wall";
  }
  if ((family === "CENTRAL_MIDFIELDER" || family === "DEFENSIVE_MIDFIELDER" || family === "ATTACKING_MIDFIELDER") &&
      totals.assists >= 80) {
    return "Midfield General";
  }
  if (totals.goals >= 150) return "Goal Machine";
  if (hasTrait(career, "BIG_GAME_PLAYER") && trophies >= 3) return "Big Game Hero";
  if (best && best.age >= 30) return "Late Bloomer";
  if (hasTrait(career, "VETERAN_MENTOR") || career.age >= 40) return "Veteran Mentor";
  if (trophies >= 2 && rep < 75) return "Underdog Legend";
  if (rep >= 70) return "Cult Hero";
  if (rep < 40) return "Forgotten Talent";
  return "Cult Hero";
}

export function retireCareer(career: Career, reason: RetirementReason): RetirementRecap {
  const totals = careerTotals(career);
  const seasons = career.seasonHistory.length + (career.seasonStats.appearances > 0 ? 1 : 0);

  return {
    reason,
    legacyTitle: deriveLegacyTitle(career),
    careerSpan: `Age ${START_AGE}–${career.age} · ${seasons} season${seasons === 1 ? "" : "s"}`,
    clubsPlayedFor: career.clubsPlayedFor.map((id) => clubLabel(id)),
    regionsPlayedIn: [...career.regionsPlayedIn],
    careerStats: totals,
    internationalStats: { ...career.internationalStats },
    trophies: [...career.trophies],
    awards: [...career.awards],
    bestSeason: bestSeason(career),
    highestMarketValue: career.highestMarketValue,
    iconicMoment: iconicMoment(career),
    finalReputation: Math.round(career.status.reputation),
  };
}

export const RETIREMENT_REASON_LABEL: Record<RetirementReason, string> = {
  PLAYER_CHOICE: "Retired by choice",
  FORCED_AGE: "Reached the end of the road at 45",
  MAJOR_INJURY: "Forced to retire through injury",
  NO_OFFERS: "Retired with no offers on the table",
};
