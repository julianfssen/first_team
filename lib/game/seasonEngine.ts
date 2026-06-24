/**
 * Season wrap-up.
 *
 * finishSeason records the completed season, aggregates career totals, runs a
 * light national-team update, applies aging, then rolls into the next season.
 */

import type { Career, SeasonRecap, SeasonRecord } from "./types";
import { clone, emptySeasonStats, applyStatusDelta, round1 } from "./util";
import { applyAging, agingNotes } from "./agingEngine";
import { overallRating } from "./weights";
import { getClub, leagueForClub, clubLabel } from "./world";
import { pushTimeline } from "./timeline";
import { rng } from "./rng";
import { phaseForAge } from "./constants";

const ATTACK_FAMILIES = new Set(["STRIKER", "WINGER", "ATTACKING_MIDFIELDER", "CENTRAL_MIDFIELDER"]);
const DEFENSIVE_FAMILIES = new Set(["GOALKEEPER", "CENTRE_BACK", "FULLBACK", "WINGBACK"]);

function computeAwards(career: Career): { awards: string[]; trophies: string[] } {
  const awards: string[] = [];
  const trophies: string[] = [];
  const s = career.seasonStats;
  if (s.appearances >= 12 && s.averageRating >= 7.6) awards.push("Player of the Season");
  if (s.goals >= 18) awards.push("Golden Boot");
  else if (s.goals >= 12) awards.push("Top Scorer Nominee");
  if (s.assists >= 12) awards.push("Playmaker of the Year");
  if (DEFENSIVE_FAMILIES.has(career.positionFamily) && s.cleanSheets >= 10) {
    awards.push("Golden Glove");
  }
  if (career.age <= 21 && s.appearances >= 10 && s.averageRating >= 7.2) {
    awards.push("Young Player of the Season");
  }
  return { awards, trophies };
}

function maybeTrophy(career: Career): string | null {
  const club = getClub(career.clubId);
  if (!club) return null;
  const r = rng(career.seed, "trophy", career.season);
  // Title chance scales with club reputation and the player's average rating.
  const titleChance = Math.max(0, (club.reputation - 70) / 100) + (career.seasonStats.averageRating - 6.8) * 0.1;
  if (r.chance(Math.min(0.6, titleChance))) {
    const league = leagueForClub(club);
    return `${league?.name ?? "League"} Title`;
  }
  if (r.chance(0.12)) return "Domestic Cup";
  return null;
}

function updateInternational(career: Career): void {
  if (career.age < 18) return;
  const rep = career.status.reputation;
  if (rep < 42) return; // not (yet) on the national-team radar
  const r = rng(career.seed, "intl", career.season);
  if (career.internationalStats.caps === 0) {
    pushTimeline(career, "CALL_UP", "Earned a first senior national-team call-up.");
  }
  const caps = r.int(2, 8);
  career.internationalStats.caps += caps;
  if (r.chance(0.4)) career.internationalStats.tournamentsPlayed += 1;
  if (ATTACK_FAMILIES.has(career.positionFamily)) {
    career.internationalStats.goals += r.int(0, Math.round(caps / 2));
  }
  career.internationalStats.assists += r.int(0, Math.round(caps / 3));
  if (DEFENSIVE_FAMILIES.has(career.positionFamily)) {
    career.internationalStats.cleanSheets += r.int(0, Math.round(caps / 3));
  }
}

export function finishSeason(career: Career): SeasonRecap {
  const c = clone(career);
  const finishedSeasonNumber = c.season;
  const finishedStats = clone(c.seasonStats);
  const clubName = clubLabel(c.clubId);
  const club = getClub(c.clubId);
  const league = club ? leagueForClub(club) : undefined;

  // Awards & trophies for the season just played.
  const { awards } = computeAwards(c);
  c.awards.push(...awards.map((a) => `${a} (${c.season})`));
  for (const a of awards) pushTimeline(c, "AWARD", `Won ${a}.`);

  const trophy = maybeTrophy(c);
  const trophies: string[] = [];
  if (trophy) {
    const label = `${trophy} (${c.season})`;
    c.trophies.push(label);
    trophies.push(label);
    pushTimeline(c, "TROPHY", `Won the ${trophy}!`);
  }

  // National team.
  updateInternational(c);

  // Season highlights from this season's timeline.
  const highlights = c.timeline
    .filter((t) => t.season === finishedSeasonNumber && t.type !== "MILESTONE")
    .slice(-6)
    .map((t) => t.text);

  // Record the season.
  const record: SeasonRecord = {
    season: finishedSeasonNumber,
    age: c.age,
    clubId: c.clubId,
    clubName,
    competitionLevel: league?.name ?? "Unknown League",
    stats: finishedStats,
    phase: c.phase,
  };
  c.seasonHistory.push(record);

  // Aggregate career totals.
  for (const key in finishedStats) {
    const k = key as keyof typeof finishedStats;
    if (k === "averageRating") continue;
    c.careerStats[k] += finishedStats[k];
  }
  c.careerStats.averageRating =
    c.careerStats.appearances > 0
      ? round1(
          c.seasonHistory.reduce((sum, r) => sum + r.stats.ratingSum, 0) /
            c.careerStats.appearances,
        )
      : 0;

  // Aging (clones internally, returns next state).
  const before = { ...c.attributes };
  const aged = applyAging(c);
  const notes = agingNotes(before, aged.attributes);

  // Roll into the next season.
  aged.seasonStats = emptySeasonStats();
  aged.season = finishedSeasonNumber + 1;
  aged.week = 1;
  aged.phase = phaseForAge(aged.age);

  // Offseason recovery.
  aged.status.fatigue = Math.min(aged.status.fatigue, 10);
  applyStatusDelta(aged.status, "injuryRisk", -5);
  aged.status.form = Math.round((aged.status.form + 55) / 2);

  // Market value refresh.
  const overall = overallRating(aged.attributes, aged.positionFamily);
  const ageFactor = aged.age <= 28 ? 1 : Math.max(0.3, 1 - (aged.age - 28) * 0.05);
  aged.marketValue = Math.round((overall * 12 + aged.status.reputation * 6) * ageFactor);
  aged.highestMarketValue = Math.max(aged.highestMarketValue, aged.marketValue);

  return {
    season: finishedSeasonNumber,
    age: aged.age,
    stats: finishedStats,
    clubName,
    awards,
    highlights,
    agingNotes: notes,
    marketValue: aged.marketValue,
    newPhase: aged.phase,
    career: aged,
  };
}
