import type { HeadlineTemplate } from "@/lib/game/types";

/**
 * Newspaper-style headline templates generated after matches and milestones.
 * Placeholders are substituted by the engine: {player}, {opponent}, {goals},
 * {rating}, {club}. Roughly an even split across the three tones.
 */
export const HEADLINES: HeadlineTemplate[] = [
  // ---------------------------------------------------------------------------
  // POSITIVE
  // ---------------------------------------------------------------------------
  {
    id: "pos_hat_trick_hero",
    tone: "POSITIVE",
    text: "{player} runs riot with {goals} as {club} tear {opponent} apart",
  },
  {
    id: "pos_match_winner",
    tone: "POSITIVE",
    text: "{player} the matchwinner again as {club} sink {opponent}",
  },
  {
    id: "pos_masterclass",
    tone: "POSITIVE",
    text: "Masterclass: {player} earns a stunning {rating} in demolition of {opponent}",
  },
  {
    id: "pos_unstoppable",
    tone: "POSITIVE",
    text: "Unstoppable {player} bags {goals} and the man of the match award",
  },
  {
    id: "pos_world_class",
    tone: "POSITIVE",
    text: "\"World class\": pundits hail {player} after dazzling display for {club}",
  },
  {
    id: "pos_late_winner",
    tone: "POSITIVE",
    text: "{player} breaks {opponent} hearts with a stoppage-time winner",
  },
  {
    id: "pos_form_of_life",
    tone: "POSITIVE",
    text: "{player} in the form of their life as {club} march on",
  },
  {
    id: "pos_carrying_club",
    tone: "POSITIVE",
    text: "One-man show: {player} drags {club} past stubborn {opponent}",
  },
  {
    id: "pos_assist_machine",
    tone: "POSITIVE",
    text: "{player} pulls the strings as {club} dismantle {opponent}",
  },
  {
    id: "pos_perfect_rating",
    tone: "POSITIVE",
    text: "Near-perfect {rating} for {player} in a performance for the ages",
  },
  {
    id: "pos_clutch",
    tone: "POSITIVE",
    text: "Ice cold: {player} delivers when it matters most against {opponent}",
  },

  // ---------------------------------------------------------------------------
  // NEUTRAL
  // ---------------------------------------------------------------------------
  {
    id: "neu_share_spoils",
    tone: "NEUTRAL",
    text: "{club} and {opponent} share the spoils in a tight contest",
  },
  {
    id: "neu_steady_display",
    tone: "NEUTRAL",
    text: "Steady {rating} for {player} as {club} grind out a result",
  },
  {
    id: "neu_quiet_outing",
    tone: "NEUTRAL",
    text: "Quiet afternoon for {player} as {club} face {opponent}",
  },
  {
    id: "neu_job_done",
    tone: "NEUTRAL",
    text: "Job done: {club} edge past {opponent} in a forgettable encounter",
  },
  {
    id: "neu_rotation",
    tone: "NEUTRAL",
    text: "{player} among the changes as {club} rotate against {opponent}",
  },
  {
    id: "neu_off_bench",
    tone: "NEUTRAL",
    text: "{player} introduced from the bench in {club}'s clash with {opponent}",
  },
  {
    id: "neu_workmanlike",
    tone: "NEUTRAL",
    text: "Workmanlike {player} keeps things simple in {club} draw",
  },
  {
    id: "neu_return_xi",
    tone: "NEUTRAL",
    text: "{player} returns to the starting eleven for the trip to {opponent}",
  },
  {
    id: "neu_no_fireworks",
    tone: "NEUTRAL",
    text: "No fireworks as {club} and {opponent} cancel each other out",
  },
  {
    id: "neu_solid_role",
    tone: "NEUTRAL",
    text: "{player} does the unglamorous work in {club}'s narrow win",
  },

  // ---------------------------------------------------------------------------
  // NEGATIVE
  // ---------------------------------------------------------------------------
  {
    id: "neg_anonymous",
    tone: "NEGATIVE",
    text: "Where was {player}? Anonymous {rating} as {opponent} run riot",
  },
  {
    id: "neg_costly_error",
    tone: "NEGATIVE",
    text: "{player}'s costly error gifts {opponent} the points against {club}",
  },
  {
    id: "neg_under_fire",
    tone: "NEGATIVE",
    text: "{player} under fire after dismal display in {club} defeat",
  },
  {
    id: "neg_sent_off",
    tone: "NEGATIVE",
    text: "Red mist: {player} sees red as {club} crumble to {opponent}",
  },
  {
    id: "neg_missed_chances",
    tone: "NEGATIVE",
    text: "Wasteful {player} spurns chances as {club} fall to {opponent}",
  },
  {
    id: "neg_off_the_pace",
    tone: "NEGATIVE",
    text: "Off the pace: {player} struggles for a meagre {rating} versus {opponent}",
  },
  {
    id: "neg_fan_anger",
    tone: "NEGATIVE",
    text: "{club} fans turn on {player} after limp loss to {opponent}",
  },
  {
    id: "neg_crisis_form",
    tone: "NEGATIVE",
    text: "Crisis deepens for {player} amid a run of dreadful form",
  },
  {
    id: "neg_dropped_question",
    tone: "NEGATIVE",
    text: "Pressure mounts: should {player} be dropped after another {rating}?",
  },
  {
    id: "neg_missed_penalty",
    tone: "NEGATIVE",
    text: "Agony for {player}, who fluffs a penalty as {opponent} hold on",
  },
  {
    id: "neg_outclassed",
    tone: "NEGATIVE",
    text: "{player} outclassed as {opponent} expose {club}'s frailties",
  },
];
