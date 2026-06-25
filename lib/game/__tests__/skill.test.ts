import { describe, it, expect } from "vitest";
import { createCareer } from "../createCareer";
import { generateMatchContext } from "../matchEngine";
import {
  skillKindForChoice,
  buildSkillChallenge,
  scoreSkillInput,
  tierFromAccuracy,
  keeperGuess,
} from "../skillEngine";
import { resolvePlayerBeat } from "../matchSimEngine";
import { getPassage } from "../passages";
import type { Career, CreateCareerInput, MatchMomentChoiceTemplate, MatchState } from "../types";

const INPUT: CreateCareerInput = {
  name: "Skill Tester",
  nationality: "Brazil",
  startingRegion: "SOUTH_AMERICA",
  position: "ST",
  strongFoot: "RIGHT",
  playstyle: "CLINICAL",
  personality: "AMBITIOUS",
  background: "ACADEMY_KID",
  seed: "skill-test-1",
};

function shotState(career: Career): MatchState {
  const ctx = generateMatchContext(career);
  const template = getPassage("st-through-on-goal")!;
  return {
    matchId: ctx.matchId, context: ctx, minute: 30, teamScore: 0, oppScore: 0,
    momentum: 0, stamina: 100, matchConfidence: 0, onPitch: true, cameOnAsSub: false, exitMinute: null,
    plan: [], queueIndex: 0, momentResults: [],
    pendingPassage: { template, stageIndex: 0, importance: "HIGH", minute: 30, slotIndex: 1 },
    finished: false,
  };
}

function withFinishing(career: Career, value: number): Career {
  const c = structuredClone(career);
  c.attributes.finishing = value;
  c.attributes.composure = value;
  c.attributes.positioning = value;
  return c;
}

const choice = (check: string, risk: string): MatchMomentChoiceTemplate =>
  ({ id: "x", label: "x", risk, check, successOutcome: "GOAL", failureOutcome: "CHANCE_MISSED" } as MatchMomentChoiceTemplate);

describe("skill mapping", () => {
  it("maps marquee checks to skill kinds", () => {
    expect(skillKindForChoice(choice("SHOOT", "MEDIUM"))).toBe("AIM");
    expect(skillKindForChoice(choice("GK_SAVE", "MEDIUM"))).toBe("TIMING");
    expect(skillKindForChoice(choice("DEFEND", "HIGH"))).toBe("TIMING");
    expect(skillKindForChoice(choice("DEFEND", "LOW"))).toBeNull();
    expect(skillKindForChoice(choice("PASS", "HIGH"))).toBe("RUN");
    expect(skillKindForChoice(choice("PASS", "LOW"))).toBeNull();
    expect(skillKindForChoice(choice("DRIBBLE", "HIGH"))).toBeNull();
  });
});

describe("skill challenge", () => {
  it("builds a deterministic AIM challenge for a shot", () => {
    const c = createCareer(INPUT);
    const a = buildSkillChallenge(c, shotState(c), "shoot-low");
    const b = buildSkillChallenge(c, shotState(c), "shoot-low");
    expect(a?.kind).toBe("AIM");
    expect(a?.flavor).toBe("SHOT");
    expect(a).toEqual(b);
    expect(a?.reachBase).toBeGreaterThan(0);
    expect(a?.windowMs).toBeGreaterThan(0);
  });

  it("gives better finishers a smaller keeper reach", () => {
    const base = createCareer(INPUT);
    const elite = buildSkillChallenge(withFinishing(base, 95), shotState(base), "shoot-low")!;
    const poor = buildSkillChallenge(withFinishing(base, 15), shotState(base), "shoot-low")!;
    expect(elite.forgiveness).toBeGreaterThan(poor.forgiveness);
    expect(elite.reachBase!).toBeLessThan(poor.reachBase!);
  });
});

describe("skill scoring", () => {
  const shotChallenge = {
    kind: "AIM" as const, flavor: "SHOT" as const, forgiveness: 0.9, label: "", prompt: "",
    reachBase: 0.16, reachGrow: 0.18, powerFloor: 0.25, windowMs: 1700,
  };

  // The keeper commits to a side this shot; score by going the OTHER way.
  const guess = keeperGuess(shotChallenge);
  const openX = guess.dir < 0 ? 0.95 : 0.05; // corner opposite his committed side
  const guessedX = guess.dir < 0 ? 0.05 : 0.95; // the corner he's covering

  it("scores into the corner the keeper left open, but not into the one he covered", () => {
    const open = scoreSkillInput(shotChallenge, { value: openX, aimY: 0.5, power: 0.7, timing: 0.2 });
    const covered = scoreSkillInput(shotChallenge, { value: guessedX, aimY: 0.5, power: 0.7, timing: 0.2 });
    const atKeeper = scoreSkillInput(shotChallenge, { value: 0.5, aimY: 0.35, power: 0.7, timing: 0.2 });
    expect(open).toBeGreaterThan(0.6);
    expect(["GREAT", "GOOD"]).toContain(tierFromAccuracy(open));
    expect(covered).toBeLessThan(0.45); // the keeper guessed right → saved
    expect(atKeeper).toBeLessThan(0.35); // central reflex
  });

  it("waiting for the gap to shut makes the same shot harder", () => {
    const early = scoreSkillInput(shotChallenge, { value: openX, aimY: 0.5, power: 0.7, timing: 0.15 });
    const late = scoreSkillInput(shotChallenge, { value: openX, aimY: 0.5, power: 0.7, timing: 0.95 });
    expect(early).toBeGreaterThan(late);
  });

  it("punishes a scuffed (too soft) strike even into the open corner", () => {
    const firm = scoreSkillInput(shotChallenge, { value: openX, aimY: 0.5, power: 0.7, timing: 0.2 });
    const scuffed = scoreSkillInput(shotChallenge, { value: openX, aimY: 0.5, power: 0.15, timing: 0.2 });
    expect(scuffed).toBeLessThan(firm);
  });

  it("a curled shot bends a central effort into the open side", () => {
    const straight = scoreSkillInput(shotChallenge, { value: 0.5, aimY: 0.5, power: 0.7, timing: 0.2, curl: 0 });
    // curl toward the side the keeper left open
    const curled = scoreSkillInput(shotChallenge, { value: 0.5, aimY: 0.5, power: 0.7, timing: 0.2, curl: -guess.dir });
    expect(straight).toBeLessThan(0.35); // straight down the middle → saved
    expect(curled).toBeGreaterThan(straight);
  });

  it("over-curling (or aiming past the post) sends it wide", () => {
    const overCurled = scoreSkillInput(shotChallenge, { value: 0.95, power: 0.7, timing: 0.2, curl: 0.9 });
    expect(overCurled).toBeLessThan(0.3);
    // aiming well beyond the post also misses (no longer clamped to the goal)
    const aimedWide = scoreSkillInput(shotChallenge, { value: 1.25, power: 0.7, timing: 0.2, curl: 0 });
    expect(aimedWide).toBeLessThan(0.3);
  });

  it("scores a perfectly timed commit high and a mistimed one low", () => {
    const challenge = { kind: "TIMING" as const, flavor: "TACKLE" as const, forgiveness: 0.6, label: "", prompt: "", sweetCenter: 0.5, sweetWidth: 0.3 };
    expect(scoreSkillInput(challenge, { value: 0.5 })).toBeCloseTo(1, 5);
    expect(scoreSkillInput(challenge, { value: 0.95 })).toBe(0);
  });

  it("aiming the open top corner beats the keeper; a low central shot is saved", () => {
    const topCorner = scoreSkillInput(shotChallenge, { value: openX, aimY: 0.95, power: 0.72, timing: 0.2 });
    const lowCentre = scoreSkillInput(shotChallenge, { value: 0.5, aimY: 0.2, power: 0.72, timing: 0.2 });
    expect(tierFromAccuracy(topCorner)).toBe("GREAT");
    expect(lowCentre).toBeLessThan(0.35); // smothered
  });

  it("aiming over the bar misses", () => {
    const over = scoreSkillInput(shotChallenge, { value: 0.5, aimY: 1.2, power: 0.72, timing: 0.2 });
    expect(over).toBeLessThan(0.3);
  });

  it("the same shot can be saved or scored depending on the keeper's guess (variance)", () => {
    // two different challenges → potentially different keeper commitments
    const a = { ...shotChallenge, reachBase: 0.16 };
    const b = { ...shotChallenge, reachBase: 0.2, reachGrow: 0.1 };
    const ga = keeperGuess(a);
    const gb = keeperGuess(b);
    // not asserting they differ (could match) — just that the guess is a real signal
    expect([-1, 1]).toContain(ga.dir);
    expect([-1, 1]).toContain(gb.dir);
  });
});

describe("skill resolution", () => {
  it("a finish into the open corner scores; one down the middle is saved", () => {
    const c = withFinishing(createCareer(INPUT), 95);
    const state = shotState(c);
    const ch = buildSkillChallenge(c, state, "shoot-low")!;
    const g = keeperGuess(ch);
    const openX = g.dir < 0 ? 0.96 : 0.04; // opposite his committed side
    const scored = resolvePlayerBeat(c, state, "shoot-low", { value: openX, aimY: 0.55, power: 0.8, timing: 0.12 });
    expect(scored.result.outcome).toBe("GOAL");
    expect(scored.state.teamScore).toBe(1);

    const saved = resolvePlayerBeat(c, state, "shoot-low", { value: 0.5, aimY: 0.3, power: 0.7, timing: 0.5 });
    expect(saved.result.outcome).toBe("CHANCE_MISSED");
    expect(saved.state.teamScore).toBe(0);
  });

  it("still resolves (via RNG fallback) when no skill input is given", () => {
    const c = createCareer(INPUT);
    const res = resolvePlayerBeat(c, shotState(c), "shoot-low");
    expect(["GOAL", "CHANCE_MISSED"]).toContain(res.result.outcome);
  });
});
