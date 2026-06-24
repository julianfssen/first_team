import { describe, it, expect } from "vitest";
import { createCareer } from "../createCareer";
import { generateMatchContext } from "../matchEngine";
import {
  skillKindForChoice,
  buildSkillChallenge,
  scoreSkillInput,
  tierFromAccuracy,
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

  it("scores a corner past the keeper high and a shot straight at them low", () => {
    const openCorner = scoreSkillInput(shotChallenge, { value: 0.02, power: 0.7, timing: 0.2 });
    const atKeeper = scoreSkillInput(shotChallenge, { value: 0.5, power: 0.7, timing: 0.2 });
    expect(openCorner).toBeGreaterThan(0.8);
    expect(atKeeper).toBeLessThan(0.3);
    expect(tierFromAccuracy(openCorner)).toBe("GREAT");
    expect(tierFromAccuracy(atKeeper)).toBe("DISASTER");
  });

  it("waiting for the gap to shut makes the same shot harder", () => {
    const early = scoreSkillInput(shotChallenge, { value: 0.2, power: 0.7, timing: 0.15 });
    const late = scoreSkillInput(shotChallenge, { value: 0.2, power: 0.7, timing: 0.95 });
    expect(early).toBeGreaterThan(late);
  });

  it("punishes a scuffed (too soft) strike even into a corner", () => {
    const firm = scoreSkillInput(shotChallenge, { value: 0.02, power: 0.7, timing: 0.2 });
    const scuffed = scoreSkillInput(shotChallenge, { value: 0.02, power: 0.15, timing: 0.2 });
    expect(scuffed).toBeLessThan(firm);
  });

  it("scores a perfectly timed commit high and a mistimed one low", () => {
    const challenge = { kind: "TIMING" as const, flavor: "TACKLE" as const, forgiveness: 0.6, label: "", prompt: "", sweetCenter: 0.5, sweetWidth: 0.3 };
    expect(scoreSkillInput(challenge, { value: 0.5 })).toBeCloseTo(1, 5);
    expect(scoreSkillInput(challenge, { value: 0.95 })).toBe(0);
  });
});

describe("skill resolution", () => {
  it("a finish into an open corner scores; a finish at the keeper is saved", () => {
    const c = withFinishing(createCareer(INPUT), 95);
    const state = shotState(c);
    // Keeper sits centrally — beat them to a post early, with pace.
    const scored = resolvePlayerBeat(c, state, "shoot-low", { value: 0.02, power: 0.7, timing: 0.15 });
    expect(scored.result.outcome).toBe("GOAL");
    expect(scored.state.teamScore).toBe(1);

    const saved = resolvePlayerBeat(c, state, "shoot-low", { value: 0.5, power: 0.7, timing: 0.5 });
    expect(saved.result.outcome).toBe("CHANCE_MISSED");
    expect(saved.state.teamScore).toBe(0);
  });

  it("still resolves (via RNG fallback) when no skill input is given", () => {
    const c = createCareer(INPUT);
    const res = resolvePlayerBeat(c, shotState(c), "shoot-low");
    expect(["GOAL", "CHANCE_MISSED"]).toContain(res.result.outcome);
  });
});
