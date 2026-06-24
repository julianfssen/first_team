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
    // Better finishers face a keeper covering a narrower band → a wider open gap.
    const keeperWidth = clamp(0.58 - forgiveness * 0.42, 0.12, 0.6);
    const keeperCenter = clamp(r.range(0.2, 0.8), keeperWidth / 2, 1 - keeperWidth / 2);
    return {
      kind,
      flavor,
      forgiveness,
      label: "Strike!",
      prompt: "Drag back and flick — aim past the keeper, into the corner.",
      keeperCenter,
      keeperWidth,
    };
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

/** Score the player's raw input against the challenge → accuracy 0..1. */
export function scoreSkillInput(challenge: SkillChallenge, input: SkillInput): number {
  if (challenge.kind === "AIM") {
    const aim = clamp(input.value, 0, 1);
    const power = clamp(input.power ?? 0.7, 0, 1);
    const c = challenge.keeperCenter ?? 0.5;
    const w = challenge.keeperWidth ?? 0.4;
    const lo = c - w / 2;
    const hi = c + w / 2;

    // Power: too soft = easy save, too hard = ballooned over; a broad sweet band.
    let pf: number;
    if (power < 0.35) pf = 0.6;
    else if (power > 0.95) pf = 0.55;
    else if (power >= 0.5 && power <= 0.9) pf = 1;
    else pf = 0.85;

    if (aim >= lo && aim <= hi) return clamp(0.15 * pf, 0, 0.22); // straight at the keeper
    const distToPost = Math.min(aim, 1 - aim); // 0 = right against a post
    let placement = 0.7 + (1 - Math.min(distToPost / 0.5, 1)) * 0.22; // post → 0.92, centre → 0.7
    const edge = Math.min(Math.abs(aim - lo), Math.abs(aim - hi));
    if (edge < 0.05) placement *= 0.82; // squeezed right next to the keeper's reach
    return clamp(placement * pf, 0, 1);
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
