/**
 * Story / career event system.
 *
 * Events are eligible if their conditions and phase gates pass. One may fire
 * per week with a moderate probability, chosen by weight. Applying a choice
 * runs its GameEffects.
 */

import type {
  Career,
  CareerEvent,
  EventCondition,
  EventConditionField,
} from "./types";
import { CAREER_EVENTS } from "@/data/events";
import { applyEffects } from "./effects";
import { clone } from "./util";
import { rng } from "./rng";

/** Per-week probability that a story event fires at all. */
const EVENT_CHANCE = 0.42;

function fieldValue(career: Career, field: EventConditionField): number {
  switch (field) {
    case "age": return career.age;
    case "season": return career.season;
    case "reputation": return career.status.reputation;
    case "form": return career.status.form;
    case "morale": return career.status.morale;
    case "fatigue": return career.status.fatigue;
    case "coachTrust": return career.status.coachTrust;
    case "injuryRisk": return career.status.injuryRisk;
  }
}

function conditionMet(career: Career, cond: EventCondition): boolean {
  const v = fieldValue(career, cond.field);
  switch (cond.op) {
    case "gt": return v > cond.value;
    case "gte": return v >= cond.value;
    case "lt": return v < cond.value;
    case "lte": return v <= cond.value;
    case "eq": return v === cond.value;
  }
}

export function eligibleEvents(career: Career): CareerEvent[] {
  return CAREER_EVENTS.filter((e) => {
    if (e.phases && e.phases.length > 0 && !e.phases.includes(career.phase)) return false;
    if (e.conditions && !e.conditions.every((c) => conditionMet(career, c))) return false;
    return true;
  });
}

export function generateCareerEvent(career: Career): CareerEvent | null {
  const r = rng(career.seed, "event", career.season, career.week);
  if (!r.chance(EVENT_CHANCE)) return null;
  const pool = eligibleEvents(career);
  if (pool.length === 0) return null;
  return r.weighted(pool, (e) => e.weight);
}

export function applyEventChoice(
  career: Career,
  event: CareerEvent,
  choiceId: string,
): Career {
  const c = clone(career);
  const choice = event.choices.find((ch) => ch.id === choiceId) ?? event.choices[0];
  applyEffects(c, choice.effects);
  return c;
}
