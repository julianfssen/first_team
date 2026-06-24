/**
 * Passage helpers (Stage 2).
 *
 * A passage is a 1+ stage flow of decisions. Single-stage moments from
 * data/matchMoments.ts are wrapped as 1-stage passages (every choice FINISHes),
 * so they behave exactly as before; data/passages.ts adds genuine multi-stage
 * passages. The simulator draws from the combined per-family pool.
 */

import type {
  ActivePassage,
  MatchMoment,
  MatchMomentTemplate,
  MomentPassageTemplate,
} from "./types";
import { MATCH_MOMENTS } from "@/data/matchMoments";
import { PASSAGES } from "@/data/passages";

function wrapSingle(t: MatchMomentTemplate): MomentPassageTemplate {
  return {
    id: t.id,
    positionFamilies: t.positionFamilies,
    stages: [
      {
        title: t.title,
        description: t.description,
        choices: t.choices.map((c) => ({ ...c, flow: "FINISH" as const })),
      },
    ],
  };
}

const WRAPPED_SINGLES = MATCH_MOMENTS.map(wrapSingle);
const ALL = [...WRAPPED_SINGLES, ...PASSAGES];
const BY_ID = new Map<string, MomentPassageTemplate>(ALL.map((p) => [p.id, p]));
const POOL_BY_FAMILY = new Map<string, MomentPassageTemplate[]>();

export function getPassage(id: string): MomentPassageTemplate | undefined {
  return BY_ID.get(id);
}

export function isMultiStage(p: MomentPassageTemplate): boolean {
  return p.stages.length > 1;
}

export function allPassages(family: string): MomentPassageTemplate[] {
  let pool = POOL_BY_FAMILY.get(family);
  if (!pool) {
    pool = ALL.filter((p) => p.positionFamilies.includes(family as never));
    POOL_BY_FAMILY.set(family, pool);
  }
  return pool;
}

/** Instantiate the passage's CURRENT stage as a concrete match moment. */
export function instantiateStageMoment(matchId: string, ap: ActivePassage): MatchMoment {
  const stage = ap.template.stages[ap.stageIndex];
  return {
    id: `${matchId}-p${ap.slotIndex}-s${ap.stageIndex}-${ap.template.id}`,
    templateId: ap.template.id,
    positionFamilies: ap.template.positionFamilies,
    minute: ap.minute,
    title: stage.title,
    description: stage.description,
    importance: ap.importance,
    choices: stage.choices,
  };
}
