import type { TraitDef } from "@/lib/game/types";

/**
 * All 27 unlockable traits. Each accumulates progress (via match moments,
 * training and events) until it crosses its threshold, at which point its
 * passive `effects` are applied to the player. Negative traits (INJURY_PRONE,
 * HOT_HEADED, SELFISH) carry deliberate downsides alongside any upside.
 */
export const TRAITS: TraitDef[] = [
  {
    id: "CLINICAL_FINISHER",
    name: "Clinical Finisher",
    description: "When the chance falls, it stays buried — you rarely waste a clear sight of goal.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "finishing", delta: 5 },
      { type: "attribute", key: "composure", delta: 2 },
    ],
  },
  {
    id: "BIG_GAME_PLAYER",
    name: "Big-Game Player",
    description: "The brighter the lights, the calmer your head — you rise when it matters most.",
    threshold: 120,
    effects: [
      { type: "attribute", key: "composure", delta: 4 },
      { type: "status", key: "confidence", delta: 6 },
    ],
  },
  {
    id: "TEAM_PLAYER",
    name: "Team Player",
    description: "You make everyone around you better and the dressing room loves you for it.",
    threshold: 90,
    effects: [
      { type: "status", key: "teamChemistry", delta: 10 },
      { type: "status", key: "morale", delta: 4 },
    ],
  },
  {
    id: "SELFISH",
    name: "Selfish",
    description: "You back yourself over the pass — great for your goal tally, less so for the room.",
    threshold: 90,
    effects: [
      { type: "attribute", key: "finishing", delta: 3 },
      { type: "status", key: "teamChemistry", delta: -8 },
    ],
  },
  {
    id: "COACHS_FAVORITE",
    name: "Coach's Favorite",
    description: "The manager trusts you implicitly and your name is the first on the team sheet.",
    threshold: 100,
    effects: [
      { type: "status", key: "coachTrust", delta: 10 },
      { type: "status", key: "morale", delta: 3 },
    ],
  },
  {
    id: "MEDIA_DARLING",
    name: "Media Darling",
    description: "Cameras love you and the headlines tend to be kind — your profile sells itself.",
    threshold: 100,
    effects: [
      { type: "status", key: "reputation", delta: 8 },
      { type: "status", key: "mediaPressure", delta: -4 },
    ],
  },
  {
    id: "PROFESSIONAL",
    name: "Consummate Professional",
    description: "Diet, sleep, recovery — every detail is dialled in, and your body thanks you.",
    threshold: 110,
    effects: [
      { type: "attribute", key: "professionalism", delta: 5 },
      { type: "status", key: "injuryRisk", delta: -8 },
    ],
  },
  {
    id: "INJURY_PRONE",
    name: "Injury Prone",
    description: "Your body keeps letting you down at the worst moments — the treatment table knows you well.",
    threshold: 80,
    effects: [{ type: "status", key: "injuryRisk", delta: 10 }],
  },
  {
    id: "SUPER_SUB",
    name: "Super Sub",
    description: "Thrown on with twenty to go, you change games — the bench is a launchpad, not a punishment.",
    threshold: 90,
    effects: [
      { type: "status", key: "confidence", delta: 8 },
      { type: "attribute", key: "finishing", delta: 2 },
    ],
  },
  {
    id: "LATE_BLOOMER",
    name: "Late Bloomer",
    description: "You took the slow road, but the lessons stuck — your game keeps improving when others fade.",
    threshold: 120,
    effects: [
      { type: "attribute", key: "composure", delta: 3 },
      { type: "attribute", key: "positioning", delta: 3 },
      { type: "attribute", key: "professionalism", delta: 2 },
    ],
  },
  {
    id: "WONDERKID",
    name: "Wonderkid",
    description: "A generational talent for your age — scouts whisper your name across the continent.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "dribbling", delta: 3 },
      { type: "attribute", key: "pace", delta: 3 },
      { type: "status", key: "reputation", delta: 6 },
    ],
  },
  {
    id: "LEADER",
    name: "Natural Leader",
    description: "Teammates look to you when the game gets ugly — you carry the armband whether you wear it or not.",
    threshold: 110,
    effects: [
      { type: "attribute", key: "leadership", delta: 5 },
      { type: "status", key: "teamChemistry", delta: 5 },
    ],
  },
  {
    id: "HOT_HEADED",
    name: "Hot-Headed",
    description: "Your fire is a gift and a curse — one bad tackle from a red card on any given day.",
    threshold: 80,
    effects: [
      { type: "attribute", key: "composure", delta: -4 },
      { type: "attribute", key: "strength", delta: 2 },
    ],
  },
  {
    id: "LOYAL_SERVANT",
    name: "Loyal Servant",
    description: "You bleed the club's colours, and the staff reward that devotion with total faith.",
    threshold: 100,
    effects: [
      { type: "status", key: "morale", delta: 6 },
      { type: "status", key: "coachTrust", delta: 6 },
    ],
  },
  {
    id: "MERCENARY",
    name: "Mercenary",
    description: "You go where the money and the spotlight are — adaptable, unsentimental, always in demand.",
    threshold: 90,
    effects: [
      { type: "status", key: "reputation", delta: 6 },
      { type: "attribute", key: "composure", delta: 2 },
    ],
  },
  {
    id: "ONE_CLUB_HERO",
    name: "One-Club Hero",
    description: "One badge, one story — the supporters will name a stand after you one day.",
    threshold: 130,
    effects: [
      { type: "status", key: "morale", delta: 8 },
      { type: "status", key: "coachTrust", delta: 6 },
      { type: "status", key: "reputation", delta: 4 },
    ],
  },
  {
    id: "JOURNEYMAN",
    name: "Journeyman",
    description: "Different leagues, different languages — you settle in anywhere and nothing fazes you.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "composure", delta: 3 },
      { type: "status", key: "reputation", delta: 3 },
    ],
  },
  {
    id: "VETERAN_MENTOR",
    name: "Veteran Mentor",
    description: "The kids hang on your every word — your experience is worth a coaching badge on the pitch.",
    threshold: 110,
    effects: [
      { type: "attribute", key: "leadership", delta: 4 },
      { type: "status", key: "teamChemistry", delta: 6 },
    ],
  },
  {
    id: "PENALTY_SPECIALIST",
    name: "Penalty Specialist",
    description: "Ice in the veins from twelve yards — the spot is yours and the keeper knows it.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "composure", delta: 4 },
      { type: "attribute", key: "finishing", delta: 2 },
    ],
  },
  {
    id: "SET_PIECE_THREAT",
    name: "Set-Piece Threat",
    description: "A free kick within thirty yards is a goalscoring chance whenever your foot is on the ball.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "passing", delta: 4 },
      { type: "attribute", key: "vision", delta: 2 },
    ],
  },
  {
    id: "SAFE_HANDS",
    name: "Safe Hands",
    description: "Shot-stopping is second nature — keepers like you turn one points into three.",
    threshold: 110,
    effects: [
      { type: "attribute", key: "goalkeeping", delta: 5 },
      { type: "attribute", key: "positioning", delta: 2 },
    ],
  },
  {
    id: "SWEEPER_KEEPER",
    name: "Sweeper Keeper",
    description: "You start your team's attacks from the edge of the box — a defender in gloves.",
    threshold: 110,
    effects: [
      { type: "attribute", key: "positioning", delta: 4 },
      { type: "attribute", key: "passing", delta: 3 },
    ],
  },
  {
    id: "HARD_TACKLER",
    name: "Hard Tackler",
    description: "Wingers dread the touchline against you — you win the ball cleanly and you win it often.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "defending", delta: 5 },
      { type: "attribute", key: "strength", delta: 2 },
    ],
  },
  {
    id: "PRESS_RESISTANT",
    name: "Press-Resistant",
    description: "Three players closing you down is an invitation — you wriggle out and keep the move alive.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "composure", delta: 4 },
      { type: "attribute", key: "dribbling", delta: 2 },
    ],
  },
  {
    id: "PLAYMAKER",
    name: "Playmaker",
    description: "You see the pass two moves before anyone else and the team plays through you.",
    threshold: 110,
    effects: [
      { type: "attribute", key: "vision", delta: 5 },
      { type: "attribute", key: "passing", delta: 3 },
    ],
  },
  {
    id: "TARGET_MAN",
    name: "Target Man",
    description: "Back to goal, you hold up everything — defenders bounce off you and runners feed off your knock-downs.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "aerialAbility", delta: 4 },
      { type: "attribute", key: "strength", delta: 4 },
    ],
  },
  {
    id: "EXPLOSIVE_DRIBBLER",
    name: "Explosive Dribbler",
    description: "One touch to set, one burst to go — full-backs are left grabbing at shadows.",
    threshold: 100,
    effects: [
      { type: "attribute", key: "dribbling", delta: 5 },
      { type: "attribute", key: "pace", delta: 3 },
    ],
  },
];
