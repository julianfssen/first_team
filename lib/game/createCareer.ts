/**
 * Player & career creation.
 *
 * Builds starting attributes from position family + playstyle + background +
 * personality, seeds status, picks a starting club in the chosen region, and
 * initialises trait progress.
 */

import { nanoid } from "nanoid";
import type {
  Attributes,
  AttributeKey,
  Background,
  Career,
  CreateCareerInput,
  Personality,
  PlayerStatus,
  Playstyle,
  PositionFamily,
  TraitId,
  TraitProgress,
} from "./types";
import { TRAITS } from "@/data/traits";
import { FAMILY_WEIGHTS, overallRating } from "./weights";
import { POSITION_FAMILY, START_AGE } from "./constants";
import { clampAttr, clampStatus, emptySeasonStats } from "./util";
import { rng, Rng } from "./rng";
import { clubsInRegion } from "./world";
import { pushTimeline } from "./timeline";

const ALL_ATTRS: AttributeKey[] = [
  "finishing", "passing", "dribbling", "pace", "strength", "stamina",
  "defending", "positioning", "composure", "professionalism", "goalkeeping",
  "aerialAbility", "workRate", "vision", "leadership",
];

const PLAYSTYLE_MODS: Record<Playstyle, Partial<Record<AttributeKey, number>>> = {
  BALANCED: {},
  TECHNICAL: { passing: 5, dribbling: 5, vision: 4 },
  PHYSICAL: { strength: 6, stamina: 5, aerialAbility: 4 },
  CREATIVE: { vision: 6, passing: 4, composure: 4 },
  CLINICAL: { finishing: 7, composure: 4, positioning: 4 },
  DEFENSIVE: { defending: 6, positioning: 5, workRate: 4 },
};

const BACKGROUND_MODS: Record<Background, Partial<Record<AttributeKey, number>>> = {
  ACADEMY_KID: { positioning: 5, professionalism: 5, composure: 3 },
  STREET_FOOTBALLER: { dribbling: 6, composure: 4, professionalism: -4 },
  FUTSAL_PRODIGY: { dribbling: 8, composure: 5, strength: -5 },
  LATE_BLOOMER: { finishing: -3, passing: -3, defending: -3, pace: -3, dribbling: -3 },
  RICH_FAMILY: { professionalism: 4, composure: 3, workRate: -4 },
  WORKING_CLASS: { workRate: 6, stamina: 4, strength: 3 },
  SCOUTED_SMALL_TOWN: { workRate: 5, pace: 4, composure: -3 },
  MULTI_SPORT_ATHLETE: { pace: 6, strength: 5, stamina: 5, finishing: -4, passing: -3 },
};

const PERSONALITY_ATTR_MODS: Record<Personality, Partial<Record<AttributeKey, number>>> = {
  HUMBLE: { professionalism: 3 },
  AMBITIOUS: { finishing: 2, dribbling: 2 },
  PROFESSIONAL: { professionalism: 8, stamina: 2 },
  FLASHY: { dribbling: 5, finishing: 2 },
  HOT_HEADED: { strength: 4, composure: -6 },
  LOYAL: { leadership: 3, professionalism: 2 },
};

const PERSONALITY_STATUS_MODS: Record<Personality, Partial<Record<keyof PlayerStatus, number>>> = {
  HUMBLE: { morale: 8, teamChemistry: 6, reputation: -2 },
  AMBITIOUS: { confidence: 8, reputation: 4, coachTrust: -3 },
  PROFESSIONAL: { injuryRisk: -6, coachTrust: 5 },
  FLASHY: { mediaPressure: 10, reputation: 6, coachTrust: -4 },
  HOT_HEADED: { mediaPressure: 6, injuryRisk: 4, coachTrust: -5 },
  LOYAL: { coachTrust: 8, morale: 6 },
};

const PERSONALITY_TRAIT_SEED: Record<Personality, { traitId: TraitId; amount: number }[]> = {
  HUMBLE: [{ traitId: "TEAM_PLAYER", amount: 20 }],
  AMBITIOUS: [{ traitId: "MERCENARY", amount: 15 }],
  PROFESSIONAL: [{ traitId: "PROFESSIONAL", amount: 30 }],
  FLASHY: [{ traitId: "MEDIA_DARLING", amount: 20 }, { traitId: "SELFISH", amount: 10 }],
  HOT_HEADED: [{ traitId: "HOT_HEADED", amount: 30 }],
  LOYAL: [{ traitId: "LOYAL_SERVANT", amount: 25 }],
};

const BACKGROUND_TRAIT_SEED: Record<Background, { traitId: TraitId; amount: number }[]> = {
  ACADEMY_KID: [{ traitId: "COACHS_FAVORITE", amount: 15 }],
  STREET_FOOTBALLER: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 15 }],
  FUTSAL_PRODIGY: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 20 }, { traitId: "PRESS_RESISTANT", amount: 15 }],
  LATE_BLOOMER: [{ traitId: "LATE_BLOOMER", amount: 40 }],
  RICH_FAMILY: [],
  WORKING_CLASS: [{ traitId: "PROFESSIONAL", amount: 10 }],
  SCOUTED_SMALL_TOWN: [{ traitId: "WONDERKID", amount: 10 }],
  MULTI_SPORT_ATHLETE: [],
};

function baseAttributes(family: PositionFamily, r: Rng): Attributes {
  const attrs = {} as Attributes;
  const BASE = 36;
  for (const key of ALL_ATTRS) {
    attrs[key] = BASE + Math.round(r.noise(5));
  }
  // Goalkeeping is binary-ish: high for keepers, near-zero for outfielders.
  attrs.goalkeeping = family === "GOALKEEPER" ? 48 + Math.round(r.noise(4)) : 8 + Math.round(r.noise(3));

  // Emphasise the position family's key attributes.
  const weights = FAMILY_WEIGHTS[family];
  for (const key in weights) {
    const k = key as AttributeKey;
    attrs[k] += Math.round((weights[k] ?? 0) * 55);
  }
  // Young players: physical traits a touch ahead of mental ones.
  attrs.leadership = Math.max(20, attrs.leadership - 8);
  attrs.composure = Math.max(25, attrs.composure - 4);
  attrs.professionalism = Math.max(30, attrs.professionalism);
  return attrs;
}

function applyAttrMods(attrs: Attributes, mods: Partial<Record<AttributeKey, number>>): void {
  for (const key in mods) {
    const k = key as AttributeKey;
    attrs[k] = clampAttr(attrs[k] + (mods[k] ?? 0));
  }
}

function pickStartingClubId(input: CreateCareerInput, r: Rng): string {
  const pool = clubsInRegion(input.startingRegion);
  if (pool.length === 0) {
    // Fallback: any club anywhere (shouldn't happen with seeded data).
    return "free-agent";
  }
  // Prefer clubs that take young players and give minutes; modest reputation.
  const youthFriendly = pool.filter(
    (c) => c.preferredAges.min <= START_AGE + 2 && c.reputation <= 78,
  );
  const candidates = youthFriendly.length > 0 ? youthFriendly : pool;
  const chosen = r.weighted(candidates, (c) => {
    let w = c.developmentQuality * 0.6 + c.minutesOpportunity * 0.8;
    // Slightly favour lower-reputation clubs for a 16-year-old's first stop.
    w += Math.max(0, 70 - c.reputation) * 0.5;
    if (c.style === "YOUTH_ACADEMY" || c.style === "DEVELOPMENT_CLUB") w += 40;
    if (c.style === "ELITE_CONTENDER") w *= 0.3;
    return w;
  });
  return chosen.id;
}

export function createCareer(input: CreateCareerInput): Career {
  const seed = input.seed ?? nanoid();
  const r = rng(seed, "create");
  const family = POSITION_FAMILY[input.position];

  const attributes = baseAttributes(family, r);
  applyAttrMods(attributes, PLAYSTYLE_MODS[input.playstyle]);
  applyAttrMods(attributes, BACKGROUND_MODS[input.background]);
  applyAttrMods(attributes, PERSONALITY_ATTR_MODS[input.personality]);

  const status: PlayerStatus = {
    form: 50,
    fatigue: 8,
    confidence: 50,
    morale: 62,
    coachTrust: 45,
    teamChemistry: 42,
    reputation: 8,
    mediaPressure: 10,
    injuryRisk: 14,
  };
  // Personality status nudges.
  const sMods = PERSONALITY_STATUS_MODS[input.personality];
  for (const key in sMods) {
    const k = key as keyof PlayerStatus;
    status[k] = clampStatus(status[k] + (sMods[k] ?? 0));
  }

  // Seed all trait progress entries at zero, then apply starting nudges.
  const traits: TraitProgress[] = TRAITS.map((t) => ({
    traitId: t.id,
    progress: 0,
    threshold: t.threshold,
    unlocked: false,
  }));
  const seedTrait = (traitId: TraitId, amount: number) => {
    const entry = traits.find((t) => t.traitId === traitId);
    if (entry) entry.progress = Math.min(entry.threshold - 1, entry.progress + amount);
  };
  for (const s of PERSONALITY_TRAIT_SEED[input.personality]) seedTrait(s.traitId, s.amount);
  for (const s of BACKGROUND_TRAIT_SEED[input.background]) seedTrait(s.traitId, s.amount);

  const clubId = pickStartingClubId(input, r);

  const career: Career = {
    version: 1,
    id: nanoid(),
    seed,
    createdAt: new Date().toISOString(),

    player: {
      name: input.name,
      nationality: input.nationality,
      strongFoot: input.strongFoot,
      playstyle: input.playstyle,
      personality: input.personality,
      background: input.background,
    },
    attributes,
    status,

    position: input.position,
    positionFamily: family,
    clubId,
    startingRegion: input.startingRegion,

    age: START_AGE,
    season: 1,
    week: 1,
    phase: "PROSPECT",
    retired: false,

    wage: 5 + Math.round(overallRating(attributes, family) / 10),
    marketValue: 100 + overallRating(attributes, family) * 5,
    highestMarketValue: 0,

    seasonStats: emptySeasonStats(),
    careerStats: emptySeasonStats(),
    internationalStats: {
      caps: 0, goals: 0, assists: 0, cleanSheets: 0, tournamentsPlayed: 0, trophies: 0,
    },
    seasonHistory: [],

    traits,
    timeline: [],

    clubsPlayedFor: [clubId],
    regionsPlayedIn: [input.startingRegion],
    trophies: [],
    awards: [],

    flags: { debuted: false, firstGoal: false },
  };
  career.highestMarketValue = career.marketValue;

  pushTimeline(
    career,
    "MILESTONE",
    `Signed first youth deal at age ${START_AGE}, beginning a career in ${input.startingRegion.replace(/_/g, " ").toLowerCase()}.`,
  );

  return career;
}
