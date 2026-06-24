/**
 * Narrated match commentary used to fill the Living Match feed between the
 * player's own moments. Lines may use {opponent} and {club} placeholders.
 */

export type CommentarySet = {
  teamBuildUp: string[];
  oppBuildUp: string[];
  midfield: string[];
  teamGoal: string[];
  oppGoal: string[];
  teamChanceMissed: string[];
  oppChanceMissed: string[];
  kickOff: string[];
  halfTime: string[];
};

export const COMMENTARY: CommentarySet = {
  kickOff: [
    "The referee gets us underway.",
    "We're off — {club} get the match started.",
    "Here we go, kick-off against {opponent}.",
  ],
  halfTime: [
    "The half-time whistle sounds.",
    "A breather as the teams head in.",
  ],
  teamBuildUp: [
    "{club} knock it around the back, looking for a way in.",
    "Patient build-up from your side.",
    "Your midfield starts to take control of the tempo.",
    "A teammate drives forward, drawing defenders.",
    "{club} work it wide, probing for an opening.",
  ],
  oppBuildUp: [
    "{opponent} keep possession, pinning your side back.",
    "Pressure now from {opponent} as they push numbers forward.",
    "The visitors switch it across the back, patient and probing.",
    "{opponent} are starting to find pockets of space.",
    "A spell of {opponent} pressure forces your team deep.",
  ],
  midfield: [
    "Scrappy stuff in midfield, neither side able to settle.",
    "The ball pings between the boxes — end-to-end now.",
    "A loose, niggly passage of play.",
    "Both sides cancel each other out for a spell.",
    "The tempo drops as the teams trade possession.",
  ],
  teamGoal: [
    "GOAL! {club} break through — the bench erupts!",
    "It's in! A teammate finishes it off for {club}!",
    "{club} score! What a time to find the net!",
    "GOAL for {club} — the away end is bouncing!",
  ],
  oppGoal: [
    "Against the run of play — {opponent} score.",
    "Disaster at the back. {opponent} punish a lapse.",
    "GOAL {opponent}. Heads drop around you.",
    "{opponent} find a way through and it's in the net.",
  ],
  teamChanceMissed: [
    "Big chance for {club} — but it's wasted!",
    "So close! A teammate drags it wide.",
    "The keeper denies {club} with a flying save.",
  ],
  oppChanceMissed: [
    "Let off! {opponent} blaze it over.",
    "Your keeper stands tall to deny {opponent}.",
    "Off the post! {opponent} should have scored.",
  ],
};
