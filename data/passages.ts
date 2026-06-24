/**
 * Multi-stage match passages (Stage 2).
 *
 * A passage is a short flow of decisions ("a passage of play") rather than a
 * single click. Each choice's `flow` controls progression:
 *   - ADVANCE: success/partial carries the move to the next stage; failure ends
 *     the passage early as a turnover.
 *   - FINISH: ends the passage (a shot, clearance, final ball).
 *   - END: always ends the passage (recycle / abort / play safe).
 *
 * Single-stage moments live in data/matchMoments.ts and are wrapped as 1-stage
 * passages automatically — these are the genuinely multi-stage ones.
 */

import type { MomentPassageTemplate } from "@/lib/game/types";

export const PASSAGES: MomentPassageTemplate[] = [
  {
    id: "wing-run-at-fullback",
    positionFamilies: ["WINGER"],
    stages: [
      {
        title: "One-on-One",
        description: "You get it wide with space to attack, isolated against their fullback.",
        choices: [
          { id: "knock-and-go", label: "Knock it past and sprint", risk: "MEDIUM", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 2 }] },
          { id: "stepover-inside", label: "Stepover, cut inside", risk: "HIGH", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 3 }] },
          { id: "lay-back", label: "Lay it back, keep shape", risk: "LOW", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
      {
        title: "Into the Box",
        description: "You're past him and into the box — the keeper rushes to narrow the angle.",
        choices: [
          { id: "shoot-near", label: "Smash it near post", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }] },
          { id: "square-tap", label: "Square for the tap-in", risk: "MEDIUM", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 2 }] },
          { id: "cut-back", label: "Cut it back to the edge", risk: "LOW", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
        ],
      },
      {
        title: "The Cutback",
        description: "You roll it to the onrushing midfielder at the top of the box.",
        choices: [
          { id: "one-two-curl", label: "Take the return and curl it", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "dummy", label: "Dummy and let it run", risk: "MEDIUM", check: "COMPOSURE", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH" },
        ],
      },
    ],
  },
  {
    id: "st-through-on-goal",
    positionFamilies: ["STRIKER"],
    stages: [
      {
        title: "Through on Goal",
        description: "A defender slips and you're clean through, the keeper charging out.",
        choices: [
          { id: "round-keeper", label: "Take it round the keeper", risk: "HIGH", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "NEUTRAL", failureOutcome: "CHANCE_MISSED", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 2 }] },
          { id: "shoot-low", label: "Shoot early and low", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }] },
          { id: "chip", label: "Dink it over the keeper", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
        ],
      },
      {
        title: "Round the Keeper",
        description: "You've beaten him — tight angle now, a defender sprinting back to cover.",
        choices: [
          { id: "slot-empty", label: "Slot into the empty net", risk: "LOW", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "square-striker", label: "Square to a teammate", risk: "MEDIUM", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 2 }] },
        ],
      },
    ],
  },
  {
    id: "cm-win-and-drive",
    positionFamilies: ["CENTRAL_MIDFIELDER"],
    stages: [
      {
        title: "Win It Back",
        description: "You step in and intercept on halfway — green grass opens up ahead.",
        choices: [
          { id: "drive", label: "Drive into the space", risk: "MEDIUM", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "first-time-ball", label: "First-time through ball", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 3 }] },
          { id: "recycle", label: "Recycle, keep possession", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "Edge of the Box",
        description: "You carry it to the edge of the area, defenders backpedalling.",
        choices: [
          { id: "thread", label: "Thread it through", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 3 }] },
          { id: "crack", label: "Have a crack yourself", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH" },
          { id: "lay-recycle", label: "Lay it off and recycle", risk: "LOW", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
    ],
  },
  {
    id: "cb-last-ditch",
    positionFamilies: ["CENTRE_BACK"],
    stages: [
      {
        title: "Last Man",
        description: "Their striker spins in behind. You're the last man, scrambling across to cover.",
        choices: [
          { id: "commit-tackle", label: "Commit to the tackle", risk: "HIGH", check: "DEFEND", successOutcome: "TACKLE_WON", partialOutcome: "CLEARANCE", failureOutcome: "DEFENSIVE_ERROR", flow: "FINISH", traitProgress: [{ traitId: "HARD_TACKLER", amount: 3 }] },
          { id: "jockey", label: "Jockey and delay", risk: "MEDIUM", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
          { id: "shepherd", label: "Shepherd him wide", risk: "LOW", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
        ],
      },
      {
        title: "Buying Time",
        description: "You've slowed him down and cover arrives — but he shapes to shoot.",
        choices: [
          { id: "block", label: "Throw yourself in the way", risk: "HIGH", check: "DEFEND", successOutcome: "BLOCK", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "HARD_TACKLER", amount: 2 }] },
          { id: "stay-feet", label: "Stay on your feet", risk: "MEDIUM", check: "DEFEND", successOutcome: "CLEARANCE", partialOutcome: "GOOD_DECISION", failureOutcome: "GOAL_CONCEDED", flow: "FINISH" },
        ],
      },
    ],
  },
  {
    id: "gk-cross-and-shot",
    positionFamilies: ["GOALKEEPER"],
    stages: [
      {
        title: "Cross Incoming",
        description: "A deep cross swings toward the back post, bodies everywhere in your six-yard box.",
        choices: [
          { id: "claim", label: "Come and claim it", risk: "HIGH", check: "AERIAL", successOutcome: "AERIAL_WON", partialOutcome: "CLEARANCE", failureOutcome: "GK_ERROR", flow: "FINISH", traitProgress: [{ traitId: "SAFE_HANDS", amount: 2 }] },
          { id: "punch", label: "Punch it clear", risk: "MEDIUM", check: "AERIAL", successOutcome: "CLEARANCE", partialOutcome: "NEUTRAL", failureOutcome: "GK_ERROR", flow: "ADVANCE" },
          { id: "set", label: "Stay and set yourself", risk: "LOW", check: "GK_SAVE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
        ],
      },
      {
        title: "It Drops",
        description: "The ball drops to their striker eight yards out — a shot is coming.",
        choices: [
          { id: "spread", label: "Spread yourself big", risk: "HIGH", check: "GK_SAVE", successOutcome: "SAVE", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "SAFE_HANDS", amount: 3 }] },
          { id: "stand-tall", label: "Stand tall, wait", risk: "MEDIUM", check: "GK_SAVE", successOutcome: "SAVE", partialOutcome: "GOAL_CONCEDED", failureOutcome: "GOAL_CONCEDED", flow: "FINISH" },
        ],
      },
    ],
  },
  {
    id: "fb-overlap",
    positionFamilies: ["FULLBACK", "WINGBACK"],
    stages: [
      {
        title: "The Overlap",
        description: "Your winger drives inside and the touchline opens up — you burst onto the overlap.",
        choices: [
          { id: "sprint-overlap", label: "Sprint into the space", risk: "MEDIUM", check: "PHYSICAL", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "early-cross", label: "First-time early cross", risk: "HIGH", check: "PASS", successOutcome: "CROSS_COMPLETED", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH" },
          { id: "hold", label: "Hold and keep your shape", risk: "LOW", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "Byline",
        description: "You reach the byline with the ball — runners attacking the box.",
        choices: [
          { id: "cutback", label: "Whip a low cutback", risk: "MEDIUM", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "SET_PIECE_THREAT", amount: 1 }] },
          { id: "near-post", label: "Drill it to the near post", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "CROSS_COMPLETED", failureOutcome: "POSSESSION_LOST", flow: "FINISH" },
        ],
      },
    ],
  },

  // ── DEFENSIVE_MIDFIELDER ─────────────────────────────────────────────────
  {
    id: "dm-screen-and-spring",
    positionFamilies: ["DEFENSIVE_MIDFIELDER"],
    stages: [
      {
        title: "Screen the Pass",
        description: "Their playmaker turns to feed the gap in front of your back four. You read it early.",
        choices: [
          { id: "step-intercept", label: "Step in and intercept", risk: "HIGH", check: "DEFEND", successOutcome: "INTERCEPTION", partialOutcome: "GOOD_DECISION", failureOutcome: "DEFENSIVE_ERROR", flow: "ADVANCE", traitProgress: [{ traitId: "HARD_TACKLER", amount: 2 }] },
          { id: "cut-shadow", label: "Cut the passing lane, shadow him", risk: "MEDIUM", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "drop-protect", label: "Drop and protect the back line", risk: "LOW", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "Spring the Counter",
        description: "You've won it and the pitch tilts — they're stretched, your forwards already turning.",
        choices: [
          { id: "first-time-spring", label: "First-time ball into the channel", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }] },
          { id: "drive-carry", label: "Carry it forward yourself", risk: "MEDIUM", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "FINISH" },
          { id: "simple-side", label: "Simple ball, keep it ticking", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
    ],
  },
  {
    id: "dm-press-resist",
    positionFamilies: ["DEFENSIVE_MIDFIELDER", "CENTRAL_MIDFIELDER"],
    stages: [
      {
        title: "Receiving Under Pressure",
        description: "The ball comes into your feet with your back to goal and a midfielder breathing on your shoulder.",
        choices: [
          { id: "half-turn", label: "Half-turn out of the press", risk: "HIGH", check: "COMPOSURE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "PRESS_RESISTANT", amount: 3 }] },
          { id: "shield-lay", label: "Shield it and lay it back", risk: "MEDIUM", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "PRESS_RESISTANT", amount: 1 }] },
          { id: "back-keeper", label: "Set it back to safety", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "The Outlet",
        description: "You've wriggled free into a pocket of space, the game opening up in front of you.",
        choices: [
          { id: "switch-play", label: "Switch the play long", risk: "HIGH", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }] },
          { id: "line-break", label: "Slide a line-breaking pass", risk: "MEDIUM", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 1 }] },
          { id: "keep-it", label: "Keep it simple, retain", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
    ],
  },
  {
    id: "dm-recover-and-block",
    positionFamilies: ["DEFENSIVE_MIDFIELDER", "CENTRE_BACK"],
    stages: [
      {
        title: "Transition Danger",
        description: "Your side lose it cheaply and their runner breaks at the gap. You sprint back to recover.",
        choices: [
          { id: "slide-tackle", label: "Time a sliding tackle", risk: "HIGH", check: "DEFEND", successOutcome: "TACKLE_WON", partialOutcome: "CLEARANCE", failureOutcome: "DEFENSIVE_ERROR", flow: "FINISH", traitProgress: [{ traitId: "HARD_TACKLER", amount: 3 }] },
          { id: "track-delay", label: "Track and delay him", risk: "MEDIUM", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
          { id: "guide-wide", label: "Usher him away from goal", risk: "LOW", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
        ],
      },
      {
        title: "The Shot Looms",
        description: "He's slowed but cuts back onto his stronger foot — a strike is loading.",
        choices: [
          { id: "throw-block", label: "Throw your body in front", risk: "HIGH", check: "DEFEND", successOutcome: "BLOCK", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "HARD_TACKLER", amount: 2 }] },
          { id: "stay-block-lane", label: "Hold the lane, show him outside", risk: "MEDIUM", check: "DEFEND", successOutcome: "CLEARANCE", partialOutcome: "GOOD_DECISION", failureOutcome: "GOAL_CONCEDED", flow: "FINISH" },
        ],
      },
    ],
  },

  // ── ATTACKING_MIDFIELDER ─────────────────────────────────────────────────
  {
    id: "am-between-the-lines",
    positionFamilies: ["ATTACKING_MIDFIELDER"],
    stages: [
      {
        title: "Between the Lines",
        description: "You drift into the pocket between their midfield and defence and the ball finds your feet.",
        choices: [
          { id: "turn-and-drive", label: "Turn sharply and drive at them", risk: "HIGH", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 2 }] },
          { id: "slip-runner", label: "Slip a runner in behind", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 3 }] },
          { id: "set-recycle", label: "Set it back and rotate", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
      {
        title: "At the Heart of It",
        description: "You've burst through the lines and the defence backs off, the box looming.",
        choices: [
          { id: "shoot-edge", label: "Open up and curl one", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "disguised-pass", label: "Disguised through ball", risk: "MEDIUM", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }] },
          { id: "draw-and-lay", label: "Draw a man, lay it square", risk: "LOW", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
    ],
  },
  {
    id: "am-edge-of-box-magic",
    positionFamilies: ["ATTACKING_MIDFIELDER", "CENTRAL_MIDFIELDER"],
    stages: [
      {
        title: "Picking the Lock",
        description: "They've sat deep and packed the box. You get it twenty-five yards out, facing a wall of bodies.",
        choices: [
          { id: "one-two-edge", label: "Play a one-two to break in", risk: "HIGH", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }] },
          { id: "shimmy-half-yard", label: "Shimmy for half a yard", risk: "MEDIUM", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 1 }] },
          { id: "wide-switch", label: "Spread it wide and reset", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "The Sight of Goal",
        description: "The lock springs open and a yard of daylight appears in front of the goal.",
        choices: [
          { id: "thunderbastard", label: "Let fly from distance", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }] },
          { id: "placed-finish", label: "Side-foot it into the corner", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "tee-up", label: "Tee up the runner inside", risk: "MEDIUM", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 2 }] },
        ],
      },
    ],
  },
  {
    id: "am-late-run-into-box",
    positionFamilies: ["ATTACKING_MIDFIELDER", "WINGER"],
    stages: [
      {
        title: "The Late Run",
        description: "The move builds down the right and you ghost in late, unmarked at the back post.",
        choices: [
          { id: "demand-ball", label: "Time the run, demand the cross", risk: "MEDIUM", check: "PHYSICAL", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "peel-far", label: "Peel off into the far gap", risk: "HIGH", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "hold-edge", label: "Hold at the edge for the cutback", risk: "LOW", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "The Ball Arrives",
        description: "The cross hangs and drops perfectly to you, six yards out with the keeper committed.",
        choices: [
          { id: "first-time-volley", label: "First-time volley it", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }] },
          { id: "cushion-finish", label: "Cushion it down and slot", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "head-across", label: "Head it across for a teammate", risk: "MEDIUM", check: "AERIAL", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 2 }] },
        ],
      },
    ],
  },

  // ── WINGER (top-up) ──────────────────────────────────────────────────────
  {
    id: "wing-touchline-to-cross",
    positionFamilies: ["WINGER"],
    stages: [
      {
        title: "Hugging the Line",
        description: "You collect it on the touchline with the fullback set and the byline beckoning.",
        choices: [
          { id: "burn-outside", label: "Burn him on the outside", risk: "HIGH", check: "PHYSICAL", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 2 }] },
          { id: "feint-cross", label: "Feint, then whip an early ball", risk: "MEDIUM", check: "PASS", successOutcome: "CROSS_COMPLETED", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "SET_PIECE_THREAT", amount: 1 }] },
          { id: "back-recycle", label: "Roll it back, keep it", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
      {
        title: "At the Byline",
        description: "You've turned the corner and reach the byline, the six-yard box filling with runners.",
        choices: [
          { id: "whipped-cross", label: "Whip it across the face", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "CROSS_COMPLETED", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "SET_PIECE_THREAT", amount: 2 }] },
          { id: "low-cutback", label: "Pull it back to the spot", risk: "MEDIUM", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 1 }] },
          { id: "near-post-shot", label: "Stab it at the near post yourself", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "SELFISH", amount: 1 }] },
        ],
      },
    ],
  },

  // ── STRIKER (top-up) ─────────────────────────────────────────────────────
  {
    id: "st-hold-up-and-finish",
    positionFamilies: ["STRIKER"],
    stages: [
      {
        title: "Back to Goal",
        description: "A long ball is launched up to you with a centre-back tight to your back. You have to make it stick.",
        choices: [
          { id: "hold-bring-in", label: "Hold it up, bring others in", risk: "MEDIUM", check: "PHYSICAL", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "TARGET_MAN", amount: 2 }] },
          { id: "spin-off", label: "Spin off the back and go", risk: "HIGH", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "EXPLOSIVE_DRIBBLER", amount: 2 }] },
          { id: "lay-off-safe", label: "Lay it off first time", risk: "LOW", check: "PASS", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "TARGET_MAN", amount: 1 }] },
        ],
      },
      {
        title: "The Return Ball",
        description: "Support arrives and the ball is bounced back into your stride at the edge of the box.",
        choices: [
          { id: "first-time-finish", label: "First-time it across the keeper", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }] },
          { id: "touch-then-shoot", label: "Touch, set, then strike", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "release-overlap", label: "Release the overlapping man", risk: "LOW", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 2 }] },
        ],
      },
    ],
  },

  // ── CENTRAL_MIDFIELDER (top-up beyond shared ones) ───────────────────────
  {
    id: "cm-box-to-box-surge",
    positionFamilies: ["CENTRAL_MIDFIELDER"],
    stages: [
      {
        title: "Box to Box",
        description: "Your team breaks at pace and you surge up from deep, lungs burning, into open midfield.",
        choices: [
          { id: "carry-momentum", label: "Carry it with momentum", risk: "MEDIUM", check: "DRIBBLE", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "release-early", label: "Release the winger early", risk: "HIGH", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }] },
          { id: "slow-it", label: "Slow it down, take a breath", risk: "LOW", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "Arriving Late",
        description: "The ball works wide and you keep running, arriving at the top of the box unseen.",
        choices: [
          { id: "smash-first-time", label: "Smash the cutback first time", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "side-foot-corner", label: "Side-foot it into the corner", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "lay-and-spin", label: "Dummy it for the man behind", risk: "MEDIUM", check: "COMPOSURE", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
    ],
  },

  // ── CENTRE_BACK (top-up beyond shared dm-recover-and-block) ──────────────
  {
    id: "cb-aerial-duel-set-piece",
    positionFamilies: ["CENTRE_BACK"],
    stages: [
      {
        title: "Defending the Corner",
        description: "Their corner swings in toward the penalty spot, their big striker rising beside you.",
        choices: [
          { id: "attack-ball", label: "Attack the ball and clear", risk: "HIGH", check: "AERIAL", successOutcome: "AERIAL_WON", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE", traitProgress: [{ traitId: "HARD_TACKLER", amount: 1 }] },
          { id: "body-position", label: "Get your body between man and ball", risk: "MEDIUM", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
          { id: "head-clear-safe", label: "Head it long and safe", risk: "LOW", check: "AERIAL", successOutcome: "CLEARANCE", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "The Second Ball",
        description: "Your header only half-clears and it drops to the edge of the box — a striker pulls the trigger.",
        choices: [
          { id: "charge-block", label: "Charge out and block it", risk: "HIGH", check: "DEFEND", successOutcome: "BLOCK", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "HARD_TACKLER", amount: 2 }] },
          { id: "screen-block", label: "Stay compact and screen", risk: "MEDIUM", check: "DEFEND", successOutcome: "CLEARANCE", partialOutcome: "GOOD_DECISION", failureOutcome: "GOAL_CONCEDED", flow: "FINISH" },
        ],
      },
    ],
  },

  // ── GOALKEEPER (top-up) ──────────────────────────────────────────────────
  {
    id: "gk-sweeper-and-distribute",
    positionFamilies: ["GOALKEEPER"],
    stages: [
      {
        title: "Through Ball Behind",
        description: "A ball is clipped over your high line and their striker tears after it. You're miles off your line.",
        choices: [
          { id: "rush-sweep", label: "Rush out and sweep it clear", risk: "HIGH", check: "GK_DISTRIBUTION", successOutcome: "CLEARANCE", partialOutcome: "GOOD_DECISION", failureOutcome: "GK_ERROR", flow: "ADVANCE", traitProgress: [{ traitId: "SWEEPER_KEEPER", amount: 3 }] },
          { id: "smother", label: "Come and smother at his feet", risk: "HIGH", check: "GK_SAVE", successOutcome: "SAVE", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "SAFE_HANDS", amount: 2 }] },
          { id: "hold-line-set", label: "Hold your line and set", risk: "LOW", check: "GK_SAVE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
        ],
      },
      {
        title: "Starting the Attack",
        description: "You've gathered it cleanly outside the box — their press is closing but your full-backs are free.",
        choices: [
          { id: "throw-counter", label: "Roll it out to spark the counter", risk: "MEDIUM", check: "GK_DISTRIBUTION", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "SWEEPER_KEEPER", amount: 2 }] },
          { id: "ping-long", label: "Ping it long to the striker", risk: "HIGH", check: "GK_DISTRIBUTION", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH" },
          { id: "clear-safe", label: "Hoof it clear and reset", risk: "LOW", check: "GK_DISTRIBUTION", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
    ],
  },

  // ── FULLBACK / WINGBACK (top-up) ─────────────────────────────────────────
  {
    id: "fb-recover-and-spring",
    positionFamilies: ["FULLBACK", "WINGBACK"],
    stages: [
      {
        title: "Caught Out Wide",
        description: "Their winger gets at you one-on-one with the line behind you, looking to go outside.",
        choices: [
          { id: "poke-tackle", label: "Poke the ball away", risk: "HIGH", check: "DEFEND", successOutcome: "TACKLE_WON", partialOutcome: "CLEARANCE", failureOutcome: "DEFENSIVE_ERROR", flow: "ADVANCE", traitProgress: [{ traitId: "HARD_TACKLER", amount: 2 }] },
          { id: "jockey-inside", label: "Jockey and force him inside", risk: "MEDIUM", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
          { id: "concede-throw", label: "Shepherd it out for a throw", risk: "LOW", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "From Defence to Attack",
        description: "You've nicked it back and suddenly the flank ahead is wide open, their winger stranded upfield.",
        choices: [
          { id: "overlap-burst", label: "Burst forward down the wing", risk: "MEDIUM", check: "PHYSICAL", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "FINISH" },
          { id: "diagonal-release", label: "Release the striker with a diagonal", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "PLAYMAKER", amount: 2 }] },
          { id: "calm-keep", label: "Stay calm, give it short", risk: "LOW", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "PRESS_RESISTANT", amount: 1 }] },
        ],
      },
    ],
  },
  {
    id: "fb-underlap-and-cross",
    positionFamilies: ["FULLBACK", "WINGBACK"],
    stages: [
      {
        title: "The Underlap",
        description: "Your winger holds it wide and stands the defender up — the inside channel yawns open for you.",
        choices: [
          { id: "dart-inside", label: "Dart into the half-space", risk: "MEDIUM", check: "PHYSICAL", successOutcome: "DRIBBLE_PAST", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "one-two-wing", label: "One-two off the winger", risk: "HIGH", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "PLAYMAKER", amount: 1 }] },
          { id: "hold-width", label: "Hold your width, stay safe", risk: "LOW", check: "DEFEND", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END" },
        ],
      },
      {
        title: "Inside the Box",
        description: "You've slipped through the inside and find yourself in the box at a tight angle.",
        choices: [
          { id: "low-drilled-cross", label: "Drill a low ball across", risk: "HIGH", check: "PASS", successOutcome: "ASSIST", partialOutcome: "CROSS_COMPLETED", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "SET_PIECE_THREAT", amount: 2 }] },
          { id: "squeeze-near", label: "Squeeze it in at the near post", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 1 }] },
          { id: "pull-back-safe", label: "Pull it back to the edge", risk: "MEDIUM", check: "PASS", successOutcome: "KEY_PASS", partialOutcome: "GOOD_DECISION", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
    ],
  },
  {
    id: "st-poachers-instinct",
    positionFamilies: ["STRIKER"],
    stages: [
      {
        title: "Reading the Cross",
        description: "A cross is loaded in from the right and you have to gamble on where it drops between the centre-backs.",
        choices: [
          { id: "near-post-dart", label: "Dart to the near post", risk: "HIGH", check: "PHYSICAL", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 1 }] },
          { id: "hang-back-post", label: "Hang at the back post", risk: "MEDIUM", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "ADVANCE" },
          { id: "drop-pull-off", label: "Drop off and pull a marker away", risk: "LOW", check: "COMPOSURE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "POSSESSION_LOST", flow: "END", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 1 }] },
        ],
      },
      {
        title: "The Half-Chance",
        description: "It breaks loose in the six-yard box, a scramble of legs, the ball sitting up for an instant.",
        choices: [
          { id: "snap-shot", label: "Snap a shot off instantly", risk: "HIGH", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 3 }] },
          { id: "toe-poke", label: "Stretch and toe-poke it goalward", risk: "MEDIUM", check: "SHOOT", successOutcome: "GOAL", partialOutcome: "CHANCE_MISSED", failureOutcome: "CHANCE_MISSED", flow: "FINISH", traitProgress: [{ traitId: "CLINICAL_FINISHER", amount: 2 }] },
          { id: "head-down-square", label: "Nod it square to a teammate", risk: "MEDIUM", check: "AERIAL", successOutcome: "ASSIST", partialOutcome: "KEY_PASS", failureOutcome: "POSSESSION_LOST", flow: "FINISH", traitProgress: [{ traitId: "TEAM_PLAYER", amount: 2 }] },
        ],
      },
    ],
  },
  {
    id: "gk-penalty-area-command",
    positionFamilies: ["GOALKEEPER"],
    stages: [
      {
        title: "The One-on-One Build",
        description: "They thread a pass behind your defence and a striker latches on, bearing down on goal.",
        choices: [
          { id: "narrow-angle", label: "Close fast to narrow the angle", risk: "MEDIUM", check: "GK_SAVE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE", traitProgress: [{ traitId: "SAFE_HANDS", amount: 1 }] },
          { id: "stay-big-set", label: "Stay big and set your feet", risk: "LOW", check: "GK_SAVE", successOutcome: "GOOD_DECISION", partialOutcome: "NEUTRAL", failureOutcome: "GOAL_CONCEDED", flow: "ADVANCE" },
          { id: "early-dive", label: "Gamble and dive at his feet early", risk: "HIGH", check: "GK_SAVE", successOutcome: "SAVE", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "SAFE_HANDS", amount: 2 }] },
        ],
      },
      {
        title: "He Pulls the Trigger",
        description: "He opens his body to place it low into the corner — the moment is yours.",
        choices: [
          { id: "strong-hand", label: "Throw out a strong hand", risk: "HIGH", check: "GK_SAVE", successOutcome: "SAVE", partialOutcome: "CLEARANCE", failureOutcome: "GOAL_CONCEDED", flow: "FINISH", traitProgress: [{ traitId: "SAFE_HANDS", amount: 3 }] },
          { id: "block-down-low", label: "Get down behind it", risk: "MEDIUM", check: "GK_SAVE", successOutcome: "SAVE", partialOutcome: "GOAL_CONCEDED", failureOutcome: "GOAL_CONCEDED", flow: "FINISH" },
        ],
      },
    ],
  },
];
