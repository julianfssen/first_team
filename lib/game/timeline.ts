import type { Career, TimelineEntryType } from "./types";

/** Append a timeline entry stamped with the career's current position in time. */
export function pushTimeline(
  career: Career,
  type: TimelineEntryType,
  text: string,
): void {
  career.timeline.push({
    id: `${type}-${career.season}-${career.week}-${career.timeline.length}`,
    season: career.season,
    week: career.week,
    age: career.age,
    type,
    text,
  });
}
