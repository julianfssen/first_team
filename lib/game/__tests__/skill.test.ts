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
    expect(skillKindForChoice(choice("PASS", "HIGH"))).toBeNull();
    expect(skillKindForChoice(choice("DRIBBLE", "HIGH"))).toBeNull();
  });
});

describe("skill challenge", () => {
  it("builds a deterministic AIM challenge for a shot", () => {
    const c = createCareer(INPUT);
    const a = buildSkillChallenge(c, shotState(c), "shoot-low");
    const b = buildSkillChallenge(c, shotState(c), "shoot-low");
    expect(a?.kind).toBe("AIM");
    expect(a).toEqual(b);
    expect((a?.keeperZones?.length ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it("gives better finishers a more forgiving window (keeper covers fewer zones)", () => {
    const base = createCareer(INPUT);
    const elite = buildSkillChallenge(withFinishing(base, 95), shotState(base), "shoot-low")!;
    const poor = buildSkillChallenge(withFinishing(base, 15), shotState(base), "shoot-low")!;
    expect(elite.forgiveness).toBeGreaterThan(poor.forgiveness);
    expect(elite.keeperZones!.length).toBeLessThanOrEqual(poor.keeperZones!.length);
  });
});

describe("skill scoring", () => {
  it("scores an open corner high and a covered zone low", () => {
    const challenge = { kind: "AIM" as const, forgiveness: 0.9, label: "", prompt: "", zones: 5, keeperZones: [2] };
    const openCorner = scoreSkillInput(challenge, { value: 0 });
    const onKeeper = scoreSkillInput(challenge, { value: 2 });
    expect(openCorner).toBeGreaterThan(0.8);
    expect(onKeeper).toBeLessThan(0.3);
    expect(tierFromAccuracy(openCorner)).toBe("GREAT");
    expect(tierFromAccuracy(onKeeper)).toBe("DISASTER");
  });

  it("scores a perfectly timed marker high and a mistimed one low", () => {
    const challenge = { kind: "TIMING" as const, forgiveness: 0.6, label: "", prompt: "", sweetCenter: 0.5, sweetWidth: 0.3 };
    expect(scoreSkillInput(challenge, { value: 0.5 })).toBeCloseTo(1, 5);
    expect(scoreSkillInput(challenge, { value: 0.95 })).toBe(0);
  });
});

describe("skill resolution", () => {
  it("a finish into an open corner scores; a finish at the keeper is saved", () => {
    const c = withFinishing(createCareer(INPUT), 95);
    const state = shotState(c);
    const challenge = buildSkillChallenge(c, state, "shoot-low")!;
    const covered = new Set(challenge.keeperZones);
    const openCorner = [0, 4].find((z) => !covered.has(z))!;

    const scored = resolvePlayerBeat(c, state, "shoot-low", { value: openCorner });
    expect(scored.result.outcome).toBe("GOAL");
    expect(scored.state.teamScore).toBe(1);

    const saved = resolvePlayerBeat(c, state, "shoot-low", { value: challenge.keeperZones![0] });
    expect(saved.result.outcome).toBe("CHANCE_MISSED");
    expect(saved.state.teamScore).toBe(0);
  });

  it("still resolves (via RNG fallback) when no skill input is given", () => {
    const c = createCareer(INPUT);
    const res = resolvePlayerBeat(c, shotState(c), "shoot-low");
    expect(["GOAL", "CHANCE_MISSED"]).toContain(res.result.outcome);
  });
});
