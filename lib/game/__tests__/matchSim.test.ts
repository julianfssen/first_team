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
} from "../matchSimEngine";
import type { Career, CreateCareerInput, MatchMomentResult, MatchState } from "../types";

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
  let guard = 0;
  for (;;) {
    if (guard++ > 500) throw new Error("match did not terminate");
    if (state.pendingMoment) {
      const choice = state.pendingMoment.choices[Math.min(pick, state.pendingMoment.choices.length - 1)];
      const res = resolvePlayerBeat(career, state, choice.id);
      state = res.state;
      beats.push(res.beat);
      continue;
    }
    const step = advanceMatch(career, state);
    state = step.state;
    beats.push(step.beat);
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
