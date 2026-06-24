/**
 * Match engine.
 *
 * A match is a handful of key MOMENTS, not a 90-minute simulation. The engine
 * builds the match context, instantiates position-appropriate moments, resolves
 * each chosen option via weighted attribute checks + status/trait/opponent
 * modifiers + seeded noise, then folds everything into a MatchResult.
 */

import type {
  AttributeCheck,
  Career,
  MatchContext,
  MatchImportance,
  MatchMoment,
  MatchMomentChoiceTemplate,
  MatchMomentResult,
  MatchMomentTemplate,
  MatchOutcomeType,
  MatchResult,
  PlayerStatus,
  SeasonStats,
} from "./types";
import { MATCH_MOMENTS } from "@/data/matchMoments";
import { HEADLINES } from "@/data/headlines";
import { CHECK_WEIGHTS, weightedAttributeScore, overallRating } from "./weights";
import {
  OUTCOME_EFFECTS,
  ResolutionTier,
  ratingDeltaForOutcome,
  finalMatchRating,
} from "./ratingEngine";
import { Rng, rng } from "./rng";
import { clamp, clone, addStats, recomputeAverageRating, applyStatusDelta } from "./util";
import { getClub, clubsInRegion, clubLabel } from "./world";
import { hasTrait, addTraitProgress } from "./effects";
import { pushTimeline } from "./timeline";
import { injuryProbability, rollSeverity, createInjury, isInjured } from "./injuryEngine";
import { FULL_MATCH_MINUTES, SEASON_WEEKS } from "./constants";

const DEFENSIVE_FAMILIES = new Set(["GOALKEEPER", "CENTRE_BACK", "FULLBACK", "WINGBACK"]);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export function generateMatchContext(career: Career): MatchContext {
  const r = rng(career.seed, "ctx", career.season, career.week);
  const ownClub = getClub(career.clubId);
  const region = ownClub?.region ?? career.startingRegion;
  const opponents = clubsInRegion(region).filter((c) => c.id !== career.clubId);
  const opponent = opponents.length > 0 ? r.pick(opponents) : undefined;
  const opponentStrength = clamp(
    Math.round((opponent?.reputation ?? 55) + r.noise(12)),
    20,
    99,
  );

  // Competition mix.
  let competition: MatchContext["competition"] = "LEAGUE";
  const compRoll = r.float();
  if (compRoll > 0.86) competition = "DOMESTIC_CUP";
  else if (compRoll > 0.78 && (ownClub?.reputation ?? 0) > 70) competition = "CONTINENTAL";

  // Importance: late-season + cup/continental skew higher.
  const lateSeason = career.week >= SEASON_WEEKS - 2;
  let importance: MatchImportance = "MEDIUM";
  const impRoll = r.float();
  if (competition === "CONTINENTAL" || (competition === "DOMESTIC_CUP" && impRoll > 0.5)) {
    importance = impRoll > 0.7 ? "CLUTCH" : "HIGH";
  } else if (lateSeason && impRoll > 0.4) {
    importance = "HIGH";
  } else if (impRoll < 0.25) {
    importance = "LOW";
  }

  // Starter? Coach trust, form, minutes opportunity and ability vs squad.
  const starterScore =
    career.status.coachTrust * 0.45 +
    career.status.form * 0.25 +
    (ownClub?.minutesOpportunity ?? 50) * 0.15 +
    overallRating(career.attributes, career.positionFamily) * 0.15;
  const isStarter = hasTrait(career, "SUPER_SUB")
    ? r.chance(0.55)
    : starterScore >= 48 || r.chance(clamp(starterScore / 120, 0.05, 0.9));

  return {
    matchId: `m-${career.season}-${career.week}`,
    season: career.season,
    week: career.week,
    competition,
    importance,
    opponentName: opponent ? opponent.name : "Visitors FC",
    opponentStrength,
    homeAway: r.chance(0.5) ? "HOME" : "AWAY",
    isStarter,
  };
}

// ---------------------------------------------------------------------------
// Moments
// ---------------------------------------------------------------------------

const MOMENT_COUNT: Record<MatchImportance, [number, number]> = {
  LOW: [1, 2],
  MEDIUM: [2, 3],
  HIGH: [3, 4],
  CLUTCH: [4, 5],
};

function templatesForFamily(family: string): MatchMomentTemplate[] {
  return MATCH_MOMENTS.filter((m) => m.positionFamilies.includes(family as never));
}

export function generateMatchMoments(career: Career, ctx: MatchContext): MatchMoment[] {
  const r = rng(career.seed, "moments", ctx.matchId);
  const pool = templatesForFamily(career.positionFamily);
  if (pool.length === 0) return [];

  const [lo, hi] = MOMENT_COUNT[ctx.importance];
  const count = Math.min(r.int(lo, hi), pool.length);
  const chosen = r.sample(pool, count);

  // Assign ascending minutes.
  const minutes = chosen
    .map(() => r.int(3, FULL_MATCH_MINUTES))
    .sort((a, b) => a - b);

  return chosen.map((tpl, i) => {
    const isLast = i === chosen.length - 1;
    const importance: MatchImportance =
      isLast && (ctx.importance === "HIGH" || ctx.importance === "CLUTCH")
        ? "CLUTCH"
        : ctx.importance;
    return {
      id: `${ctx.matchId}-mom-${i}-${tpl.id}`,
      templateId: tpl.id,
      positionFamilies: tpl.positionFamilies,
      minute: minutes[i],
      title: tpl.title,
      description: tpl.description,
      importance,
      choices: tpl.choices,
    };
  });
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

function fatiguePenalty(fatigue: number): number {
  if (fatigue <= 30) return 0;
  if (fatigue <= 60) return (fatigue - 30) * 0.12;
  if (fatigue <= 80) return 3.6 + (fatigue - 60) * 0.25;
  return 8.6 + (fatigue - 80) * 0.4;
}

function traitCheckModifier(career: Career, ctx: MatchContext, check: AttributeCheck): number {
  let m = 0;
  const big = ctx.importance === "HIGH" || ctx.importance === "CLUTCH";
  if (big && hasTrait(career, "BIG_GAME_PLAYER")) m += 6;
  if (!ctx.isStarter && hasTrait(career, "SUPER_SUB")) m += 5;
  if (hasTrait(career, "HOT_HEADED")) m -= 2;
  switch (check) {
    case "SHOOT":
      if (hasTrait(career, "CLINICAL_FINISHER")) m += 5;
      if (hasTrait(career, "PENALTY_SPECIALIST")) m += 2;
      break;
    case "PASS":
      if (hasTrait(career, "PLAYMAKER")) m += 5;
      if (hasTrait(career, "SET_PIECE_THREAT")) m += 2;
      break;
    case "DRIBBLE":
      if (hasTrait(career, "EXPLOSIVE_DRIBBLER")) m += 5;
      break;
    case "DEFEND":
      if (hasTrait(career, "HARD_TACKLER")) m += 4;
      break;
    case "AERIAL":
    case "PHYSICAL":
      if (hasTrait(career, "TARGET_MAN")) m += 4;
      break;
    case "COMPOSURE":
      if (hasTrait(career, "PRESS_RESISTANT")) m += 4;
      break;
    case "GK_SAVE":
      if (hasTrait(career, "SAFE_HANDS")) m += 5;
      break;
    case "GK_DISTRIBUTION":
      if (hasTrait(career, "SWEEPER_KEEPER")) m += 4;
      break;
  }
  return m;
}

const RISK_THRESHOLDS: Record<string, { success: number; partial: number }> = {
  LOW: { success: 46, partial: 32 },
  MEDIUM: { success: 58, partial: 42 },
  HIGH: { success: 70, partial: 50 },
};

function tierFromScore(score: number, risk: string): ResolutionTier {
  const t = RISK_THRESHOLDS[risk];
  if (score >= t.success + 10) return "GREAT";
  if (score >= t.success) return "GOOD";
  if (score >= t.partial) return "OK";
  if (score >= t.partial - 15) return "POOR";
  return "DISASTER";
}

function outcomeForTier(choice: MatchMomentChoiceTemplate, tier: ResolutionTier): MatchOutcomeType {
  switch (tier) {
    case "GREAT":
    case "GOOD":
      return choice.successOutcome;
    case "OK":
      return choice.partialOutcome ?? "GOOD_DECISION";
    case "POOR":
    case "DISASTER":
    default:
      return choice.failureOutcome;
  }
}

/** Pure: resolve a single moment choice into its outcome. Does not mutate the career. */
export function resolveMatchMoment(
  career: Career,
  ctx: MatchContext,
  moment: MatchMoment,
  choiceId: string,
): MatchMomentResult {
  const choice = moment.choices.find((c) => c.id === choiceId) ?? moment.choices[0];
  const r = rng(career.seed, "resolve", moment.id, choiceId);

  const base = weightedAttributeScore(career.attributes, CHECK_WEIGHTS[choice.check]);
  const s = career.status;
  const statusMod =
    (s.form - 50) * 0.12 +
    (s.confidence - 50) * 0.1 +
    (s.coachTrust - 50) * 0.04 +
    (s.teamChemistry - 50) * 0.03;
  const traitMod = traitCheckModifier(career, ctx, choice.check);
  const oppPenalty = (ctx.opponentStrength - 50) * 0.25;
  const moment_importance_pressure =
    (moment.importance === "CLUTCH" ? -3 : moment.importance === "HIGH" ? -1.5 : 0) *
    (1 - s.confidence / 130);
  const noise = r.noise(13);

  const score =
    base + statusMod + traitMod - fatiguePenalty(s.fatigue) - oppPenalty +
    moment_importance_pressure + noise;

  const tier = tierFromScore(score, choice.risk);
  let outcome = outcomeForTier(choice, tier);

  // Hot-headed players occasionally tip a bad high-risk tackle into a card.
  if (
    tier === "DISASTER" &&
    choice.check === "DEFEND" &&
    choice.risk === "HIGH" &&
    r.chance(hasTrait(career, "HOT_HEADED") ? 0.4 : 0.12)
  ) {
    outcome = r.chance(0.2) ? "RED_CARD" : "YELLOW_CARD";
  }

  const eff = OUTCOME_EFFECTS[outcome];
  return {
    moment,
    choiceId: choice.id,
    outcome,
    tier,
    ratingDelta: ratingDeltaForOutcome(outcome, tier),
    statDeltas: { ...eff.stats },
    narrative: `${moment.minute}' — ${eff.narrative}`,
  };
}

// ---------------------------------------------------------------------------
// Finishing the match
// ---------------------------------------------------------------------------

function sampleGoals(r: Rng, lambda: number): number {
  return Math.max(0, Math.round(lambda + r.noise(1.3)));
}

function pickHeadline(
  r: Rng,
  tone: "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  fill: Record<string, string | number>,
): string {
  const pool = HEADLINES.filter((h) => h.tone === tone);
  const tpl = pool.length > 0 ? r.pick(pool) : { text: "Another matchday in the books." };
  return tpl.text.replace(/\{(\w+)\}/g, (_, k) => String(fill[k] ?? ""));
}

export function finishMatch(
  career: Career,
  ctx: MatchContext,
  momentResults: MatchMomentResult[],
): MatchResult {
  const r = rng(career.seed, "finish", ctx.matchId);
  const ownClub = getClub(career.clubId);
  const teamBase = ownClub?.reputation ?? 55;
  const diff = teamBase - ctx.opponentStrength;

  // Baseline scoreline from the rest of the team, then add player contributions.
  let teamScore = sampleGoals(r, clamp(0.9 + diff * 0.018, 0.1, 3.0));
  let opponentScore = sampleGoals(r, clamp(0.9 - diff * 0.018, 0.1, 3.0));

  const statDeltas: Partial<SeasonStats> = {};
  const momentDeltas: number[] = [];
  let matchGoals = 0;
  for (const mr of momentResults) {
    momentDeltas.push(mr.ratingDelta);
    addStats(statDeltas as SeasonStats, mr.statDeltas);
    const eff = OUTCOME_EFFECTS[mr.outcome];
    if (eff.teamGoal) {
      teamScore += 1;
      if (mr.outcome === "GOAL") matchGoals += 1;
    }
    if (eff.opponentGoal) opponentScore += 1;
  }

  const teamWon = teamScore > opponentScore;
  const teamDrew = teamScore === opponentScore;
  const isDefensive = DEFENSIVE_FAMILIES.has(career.positionFamily);
  const cleanSheet = opponentScore === 0 && isDefensive && ctx.isStarter;
  if (cleanSheet) statDeltas.cleanSheets = (statDeltas.cleanSheets ?? 0) + 1;
  if (isDefensive && ctx.isStarter) {
    statDeltas.goalsConceded = (statDeltas.goalsConceded ?? 0) + opponentScore;
  }

  const rating = finalMatchRating(momentDeltas, {
    teamWon,
    teamDrew,
    cleanSheetBonus: cleanSheet,
    fatigue: career.status.fatigue,
  });

  // Injury roll for the match.
  let injury: MatchResult["injury"];
  const forcedInjury = momentResults.some((mr) => mr.outcome === "INJURY");
  const intensity = ctx.importance === "CLUTCH" ? 1.3 : ctx.importance === "HIGH" ? 1.15 : 1;
  if (!isInjured(career) && (forcedInjury || r.chance(injuryProbability(career, intensity)))) {
    const severity = forcedInjury ? rollSeverity(career, ctx.matchId + "-forced") : rollSeverity(career, ctx.matchId);
    injury = createInjury(career, severity);
  }

  // Status deltas.
  const fatigueAdd = (ctx.isStarter ? 16 : 8) + (intensity - 1) * 12;
  const statusDeltas: Partial<PlayerStatus> = {
    fatigue: Math.round(fatigueAdd),
    form: clamp((rating - 6.5) * 4, -12, 14),
    confidence: clamp((rating - 6.3) * 3, -10, 12),
    morale: (teamWon ? 4 : teamDrew ? 1 : -3) + clamp((rating - 6.5) * 2, -6, 6),
    coachTrust: clamp((rating - 6.4) * 1.6, -8, 8),
    reputation: clamp((rating - 6.5) * 1.3, -4, 6) * (ctx.importance === "CLUTCH" ? 1.6 : ctx.importance === "HIGH" ? 1.3 : 1),
    mediaPressure: ctx.importance === "CLUTCH" ? 4 : ctx.importance === "HIGH" ? 2 : 0,
  };

  // Headline.
  const tone: "POSITIVE" | "NEUTRAL" | "NEGATIVE" =
    rating >= 7.3 || matchGoals > 0 ? "POSITIVE" : rating <= 5.3 ? "NEGATIVE" : "NEUTRAL";
  const headline = pickHeadline(r, tone, {
    player: career.player.name,
    opponent: ctx.opponentName,
    goals: matchGoals,
    rating: rating.toFixed(1),
    club: clubLabel(career.clubId),
  });

  return {
    matchId: ctx.matchId,
    context: ctx,
    teamScore,
    opponentScore,
    rating,
    momentResults,
    statDeltas,
    statusDeltas,
    headline,
    injury,
  };
}

// ---------------------------------------------------------------------------
// Applying the result to the career
// ---------------------------------------------------------------------------

const OUTCOME_TRAIT_PROGRESS: Partial<Record<MatchOutcomeType, { traitId: import("./types").TraitId; amount: number }[]>> = {
  GOAL: [{ traitId: "CLINICAL_FINISHER", amount: 4 }],
  ASSIST: [{ traitId: "PLAYMAKER", amount: 4 }],
  KEY_PASS: [{ traitId: "PLAYMAKER", amount: 1 }],
  DRIBBLE_PAST: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 2 }],
  TACKLE_WON: [{ traitId: "HARD_TACKLER", amount: 2 }],
  SAVE: [{ traitId: "SAFE_HANDS", amount: 2 }],
  PENALTY_SAVE: [{ traitId: "SAFE_HANDS", amount: 6 }],
  CROSS_COMPLETED: [{ traitId: "SET_PIECE_THREAT", amount: 1 }],
};

export function applyMatchResult(career: Career, result: MatchResult): Career {
  const c = clone(career);
  const ctx = result.context;
  const big = ctx.importance === "HIGH" || ctx.importance === "CLUTCH";

  // Debut milestone.
  if (!c.flags.debuted) {
    c.flags.debuted = true;
    pushTimeline(c, "DEBUT", `Made competitive debut for ${clubLabel(c.clubId)}.`);
  }

  // Appearance bookkeeping.
  const minutes = ctx.isStarter ? FULL_MATCH_MINUTES : rng(c.seed, "minutes", ctx.matchId).int(15, 35);
  c.seasonStats.appearances += 1;
  if (ctx.isStarter) c.seasonStats.starts += 1;
  c.seasonStats.minutes += minutes;

  // Fold in match stats + rating.
  addStats(c.seasonStats, result.statDeltas);
  c.seasonStats.ratingSum += result.rating;
  recomputeAverageRating(c.seasonStats);

  // Status changes.
  for (const key in result.statusDeltas) {
    const k = key as keyof PlayerStatus;
    applyStatusDelta(c.status, k, result.statusDeltas[k] ?? 0);
  }

  // Trait progress from chosen options + outcomes.
  let matchGoals = 0;
  for (const mr of result.momentResults) {
    const choice = mr.moment.choices.find((ch) => ch.id === mr.choiceId);
    if (choice?.traitProgress) {
      for (const tp of choice.traitProgress) addTraitProgress(c, tp.traitId, tp.amount);
    }
    const outcomeProg = OUTCOME_TRAIT_PROGRESS[mr.outcome];
    if (outcomeProg) for (const tp of outcomeProg) addTraitProgress(c, tp.traitId, tp.amount);
    if (mr.outcome === "GOAL") matchGoals += 1;
  }
  // Big-game performances build the Big Game Player trait.
  if (big && result.rating >= 7.5) addTraitProgress(c, "BIG_GAME_PLAYER", 8);

  // First goal milestone.
  if (matchGoals > 0 && !c.flags.firstGoal) {
    c.flags.firstGoal = true;
    pushTimeline(c, "FIRST_GOAL", `Scored first senior goal vs ${ctx.opponentName}.`);
  }

  // Injury.
  if (result.injury) {
    c.injury = result.injury;
    c.seasonStats.injuries += 1;
    applyStatusDelta(c.status, "morale", -8);
    applyStatusDelta(c.status, "confidence", -5);
    applyStatusDelta(c.status, "injuryRisk", result.injury.severity === "MINOR" ? 3 : 8);
    addTraitProgress(c, "INJURY_PRONE", result.injury.severity === "MINOR" ? 6 : 15);
    pushTimeline(
      c,
      "INJURY",
      `${result.injury.name} vs ${ctx.opponentName} — out ~${result.injury.weeksOut} weeks.`,
    );
  }

  // Market value drifts toward overall ability + reputation, modulated by age.
  const overall = overallRating(c.attributes, c.positionFamily);
  const ageFactor = c.age <= 28 ? 1 : clamp(1 - (c.age - 28) * 0.05, 0.3, 1);
  c.marketValue = Math.round((overall * 12 + c.status.reputation * 6) * ageFactor);
  c.highestMarketValue = Math.max(c.highestMarketValue, c.marketValue);

  return c;
}

// ---------------------------------------------------------------------------
// Week commit
// ---------------------------------------------------------------------------

/** Increment the week counter; report whether the season just ended. */
export function commitWeek(career: Career): { career: Career; seasonComplete: boolean } {
  const c = clone(career);
  c.week += 1;
  const seasonComplete = c.week > SEASON_WEEKS;
  return { career: c, seasonComplete };
}
