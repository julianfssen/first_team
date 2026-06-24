/**
 * GameEffect interpreter + trait progression.
 *
 * GameEffects are the shared currency of events and traits. They mutate a
 * Career in place (callers clone first). Trait progress that crosses a
 * threshold unlocks the trait and immediately applies its passive effects.
 */

import type { Career, GameEffect, TraitId, TraitDef } from "./types";
import { TRAITS } from "@/data/traits";
import { applyAttributeDelta, applyStatusDelta } from "./util";
import { pushTimeline } from "./timeline";
import { createInjury } from "./injuryEngine";

const TRAIT_BY_ID: Map<TraitId, TraitDef> = new Map(TRAITS.map((t) => [t.id, t]));

export function traitDef(id: TraitId): TraitDef | undefined {
  return TRAIT_BY_ID.get(id);
}

/** Apply a single effect in place. */
export function applyEffect(career: Career, effect: GameEffect): void {
  switch (effect.type) {
    case "attribute":
      applyAttributeDelta(career.attributes, effect.key, effect.delta);
      break;
    case "status":
      applyStatusDelta(career.status, effect.key, effect.delta);
      break;
    case "traitProgress":
      addTraitProgress(career, effect.traitId, effect.amount);
      break;
    case "injury":
      if (!career.injury) {
        career.injury = createInjury(career, effect.severity);
        career.seasonStats.injuries += 1;
        pushTimeline(career, "INJURY", `Picked up a ${career.injury.name}.`);
      }
      break;
    case "money":
      career.wage = Math.max(0, career.wage + effect.delta);
      break;
  }
}

export function applyEffects(career: Career, effects: GameEffect[]): void {
  for (const effect of effects) applyEffect(career, effect);
}

/** Add progress toward a trait; unlock + apply passive effects if threshold crossed. */
export function addTraitProgress(
  career: Career,
  traitId: TraitId,
  amount: number,
): void {
  let entry = career.traits.find((t) => t.traitId === traitId);
  if (!entry) {
    const def = TRAIT_BY_ID.get(traitId);
    entry = { traitId, progress: 0, threshold: def?.threshold ?? 100, unlocked: false };
    career.traits.push(entry);
  }
  if (entry.unlocked) return;
  entry.progress += amount;
  if (entry.progress >= entry.threshold) {
    entry.progress = entry.threshold;
    entry.unlocked = true;
    const def = TRAIT_BY_ID.get(traitId);
    if (def) {
      pushTimeline(career, "TRAIT_UNLOCKED", `Unlocked trait: ${def.name}.`);
      // Apply the trait's passive effects once on unlock.
      for (const eff of def.effects) {
        // Avoid recursive trait-progress loops from trait effects.
        if (eff.type !== "traitProgress") applyEffect(career, eff);
      }
    }
  }
}

export function hasTrait(career: Career, traitId: TraitId): boolean {
  return career.traits.some((t) => t.traitId === traitId && t.unlocked);
}

export function unlockedTraitIds(career: Career): TraitId[] {
  return career.traits.filter((t) => t.unlocked).map((t) => t.traitId);
}
