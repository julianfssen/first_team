/**
 * Skill flourishes (Stage 3).
 *
 * Marquee choices (a shot, a penalty, a last-ditch tackle, a shot-stop) trigger
 * a quick skill mini-game instead of a pure dice roll:
 *   - The deterministic `competence` (stats + form + traits − fatigue − pressure)
 *     sizes the success window (`forgiveness`).
 *   - The player's input resolves the execution.
 *   - Together they yield a tier, which flows into the normal outcome pipeline.
 *
 * The window size is a stat lever (you can't twitch past a hopeless attempt),
 * and the input is the skill (stats alone don't guarantee it). The seeded parts
 * (keeper position, sweet-zone centre) are reproducible; only the tap is live.
 */

import type {
  Career,
  MatchMomentChoiceTemplate,
  MatchState,
  SkillChallenge,
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
  return null;
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

  const r = rng(career.seed, "skill", moment.id, choiceId);

  if (kind === "AIM") {
    const zones = 5;
    const coverCount = clamp(Math.round(1 + (1 - forgiveness) * 3), 1, 4);
    const center = r.int(0, zones - 1);
    const keeperZones: number[] = [];
    // Build a contiguous covered span around the keeper's chosen side.
    let lo = center - Math.floor((coverCount - 1) / 2);
    lo = clamp(lo, 0, zones - coverCount);
    for (let i = 0; i < coverCount; i++) keeperZones.push(lo + i);
    return {
      kind,
      forgiveness,
      label: "Pick your spot",
      prompt: "Find the gap the keeper leaves — corners are best.",
      zones,
      keeperZones,
    };
  }

  // TIMING
  const sweetCenter = r.range(0.18, 0.82);
  const sweetWidth = clamp(0.12 + forgiveness * 0.3, 0.1, 0.45);
  const label = "Time it";
  return {
    kind,
    forgiveness,
    label,
    prompt: "Stop the marker in the green.",
    sweetCenter,
    sweetWidth,
  };
}

/** Score the player's raw input against the challenge → accuracy 0..1. */
export function scoreSkillInput(challenge: SkillChallenge, input: SkillInput): number {
  if (challenge.kind === "AIM") {
    const zones = challenge.zones ?? 5;
    const z = clamp(Math.round(input.value), 0, zones - 1);
    if ((challenge.keeperZones ?? []).includes(z)) return 0.15; // saved
    const corner = z === 0 || z === zones - 1;
    return corner ? 0.9 : 0.7;
  }
  // TIMING
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
