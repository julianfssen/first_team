/**
 * Footballer Career RPG — core type system.
 *
 * This file is the single source of truth for the game's data shapes. The engine
 * (pure functions under lib/game) and the content data files (under /data) both
 * depend on these types. UI components only ever read these shapes; they never
 * define game logic.
 */

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

export type Region =
  | "EUROPE"
  | "ASIA_PACIFIC"
  | "MIDDLE_EAST_GULF"
  | "SOUTH_AMERICA"
  | "NORTH_AMERICA"
  | "CENTRAL_AMERICA_CARIBBEAN"
  | "AFRICA"
  | "OCEANIA"
  | "INTERNATIONAL_GLOBAL";

export type RegionIdentity = {
  id: Region;
  name: string;
  blurb: string;
  /** 0-100 baseline prestige of the region's football ecosystem. */
  prestige: number;
  /** 0-100 baseline competitive difficulty. */
  difficulty: number;
  /** 0-100 typical wage level. */
  wageLevel: number;
  /** 0-100 media/pressure intensity. */
  mediaPressure: number;
};

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

export type Position =
  | "GK"
  | "LB"
  | "RB"
  | "LWB"
  | "RWB"
  | "CB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST"
  | "CF";

export type PositionFamily =
  | "GOALKEEPER"
  | "CENTRE_BACK"
  | "FULLBACK"
  | "WINGBACK"
  | "DEFENSIVE_MIDFIELDER"
  | "CENTRAL_MIDFIELDER"
  | "ATTACKING_MIDFIELDER"
  | "WINGER"
  | "STRIKER";

// ---------------------------------------------------------------------------
// Attributes & status
// ---------------------------------------------------------------------------

export type Attributes = {
  finishing: number;
  passing: number;
  dribbling: number;
  pace: number;
  strength: number;
  stamina: number;
  defending: number;
  positioning: number;
  composure: number;
  professionalism: number;
  goalkeeping: number;
  aerialAbility: number;
  workRate: number;
  vision: number;
  leadership: number;
};

export type AttributeKey = keyof Attributes;

export type PlayerStatus = {
  form: number;
  fatigue: number;
  confidence: number;
  morale: number;
  coachTrust: number;
  teamChemistry: number;
  reputation: number;
  mediaPressure: number;
  injuryRisk: number;
};

export type StatusKey = keyof PlayerStatus;

// ---------------------------------------------------------------------------
// Player creation inputs
// ---------------------------------------------------------------------------

export type StrongFoot = "LEFT" | "RIGHT" | "BOTH";

export type Personality =
  | "HUMBLE"
  | "AMBITIOUS"
  | "PROFESSIONAL"
  | "FLASHY"
  | "HOT_HEADED"
  | "LOYAL";

export type Background =
  | "ACADEMY_KID"
  | "STREET_FOOTBALLER"
  | "FUTSAL_PRODIGY"
  | "LATE_BLOOMER"
  | "RICH_FAMILY"
  | "WORKING_CLASS"
  | "SCOUTED_SMALL_TOWN"
  | "MULTI_SPORT_ATHLETE";

export type Playstyle =
  | "BALANCED"
  | "TECHNICAL"
  | "PHYSICAL"
  | "CREATIVE"
  | "CLINICAL"
  | "DEFENSIVE";

export type CreateCareerInput = {
  name: string;
  nationality: string;
  startingRegion: Region;
  position: Position;
  strongFoot: StrongFoot;
  playstyle: Playstyle;
  personality: Personality;
  background: Background;
  /** Optional explicit seed for reproducible careers; otherwise generated. */
  seed?: string;
};

// ---------------------------------------------------------------------------
// Career phases & player identity
// ---------------------------------------------------------------------------

export type CareerPhase =
  | "PROSPECT"
  | "RISING_PLAYER"
  | "PRIME"
  | "VETERAN"
  | "FINAL_CHAPTER";

export type PlayerIdentity = {
  name: string;
  nationality: string;
  strongFoot: StrongFoot;
  playstyle: Playstyle;
  personality: Personality;
  background: Background;
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export type SeasonStats = {
  appearances: number;
  starts: number;
  minutes: number;

  goals: number;
  assists: number;
  shots: number;
  keyPasses: number;
  /** Sum of match ratings; divide by appearances for average. */
  ratingSum: number;
  averageRating: number;

  yellowCards: number;
  redCards: number;
  injuries: number;

  saves: number;
  cleanSheets: number;
  goalsConceded: number;
  penaltySaves: number;
  errorsLeadingToGoal: number;

  tackles: number;
  interceptions: number;
  blocks: number;
  clearances: number;
  aerialDuelsWon: number;

  passesCompleted: number;
  progressivePasses: number;
  chancesCreated: number;
  dribblesCompleted: number;
  crossesCompleted: number;
};

export type InternationalStats = {
  caps: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  tournamentsPlayed: number;
  trophies: number;
};

// ---------------------------------------------------------------------------
// Traits
// ---------------------------------------------------------------------------

export type TraitId =
  | "CLINICAL_FINISHER"
  | "BIG_GAME_PLAYER"
  | "TEAM_PLAYER"
  | "SELFISH"
  | "COACHS_FAVORITE"
  | "MEDIA_DARLING"
  | "PROFESSIONAL"
  | "INJURY_PRONE"
  | "SUPER_SUB"
  | "LATE_BLOOMER"
  | "WONDERKID"
  | "LEADER"
  | "HOT_HEADED"
  | "LOYAL_SERVANT"
  | "MERCENARY"
  | "ONE_CLUB_HERO"
  | "JOURNEYMAN"
  | "VETERAN_MENTOR"
  | "PENALTY_SPECIALIST"
  | "SET_PIECE_THREAT"
  | "SAFE_HANDS"
  | "SWEEPER_KEEPER"
  | "HARD_TACKLER"
  | "PRESS_RESISTANT"
  | "PLAYMAKER"
  | "TARGET_MAN"
  | "EXPLOSIVE_DRIBBLER";

export type TraitDef = {
  id: TraitId;
  name: string;
  description: string;
  /** How much progress is needed before the trait unlocks. */
  threshold: number;
  /** Effects applied once the trait is unlocked (interpreted by the engine). */
  effects: GameEffect[];
};

export type TraitProgress = {
  traitId: TraitId;
  progress: number;
  threshold: number;
  unlocked: boolean;
};

// ---------------------------------------------------------------------------
// Game effects (shared by events & traits — interpreted by the engine)
// ---------------------------------------------------------------------------

export type GameEffect =
  | { type: "attribute"; key: AttributeKey; delta: number }
  | { type: "status"; key: StatusKey; delta: number }
  | { type: "traitProgress"; traitId: TraitId; amount: number }
  | { type: "injury"; severity: InjurySeverity }
  | { type: "money"; delta: number };

// ---------------------------------------------------------------------------
// Weekly loop
// ---------------------------------------------------------------------------

export type WeeklyChoiceId =
  | "TRAIN_FINISHING"
  | "TRAIN_PASSING"
  | "TRAIN_DRIBBLING"
  | "TRAIN_DEFENDING"
  | "TRAIN_FITNESS"
  | "TRAIN_GOALKEEPING"
  | "REST_RECOVER"
  | "STUDY_TACTICS"
  | "BUILD_COACH_TRUST"
  | "BUILD_TEAM_CHEMISTRY"
  | "SOCIAL_MEDIA_PUSH"
  | "EXTRA_PROFESSIONAL_ROUTINE";

export type WeeklyChoiceDef = {
  id: WeeklyChoiceId;
  label: string;
  description: string;
  /** Position families this choice is offered to. Empty = all. */
  positionFamilies?: PositionFamily[];
  /** Attribute growth applied (scaled by growth multiplier). */
  attributeGrowth?: Partial<Record<AttributeKey, number>>;
  /** Direct status changes. */
  statusEffects?: Partial<Record<StatusKey, number>>;
  /** Trait progress nudges. */
  traitProgress?: { traitId: TraitId; amount: number }[];
};

export type WeekResult = {
  career: Career;
  log: string[];
  /** True if this week is a match week. */
  hadMatch: boolean;
};

// ---------------------------------------------------------------------------
// Match system
// ---------------------------------------------------------------------------

export type MatchImportance = "LOW" | "MEDIUM" | "HIGH" | "CLUTCH";
export type Risk = "LOW" | "MEDIUM" | "HIGH";

export type Competition = "LEAGUE" | "DOMESTIC_CUP" | "CONTINENTAL" | "INTERNATIONAL";

/**
 * Named attribute-check profiles. The engine owns the per-check attribute
 * weights so moment data stays lightweight and consistent.
 */
export type AttributeCheck =
  | "SHOOT"
  | "PASS"
  | "DRIBBLE"
  | "DEFEND"
  | "AERIAL"
  | "PHYSICAL"
  | "COMPOSURE"
  | "GK_SAVE"
  | "GK_DISTRIBUTION";

export type MatchOutcomeType =
  | "GOAL"
  | "ASSIST"
  | "KEY_PASS"
  | "DRIBBLE_PAST"
  | "CROSS_COMPLETED"
  | "TACKLE_WON"
  | "INTERCEPTION"
  | "BLOCK"
  | "CLEARANCE"
  | "AERIAL_WON"
  | "SAVE"
  | "PENALTY_SAVE"
  | "CLEAN_SHEET_ACTION"
  | "GOOD_DECISION"
  | "NEUTRAL"
  | "CHANCE_MISSED"
  | "POSSESSION_LOST"
  | "DEFENSIVE_ERROR"
  | "GK_ERROR"
  | "GOAL_CONCEDED"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "INJURY";

export type MatchMomentChoiceTemplate = {
  id: string;
  label: string;
  risk: Risk;
  check: AttributeCheck;
  /** Outcome on a strong success. */
  successOutcome: MatchOutcomeType;
  /** Outcome on a partial/mixed result (optional; defaults to NEUTRAL). */
  partialOutcome?: MatchOutcomeType;
  /** Outcome on failure. */
  failureOutcome: MatchOutcomeType;
  /** Optional trait progress granted when this choice is taken. */
  traitProgress?: { traitId: TraitId; amount: number }[];
};

export type MatchMomentTemplate = {
  id: string;
  positionFamilies: PositionFamily[];
  title: string;
  description: string;
  choices: MatchMomentChoiceTemplate[];
};

// ---------------------------------------------------------------------------
// Passages (Stage 2): a "moment" is one or more chained decision stages.
// ---------------------------------------------------------------------------

/**
 * What happens after a choice resolves:
 * - ADVANCE: success/partial carries the move to the next stage; failure ends
 *   the passage early (a turnover).
 * - FINISH: this choice ends the passage (a shot, clearance, final ball).
 * - END: always ends the passage (you abort / recycle / play it safe).
 */
export type PassageFlow = "ADVANCE" | "FINISH" | "END";

export type PassageChoice = MatchMomentChoiceTemplate & { flow: PassageFlow };

export type PassageStage = {
  title: string;
  description: string;
  choices: PassageChoice[];
};

export type MomentPassageTemplate = {
  id: string;
  positionFamilies: PositionFamily[];
  stages: PassageStage[];
};

/** A passage in progress within a live match. */
export type ActivePassage = {
  template: MomentPassageTemplate;
  stageIndex: number;
  importance: MatchImportance;
  minute: number;
  slotIndex: number;
};

// ---------------------------------------------------------------------------
// Skill flourishes (Stage 3): marquee choices trigger a quick skill mini-game.
// ---------------------------------------------------------------------------

/** AIM = aim + power (shot); TIMING = commit at the right instant; RUN = timed release. */
export type SkillKind = "AIM" | "TIMING" | "RUN";

/** The football action a challenge represents (drives which animated scene shows). */
export type SkillFlavor = "SHOT" | "TACKLE" | "SAVE" | "THROUGH_BALL";

export type ShotType = "NORMAL" | "ONE_ON_ONE" | "LONG_RANGE";

/** Parameters for a skill mini-game, derived deterministically from competence. */
export type SkillChallenge = {
  kind: SkillKind;
  flavor: SkillFlavor;
  /** 0..1; higher = easier (smaller keeper reach / bigger timing window). */
  forgiveness: number;
  label: string;
  prompt: string;
  // AIM (shot): the keeper sits centrally and CLOSES the gap over the window.
  // reach (how much of the goal centre is covered) = reachBase + reachGrow*timing
  // + a softness penalty for low power; you must beat it out to a corner.
  shotType?: ShotType;
  reachBase?: number;
  reachGrow?: number;
  /** Minimum power for the shot to even reach / not be gathered. */
  powerFloor?: number;
  /** Closing-window duration in ms before the keeper smothers it. */
  windowMs?: number;
  // TIMING / RUN: a sweet window along a 0..1 track.
  sweetCenter?: number;
  sweetWidth?: number;
};

/**
 * The player's raw input.
 * AIM: value = aim across the goal (0..1), power = strike power (0..1),
 *      timing = fraction of the closing window elapsed at release (0..1).
 * TIMING / RUN: value = the moment committed (0..1).
 */
export type SkillInput = { value: number; power?: number; timing?: number };

/** A moment instantiated for a specific match. */
export type MatchMoment = {
  id: string;
  templateId: string;
  positionFamilies: PositionFamily[];
  minute: number;
  title: string;
  description: string;
  importance: MatchImportance;
  choices: MatchMomentChoiceTemplate[];
};

export type MatchContext = {
  matchId: string;
  season: number;
  week: number;
  competition: Competition;
  importance: MatchImportance;
  opponentName: string;
  /** 0-100 opponent strength. */
  opponentStrength: number;
  homeAway: "HOME" | "AWAY";
  /** Expected squad role for this match. */
  isStarter: boolean;
};

export type MatchMomentResult = {
  moment: MatchMoment;
  choiceId: string;
  outcome: MatchOutcomeType;
  /** Resolution tier for narrative/animation. */
  tier: "GREAT" | "GOOD" | "OK" | "POOR" | "DISASTER";
  ratingDelta: number;
  /** Stat deltas applied to season stats. */
  statDeltas: Partial<SeasonStats>;
  narrative: string;
};

export type MatchResult = {
  matchId: string;
  context: MatchContext;
  teamScore: number;
  opponentScore: number;
  rating: number;
  momentResults: MatchMomentResult[];
  /** Aggregate stat deltas to fold into season stats. */
  statDeltas: Partial<SeasonStats>;
  /** Status changes (fatigue, form, confidence...). */
  statusDeltas: Partial<PlayerStatus>;
  headline: string;
  injury?: Injury;
  /** "Moment of the match" narrative, if one stood out. */
  momentOfMatch?: string;
  /** Minutes the player actually featured. */
  minutesPlayed: number;
  /** True if the manager hooked the player early. */
  subbedOff: boolean;
  cameOnAsSub: boolean;
};

// ---------------------------------------------------------------------------
// Live match simulation (Stage 1: the "Living Match")
// ---------------------------------------------------------------------------

/** How the live match state frames the player's next decision. */
export type MatchSituation = "NEUTRAL" | "CHASING" | "CHASING_HARD" | "PROTECTING";

export type MatchBeatKind = "NARRATED" | "PLAYER" | "RESULT" | "FULL_TIME" | "SUB";

/** One entry in the live match feed. */
export type MatchBeat = {
  id: string;
  kind: MatchBeatKind;
  minute: number;
  text?: string;
  /** A goal was scored on this beat (narrated beats). */
  scored?: "TEAM" | "OPP" | null;
  tone?: HeadlineTone;
  /** For PLAYER beats: the decision to present. */
  moment?: MatchMoment;
  /** For PLAYER beats: how the live state frames the decision. */
  situation?: MatchSituation;
  /** For PLAYER beats: true if this is a follow-on stage of an ongoing passage. */
  continuation?: boolean;
  /** For RESULT beats: the resolved outcome + any contextual note. */
  result?: MatchMomentResult;
  contextNote?: string;
};

/** A pre-planned slot in the match skeleton (seeded at kickoff). */
export type PlannedSlot = {
  kind: "NARRATED" | "PLAYER";
  minute: number;
  templateId?: string;
  importance: MatchImportance;
};

/** Live, transient state of a match in progress (not persisted to saves). */
export type MatchState = {
  matchId: string;
  context: MatchContext;
  minute: number;
  teamScore: number;
  oppScore: number;
  /** -100 (opponent on top) .. +100 (your team on top). */
  momentum: number;
  /** In-match stamina 0-100; drains across the game, faster for bold play. */
  stamina: number;
  /** In-match confidence streak -100..100, layered on career confidence. */
  matchConfidence: number;
  onPitch: boolean;
  /** True if the player came on from the bench rather than starting. */
  cameOnAsSub: boolean;
  /** Minute the player left the pitch (subbed off), or null if they saw it out. */
  exitMinute: number | null;
  plan: PlannedSlot[];
  queueIndex: number;
  momentResults: MatchMomentResult[];
  /** The passage currently awaiting the player's choice, if any. */
  pendingPassage: ActivePassage | null;
  finished: boolean;
};

// ---------------------------------------------------------------------------
// Injuries
// ---------------------------------------------------------------------------

export type InjurySeverity = "MINOR" | "MODERATE" | "MAJOR" | "CAREER_THREATENING";

export type Injury = {
  id: string;
  name: string;
  severity: InjurySeverity;
  /** Weeks out. */
  weeksOut: number;
  weeksRemaining: number;
  season: number;
};

// ---------------------------------------------------------------------------
// Clubs & leagues
// ---------------------------------------------------------------------------

export type ClubStyle =
  | "ELITE_CONTENDER"
  | "DEVELOPMENT_CLUB"
  | "SELLING_CLUB"
  | "LOCAL_GIANT"
  | "RELEGATION_FIGHTER"
  | "VETERAN_DESTINATION"
  | "HIGH_WAGE_PROJECT"
  | "YOUTH_ACADEMY"
  | "TACTICAL_CLUB"
  | "PHYSICAL_CLUB";

export type Club = {
  id: string;
  name: string;
  region: Region;
  country: string;
  leagueId: string;
  reputation: number;
  difficulty: number;
  wageLevel: number;
  developmentQuality: number;
  minutesOpportunity: number;
  pressure: number;
  scoutingReach: number;
  preferredAges: { min: number; max: number };
  style: ClubStyle;
};

export type League = {
  id: string;
  name: string;
  region: Region;
  country: string;
  tier: number;
  reputation: number;
  difficulty: number;
  averageWage: number;
  mediaPressure: number;
  scoutingVisibility: number;
};

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

export type SquadRole =
  | "YOUTH_PROSPECT"
  | "ROTATION"
  | "STARTER"
  | "STAR_PLAYER"
  | "CAPTAIN_CANDIDATE"
  | "VETERAN_MENTOR";

export type TransferOffer = {
  id: string;
  clubId: string;
  role: SquadRole;
  wage: number;
  contractYears: number;
  expectedMinutes: number;
  developmentFit: number;
  prestigeGain: number;
  risk: number;
  reason: string;
};

// ---------------------------------------------------------------------------
// Story events
// ---------------------------------------------------------------------------

export type EventCategory =
  | "COACH"
  | "AGENT"
  | "MEDIA"
  | "TRAINING"
  | "TEAMMATE"
  | "INJURY"
  | "TRANSFER"
  | "NATIONAL_TEAM"
  | "PERSONAL_LIFE"
  | "RETIREMENT"
  | "POSITION_CHANGE";

export type EventConditionField =
  | "age"
  | "season"
  | "reputation"
  | "form"
  | "morale"
  | "fatigue"
  | "coachTrust"
  | "injuryRisk";

export type EventCondition = {
  field: EventConditionField;
  op: "gt" | "gte" | "lt" | "lte" | "eq";
  value: number;
};

export type EventChoice = {
  id: string;
  label: string;
  description?: string;
  effects: GameEffect[];
  /** Optional outcome text shown after choosing. */
  resultText?: string;
};

export type CareerEvent = {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  choices: EventChoice[];
  conditions?: EventCondition[];
  /** Relative likelihood weight when eligible. */
  weight: number;
  /** Career phases this event can fire in. Empty = any. */
  phases?: CareerPhase[];
};

// ---------------------------------------------------------------------------
// Headlines
// ---------------------------------------------------------------------------

export type HeadlineTone = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type HeadlineTemplate = {
  id: string;
  tone: HeadlineTone;
  /** Template string; supports {player}, {opponent}, {goals}, {rating}, {club}. */
  text: string;
};

// ---------------------------------------------------------------------------
// Timeline & career
// ---------------------------------------------------------------------------

export type TimelineEntryType =
  | "DEBUT"
  | "FIRST_GOAL"
  | "TRANSFER"
  | "INJURY"
  | "TROPHY"
  | "CALL_UP"
  | "AWARD"
  | "POSITION_CHANGE"
  | "TRAIT_UNLOCKED"
  | "MILESTONE"
  | "RETIREMENT";

export type TimelineEntry = {
  id: string;
  season: number;
  week: number;
  age: number;
  type: TimelineEntryType;
  text: string;
};

export type SeasonRecord = {
  season: number;
  age: number;
  clubId: string;
  clubName: string;
  competitionLevel: string;
  stats: SeasonStats;
  phase: CareerPhase;
};

export type SeasonRecap = {
  season: number;
  age: number;
  stats: SeasonStats;
  clubName: string;
  awards: string[];
  highlights: string[];
  agingNotes: string[];
  marketValue: number;
  newPhase: CareerPhase;
  career: Career;
};

export type RetirementReason =
  | "PLAYER_CHOICE"
  | "FORCED_AGE"
  | "MAJOR_INJURY"
  | "NO_OFFERS";

export type RetirementRecap = {
  reason: RetirementReason;
  legacyTitle: string;
  careerSpan: string;
  clubsPlayedFor: string[];
  regionsPlayedIn: Region[];
  careerStats: SeasonStats;
  internationalStats: InternationalStats;
  trophies: string[];
  awards: string[];
  bestSeason?: SeasonRecord;
  highestMarketValue: number;
  iconicMoment?: string;
  finalReputation: number;
};

// ---------------------------------------------------------------------------
// Career (the persisted save state)
// ---------------------------------------------------------------------------

export type Career = {
  version: 1;
  id: string;
  seed: string;
  createdAt: string;

  player: PlayerIdentity;
  attributes: Attributes;
  status: PlayerStatus;

  position: Position;
  positionFamily: PositionFamily;
  clubId: string;
  startingRegion: Region;

  age: number;
  /** 1-based season counter. */
  season: number;
  /** 1-based week within the current season. */
  week: number;
  phase: CareerPhase;
  retired: boolean;
  retirementRecap?: RetirementRecap;

  /** In-game money in fictional units (wages/value); not real currency. */
  wage: number;
  marketValue: number;
  highestMarketValue: number;

  seasonStats: SeasonStats;
  careerStats: SeasonStats;
  internationalStats: InternationalStats;
  seasonHistory: SeasonRecord[];

  traits: TraitProgress[];
  timeline: TimelineEntry[];

  clubsPlayedFor: string[];
  regionsPlayedIn: Region[];
  trophies: string[];
  awards: string[];

  injury?: Injury;

  /** Counts for milestone detection (first goal, debut, etc.). */
  flags: {
    debuted: boolean;
    firstGoal: boolean;
  };
};

// ---------------------------------------------------------------------------
// Save slots
// ---------------------------------------------------------------------------

export type SaveSlot = {
  id: string;
  name: string;
  version: 1;
  career: Career;
  createdAt: string;
  updatedAt: string;
};
