/**
 * Skill flourishes (Stage 3, scene rework).
 *
 * Marquee choices trigger a football mini-scene instead of a dice roll:
 *   - SHOOT            → AIM  (flavor SHOT): drag-and-flick; aim past the keeper.
 *   - GK_SAVE          → TIMING (flavor SAVE): commit the dive at the right instant.
 *   - DEFEND (HIGH)    → TIMING (flavor TACKLE): time the challenge as the ball arrives.
 *   - PASS (HIGH)      → RUN  (flavor THROUGH_BALL): release as the runner hits the gap.
 *
 * The deterministic `competence` (stats + form + traits − fatigue − pressure)
 * sizes the success window (`forgiveness`); the player's input resolves the
 * execution; together they yield a tier that flows into the normal outcome
 * pipeline. Seeded params (keeper band / sweet window) are reproducible.
 */

import type {
  Career,
  MatchMomentChoiceTemplate,
  MatchState,
  ShotType,
  SkillChallenge,
  SkillFlavor,
  SkillInput,
  SkillKind,
} from "./types";
import type { ResolutionTier } from "./ratingEngine";
import { choiceCompetence } from "./matchEngine";
import { instantiateStageMoment } from "./passages";
import { rng } from "./rng";
import { clamp } from "./util";

/** Which marquee choices get a skill mini-game (inferred from the check). */
export function skillKindForChoice(choice: MatchMomentChoiceTemplate): SkillKind | null {
  if (choice.check === "SHOOT") return "AIM";
  if (choice.check === "GK_SAVE") return "TIMING";
  if (choice.check === "DEFEND" && choice.risk === "HIGH") return "TIMING";
  if (choice.check === "PASS" && choice.risk === "HIGH") return "RUN";
  return null;
}

function flavorFor(choice: MatchMomentChoiceTemplate): SkillFlavor {
  if (choice.check === "SHOOT") return "SHOT";
  if (choice.check === "GK_SAVE") return "SAVE";
  if (choice.check === "PASS") return "THROUGH_BALL";
  return "TACKLE";
}

/** Build the (deterministic) challenge for the current pending choice, or null. */
export function buildSkillChallenge(
  career: Career,
  state: MatchState,
  choiceId: string,
): SkillChallenge | null {
  const ap = state.pendingPassage;
  if (!ap) return null;
  const moment = instantiateStageMoment(state.matchId, ap);
  const choice = moment.choices.find((c) => c.id === choiceId);
  if (!choice) return null;
  const kind = skillKindForChoice(choice);
  if (!kind) return null;

  const { score } = choiceCompetence(career, state.context, moment, choiceId, {
    fatigue: 100 - state.stamina,
    extraMod: state.momentum * 0.06 + state.matchConfidence * 0.08,
  });
  let comp = clamp((score - 25) / 55, 0, 1);
  // Extra squeeze when chasing late — the big moments are unforgiving.
  if (state.minute >= 80 && state.teamScore - state.oppScore < 0) comp *= 0.85;
  const forgiveness = clamp(comp, 0.08, 0.95);
  const flavor = flavorFor(choice);
  const r = rng(career.seed, "skill", moment.id, choiceId);

  if (kind === "AIM") {
    const fInv = 1 - forgiveness;
    const roll = r.float();
    let shotType: ShotType, reachBase: number, reachGrow: number, powerFloor: number, windowMs: number;
    let label: string, prompt: string;
    if (roll > 0.82) {
      shotType = "ONE_ON_ONE";
      reachBase = 0.1 + fInv * 0.12;
      reachGrow = 0.2; // the keeper closes faster than normal
      powerFloor = 0.15;
      windowMs = 1900;
      label = "One-on-one!";
      prompt = "Keeper's rushing out — shoot early and pick your side.";
    } else if (roll > 0.64) {
      shotType = "LONG_RANGE";
      reachBase = 0.14 + fInv * 0.14;
      reachGrow = 0.08;
      powerFloor = 0.45; // you need real power from distance
      windowMs = 2800;
      label = "From distance";
      prompt = "Long shot — you'll need real power to beat the keeper.";
    } else {
      shotType = "NORMAL";
      reachBase = 0.11 + fInv * 0.14;
      reachGrow = 0.12;
      powerFloor = 0.18;
      windowMs = 2400;
      label = "Strike!";
      prompt = "Beat the keeper to a corner before the gap shuts.";
    }
    return { kind, flavor, forgiveness, label, prompt, shotType, reachBase, reachGrow, powerFloor, windowMs };
  }

  // TIMING / RUN share a sweet-window model.
  const sweetCenter = r.range(0.18, 0.82);
  const sweetWidth = clamp(0.12 + forgiveness * 0.3, 0.1, 0.45);
  const label = flavor === "SAVE" ? "Get down!" : flavor === "THROUGH_BALL" ? "Lead the run" : "Time the tackle";
  const prompt =
    flavor === "SAVE"
      ? "Commit your dive as the shot comes in."
      : flavor === "THROUGH_BALL"
        ? "Release as the runner hits the gap."
        : "Go in as the ball arrives at your feet.";
  return { kind, flavor, forgiveness, label, prompt, sweetCenter, sweetWidth };
}

/**
 * How far from goal-centre the keeper covers (0..0.5 of the full mouth). Grows as
 * the closing window runs and as power drops; shared by the scorer and the scene
 * so the drawn danger zone always matches what's scored.
 */
export function keeperReach(challenge: SkillChallenge, timing: number, power: number): number {
  const base = challenge.reachBase ?? 0.18;
  const grow = challenge.reachGrow ?? 0.18;
  const t = clamp(timing, 0, 1);
  const p = clamp(power, 0, 1);
  return clamp(base + grow * t + (1 - p) * 0.06, 0.06, 0.45);
}

/** Score the player's raw input against the challenge → accuracy 0..1. */
export function scoreSkillInput(challenge: SkillChallenge, input: SkillInput): number {
  if (challenge.kind === "AIM") {
    const power = clamp(input.power ?? 0.5, 0, 1);
    const timing = clamp(input.timing ?? 1, 0, 1);
    const curl = clamp(input.curl ?? 0, -1, 1);
    const floor = challenge.powerFloor ?? 0.25;

    if (power > 0.97) return 0.18; // ballooned over the bar
    if (power < floor) return 0.2; // too soft — the keeper gathers it

    // aim 0..1 spans post-to-post; aiming/curling beyond the frame misses wide.
    const bent = clamp(input.value, -0.3, 1.3) + curl * 0.25;
    if (bent < -0.06 || bent > 1.06) return 0.15; // wide of the post — a miss
    const finalAim = clamp(bent, 0, 1);

    // A curled shot beats the keeper a touch — they can't adjust to late swerve.
    const reach = Math.max(0.05, keeperReach(challenge, timing, power) - Math.abs(curl) * 0.05);
    const dist = Math.abs(finalAim - 0.5); // 0 = down the middle, 0.5 = right on a post
    if (dist <= reach) return clamp(0.1 + dist * 0.25, 0, 0.32); // within the keeper's reach → saved
    const margin = dist - reach; // how cleanly you beat the keeper
    return clamp(0.5 + margin * 1.7 + dist * 0.3 + Math.abs(curl) * 0.05, 0, 1);
  }

  // TIMING / RUN
  const center = challenge.sweetCenter ?? 0.5;
  const width = challenge.sweetWidth ?? 0.25;
  const error = Math.abs(clamp(input.value, 0, 1) - center);
  return clamp(1 - error / width, 0, 1);
}

export function tierFromAccuracy(accuracy: number): ResolutionTier {
  if (accuracy >= 0.85) return "GREAT";
  if (accuracy >= 0.65) return "GOOD";
  if (accuracy >= 0.45) return "OK";
  if (accuracy >= 0.25) return "POOR";
  return "DISASTER";
}
