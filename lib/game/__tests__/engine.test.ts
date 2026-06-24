import { describe, it, expect } from "vitest";
import { createCareer } from "../createCareer";
import { advanceWeek } from "../weeklyEngine";
import {
  generateMatchContext,
  generateMatchMoments,
  resolveMatchMoment,
  finishMatch,
  applyMatchResult,
  commitWeek,
} from "../matchEngine";
import { finishSeason } from "../seasonEngine";
import { generateTransferOffers } from "../transferEngine";
import { careerTotals } from "../careerEngine";
import { retireCareer } from "../retirementEngine";
import { ATTR_MIN, ATTR_MAX, SEASON_WEEKS } from "../constants";
import type { Career, CreateCareerInput } from "../types";

const INPUT: CreateCareerInput = {
  name: "Test Player",
  nationality: "Brazil",
  startingRegion: "SOUTH_AMERICA",
  position: "ST",
  strongFoot: "RIGHT",
  playstyle: "CLINICAL",
  personality: "AMBITIOUS",
  background: "STREET_FOOTBALLER",
  seed: "test-seed-001",
};

/** Play one matchday week using the first choice of every moment. */
function playWeek(career: Career): Career {
  const wk = advanceWeek(career, "TRAIN_FINISHING");
  let c = wk.career;
  if (wk.hadMatch) {
    const ctx = generateMatchContext(c);
    const moments = generateMatchMoments(c, ctx);
    const results = moments.map((m) => resolveMatchMoment(c, ctx, m, m.choices[0].id));
    const result = finishMatch(c, ctx, results);
    c = applyMatchResult(c, result);
  }
  return commitWeek(c).career;
}

describe("createCareer", () => {
  it("creates a valid 16-year-old with a club and in-range attributes", () => {
    const c = createCareer(INPUT);
    expect(c.age).toBe(16);
    expect(c.phase).toBe("PROSPECT");
    expect(c.positionFamily).toBe("STRIKER");
    expect(c.clubId).not.toBe("free-agent");
    expect(c.clubsPlayedFor.length).toBe(1);
    for (const k of Object.keys(c.attributes) as (keyof typeof c.attributes)[]) {
      expect(c.attributes[k]).toBeGreaterThanOrEqual(ATTR_MIN);
      expect(c.attributes[k]).toBeLessThanOrEqual(ATTR_MAX);
    }
    // A clinical striker should have meaningful finishing.
    expect(c.attributes.finishing).toBeGreaterThan(40);
    // Outfielders have negligible goalkeeping.
    expect(c.attributes.goalkeeping).toBeLessThan(20);
  });

  it("is deterministic for the same seed", () => {
    const a = createCareer(INPUT);
    const b = createCareer(INPUT);
    expect(a.attributes).toEqual(b.attributes);
    expect(a.clubId).toBe(b.clubId);
  });
});

describe("match resolution", () => {
  it("is deterministic: same inputs produce the same outcome", () => {
    const c = createCareer(INPUT);
    const ctx = generateMatchContext(c);
    const moments = generateMatchMoments(c, ctx);
    expect(moments.length).toBeGreaterThan(0);
    const m = moments[0];
    const r1 = resolveMatchMoment(c, ctx, m, m.choices[0].id);
    const r2 = resolveMatchMoment(c, ctx, m, m.choices[0].id);
    expect(r1.outcome).toBe(r2.outcome);
    expect(r1.ratingDelta).toBe(r2.ratingDelta);
  });

  it("produces a rating within the legal 3.0–10.0 band", () => {
    const c = createCareer(INPUT);
    const ctx = generateMatchContext(c);
    const moments = generateMatchMoments(c, ctx);
    const results = moments.map((m) => resolveMatchMoment(c, ctx, m, m.choices[0].id));
    const result = finishMatch(c, ctx, results);
    expect(result.rating).toBeGreaterThanOrEqual(3.0);
    expect(result.rating).toBeLessThanOrEqual(10.0);
    expect(result.headline.length).toBeGreaterThan(0);
  });

  it("accumulates appearances and minutes across a season", () => {
    let c = createCareer(INPUT);
    for (let i = 0; i < SEASON_WEEKS; i++) c = playWeek(c);
    expect(c.seasonStats.appearances).toBeGreaterThan(0);
    expect(c.seasonStats.minutes).toBeGreaterThan(0);
    expect(c.week).toBe(SEASON_WEEKS + 1); // ready to finish the season
  });
});

describe("season + aging", () => {
  it("ages the player and advances the season", () => {
    let c = createCareer(INPUT);
    for (let i = 0; i < SEASON_WEEKS; i++) c = playWeek(c);
    const recap = finishSeason(c);
    expect(recap.career.age).toBe(17);
    expect(recap.career.season).toBe(2);
    expect(recap.career.week).toBe(1);
    expect(recap.career.seasonHistory.length).toBe(1);
    expect(recap.career.seasonStats.appearances).toBe(0); // reset for new season
  });

  it("declines physical attributes for an old player", () => {
    let c = createCareer(INPUT);
    c = { ...c, age: 36 };
    const paceBefore = c.attributes.pace;
    const recap = finishSeason(c);
    expect(recap.career.age).toBe(37);
    expect(recap.career.attributes.pace).toBeLessThan(paceBefore);
  });
});

describe("transfers + retirement", () => {
  it("generates plausible transfer offers", () => {
    let c = createCareer(INPUT);
    for (let i = 0; i < SEASON_WEEKS; i++) c = playWeek(c);
    c = finishSeason(c).career;
    const offers = generateTransferOffers(c);
    expect(Array.isArray(offers)).toBe(true);
    for (const o of offers) {
      expect(o.clubId).not.toBe(c.clubId);
      expect(o.wage).toBeGreaterThan(0);
    }
  });

  it("produces a retirement recap with a legacy title", () => {
    let c = createCareer(INPUT);
    for (let i = 0; i < SEASON_WEEKS; i++) c = playWeek(c);
    c = finishSeason(c).career;
    const recap = retireCareer(c, "PLAYER_CHOICE");
    expect(recap.legacyTitle.length).toBeGreaterThan(0);
    expect(recap.clubsPlayedFor.length).toBeGreaterThan(0);
    const totals = careerTotals(c);
    expect(recap.careerStats.appearances).toBe(totals.appearances);
  });
});
