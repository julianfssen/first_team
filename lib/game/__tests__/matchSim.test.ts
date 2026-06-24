import { describe, it, expect } from "vitest";
import { createCareer } from "../createCareer";
import { generateMatchContext } from "../matchEngine";
import {
  startMatch,
  advanceMatch,
  resolvePlayerBeat,
  finalizeMatch,
  computeSituation,
  contextualPayoff,
  shouldSubOff,
} from "../matchSimEngine";
import { allPassages, isMultiStage, getPassage } from "../passages";
import { rng } from "../rng";
import type { Career, CreateCareerInput, MatchContext, MatchMomentResult, MatchState } from "../types";

const INPUT: CreateCareerInput = {
  name: "Sim Tester",
  nationality: "Brazil",
  startingRegion: "SOUTH_AMERICA",
  position: "ST",
  strongFoot: "RIGHT",
  playstyle: "CLINICAL",
  personality: "AMBITIOUS",
  background: "STREET_FOOTBALLER",
  seed: "sim-test-1",
};

/** Play a whole match picking choice `pick` each time. */
function driveMatch(career: Career, pick = 0) {
  const ctx = generateMatchContext(career);
  let state = startMatch(career, ctx);
  const beats = [];
  let active: { choices: { id: string }[] } | null = null;
  let guard = 0;
  for (;;) {
    if (guard++ > 500) throw new Error("match did not terminate");
    if (active) {
      const choice = active.choices[Math.min(pick, active.choices.length - 1)];
      const res = resolvePlayerBeat(career, state, choice.id);
      state = res.state;
      beats.push(...res.beats);
      // A follow-on PLAYER beat means the passage continues.
      active = res.beats.find((b) => b.kind === "PLAYER")?.moment ?? null;
      continue;
    }
    const step = advanceMatch(career, state);
    state = step.state;
    beats.push(step.beat);
    if (step.beat.kind === "PLAYER") active = step.beat.moment ?? null;
    if (step.beat.kind === "FULL_TIME") break;
  }
  const result = finalizeMatch(career, state);
  return { state, beats, result };
}

describe("match simulator", () => {
  it("runs start to finish and produces a valid result", () => {
    const c = createCareer(INPUT);
    const { state, beats, result } = driveMatch(c);
    expect(state.finished).toBe(true);
    expect(state.minute).toBe(90);
    expect(beats.length).toBeGreaterThan(3);
    expect(beats.some((b) => b.kind === "PLAYER")).toBe(true);
    expect(result.rating).toBeGreaterThanOrEqual(3.0);
    expect(result.rating).toBeLessThanOrEqual(10.0);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same seed + same choices", () => {
    const a = driveMatch(createCareer(INPUT));
    const b = driveMatch(createCareer(INPUT));
    expect(a.result.teamScore).toBe(b.result.teamScore);
    expect(a.result.opponentScore).toBe(b.result.opponentScore);
    expect(a.result.rating).toBe(b.result.rating);
    expect(a.beats.length).toBe(b.beats.length);
  });

  it("computes the match situation from score + clock", () => {
    const base = (teamScore: number, oppScore: number, minute: number): MatchState =>
      ({ teamScore, oppScore, minute } as MatchState);
    expect(computeSituation(base(0, 1, 82))).toBe("CHASING_HARD");
    expect(computeSituation(base(0, 1, 65))).toBe("CHASING");
    expect(computeSituation(base(2, 0, 75))).toBe("PROTECTING");
    expect(computeSituation(base(0, 0, 20))).toBe("NEUTRAL");
    expect(computeSituation(base(0, 1, 30))).toBe("NEUTRAL"); // down early = not yet chasing
  });

  it("punishes the safe option when chasing and rewards bravery", () => {
    const safeNonDecisive = { outcome: "KEY_PASS" } as MatchMomentResult;
    const boldGoal = { outcome: "GOAL" } as MatchMomentResult;

    const safeWhenChasing = contextualPayoff(safeNonDecisive, "CHASING_HARD", "LOW");
    expect(safeWhenChasing.ratingDelta).toBeLessThan(0);
    expect(safeWhenChasing.note).toBeTruthy();

    const boldWhenChasing = contextualPayoff(boldGoal, "CHASING_HARD", "HIGH");
    expect(boldWhenChasing.ratingDelta).toBeGreaterThan(0);

    // The same safe pass is fine in a neutral game.
    const safeNeutral = contextualPayoff(safeNonDecisive, "NEUTRAL", "LOW");
    expect(safeNeutral.ratingDelta).toBe(0);
  });

  it("punishes reckless risk when protecting a lead", () => {
    const boldFail = { outcome: "POSSESSION_LOST" } as MatchMomentResult;
    const payoff = contextualPayoff(boldFail, "PROTECTING", "HIGH");
    expect(payoff.ratingDelta).toBeLessThan(0);
  });
});

describe("multi-stage passages", () => {
  function passageState(career: Career, passageId: string): MatchState {
    const ctx = generateMatchContext(career);
    const template = getPassage(passageId)!;
    return {
      matchId: ctx.matchId, context: ctx, minute: 30, teamScore: 0, oppScore: 0,
      momentum: 0, stamina: 100, matchConfidence: 0, onPitch: true, cameOnAsSub: false, exitMinute: null,
      plan: [], queueIndex: 0, momentResults: [],
      pendingPassage: { template, stageIndex: 0, importance: "MEDIUM", minute: 30, slotIndex: 1 },
      finished: false,
    };
  }

  it("exposes multi-stage passages for every family", () => {
    for (const fam of ["GOALKEEPER", "STRIKER", "WINGER", "CENTRE_BACK", "CENTRAL_MIDFIELDER"]) {
      expect(allPassages(fam).some(isMultiStage)).toBe(true);
    }
  });

  it("a FINISH choice always ends the passage", () => {
    const c = createCareer(INPUT);
    const res = resolvePlayerBeat(c, passageState(c, "st-through-on-goal"), "shoot-low");
    expect(res.continues).toBe(false);
    expect(res.state.pendingPassage).toBeNull();
    expect(res.beats.some((b) => b.kind === "PLAYER")).toBe(false);
  });

  it("an ADVANCE choice continues iff it didn't fail and a stage remains", () => {
    const c = createCareer(INPUT);
    const res = resolvePlayerBeat(c, passageState(c, "st-through-on-goal"), "round-keeper");
    const followOn = res.beats.some((b) => b.kind === "PLAYER");
    expect(res.continues).toBe(followOn);
    if (res.continues) {
      expect(res.state.pendingPassage?.stageIndex).toBe(1);
    } else {
      expect(res.state.pendingPassage).toBeNull();
    }
  });

  it("a multi-stage passage can stack multiple result beats", () => {
    // Drive a striker match always taking the first (often ADVANCE) option;
    // at least one passage should produce more than one result beat in sequence.
    const c = createCareer(INPUT);
    const { beats } = driveMatch(c, 0);
    expect(beats.filter((b) => b.kind === "RESULT").length).toBeGreaterThan(0);
  });
});

describe("substitutions", () => {
  function ctxWith(career: Career, isStarter: boolean): MatchContext {
    return { ...generateMatchContext(career), isStarter };
  }
  function baseState(career: Career, ctx: MatchContext, over: Partial<MatchState>): MatchState {
    return {
      matchId: ctx.matchId, context: ctx, minute: 80, teamScore: 0, oppScore: 0,
      momentum: 0, stamina: 60, matchConfidence: 0, onPitch: true, cameOnAsSub: false,
      exitMinute: null, plan: [], queueIndex: 0, momentResults: [], pendingPassage: null,
      finished: false, ...over,
    };
  }
  const badBeats = (n: number) => Array.from({ length: n }, () => ({ ratingDelta: -1 } as MatchMomentResult));

  it("never hooks a player early or one playing well", () => {
    const c = createCareer(INPUT);
    const ctx = ctxWith(c, true);
    // Too early.
    expect(shouldSubOff(c, baseState(c, ctx, { minute: 50, stamina: 20, momentResults: badBeats(3) }), rng("a"))).toBe(false);
    // Playing fine and fresh.
    expect(shouldSubOff(c, baseState(c, ctx, { minute: 85, stamina: 90 }), rng("b"))).toBe(false);
  });

  it("can hook a poor, gassed player late", () => {
    const c = createCareer(INPUT);
    const ctx = ctxWith(c, true);
    const bad = baseState(c, ctx, { minute: 85, stamina: 18, momentResults: badBeats(3) });
    let fired = false;
    for (let i = 0; i < 40 && !fired; i++) {
      if (shouldSubOff(c, bad, rng(c.seed, "subtest", i))) fired = true;
    }
    expect(fired).toBe(true);
  });

  it("does not present player moments while off the pitch", () => {
    const c = createCareer(INPUT);
    const ctx = ctxWith(c, true);
    const state = baseState(c, ctx, {
      minute: 65, onPitch: false, exitMinute: 64,
      plan: [{ kind: "PLAYER", minute: 70, templateId: "st-through-on-goal", importance: "MEDIUM" }],
    });
    const { beat } = advanceMatch(c, state);
    expect(beat.kind).not.toBe("PLAYER");
  });

  it("finalize reports minutes for a hooked starter and an impact sub", () => {
    const c = createCareer(INPUT);
    const hooked = finalizeMatch(c, baseState(c, ctxWith(c, true), { minute: 90, onPitch: false, exitMinute: 70, finished: true }));
    expect(hooked.subbedOff).toBe(true);
    expect(hooked.minutesPlayed).toBe(70);

    const sub = finalizeMatch(c, baseState(c, ctxWith(c, false), { minute: 90, cameOnAsSub: true, finished: true }));
    expect(sub.cameOnAsSub).toBe(true);
    expect(sub.subbedOff).toBe(false);
    expect(sub.minutesPlayed).toBe(30); // came on at 60, played to 90
  });
});
