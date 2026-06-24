/**
 * Weekly training loop.
 *
 * advanceWeek applies the player's chosen weekly focus: natural recovery, then
 * the choice's attribute growth (via the progression engine), status effects
 * and trait nudges. It does NOT increment the week counter or play the match —
 * the caller sequences (advanceWeek → maybe event → match → commitWeek).
 */

import type { Career, WeeklyChoiceId, WeekResult } from "./types";
import { WEEKLY_CHOICES } from "./weeklyChoices";
import { applyTraining } from "./progressionEngine";
import { addTraitProgress } from "./effects";
import { applyStatusDelta, clone } from "./util";
import { isInjured, tickInjuryRecovery } from "./injuryEngine";
import { FAMILY_LABEL } from "./constants";

export function advanceWeek(career: Career, choiceId: WeeklyChoiceId): WeekResult {
  const c = clone(career);
  const choice = WEEKLY_CHOICES[choiceId];
  const log: string[] = [];

  const injuredAtStart = isInjured(c);
  const hadMatch = !injuredAtStart;

  // Natural week-to-week recovery and decay.
  applyStatusDelta(c.status, "fatigue", -10);
  applyStatusDelta(c.status, "mediaPressure", -2);
  applyStatusDelta(c.status, "injuryRisk", -1);

  // Apply the chosen focus.
  if (choice.attributeGrowth) {
    const factor = injuredAtStart ? 0.4 : 1;
    const scaled: Record<string, number> = {};
    for (const k in choice.attributeGrowth) {
      scaled[k] = (choice.attributeGrowth[k as keyof typeof choice.attributeGrowth] ?? 0) * factor;
    }
    const changes = applyTraining(c, scaled);
    for (const ch of changes) {
      log.push(`${ch.key} ${ch.delta >= 0 ? "+" : ""}${ch.delta.toFixed(1)}`);
    }
  }
  if (choice.statusEffects) {
    for (const k in choice.statusEffects) {
      applyStatusDelta(c.status, k as keyof typeof c.status, choice.statusEffects[k as keyof typeof choice.statusEffects] ?? 0);
    }
  }
  if (choice.traitProgress) {
    for (const tp of choice.traitProgress) addTraitProgress(c, tp.traitId, tp.amount);
  }

  // Injury recovery.
  if (injuredAtStart) {
    const recovered = tickInjuryRecovery(c);
    if (recovered) {
      log.push("Returned to full fitness.");
      applyStatusDelta(c.status, "morale", 6);
    } else if (c.injury) {
      log.push(`Rehab continues — ${c.injury.weeksRemaining} week(s) until return.`);
    }
  }

  if (hadMatch) {
    log.push(`Trained as a ${FAMILY_LABEL[c.positionFamily]} and prepared for matchday.`);
  }

  return { career: c, log, hadMatch };
}
