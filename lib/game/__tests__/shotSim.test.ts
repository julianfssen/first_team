/**
 * Shot balance harness (not a normal test — gated behind SHOT_SIM=1).
 *
 *   SHOT_SIM=1 npx vitest run lib/game/__tests__/shotSim.test.ts --reporter=verbose
 *
 * Monte-Carlos thousands of shots through the real engine (buildSkillChallenge →
 * keeperGuess → resolvePlayerBeat) for different finisher qualities and player
 * strategies, and prints conversion + outcome numbers. Deterministic (seeded),
 * so runs are reproducible. This is how we sanity-check "too easy / fair / varied"
 * without a browser.
 */
import { describe, it } from "vitest";
import { createCareer } from "../createCareer";
import { generateMatchContext } from "../matchEngine";
import { buildSkillChallenge, keeperGuess } from "../skillEngine";
import { resolvePlayerBeat } from "../matchSimEngine";
import { getPassage } from "../passages";
import { rng } from "../rng";
import { clamp } from "../util";
import type { Career, CreateCareerInput, MatchState, SkillInput } from "../types";

const RUN = !!process.env.SHOT_SIM;
const N = Number(process.env.SHOT_SIM_N ?? 3000);

const BASE_INPUT: CreateCareerInput = {
  name: "Sim", nationality: "Brazil", startingRegion: "SOUTH_AMERICA", position: "ST",
  strongFoot: "RIGHT", playstyle: "CLINICAL", personality: "AMBITIOUS", background: "ACADEMY_KID",
  seed: "shot-sim",
};

function withFinishing(c: Career, v: number): Career {
  const k = structuredClone(c);
  k.attributes.finishing = v;
  k.attributes.composure = v;
  k.attributes.positioning = v;
  return k;
}

function shotState(c: Career, matchId: string): MatchState {
  const ctx = generateMatchContext(c);
  ctx.matchId = matchId;
  return {
    matchId, context: ctx, minute: 45, teamScore: 0, oppScore: 0, momentum: 0, stamina: 80,
    matchConfidence: 0, onPitch: true, cameOnAsSub: false, exitMinute: null,
    plan: [], queueIndex: 0, momentResults: [],
    pendingPassage: { template: getPassage("st-through-on-goal")!, stageIndex: 0, importance: "HIGH", minute: 45, slotIndex: 1 },
    finished: false,
  };
}

type Strategy = "reader" | "sloppy" | "naive";

/** Build the player's input for this shot given their strategy + skill. */
function makeInput(strategy: Strategy, guess: { dir: number; high: boolean }, r: ReturnType<typeof rng>): SkillInput {
  const openX = guess.dir < 0 ? 0.92 : 0.08; // corner he LEFT open
  const coveredX = guess.dir < 0 ? 0.08 : 0.92;
  if (strategy === "reader") {
    // reads the lean, aims the open top corner, shoots early, small human jitter
    return {
      value: clamp(openX + r.noise(0.05), 0, 1),
      aimY: clamp(0.82 + r.noise(0.1), 0.2, 1.0),
      power: 0.8, timing: clamp(0.22 + r.noise(0.08), 0, 1), curl: 0,
    };
  }
  if (strategy === "sloppy") {
    // reads correctly ~65% of the time, bigger jitter, dawdles to mid-window
    const aimsOpen = r.chance(0.65);
    const tx = aimsOpen ? openX : coveredX;
    return {
      value: clamp(tx + r.noise(0.12), 0, 1),
      aimY: clamp(0.6 + r.noise(0.22), 0.1, 1.05),
      power: clamp(0.7 + r.noise(0.12), 0, 1), timing: clamp(0.5 + r.noise(0.18), 0, 1), curl: r.noise(0.3),
    };
  }
  // naive: ignores the keeper entirely — random spot + random timing
  return {
    value: r.range(0.05, 0.95),
    aimY: r.range(0.25, 1.0),
    power: r.range(0.45, 0.95), timing: r.range(0.1, 0.95), curl: r.range(-0.4, 0.4),
  };
}

function pct(n: number, d: number): string {
  return `${((100 * n) / d).toFixed(1)}%`;
}

describe("shot balance sim", () => {
  (RUN ? it : it.skip)("conversion by quality x strategy", () => {
    const base = createCareer(BASE_INPUT);
    const qualities: [string, number][] = [["poor", 35], ["avg", 60], ["elite", 90]];
    const strategies: Strategy[] = ["reader", "sloppy", "naive"];

    console.log(`\n=== Shot conversion (${N} shots each) ===`);
    console.log("quality  strategy   goals    conversion");
    for (const [qname, qval] of qualities) {
      const c = withFinishing(base, qval);
      for (const strat of strategies) {
        let goals = 0;
        for (let i = 0; i < N; i++) {
          const state = shotState(c, `sim-${qname}-${strat}-${i}`);
          const ch = buildSkillChallenge(c, state, "shoot-low");
          if (!ch) continue;
          const g = keeperGuess(ch);
          const r = rng("siminput", qname, strat, i);
          const input = makeInput(strat, g, r);
          const res = resolvePlayerBeat(c, state, "shoot-low", input);
          if (res.result.outcome === "GOAL") goals++;
        }
        console.log(`${qname.padEnd(8)} ${strat.padEnd(10)} ${String(goals).padStart(5)}    ${pct(goals, N)}`);
      }
    }

    // Keeper guess balance + variety
    let left = 0, high = 0;
    const M = 6000;
    const c = withFinishing(base, 60);
    for (let i = 0; i < M; i++) {
      const ch = buildSkillChallenge(c, shotState(c, `bal-${i}`), "shoot-low")!;
      const g = keeperGuess(ch);
      if (g.dir < 0) left++;
      if (g.high) high++;
    }
    console.log(`\n=== Keeper guess balance (${M} shots) ===`);
    console.log(`left: ${pct(left, M)}   right: ${pct(M - left, M)}   guesses-high: ${pct(high, M)}`);
    console.log("");
  });
});
