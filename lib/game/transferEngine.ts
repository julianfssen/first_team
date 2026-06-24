/**
 * Transfers.
 *
 * Offers are generated at season end based on the player's desirability (recent
 * form, reputation, ability, age) and weighted toward clubs that fit the
 * player's career phase. Accepting switches club/region; rejecting (staying)
 * rewards loyalty.
 */

import type { Career, Club, SquadRole, TransferOffer } from "./types";
import { allClubs, getClub } from "./world";
import { overallRating } from "./weights";
import { clone, clamp, applyStatusDelta } from "./util";
import { addTraitProgress } from "./effects";
import { pushTimeline } from "./timeline";
import { rng, Rng } from "./rng";
import { REGIONS } from "@/data/regions";

function desirability(career: Career): number {
  const last = career.seasonHistory[career.seasonHistory.length - 1];
  const avg = last?.stats.averageRating || career.careerStats.averageRating || 6.4;
  const apps = last?.stats.appearances ?? 0;
  const overall = overallRating(career.attributes, career.positionFamily);
  let d =
    career.status.reputation * 0.5 +
    (avg - 6.5) * 28 +
    overall * 0.45 +
    (apps >= 15 ? 8 : 0);
  if (career.age >= 33) d -= (career.age - 32) * 3;
  return clamp(d, 0, 100);
}

function roleFor(career: Career, club: Club, overall: number): SquadRole {
  const gap = overall - club.reputation;
  if (career.age >= 33) return gap > 0 ? "VETERAN_MENTOR" : "ROTATION";
  if (career.age <= 19 && club.reputation > overall + 8) return "YOUTH_PROSPECT";
  if (gap >= 14) return "STAR_PLAYER";
  if (gap >= 6) return career.attributes.leadership > 70 ? "CAPTAIN_CANDIDATE" : "STARTER";
  if (gap >= -6) return "STARTER";
  if (gap >= -16) return "ROTATION";
  return "YOUTH_PROSPECT";
}

const ROLE_MINUTES: Record<SquadRole, number> = {
  YOUTH_PROSPECT: 35,
  ROTATION: 55,
  STARTER: 80,
  STAR_PLAYER: 90,
  CAPTAIN_CANDIDATE: 92,
  VETERAN_MENTOR: 55,
};

function buildOffer(career: Career, club: Club, overall: number, r: Rng, index: number): TransferOffer {
  const role = roleFor(career, club, overall);
  const region = REGIONS[club.region];
  const wage = Math.round(
    (club.wageLevel * 0.6 + region.wageLevel * 0.4) *
      (role === "STAR_PLAYER" || role === "CAPTAIN_CANDIDATE" ? 1.4 : role === "VETERAN_MENTOR" ? 1.1 : 1) *
      (1 + overall / 200),
  );
  const expectedMinutes = clamp(
    Math.round((ROLE_MINUTES[role] * 0.6 + club.minutesOpportunity * 0.4) + r.noise(6)),
    10,
    98,
  );
  const currentClub = getClub(career.clubId);
  const prestigeGain = clamp(club.reputation - (currentClub?.reputation ?? 0), 0, 100);

  let reason: string;
  switch (role) {
    case "STAR_PLAYER": reason = "They want to build the team around you."; break;
    case "CAPTAIN_CANDIDATE": reason = "They see you as a future captain."; break;
    case "VETERAN_MENTOR": reason = "They want your experience to guide their youngsters."; break;
    case "YOUTH_PROSPECT": reason = "A development move with a clear pathway."; break;
    case "ROTATION": reason = "Squad depth at a bigger club — minutes must be earned."; break;
    default: reason = "They want you as a regular starter.";
  }

  return {
    id: `offer-${career.season}-${index}-${club.id}`,
    clubId: club.id,
    role,
    wage,
    contractYears: career.age >= 33 ? 1 : r.int(2, 4),
    expectedMinutes,
    developmentFit: club.developmentQuality,
    prestigeGain,
    risk: clamp(Math.round(club.pressure * 0.6 + prestigeGain * 0.4), 0, 100),
    reason,
  };
}

export function generateTransferOffers(career: Career): TransferOffer[] {
  const r = rng(career.seed, "transfers", career.season);
  const d = desirability(career);
  const overall = overallRating(career.attributes, career.positionFamily);

  let count = clamp(Math.floor(d / 22), 0, 4);
  // A struggling player at a strong club still tends to get a move option.
  if (count === 0 && career.age >= 30) count = r.chance(0.5) ? 1 : 0;

  if (count === 0) return [];

  const phase = career.phase;
  const candidates = allClubs().filter((club) => {
    if (club.id === career.clubId) return false;
    // Age-appropriate clubs.
    if (career.age + 1 < club.preferredAges.min - 2) return false;
    // Don't offer wildly out-of-reach clubs.
    if (club.reputation > d + 22) return false;
    return true;
  });

  const chosen = r.sample(
    candidates.length > 0 ? candidates : allClubs().filter((c) => c.id !== career.clubId),
    Math.min(count, 4),
  );

  // Phase flavour: nudge in money/lifestyle/return options for older players.
  const weighted = (club: Club): number => {
    let w = 100 - Math.abs(club.reputation - overall);
    w += club.developmentQuality * (phase === "PROSPECT" ? 0.6 : 0.1);
    if ((phase === "VETERAN" || phase === "FINAL_CHAPTER")) {
      if (club.region === "MIDDLE_EAST_GULF" || club.region === "NORTH_AMERICA") w += 40;
      if (club.region === career.startingRegion) w += 25; // return home
    }
    return Math.max(1, w);
  };

  const finalClubs = r.sample(
    chosen.length >= count ? chosen : candidates,
    count,
  ).sort((a, b) => weighted(b) - weighted(a));

  return finalClubs.map((club, i) => buildOffer(career, club, overall, r, i));
}

export function acceptTransferOffer(career: Career, offer: TransferOffer): Career {
  const c = clone(career);
  const club = getClub(offer.clubId);
  if (!club) return c;

  const fromRegion = getClub(c.clubId)?.region ?? c.startingRegion;
  c.clubId = club.id;
  c.wage = offer.wage;
  if (!c.clubsPlayedFor.includes(club.id)) c.clubsPlayedFor.push(club.id);
  if (!c.regionsPlayedIn.includes(club.region)) c.regionsPlayedIn.push(club.region);

  // Settling in.
  c.status.teamChemistry = clamp(40 + offer.developmentFit * 0.1, 30, 60);
  applyStatusDelta(c.status, "coachTrust", -6);
  applyStatusDelta(c.status, "morale", offer.prestigeGain > 0 ? 6 : 2);
  applyStatusDelta(c.status, "reputation", Math.round(offer.prestigeGain * 0.15));

  // Traits: moving builds Journeyman / Mercenary; crossing regions counts more.
  addTraitProgress(c, "JOURNEYMAN", club.region !== fromRegion ? 22 : 14);
  if (offer.wage > c.wage * 0.9 && offer.prestigeGain < 5) addTraitProgress(c, "MERCENARY", 12);

  pushTimeline(
    c,
    "TRANSFER",
    `Transferred to ${club.name} (${club.country}) as ${offer.role.replace(/_/g, " ").toLowerCase()}.`,
  );
  return c;
}

export function rejectTransferOffers(career: Career): Career {
  const c = clone(career);
  applyStatusDelta(c.status, "coachTrust", 3);
  applyStatusDelta(c.status, "morale", 2);
  addTraitProgress(c, "LOYAL_SERVANT", 16);
  // Staying at your very first club builds the One-Club Hero story.
  if (c.clubsPlayedFor.length === 1) addTraitProgress(c, "ONE_CLUB_HERO", 18);
  return c;
}
