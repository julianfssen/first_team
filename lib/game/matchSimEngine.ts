/**
 * Living Match simulator (Stage 1).
 *
 * A match is stepped from kickoff to full time. Each step emits a beat:
 *   - NARRATED: auto commentary; the scoreline can evolve without the player.
 *   - PLAYER:   one of the player's position-specific moments, framed by live
 *               match state (score, clock, momentum, stamina).
 *   - FULL_TIME: the match is over → finalize into a MatchResult.
 *
 * Contextual payoff: the value of a choice depends on the match situation, so
 * the "safe" option is sometimes the wrong one (e.g. recycling possession while
 * chasing a game late costs you rating and momentum).
 *
 * All randomness is seeded from career.seed + matchId, so a given seed plus the
 * same player choices reproduces the same match.
 */

import type {
  Career,
  MatchBeat,
  MatchContext,
  MatchImportance,
  MatchMomentResult,
  MatchResult,
  MatchSituation,
  MatchState,
  PlannedSlot,
  PlayerStatus,
  Risk,
  SeasonStats,
  SkillInput,
} from "./types";
import { COMMENTARY } from "@/data/commentary";
import {
  resolveChoiceOutcome,
  outcomeForTier,
  MOMENT_COUNT_BY_IMPORTANCE,
  pickHeadline,
  DEFENSIVE_FAMILIES,
} from "./matchEngine";
import { allPassages, isMultiStage, getPassage, instantiateStageMoment } from "./passages";
import { skillKindForChoice, buildSkillChallenge, scoreSkillInput, tierFromAccuracy } from "./skillEngine";
import { OUTCOME_EFFECTS, finalMatchRating, ratingDeltaForOutcome } from "./ratingEngine";
import { Rng, rng } from "./rng";
import { clamp, clone, addStats, round1 } from "./util";
import { getClub, clubLabel } from "./world";
import { injuryProbability, rollSeverity, createInjury, isInjured } from "./injuryEngine";

const MOMENTUM_DECAY = 6;

// ---------------------------------------------------------------------------
// Kickoff: build the match skeleton
// ---------------------------------------------------------------------------

export function startMatch(career: Career, ctx: MatchContext): MatchState {
  const r = rng(career.seed, "sim", ctx.matchId);
  const pool = allPassages(career.positionFamily);
  const multiPool = pool.filter(isMultiStage);

  const [lo, hi] = MOMENT_COUNT_BY_IMPORTANCE[ctx.importance];
  let playerCount = Math.min(r.int(lo, hi), pool.length);
  if (!ctx.isStarter) playerCount = Math.max(1, playerCount - 1);

  const earliest = ctx.isStarter ? 5 : 58;
  const used = new Set<string>();

  const plan: PlannedSlot[] = [];
  for (let i = 0; i < playerCount; i++) {
    const isLast = i === playerCount - 1;
    const importance: MatchImportance =
      isLast && (ctx.importance === "HIGH" || ctx.importance === "CLUTCH")
        ? "CLUTCH"
        : ctx.importance;

    // Bias the bigger moments toward richer, multi-stage passages.
    const big = importance === "HIGH" || importance === "CLUTCH";
    const wantMulti = multiPool.length > 0 && r.chance(big ? 0.75 : 0.3);
    const source = wantMulti ? multiPool : pool;
    const fresh = source.filter((p) => !used.has(p.id));
    const passage = (fresh.length > 0 ? r.pick(fresh) : r.pick(source));
    used.add(passage.id);

    plan.push({
      kind: "PLAYER",
      minute: r.int(earliest, 89),
      templateId: passage.id,
      importance,
    });
  }

  // Narrated beats fill the rest of the timeline.
  const narratedCount = r.int(6, 9);
  for (let i = 0; i < narratedCount; i++) {
    plan.push({ kind: "NARRATED", minute: r.int(2, 90), importance: ctx.importance });
  }
  plan.sort((a, b) => a.minute - b.minute);

  return {
    matchId: ctx.matchId,
    context: ctx,
    minute: 0,
    teamScore: 0,
    oppScore: 0,
    momentum: 0,
    stamina: clamp(100 - career.status.fatigue * 0.5, 45, 100),
    matchConfidence: 0,
    onPitch: true,
    plan,
    queueIndex: 0,
    momentResults: [],
    pendingPassage: null,
    finished: false,
  };
}

// ---------------------------------------------------------------------------
// Stepping the match
// ---------------------------------------------------------------------------

function fill(text: string, career: Career, ctx: MatchContext): string {
  return text
    .replace(/\{club\}/g, clubLabel(career.clubId))
    .replace(/\{opponent\}/g, ctx.opponentName);
}

function decayMomentum(state: MatchState) {
  if (state.momentum > 0) state.momentum = Math.max(0, state.momentum - MOMENTUM_DECAY);
  else if (state.momentum < 0) state.momentum = Math.min(0, state.momentum + MOMENTUM_DECAY);
}

export function computeSituation(state: MatchState): MatchSituation {
  const diff = state.teamScore - state.oppScore;
  if (diff < 0 && state.minute >= 78) return "CHASING_HARD";
  if (diff < 0 && state.minute >= 60) return "CHASING";
  if (diff > 0 && state.minute >= 70) return "PROTECTING";
  return "NEUTRAL";
}

function narratedBeat(career: Career, state: MatchState, r: Rng, index: number): MatchBeat {
  const teamStrength = getClub(career.clubId)?.reputation ?? 55;
  const edge = teamStrength - state.context.opponentStrength;
  const sideTeam = r.float() < clamp(0.5 + edge / 260 + state.momentum / 450, 0.2, 0.8);
  const beat: MatchBeat = { id: `${state.matchId}-b${index}`, kind: "NARRATED", minute: state.minute, scored: null };

  if (r.float() < 0.22) {
    // A genuine chance.
    if (sideTeam) {
      const goalProb = clamp(0.28 + edge / 400 + state.momentum / 600, 0.08, 0.6);
      if (r.chance(goalProb)) {
        state.teamScore += 1;
        state.momentum = clamp(state.momentum + 30, -100, 100);
        state.matchConfidence = clamp(state.matchConfidence + 6, -100, 100);
        beat.scored = "TEAM";
        beat.tone = "POSITIVE";
        beat.text = fill(r.pick(COMMENTARY.teamGoal), career, state.context);
      } else {
        state.momentum = clamp(state.momentum + 6, -100, 100);
        beat.tone = "NEUTRAL";
        beat.text = fill(r.pick(COMMENTARY.teamChanceMissed), career, state.context);
      }
    } else {
      const goalProb = clamp(0.28 - edge / 400 - state.momentum / 600, 0.08, 0.6);
      if (r.chance(goalProb)) {
        state.oppScore += 1;
        state.momentum = clamp(state.momentum - 30, -100, 100);
        state.matchConfidence = clamp(state.matchConfidence - 6, -100, 100);
        beat.scored = "OPP";
        beat.tone = "NEGATIVE";
        beat.text = fill(r.pick(COMMENTARY.oppGoal), career, state.context);
      } else {
        state.momentum = clamp(state.momentum - 6, -100, 100);
        beat.tone = "NEUTRAL";
        beat.text = fill(r.pick(COMMENTARY.oppChanceMissed), career, state.context);
      }
    }
  } else {
    // Build-up / midfield flavour.
    state.momentum = clamp(state.momentum + (sideTeam ? 4 : -4), -100, 100);
    beat.tone = "NEUTRAL";
    const set = r.float() < 0.35 ? COMMENTARY.midfield : sideTeam ? COMMENTARY.teamBuildUp : COMMENTARY.oppBuildUp;
    beat.text = fill(r.pick(set), career, state.context);
  }
  return beat;
}

/** Step the match forward by one beat. Returns the next state and the beat. */
export function advanceMatch(career: Career, state: MatchState): { state: MatchState; beat: MatchBeat } {
  const s = clone(state);
  if (s.finished || s.queueIndex >= s.plan.length) {
    s.finished = true;
    s.minute = 90;
    return { state: s, beat: { id: `${s.matchId}-ft`, kind: "FULL_TIME", minute: 90, text: "Full time." } };
  }

  const slot = s.plan[s.queueIndex];
  s.queueIndex += 1;
  s.minute = slot.minute;
  decayMomentum(s);

  if (slot.kind === "PLAYER" && slot.templateId) {
    const template = getPassage(slot.templateId);
    if (template) {
      const passage = {
        template,
        stageIndex: 0,
        importance: slot.importance,
        minute: slot.minute,
        slotIndex: s.queueIndex,
      };
      s.pendingPassage = passage;
      const moment = instantiateStageMoment(s.matchId, passage);
      return {
        state: s,
        beat: {
          id: `${s.matchId}-p${s.queueIndex}`,
          kind: "PLAYER",
          minute: slot.minute,
          moment,
          situation: computeSituation(s),
          continuation: false,
        },
      };
    }
  }

  const r = rng(career.seed, "narrate", s.matchId, s.queueIndex);
  return { state: s, beat: narratedBeat(career, s, r, s.queueIndex) };
}

// ---------------------------------------------------------------------------
// Contextual payoff
// ---------------------------------------------------------------------------

const DECISIVE = new Set(["GOAL", "ASSIST", "SAVE", "PENALTY_SAVE", "TACKLE_WON", "BLOCK", "DRIBBLE_PAST"]);

type Payoff = { ratingDelta: number; momentum: number; confidence: number; note?: string };

export function contextualPayoff(result: MatchMomentResult, situation: MatchSituation, risk: Risk): Payoff {
  const positive = OUTCOME_EFFECTS[result.outcome].positive;
  const decisive = DECISIVE.has(result.outcome);
  const bold = risk === "HIGH";
  const safe = risk === "LOW";
  const p: Payoff = { ratingDelta: 0, momentum: 0, confidence: 0 };

  if (situation === "CHASING" || situation === "CHASING_HARD") {
    const hard = situation === "CHASING_HARD";
    if (safe && !decisive) {
      p.ratingDelta -= hard ? 0.6 : 0.35;
      p.confidence -= 8;
      p.note = "The team needed a hero — that was too safe.";
    } else if (bold && positive) {
      p.ratingDelta += hard ? 0.5 : 0.35;
      p.momentum += 10;
      p.confidence += 10;
      p.note = "You stood up when it mattered most.";
    } else if (bold && !positive) {
      p.note = "A brave attempt that didn't come off.";
    }
  } else if (situation === "PROTECTING") {
    if (bold && !positive) {
      p.ratingDelta -= 0.4;
      p.confidence -= 6;
      p.note = "A needless risk with the lead.";
    } else if (safe && positive) {
      p.ratingDelta += 0.2;
      p.note = "Cool head — sees the game out.";
    }
  }
  return p;
}

function staminaCost(risk: Risk): number {
  return (risk === "HIGH" ? 8 : risk === "MEDIUM" ? 5 : 3) + 2;
}

const NON_FAILURE = new Set(["GREAT", "GOOD", "OK"]);

/**
 * Resolve the current stage of the pending passage. If the chosen option's flow
 * is ADVANCE and it succeeds (and a further stage exists), the passage carries
 * on — returning the next stage as a follow-on PLAYER beat. Otherwise it ends.
 */
export function resolvePlayerBeat(
  career: Career,
  state: MatchState,
  choiceId: string,
  skillInput?: SkillInput,
): { state: MatchState; result: MatchMomentResult; beats: MatchBeat[]; continues: boolean } {
  const s = clone(state);
  const passage = s.pendingPassage;
  if (!passage) throw new Error("No pending passage to resolve.");

  const moment = instantiateStageMoment(s.matchId, passage);
  const stage = passage.template.stages[passage.stageIndex];
  const situation = computeSituation(s);
  const choice = stage.choices.find((c) => c.id === choiceId) ?? stage.choices[0];

  const extraMod = s.momentum * 0.06 + s.matchConfidence * 0.08;

  // Marquee choices resolve via the player's skill input (when supplied);
  // otherwise (and for non-skill choices) fall back to the seeded dice roll.
  const skillKind = skillKindForChoice(choice);
  let base: MatchMomentResult;
  if (skillKind && skillInput) {
    const challenge = buildSkillChallenge(career, s, choice.id);
    const tier = challenge
      ? tierFromAccuracy(scoreSkillInput(challenge, skillInput))
      : "OK";
    const outcome = outcomeForTier(choice, tier);
    const eff0 = OUTCOME_EFFECTS[outcome];
    base = {
      moment,
      choiceId: choice.id,
      outcome,
      tier,
      ratingDelta: ratingDeltaForOutcome(outcome, tier),
      statDeltas: { ...eff0.stats },
      narrative: `${moment.minute}' — ${eff0.narrative}`,
    };
  } else {
    base = resolveChoiceOutcome(career, s.context, moment, choice.id, {
      fatigue: 100 - s.stamina,
      extraMod,
    });
  }

  const payoff = contextualPayoff(base, situation, choice.risk);
  const eff = OUTCOME_EFFECTS[base.outcome];

  // Live state updates from the outcome.
  if (eff.teamGoal) {
    s.teamScore += 1;
    s.momentum = clamp(s.momentum + 30 + payoff.momentum, -100, 100);
    s.matchConfidence = clamp(s.matchConfidence + 12 + payoff.confidence, -100, 100);
  } else if (eff.opponentGoal) {
    s.oppScore += 1;
    s.momentum = clamp(s.momentum - 28 + payoff.momentum, -100, 100);
    s.matchConfidence = clamp(s.matchConfidence - 12 + payoff.confidence, -100, 100);
  } else {
    s.momentum = clamp(s.momentum + (eff.positive ? 10 : -8) + payoff.momentum, -100, 100);
    s.matchConfidence = clamp(s.matchConfidence + (eff.positive ? 6 : -6) + payoff.confidence, -100, 100);
  }
  s.stamina = clamp(s.stamina - staminaCost(choice.risk), 0, 100);

  const result: MatchMomentResult = {
    ...base,
    ratingDelta: round1(base.ratingDelta + payoff.ratingDelta),
  };
  s.momentResults.push(result);

  const resultBeat: MatchBeat = {
    id: `${s.matchId}-r${s.momentResults.length}`,
    kind: "RESULT",
    minute: moment.minute,
    result,
    situation,
    contextNote: payoff.note,
    tone: eff.positive ? "POSITIVE" : "NEGATIVE",
  };

  // Does the passage carry on?
  const hasNext = passage.stageIndex + 1 < passage.template.stages.length;
  const continues = choice.flow === "ADVANCE" && NON_FAILURE.has(base.tier) && hasNext;

  const beats: MatchBeat[] = [resultBeat];
  if (continues) {
    passage.stageIndex += 1;
    s.pendingPassage = passage;
    const nextMoment = instantiateStageMoment(s.matchId, passage);
    beats.push({
      id: `${s.matchId}-p${passage.slotIndex}-s${passage.stageIndex}`,
      kind: "PLAYER",
      minute: passage.minute,
      moment: nextMoment,
      situation: computeSituation(s),
      continuation: true,
    });
  } else {
    s.pendingPassage = null;
  }

  return { state: s, result, beats, continues };
}

// ---------------------------------------------------------------------------
// Finalize
// ---------------------------------------------------------------------------

export function finalizeMatch(career: Career, state: MatchState): MatchResult {
  const r = rng(career.seed, "finalize", state.matchId);
  const ctx = state.context;

  const statDeltas: Partial<SeasonStats> = {};
  const momentDeltas: number[] = [];
  let matchGoals = 0;
  for (const mr of state.momentResults) {
    momentDeltas.push(mr.ratingDelta);
    addStats(statDeltas as SeasonStats, mr.statDeltas);
    if (mr.outcome === "GOAL") matchGoals += 1;
  }

  const isDefensive = DEFENSIVE_FAMILIES.has(career.positionFamily);
  const cleanSheet = state.oppScore === 0 && isDefensive && ctx.isStarter;
  if (cleanSheet) statDeltas.cleanSheets = (statDeltas.cleanSheets ?? 0) + 1;
  if (isDefensive && ctx.isStarter) {
    statDeltas.goalsConceded = (statDeltas.goalsConceded ?? 0) + state.oppScore;
  }

  const teamWon = state.teamScore > state.oppScore;
  const teamDrew = state.teamScore === state.oppScore;
  const rating = finalMatchRating(momentDeltas, {
    teamWon,
    teamDrew,
    cleanSheetBonus: cleanSheet,
    fatigue: 100 - state.stamina,
  });

  // Injury roll.
  const intensity = ctx.importance === "CLUTCH" ? 1.3 : ctx.importance === "HIGH" ? 1.15 : 1;
  const forcedInjury = state.momentResults.some((mr) => mr.outcome === "INJURY");
  let injury: MatchResult["injury"];
  if (!isInjured(career) && (forcedInjury || r.chance(injuryProbability(career, intensity)))) {
    injury = createInjury(career, rollSeverity(career, state.matchId));
  }

  const fatigueAdd = (ctx.isStarter ? 16 : 8) + (intensity - 1) * 12;
  const statusDeltas: Partial<PlayerStatus> = {
    fatigue: Math.round(fatigueAdd),
    form: clamp((rating - 6.5) * 4, -12, 14),
    confidence: clamp((rating - 6.3) * 3, -10, 12),
    morale: (teamWon ? 4 : teamDrew ? 1 : -3) + clamp((rating - 6.5) * 2, -6, 6),
    coachTrust: clamp((rating - 6.4) * 1.6, -8, 8),
    reputation:
      clamp((rating - 6.5) * 1.3, -4, 6) *
      (ctx.importance === "CLUTCH" ? 1.6 : ctx.importance === "HIGH" ? 1.3 : 1),
    mediaPressure: ctx.importance === "CLUTCH" ? 4 : ctx.importance === "HIGH" ? 2 : 0,
  };

  const tone: "POSITIVE" | "NEUTRAL" | "NEGATIVE" =
    rating >= 7.3 || matchGoals > 0 ? "POSITIVE" : rating <= 5.3 ? "NEGATIVE" : "NEUTRAL";
  const headline = pickHeadline(r, tone, {
    player: career.player.name,
    opponent: ctx.opponentName,
    goals: matchGoals,
    rating: rating.toFixed(1),
    club: clubLabel(career.clubId),
  });

  // Moment of the match = the most impactful beat.
  const standout = [...state.momentResults].sort(
    (a, b) => Math.abs(b.ratingDelta) - Math.abs(a.ratingDelta),
  )[0];

  return {
    matchId: state.matchId,
    context: ctx,
    teamScore: state.teamScore,
    opponentScore: state.oppScore,
    rating,
    momentResults: state.momentResults,
    statDeltas,
    statusDeltas,
    headline,
    injury,
    momentOfMatch: standout?.narrative,
  };
}
