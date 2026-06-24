/**
 * Zod schemas for validating persisted saves. Used to guard against corrupt or
 * incompatible save data on load.
 */

import { z } from "zod";

const num = z.number();

const attributesSchema = z.object({
  finishing: num, passing: num, dribbling: num, pace: num, strength: num,
  stamina: num, defending: num, positioning: num, composure: num,
  professionalism: num, goalkeeping: num, aerialAbility: num, workRate: num,
  vision: num, leadership: num,
});

const statusSchema = z.object({
  form: num, fatigue: num, confidence: num, morale: num, coachTrust: num,
  teamChemistry: num, reputation: num, mediaPressure: num, injuryRisk: num,
});

const seasonStatsSchema = z.object({
  appearances: num, starts: num, minutes: num, goals: num, assists: num,
  shots: num, keyPasses: num, ratingSum: num, averageRating: num,
  yellowCards: num, redCards: num, injuries: num, saves: num, cleanSheets: num,
  goalsConceded: num, penaltySaves: num, errorsLeadingToGoal: num, tackles: num,
  interceptions: num, blocks: num, clearances: num, aerialDuelsWon: num,
  passesCompleted: num, progressivePasses: num, chancesCreated: num,
  dribblesCompleted: num, crossesCompleted: num,
});

const internationalStatsSchema = z.object({
  caps: num, goals: num, assists: num, cleanSheets: num,
  tournamentsPlayed: num, trophies: num,
});

const traitProgressSchema = z.object({
  traitId: z.string(),
  progress: num,
  threshold: num,
  unlocked: z.boolean(),
});

const timelineEntrySchema = z.object({
  id: z.string(),
  season: num,
  week: num,
  age: num,
  type: z.string(),
  text: z.string(),
});

const seasonRecordSchema = z.object({
  season: num,
  age: num,
  clubId: z.string(),
  clubName: z.string(),
  competitionLevel: z.string(),
  stats: seasonStatsSchema,
  phase: z.string(),
});

const injurySchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: z.enum(["MINOR", "MODERATE", "MAJOR", "CAREER_THREATENING"]),
  weeksOut: num,
  weeksRemaining: num,
  season: num,
});

export const careerSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  seed: z.string(),
  createdAt: z.string(),
  player: z.object({
    name: z.string(),
    nationality: z.string(),
    strongFoot: z.enum(["LEFT", "RIGHT", "BOTH"]),
    playstyle: z.string(),
    personality: z.string(),
    background: z.string(),
  }),
  attributes: attributesSchema,
  status: statusSchema,
  position: z.string(),
  positionFamily: z.string(),
  clubId: z.string(),
  startingRegion: z.string(),
  age: num,
  season: num,
  week: num,
  phase: z.string(),
  retired: z.boolean(),
  retirementRecap: z.unknown().optional(),
  wage: num,
  marketValue: num,
  highestMarketValue: num,
  seasonStats: seasonStatsSchema,
  careerStats: seasonStatsSchema,
  internationalStats: internationalStatsSchema,
  seasonHistory: z.array(seasonRecordSchema),
  traits: z.array(traitProgressSchema),
  timeline: z.array(timelineEntrySchema),
  clubsPlayedFor: z.array(z.string()),
  regionsPlayedIn: z.array(z.string()),
  trophies: z.array(z.string()),
  awards: z.array(z.string()),
  injury: injurySchema.optional(),
  flags: z.object({
    debuted: z.boolean(),
    firstGoal: z.boolean(),
  }),
});

export const saveSlotSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.literal(1),
  career: careerSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const saveFileSchema = z.array(saveSlotSchema);
