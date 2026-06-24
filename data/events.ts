import type { CareerEvent } from "@/lib/game/types";

/**
 * Story events — choose-your-own-adventure dilemmas that fire between matches.
 * Each presents 2-3 trade-off choices. Optional `conditions` gate eligibility
 * (ALL must hold) and `phases` restrict which career stage they appear in.
 * Weights set relative likelihood when eligible.
 */
export const CAREER_EVENTS: CareerEvent[] = [
  // ---------------------------------------------------------------------------
  // COACH
  // ---------------------------------------------------------------------------
  {
    id: "coach_extra_sessions",
    category: "COACH",
    title: "An Offer of Extra Sessions",
    description:
      "The manager pulls you aside after training. \"Stay back an hour with me and the analyst,\" he says. \"I think there's another level in you — if you're willing to chase it.\" The rest of the squad is already heading for the showers.",
    choices: [
      {
        id: "stay",
        label: "Stay and grind",
        description: "Sacrifice rest for development and the gaffer's approval.",
        effects: [
          { type: "attribute", key: "positioning", delta: 3 },
          { type: "status", key: "coachTrust", delta: 8 },
          { type: "status", key: "fatigue", delta: 8 },
        ],
        resultText: "You leave the pitch in the dark, legs heavy — but the coach claps you on the back. He noticed.",
      },
      {
        id: "decline",
        label: "Politely decline",
        description: "Protect your body and your evening.",
        effects: [
          { type: "status", key: "fatigue", delta: -4 },
          { type: "status", key: "coachTrust", delta: -5 },
        ],
        resultText: "He nods, but there's a flicker of disappointment. \"Maybe next time.\"",
      },
    ],
    weight: 6,
  },
  {
    id: "coach_captaincy_offer",
    category: "COACH",
    title: "The Armband",
    description:
      "\"I need someone to lead this group,\" the manager says, sliding a captain's armband across his desk. \"It's a lot of weight to carry. But I think you can.\"",
    choices: [
      {
        id: "accept",
        label: "Accept the captaincy",
        effects: [
          { type: "status", key: "coachTrust", delta: 8 },
          { type: "status", key: "reputation", delta: 5 },
          { type: "traitProgress", traitId: "LEADER", amount: 35 },
          { type: "status", key: "mediaPressure", delta: 6 },
        ],
        resultText: "You pull the armband on for the first time. The dressing room goes quiet, then erupts in applause.",
      },
      {
        id: "decline_humble",
        label: "Suggest a senior teammate instead",
        effects: [
          { type: "status", key: "teamChemistry", delta: 6 },
          { type: "status", key: "coachTrust", delta: -3 },
        ],
        resultText: "The veteran shakes your hand for the gesture. The room respects your humility.",
      },
    ],
    conditions: [{ field: "coachTrust", op: "gte", value: 55 }],
    weight: 4,
    phases: ["PRIME", "VETERAN"],
  },
  {
    id: "coach_tactical_buyin",
    category: "COACH",
    title: "A New System",
    description:
      "The manager unveils a radical new tactical shape in the team meeting. Half the squad looks lost. He scans the room. \"I need someone to buy in publicly. Are you with me?\"",
    choices: [
      {
        id: "champion",
        label: "Champion the system",
        effects: [
          { type: "status", key: "coachTrust", delta: 9 },
          { type: "attribute", key: "positioning", delta: 2 },
          { type: "status", key: "teamChemistry", delta: -3 },
        ],
        resultText: "You speak up. The coach beams; a couple of teammates roll their eyes at the teacher's pet.",
      },
      {
        id: "neutral",
        label: "Stay quiet and adapt",
        effects: [{ type: "attribute", key: "positioning", delta: 2 }],
        resultText: "You say nothing but work hard to learn it. Steady as she goes.",
      },
      {
        id: "voice_doubt",
        label: "Voice your doubts",
        effects: [
          { type: "status", key: "coachTrust", delta: -7 },
          { type: "status", key: "teamChemistry", delta: 5 },
        ],
        resultText: "You question it honestly. Some teammates nod along; the gaffer's jaw tightens.",
      },
    ],
    weight: 5,
  },
  {
    id: "coach_benched_form",
    category: "COACH",
    title: "Dropped to the Bench",
    description:
      "Your name isn't on the team sheet. The manager finds you in the corridor: \"You've not been at it, son. Earn your way back.\" Your recent displays have been flat and everyone knows it.",
    choices: [
      {
        id: "double_down",
        label: "Knuckle down in training",
        effects: [
          { type: "status", key: "fatigue", delta: 6 },
          { type: "status", key: "coachTrust", delta: 6 },
          { type: "status", key: "form", delta: 4 },
        ],
        resultText: "You're first in, last out all week. The coach starts to soften.",
      },
      {
        id: "sulk",
        label: "Let your frustration show",
        effects: [
          { type: "status", key: "coachTrust", delta: -8 },
          { type: "status", key: "morale", delta: -5 },
          { type: "traitProgress", traitId: "HOT_HEADED", amount: 20 },
        ],
        resultText: "You slam a water bottle in training. It does not go unnoticed.",
      },
      {
        id: "request_talk",
        label: "Ask for an honest conversation",
        effects: [
          { type: "status", key: "coachTrust", delta: 3 },
          { type: "status", key: "morale", delta: 3 },
        ],
        resultText: "You sit down and listen. He lays out exactly what he wants. Clarity, at least.",
      },
    ],
    conditions: [{ field: "form", op: "lt", value: 40 }],
    weight: 7,
  },

  // ---------------------------------------------------------------------------
  // AGENT
  // ---------------------------------------------------------------------------
  {
    id: "agent_foreign_interest",
    category: "AGENT",
    title: "A Foreign Club Comes Calling",
    description:
      "Your agent's voice crackles with excitement down the phone. \"A big club abroad has been watching you. They're serious. This could change everything — new league, new money, new pressure.\"",
    choices: [
      {
        id: "push_move",
        label: "Tell him to push for the move",
        effects: [
          { type: "status", key: "reputation", delta: 6 },
          { type: "status", key: "morale", delta: 4 },
          { type: "status", key: "coachTrust", delta: -6 },
          { type: "traitProgress", traitId: "MERCENARY", amount: 25 },
        ],
        resultText: "Word leaks. The fans are uneasy, the manager colder — but your stock has never been higher.",
      },
      {
        id: "stay_focused",
        label: "Stay focused on this season",
        effects: [
          { type: "status", key: "coachTrust", delta: 5 },
          { type: "status", key: "teamChemistry", delta: 4 },
          { type: "traitProgress", traitId: "LOYAL_SERVANT", amount: 20 },
        ],
        resultText: "\"Tell them I'm happy here,\" you say. The dressing room hears about it, and respects it.",
      },
    ],
    weight: 6,
  },
  {
    id: "agent_image_rights",
    category: "AGENT",
    title: "A Lucrative Endorsement",
    description:
      "A sportswear giant wants you as the face of their new boot. \"Massive money,\" your agent grins, \"but they'll want photo shoots, appearances, the lot. It'll eat into your week.\"",
    choices: [
      {
        id: "sign",
        label: "Sign the deal",
        effects: [
          { type: "money", delta: 500000 },
          { type: "status", key: "reputation", delta: 7 },
          { type: "status", key: "fatigue", delta: 5 },
          { type: "traitProgress", traitId: "MEDIA_DARLING", amount: 25 },
        ],
        resultText: "Your face goes up on billboards across the city. The cheque clears beautifully.",
      },
      {
        id: "negotiate_light",
        label: "Sign a lighter version",
        effects: [
          { type: "money", delta: 200000 },
          { type: "status", key: "reputation", delta: 3 },
        ],
        resultText: "You trim the commitments. Less money, but your weeks stay your own.",
      },
      {
        id: "reject",
        label: "Turn it down for now",
        effects: [
          { type: "attribute", key: "professionalism", delta: 2 },
          { type: "status", key: "morale", delta: 2 },
        ],
        resultText: "\"Football first,\" you tell him. The boot company will wait.",
      },
    ],
    weight: 5,
  },
  {
    id: "agent_contract_demand",
    category: "AGENT",
    title: "Time to Renegotiate",
    description:
      "\"You're underpaid,\" your agent insists. \"You've outgrown this contract. We go in hard, we threaten to walk, the club caves.\" It's a gamble — push too far and you sour the relationship.",
    choices: [
      {
        id: "hardball",
        label: "Play hardball",
        effects: [
          { type: "money", delta: 400000 },
          { type: "status", key: "coachTrust", delta: -5 },
          { type: "status", key: "reputation", delta: 2 },
        ],
        resultText: "The board grumbles but pays up. Your bank balance and your reputation as a tough negotiator both grow.",
      },
      {
        id: "reasonable",
        label: "Ask for a fair raise",
        effects: [
          { type: "money", delta: 150000 },
          { type: "status", key: "coachTrust", delta: 3 },
        ],
        resultText: "A modest bump, signed with a handshake. Everyone leaves happy.",
      },
    ],
    weight: 4,
  },

  // ---------------------------------------------------------------------------
  // MEDIA
  // ---------------------------------------------------------------------------
  {
    id: "media_deserve_to_start",
    category: "MEDIA",
    title: "\"Do You Deserve to Start?\"",
    description:
      "A reporter leans in at the mixed zone, recorder thrust forward. \"Some say you're keeping a better player out of the side. Do you honestly believe you deserve to start?\" The room goes still.",
    choices: [
      {
        id: "confident",
        label: "Back yourself, unapologetically",
        effects: [
          { type: "status", key: "confidence", delta: 7 },
          { type: "status", key: "mediaPressure", delta: 5 },
          { type: "status", key: "teamChemistry", delta: -3 },
        ],
        resultText: "\"Every single day,\" you say, holding his gaze. The quote runs everywhere by morning.",
      },
      {
        id: "humble",
        label: "Deflect with humility",
        effects: [
          { type: "status", key: "teamChemistry", delta: 5 },
          { type: "status", key: "reputation", delta: 3 },
          { type: "traitProgress", traitId: "TEAM_PLAYER", amount: 15 },
        ],
        resultText: "\"That's the manager's call. I just try to repay his faith.\" A model professional.",
      },
      {
        id: "snap",
        label: "Snap at the reporter",
        effects: [
          { type: "status", key: "mediaPressure", delta: 10 },
          { type: "status", key: "reputation", delta: -5 },
          { type: "traitProgress", traitId: "HOT_HEADED", amount: 25 },
        ],
        resultText: "\"Stupid question.\" The clip goes viral for all the wrong reasons.",
      },
    ],
    weight: 6,
  },
  {
    id: "media_documentary",
    category: "MEDIA",
    title: "The Documentary Crew",
    description:
      "A streaming service wants to follow you for a season — cameras at home, in the car, on the training ground. \"It'll make you a household name,\" the producer promises. \"Or it'll show the world your worst week.\"",
    choices: [
      {
        id: "say_yes",
        label: "Open your life to the cameras",
        effects: [
          { type: "status", key: "reputation", delta: 8 },
          { type: "status", key: "mediaPressure", delta: 8 },
          { type: "traitProgress", traitId: "MEDIA_DARLING", amount: 30 },
        ],
        resultText: "The trailer drops and you trend worldwide. There's no privacy now — only profile.",
      },
      {
        id: "decline_privacy",
        label: "Guard your privacy",
        effects: [
          { type: "status", key: "mediaPressure", delta: -5 },
          { type: "status", key: "morale", delta: 3 },
        ],
        resultText: "\"My life's my own.\" The producer is disappointed; your family is relieved.",
      },
    ],
    weight: 4,
  },
  {
    id: "media_pundit_criticism",
    category: "MEDIA",
    title: "A Pundit Tears You Apart",
    description:
      "A former great savages your performance on national TV: \"Lazy, overrated, coasting on reputation.\" By the time you wake up, it's everywhere, and your phone won't stop buzzing.",
    choices: [
      {
        id: "respond_pitch",
        label: "Let your football answer",
        effects: [
          { type: "status", key: "confidence", delta: 5 },
          { type: "status", key: "form", delta: 3 },
          { type: "attribute", key: "composure", delta: 2 },
        ],
        resultText: "You say nothing publicly and bury yourself in work. The best revenge is a good week.",
      },
      {
        id: "clap_back",
        label: "Hit back on social media",
        effects: [
          { type: "status", key: "mediaPressure", delta: 8 },
          { type: "status", key: "reputation", delta: -3 },
          { type: "status", key: "confidence", delta: 4 },
        ],
        resultText: "Your post racks up a million likes — and a thousand new critics.",
      },
    ],
    conditions: [{ field: "reputation", op: "gte", value: 40 }],
    weight: 5,
  },

  // ---------------------------------------------------------------------------
  // TRAINING
  // ---------------------------------------------------------------------------
  {
    id: "training_finishing_drill",
    category: "TRAINING",
    title: "The Finishing Challenge",
    description:
      "The strikers' coach sets up a brutal finishing circuit and bets you can't beat his record. The squad gathers to watch. It's just for fun — but everything's a contest with these lads.",
    choices: [
      {
        id: "go_all_in",
        label: "Throw everything at it",
        effects: [
          { type: "attribute", key: "finishing", delta: 3 },
          { type: "status", key: "fatigue", delta: 5 },
          { type: "traitProgress", traitId: "CLINICAL_FINISHER", amount: 20 },
        ],
        resultText: "You smash the record on the last ball. The lads mob you like it's a cup final.",
      },
      {
        id: "casual",
        label: "Keep it light",
        effects: [
          { type: "attribute", key: "finishing", delta: 1 },
          { type: "status", key: "teamChemistry", delta: 3 },
        ],
        resultText: "You laugh through it, miss a few on purpose. Good for the soul, light on the legs.",
      },
    ],
    weight: 5,
  },
  {
    id: "training_new_technique",
    category: "TRAINING",
    title: "A Trick Worth Learning",
    description:
      "A flair player on the squad offers to teach you his signature move. \"It's risky in a game,\" he warns, \"but when it comes off, the crowd loses their minds.\"",
    choices: [
      {
        id: "learn_it",
        label: "Spend weeks mastering it",
        effects: [
          { type: "attribute", key: "dribbling", delta: 3 },
          { type: "status", key: "fatigue", delta: 4 },
          { type: "traitProgress", traitId: "EXPLOSIVE_DRIBBLER", amount: 20 },
        ],
        resultText: "After endless reps, it finally clicks. Defenders won't know what hit them.",
      },
      {
        id: "focus_basics",
        label: "Stick to the fundamentals",
        effects: [
          { type: "attribute", key: "passing", delta: 2 },
          { type: "attribute", key: "professionalism", delta: 1 },
        ],
        resultText: "\"Flash is for highlight reels,\" you tell him. You drill the simple stuff instead.",
      },
    ],
    weight: 5,
  },
  {
    id: "training_overtrain_warning",
    category: "TRAINING",
    title: "Burning the Candle",
    description:
      "The fitness staff flag your workload — you've been pushing too hard, and your numbers say you're running on empty. \"Ease off,\" the physio warns, \"or your body will make the decision for you.\"",
    choices: [
      {
        id: "ignore",
        label: "Push through it anyway",
        effects: [
          { type: "attribute", key: "stamina", delta: 2 },
          { type: "status", key: "injuryRisk", delta: 9 },
          { type: "status", key: "fatigue", delta: 8 },
        ],
        resultText: "You wave the physio off. The gains are real — so is the gamble.",
      },
      {
        id: "rest",
        label: "Take the advice and rest",
        effects: [
          { type: "status", key: "fatigue", delta: -10 },
          { type: "status", key: "injuryRisk", delta: -6 },
          { type: "traitProgress", traitId: "PROFESSIONAL", amount: 15 },
        ],
        resultText: "You dial it back. The legs feel fresh again by the weekend.",
      },
    ],
    conditions: [{ field: "fatigue", op: "gte", value: 60 }],
    weight: 6,
  },
  {
    id: "training_set_piece_role",
    category: "TRAINING",
    title: "Dead-Ball Duty",
    description:
      "The coach is hunting for a new set-piece taker and hands you the ball at the edge of the box. \"Show me something,\" he says, folding his arms. The keeper digs in.",
    choices: [
      {
        id: "claim_it",
        label: "Claim the role",
        effects: [
          { type: "attribute", key: "passing", delta: 2 },
          { type: "status", key: "fatigue", delta: 3 },
          { type: "traitProgress", traitId: "SET_PIECE_THREAT", amount: 25 },
        ],
        resultText: "You curl three straight into the top corner. The free kicks are yours now.",
      },
      {
        id: "defer",
        label: "Defer to a teammate",
        effects: [{ type: "status", key: "teamChemistry", delta: 4 }],
        resultText: "You nod to the regular taker. \"It's his ball.\" Quietly classy.",
      },
    ],
    weight: 4,
  },

  // ---------------------------------------------------------------------------
  // TEAMMATE
  // ---------------------------------------------------------------------------
  {
    id: "teammate_younger_challenger",
    category: "TEAMMATE",
    title: "A Kid After Your Spot",
    description:
      "A hungry academy graduate has been tearing it up in training, and the whispers say he's after your position. He's half your age and twice as fearless. How do you handle it?",
    choices: [
      {
        id: "mentor",
        label: "Take him under your wing",
        effects: [
          { type: "status", key: "teamChemistry", delta: 6 },
          { type: "attribute", key: "leadership", delta: 2 },
          { type: "traitProgress", traitId: "VETERAN_MENTOR", amount: 25 },
        ],
        resultText: "You show him the ropes. The staff notice your grace; the kid idolises you.",
      },
      {
        id: "freeze_out",
        label: "Freeze him out",
        effects: [
          { type: "status", key: "teamChemistry", delta: -6 },
          { type: "status", key: "confidence", delta: 3 },
          { type: "traitProgress", traitId: "SELFISH", amount: 20 },
        ],
        resultText: "You give him nothing. He'll have to earn it the hard way — but the room cools toward you.",
      },
      {
        id: "raise_game",
        label: "Use it as motivation",
        effects: [
          { type: "status", key: "form", delta: 5 },
          { type: "status", key: "fatigue", delta: 4 },
        ],
        resultText: "Nothing sharpens you like competition. You hit a new gear in training.",
      },
    ],
    weight: 6,
    phases: ["PRIME", "VETERAN", "FINAL_CHAPTER"],
  },
  {
    id: "teammate_dressing_room_rift",
    category: "TEAMMATE",
    title: "A Dressing-Room Rift",
    description:
      "Two senior players are at each other's throats and the squad is splintering into camps. In the tense silence after a heated row, everyone seems to be waiting to see whose side you'll take.",
    choices: [
      {
        id: "mediate",
        label: "Broker peace between them",
        effects: [
          { type: "status", key: "teamChemistry", delta: 8 },
          { type: "attribute", key: "leadership", delta: 2 },
          { type: "traitProgress", traitId: "LEADER", amount: 20 },
        ],
        resultText: "You get them in a room and won't let them leave until it's settled. The squad exhales.",
      },
      {
        id: "stay_out",
        label: "Stay well out of it",
        effects: [{ type: "status", key: "morale", delta: -2 }],
        resultText: "Not your circus, not your monkeys. The rift festers a while longer.",
      },
    ],
    weight: 5,
  },
  {
    id: "teammate_veteran_mentorship",
    category: "TEAMMATE",
    title: "A Veteran's Wisdom",
    description:
      "The club's grizzled old pro corners you after training. \"You've got talent, kid, but you're wasting half of it. Stick with me — I'll teach you the things they don't coach.\"",
    choices: [
      {
        id: "accept_mentor",
        label: "Soak up everything he offers",
        effects: [
          { type: "attribute", key: "positioning", delta: 3 },
          { type: "attribute", key: "composure", delta: 2 },
          { type: "traitProgress", traitId: "PROFESSIONAL", amount: 20 },
        ],
        resultText: "You shadow him for weeks. The little tricks of the trade start to show in your game.",
      },
      {
        id: "polite_no",
        label: "Trust your own path",
        effects: [
          { type: "status", key: "confidence", delta: 4 },
          { type: "status", key: "teamChemistry", delta: -2 },
        ],
        resultText: "\"Appreciate it, but I do things my way.\" He shrugs. \"Your call, kid.\"",
      },
    ],
    weight: 5,
    phases: ["PROSPECT", "RISING_PLAYER"],
  },
  {
    id: "teammate_night_out",
    category: "TEAMMATE",
    title: "The Night Before",
    description:
      "The squad wants to bond over a big night out — except there's a match in three days. \"Come on,\" they goad, \"one night won't hurt. Be one of the lads.\"",
    choices: [
      {
        id: "go_out",
        label: "Go and bond with the lads",
        effects: [
          { type: "status", key: "teamChemistry", delta: 7 },
          { type: "status", key: "fatigue", delta: 6 },
          { type: "status", key: "morale", delta: 3 },
        ],
        resultText: "A great night, a sore head. The group's tighter for it — your legs, less so.",
      },
      {
        id: "stay_in",
        label: "Stay home and recover",
        effects: [
          { type: "attribute", key: "professionalism", delta: 2 },
          { type: "status", key: "teamChemistry", delta: -3 },
          { type: "traitProgress", traitId: "PROFESSIONAL", amount: 15 },
        ],
        resultText: "\"Maybe after the game.\" The lads tease you, but you're fresh on matchday.",
      },
    ],
    weight: 5,
  },

  // ---------------------------------------------------------------------------
  // INJURY
  // ---------------------------------------------------------------------------
  {
    id: "injury_hamstring_before_final",
    category: "INJURY",
    title: "Tightness Before the Final",
    description:
      "It's the morning of the biggest match of the season and your hamstring is barking. The physio's face says it all. \"You can play,\" she says carefully, \"but if it goes, it'll be a long one.\"",
    choices: [
      {
        id: "play_through",
        label: "Strap it up and play",
        effects: [
          { type: "status", key: "reputation", delta: 5 },
          { type: "status", key: "coachTrust", delta: 6 },
          { type: "status", key: "injuryRisk", delta: 12 },
          { type: "injury", severity: "MODERATE" },
        ],
        resultText: "You play the hero — and feel it pull in the second half. The brave call comes at a cost.",
      },
      {
        id: "sit_out",
        label: "Sit it out to be safe",
        effects: [
          { type: "status", key: "injuryRisk", delta: -6 },
          { type: "status", key: "coachTrust", delta: -5 },
          { type: "status", key: "morale", delta: -4 },
        ],
        resultText: "You watch from the stands, gutted but intact. The hamstring holds for another day.",
      },
    ],
    weight: 4,
  },
  {
    id: "injury_rehab_choice",
    category: "INJURY",
    title: "The Long Road Back",
    description:
      "You're weeks into a serious rehab. The specialist offers two paths: a cautious programme that guarantees full recovery, or an aggressive one that gets you back sooner — with risk.",
    choices: [
      {
        id: "aggressive",
        label: "Rush the recovery",
        effects: [
          { type: "status", key: "injuryRisk", delta: 10 },
          { type: "status", key: "coachTrust", delta: 4 },
          { type: "status", key: "fatigue", delta: 5 },
        ],
        resultText: "You're back in the squad early. The knee feels okay — for now.",
      },
      {
        id: "patient",
        label: "Do it properly",
        effects: [
          { type: "status", key: "injuryRisk", delta: -10 },
          { type: "attribute", key: "professionalism", delta: 2 },
          { type: "traitProgress", traitId: "PROFESSIONAL", amount: 15 },
        ],
        resultText: "You take the slow road. When you return, you return whole.",
      },
    ],
    conditions: [{ field: "injuryRisk", op: "gte", value: 40 }],
    weight: 4,
  },
  {
    id: "injury_niggle_management",
    category: "INJURY",
    title: "Playing With a Knock",
    description:
      "A nagging ankle knock has been bothering you for weeks. You can keep playing through it, but the dull ache never quite goes, and the staff want to give it a proper rest.",
    choices: [
      {
        id: "keep_playing",
        label: "Keep playing through it",
        effects: [
          { type: "status", key: "coachTrust", delta: 3 },
          { type: "status", key: "injuryRisk", delta: 7 },
          { type: "attribute", key: "composure", delta: 1 },
        ],
        resultText: "You grit your teeth and play on. The fans love your commitment; the physio frets.",
      },
      {
        id: "rest_knock",
        label: "Take a few weeks off",
        effects: [
          { type: "status", key: "injuryRisk", delta: -8 },
          { type: "status", key: "fatigue", delta: -6 },
          { type: "status", key: "form", delta: -3 },
        ],
        resultText: "You rest it fully. The ankle settles, even if your rhythm takes a hit.",
      },
    ],
    weight: 5,
  },

  // ---------------------------------------------------------------------------
  // TRANSFER
  // ---------------------------------------------------------------------------
  {
    id: "transfer_bigger_club",
    category: "TRANSFER",
    title: "A Step Up — and a Gamble",
    description:
      "A bigger, richer club tables an offer. More prestige, more pressure, and a deeper squad where minutes are anything but guaranteed. Your current club wants you to stay and be the main man.",
    choices: [
      {
        id: "take_leap",
        label: "Take the leap",
        effects: [
          { type: "status", key: "reputation", delta: 9 },
          { type: "money", delta: 600000 },
          { type: "status", key: "coachTrust", delta: -10 },
          { type: "status", key: "confidence", delta: -4 },
        ],
        resultText: "You sign for the giants. Bright lights, brutal competition — sink or swim.",
      },
      {
        id: "stay_main_man",
        label: "Stay and be the star here",
        effects: [
          { type: "status", key: "coachTrust", delta: 7 },
          { type: "status", key: "confidence", delta: 5 },
          { type: "traitProgress", traitId: "ONE_CLUB_HERO", amount: 20 },
        ],
        resultText: "You commit your future to the club. The fans sing your name louder than ever.",
      },
    ],
    weight: 4,
    phases: ["RISING_PLAYER", "PRIME"],
  },
  {
    id: "transfer_gulf_payday",
    category: "TRANSFER",
    title: "The Lucrative Twilight Offer",
    description:
      "A wealthy club abroad waves an eye-watering contract at you. The football is a step down, but the payday would set up generations. Your competitive days in the elite are numbered either way.",
    choices: [
      {
        id: "take_money",
        label: "Take the money",
        effects: [
          { type: "money", delta: 2000000 },
          { type: "status", key: "reputation", delta: -4 },
          { type: "status", key: "morale", delta: 5 },
          { type: "traitProgress", traitId: "MERCENARY", amount: 30 },
        ],
        resultText: "You cash in. Purists tut, your accountant grins, and the sun is lovely this time of year.",
      },
      {
        id: "chase_legacy",
        label: "Chase one more honour instead",
        effects: [
          { type: "status", key: "reputation", delta: 5 },
          { type: "status", key: "confidence", delta: 4 },
          { type: "money", delta: -100000 },
        ],
        resultText: "\"It was never about the money.\" You stay to chase silverware while you still can.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 31 }],
    weight: 3,
    phases: ["VETERAN", "FINAL_CHAPTER"],
  },

  // ---------------------------------------------------------------------------
  // NATIONAL_TEAM
  // ---------------------------------------------------------------------------
  {
    id: "national_scout_at_match",
    category: "NATIONAL_TEAM",
    title: "The National Coach Is Watching",
    description:
      "Word reaches the dressing room before kickoff: the national team manager is in the stands tonight, and he's here to watch you. This is your audition for an international call-up.",
    choices: [
      {
        id: "showboat",
        label: "Try to dazzle him",
        effects: [
          { type: "status", key: "confidence", delta: 5 },
          { type: "status", key: "mediaPressure", delta: 6 },
          { type: "attribute", key: "dribbling", delta: 1 },
        ],
        resultText: "You go looking for moments. Some come off spectacularly; some leave the gaffer wincing.",
      },
      {
        id: "play_normal",
        label: "Play your natural game",
        effects: [
          { type: "attribute", key: "composure", delta: 2 },
          { type: "status", key: "reputation", delta: 4 },
        ],
        resultText: "You trust what got you here. Calm, efficient, exactly the audition he wanted to see.",
      },
    ],
    weight: 5,
  },
  {
    id: "national_callup_decision",
    category: "NATIONAL_TEAM",
    title: "The Call-Up Dilemma",
    description:
      "Your country calls — but it's a meaningless friendly during a brutal stretch of club fixtures. Answer the call and risk burnout, or pull out and risk your international future?",
    choices: [
      {
        id: "answer_call",
        label: "Answer your country's call",
        effects: [
          { type: "status", key: "reputation", delta: 6 },
          { type: "status", key: "fatigue", delta: 9 },
          { type: "status", key: "morale", delta: 4 },
        ],
        resultText: "You pull on the national shirt with pride — and arrive back at the club running on fumes.",
      },
      {
        id: "withdraw",
        label: "Withdraw to rest",
        effects: [
          { type: "status", key: "fatigue", delta: -6 },
          { type: "status", key: "reputation", delta: -5 },
          { type: "status", key: "coachTrust", delta: 4 },
        ],
        resultText: "Your club manager is delighted. The national press, less so.",
      },
    ],
    weight: 4,
  },
  {
    id: "national_tournament_squad",
    category: "NATIONAL_TEAM",
    title: "Squad of the Summer",
    description:
      "The national manager calls personally. \"I want you at the tournament — but only if you're at your sharpest. A long season's behind you. Be honest: are you ready to give me everything?\"",
    choices: [
      {
        id: "commit_fully",
        label: "Commit to the tournament",
        effects: [
          { type: "status", key: "reputation", delta: 8 },
          { type: "status", key: "fatigue", delta: 10 },
          { type: "status", key: "morale", delta: 6 },
        ],
        resultText: "You promise him everything and mean it. A summer on the biggest stage awaits.",
      },
      {
        id: "ask_rest",
        label: "Ask to be rested this cycle",
        effects: [
          { type: "status", key: "fatigue", delta: -10 },
          { type: "status", key: "reputation", delta: -6 },
          { type: "attribute", key: "professionalism", delta: 1 },
        ],
        resultText: "You bow out to recharge. Some call it wise; others call it a missed chapter.",
      },
    ],
    conditions: [{ field: "reputation", op: "gte", value: 55 }],
    weight: 3,
    phases: ["PRIME", "VETERAN"],
  },

  // ---------------------------------------------------------------------------
  // PERSONAL_LIFE
  // ---------------------------------------------------------------------------
  {
    id: "personal_family_milestone",
    category: "PERSONAL_LIFE",
    title: "A New Arrival",
    description:
      "Life off the pitch reaches a milestone — a major family event lands in the middle of the season. Your heart is at home, but the matches don't stop coming.",
    choices: [
      {
        id: "family_first",
        label: "Put family first this week",
        effects: [
          { type: "status", key: "morale", delta: 8 },
          { type: "status", key: "form", delta: -3 },
          { type: "status", key: "coachTrust", delta: -3 },
        ],
        resultText: "You take the time you need. Your head's clearer, even if your match sharpness dips.",
      },
      {
        id: "compartmentalise",
        label: "Channel it into your football",
        effects: [
          { type: "status", key: "confidence", delta: 4 },
          { type: "status", key: "form", delta: 4 },
          { type: "status", key: "fatigue", delta: 4 },
        ],
        resultText: "You dedicate your next goal to them, point to the sky, and run yourself into the ground.",
      },
    ],
    weight: 5,
  },
  {
    id: "personal_hometown_charity",
    category: "PERSONAL_LIFE",
    title: "Giving Back",
    description:
      "Your old neighbourhood asks you to fund and front a community pitch project. It's close to your heart — but it'll cost real money and real time you don't have a lot of.",
    choices: [
      {
        id: "fund_it",
        label: "Fund the project",
        effects: [
          { type: "money", delta: -250000 },
          { type: "status", key: "reputation", delta: 7 },
          { type: "status", key: "morale", delta: 6 },
        ],
        resultText: "Kids will learn the game where you did. The local press calls you a hero.",
      },
      {
        id: "lend_name",
        label: "Lend your name, not your wallet",
        effects: [
          { type: "status", key: "reputation", delta: 3 },
          { type: "status", key: "mediaPressure", delta: 2 },
        ],
        resultText: "You show up for the photos. Helpful — but some back home wanted more.",
      },
      {
        id: "stay_focused",
        label: "Politely stay focused on football",
        effects: [{ type: "status", key: "fatigue", delta: -3 }],
        resultText: "You keep your energy for the pitch. The project finds another backer.",
      },
    ],
    weight: 4,
  },
  {
    id: "personal_social_media_storm",
    category: "PERSONAL_LIFE",
    title: "An Old Post Resurfaces",
    description:
      "Something you posted years ago is dug up and goes viral for the wrong reasons. Your phone is melting. The club's media team wants to know how you'd like to handle it.",
    choices: [
      {
        id: "apologise",
        label: "Apologise sincerely",
        effects: [
          { type: "status", key: "mediaPressure", delta: -4 },
          { type: "status", key: "reputation", delta: -2 },
          { type: "attribute", key: "professionalism", delta: 1 },
        ],
        resultText: "You own it and move on. It blows over faster than feared.",
      },
      {
        id: "ignore",
        label: "Say nothing and let it pass",
        effects: [
          { type: "status", key: "mediaPressure", delta: 6 },
          { type: "status", key: "confidence", delta: 2 },
        ],
        resultText: "You go quiet and ride it out. The storm rages a while before it dies.",
      },
    ],
    weight: 4,
  },

  // ---------------------------------------------------------------------------
  // POSITION_CHANGE
  // ---------------------------------------------------------------------------
  {
    id: "position_coach_asks_newrole",
    category: "POSITION_CHANGE",
    title: "A New Role",
    description:
      "The manager sketches a diagram on the whiteboard and turns to you. \"I want to try you in a new position. Your attributes fit it better than you'd think — but it means relearning your game.\"",
    choices: [
      {
        id: "embrace",
        label: "Embrace the reinvention",
        effects: [
          { type: "attribute", key: "positioning", delta: 3 },
          { type: "attribute", key: "vision", delta: 2 },
          { type: "status", key: "coachTrust", delta: 7 },
          { type: "status", key: "confidence", delta: -3 },
        ],
        resultText: "You throw yourself into the new role. It's awkward at first, but the coach sees a future here.",
      },
      {
        id: "resist",
        label: "Insist on your natural position",
        effects: [
          { type: "status", key: "coachTrust", delta: -6 },
          { type: "status", key: "confidence", delta: 4 },
        ],
        resultText: "\"I know what I am.\" The gaffer respects the conviction, but files it away.",
      },
    ],
    weight: 5,
  },
  {
    id: "position_drop_deeper",
    category: "POSITION_CHANGE",
    title: "Dropping Deeper",
    description:
      "As the years catch up with your legs, the staff float the idea of dropping you into a deeper, more cerebral role — less running, more thinking. It's a path many greats have walked late in their careers.",
    choices: [
      {
        id: "reinvent",
        label: "Reinvent yourself deeper",
        effects: [
          { type: "attribute", key: "passing", delta: 3 },
          { type: "attribute", key: "vision", delta: 3 },
          { type: "attribute", key: "pace", delta: -1 },
          { type: "traitProgress", traitId: "PLAYMAKER", amount: 25 },
        ],
        resultText: "You trade yards for guile, and your reading of the game blossoms.",
      },
      {
        id: "stay_advanced",
        label: "Cling to your advanced role",
        effects: [
          { type: "status", key: "confidence", delta: 4 },
          { type: "status", key: "fatigue", delta: 6 },
          { type: "status", key: "coachTrust", delta: -3 },
        ],
        resultText: "You refuse to accept the legs are going. Some nights they prove you right.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 30 }],
    weight: 4,
    phases: ["VETERAN", "FINAL_CHAPTER"],
  },
  {
    id: "position_emergency_cover",
    category: "POSITION_CHANGE",
    title: "Emergency Cover",
    description:
      "Injuries have decimated one area of the pitch, and the manager asks you to fill in there for a few weeks — well out of your comfort zone. \"I'm desperate,\" he admits. \"I need a team man.\"",
    choices: [
      {
        id: "step_up",
        label: "Step up wherever needed",
        effects: [
          { type: "status", key: "coachTrust", delta: 8 },
          { type: "status", key: "teamChemistry", delta: 5 },
          { type: "status", key: "form", delta: -2 },
          { type: "traitProgress", traitId: "TEAM_PLAYER", amount: 20 },
        ],
        resultText: "You play out of position without a word of complaint. The gaffer won't forget it.",
      },
      {
        id: "refuse",
        label: "Refuse to play out of position",
        effects: [
          { type: "status", key: "coachTrust", delta: -8 },
          { type: "status", key: "form", delta: 2 },
        ],
        resultText: "\"That's not my job.\" The manager finds someone else — and remembers who said no.",
      },
    ],
    weight: 4,
  },

  // ---------------------------------------------------------------------------
  // RETIREMENT
  // ---------------------------------------------------------------------------
  {
    id: "retirement_musing",
    category: "RETIREMENT",
    title: "How Much Longer?",
    description:
      "Sitting in an empty dressing room after another long week, the thought arrives unbidden: how much longer can you do this? The body protests more each season, and a life beyond football beckons.",
    choices: [
      {
        id: "one_more",
        label: "Sign up for one more year",
        effects: [
          { type: "status", key: "morale", delta: 5 },
          { type: "status", key: "fatigue", delta: 4 },
          { type: "traitProgress", traitId: "LOYAL_SERVANT", amount: 15 },
        ],
        resultText: "Not yet. There's life in the old dog. You commit to one more campaign.",
      },
      {
        id: "begin_planning",
        label: "Start planning life after football",
        effects: [
          { type: "status", key: "morale", delta: 3 },
          { type: "status", key: "fatigue", delta: -5 },
          { type: "attribute", key: "leadership", delta: 2 },
        ],
        resultText: "You start lining up coaching badges and quiet days. Peace settles over you.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 34 }],
    weight: 4,
    phases: ["FINAL_CHAPTER"],
  },
  {
    id: "retirement_after_major_injury",
    category: "RETIREMENT",
    title: "After the Big One",
    description:
      "A career-altering injury has left you staring at a hard truth in the rehab room. The surgeon was honest: you can come back, but you'll never be quite what you were. Is it worth the fight?",
    choices: [
      {
        id: "fight_back",
        label: "Fight your way back",
        effects: [
          { type: "status", key: "confidence", delta: 6 },
          { type: "status", key: "injuryRisk", delta: 8 },
          { type: "status", key: "reputation", delta: 4 },
          { type: "traitProgress", traitId: "PROFESSIONAL", amount: 20 },
        ],
        resultText: "You refuse to let it end like this. The grind back begins, scar tissue and all.",
      },
      {
        id: "bow_out",
        label: "Consider bowing out with grace",
        effects: [
          { type: "status", key: "morale", delta: 4 },
          { type: "status", key: "reputation", delta: 3 },
          { type: "attribute", key: "leadership", delta: 1 },
        ],
        resultText: "Maybe the body's telling you something. You begin to make peace with the idea.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 32 }, { field: "injuryRisk", op: "gte", value: 50 }],
    weight: 3,
    phases: ["VETERAN", "FINAL_CHAPTER"],
  },

  // ---------------------------------------------------------------------------
  // Extra COACH / AGENT / MEDIA / TRAINING / TEAMMATE / etc. to clear 45
  // ---------------------------------------------------------------------------
  {
    id: "coach_trust_test",
    category: "COACH",
    title: "A Test of Faith",
    description:
      "The manager hands you a defensive instruction that goes against every attacking instinct you have. \"Trust me,\" he says. \"Do it my way for one match.\" It could blunt your game entirely.",
    choices: [
      {
        id: "obey",
        label: "Follow the instruction to the letter",
        effects: [
          { type: "status", key: "coachTrust", delta: 7 },
          { type: "attribute", key: "defending", delta: 2 },
          { type: "status", key: "form", delta: -2 },
        ],
        resultText: "You play the disciplined role. Quietly effective, even if the highlight reel suffers.",
      },
      {
        id: "freelance",
        label: "Play your own way regardless",
        effects: [
          { type: "status", key: "coachTrust", delta: -7 },
          { type: "status", key: "form", delta: 4 },
          { type: "traitProgress", traitId: "SELFISH", amount: 15 },
        ],
        resultText: "You do your own thing and it comes off. The result silences him — for now.",
      },
    ],
    weight: 5,
  },
  {
    id: "agent_loan_offer",
    category: "AGENT",
    title: "A Loan to Play",
    description:
      "You're rotting on the bench. Your agent has lined up a loan to a smaller club where you'd play every week. \"Game time is everything at your age,\" he says. \"But it's a step down in level.\"",
    choices: [
      {
        id: "take_loan",
        label: "Take the loan and play",
        effects: [
          { type: "status", key: "form", delta: 8 },
          { type: "status", key: "confidence", delta: 6 },
          { type: "status", key: "reputation", delta: -3 },
        ],
        resultText: "You drop down a level and rediscover your joy for the game, week in week out.",
      },
      {
        id: "stay_fight",
        label: "Stay and fight for your spot",
        effects: [
          { type: "status", key: "coachTrust", delta: 4 },
          { type: "status", key: "morale", delta: -4 },
          { type: "status", key: "fatigue", delta: 3 },
        ],
        resultText: "You back yourself to break into the side here. It's a gamble on patience.",
      },
    ],
    conditions: [{ field: "coachTrust", op: "lt", value: 45 }],
    weight: 4,
    phases: ["PROSPECT", "RISING_PLAYER"],
  },
  {
    id: "media_captain_interview",
    category: "MEDIA",
    title: "The Big Sit-Down",
    description:
      "A major outlet wants a long, revealing interview about your journey — the struggles, the doubters, all of it. \"Be candid,\" the journalist urges, \"and people will love you. Hold back and it falls flat.\"",
    choices: [
      {
        id: "open_up",
        label: "Open up completely",
        effects: [
          { type: "status", key: "reputation", delta: 7 },
          { type: "status", key: "mediaPressure", delta: 4 },
          { type: "traitProgress", traitId: "MEDIA_DARLING", amount: 20 },
        ],
        resultText: "Your honesty moves people. The piece is shared everywhere and humanises you.",
      },
      {
        id: "guarded",
        label: "Keep it guarded and professional",
        effects: [
          { type: "status", key: "mediaPressure", delta: -2 },
          { type: "attribute", key: "professionalism", delta: 1 },
        ],
        resultText: "A safe, polished interview. Forgettable, but you gave nothing away.",
      },
    ],
    weight: 4,
  },
  {
    id: "media_goal_drought",
    category: "MEDIA",
    title: "The Drought Narrative",
    description:
      "The press has decided your goalless run is a crisis, and every question circles back to it. The pressure is becoming a story of its own, and it's starting to seep into your head.",
    choices: [
      {
        id: "embrace_pressure",
        label: "Embrace the pressure publicly",
        effects: [
          { type: "status", key: "confidence", delta: 5 },
          { type: "attribute", key: "composure", delta: 2 },
          { type: "traitProgress", traitId: "BIG_GAME_PLAYER", amount: 15 },
        ],
        resultText: "\"Strikers go through it. I'll score this weekend.\" You stare the narrative down.",
      },
      {
        id: "deflect_pressure",
        label: "Deflect to the team's results",
        effects: [
          { type: "status", key: "mediaPressure", delta: -4 },
          { type: "status", key: "teamChemistry", delta: 3 },
        ],
        resultText: "\"As long as we're winning, my goals don't matter.\" Smart, selfless, deflecting.",
      },
    ],
    conditions: [{ field: "form", op: "lt", value: 45 }],
    weight: 5,
  },
  {
    id: "training_leadership_drill",
    category: "TRAINING",
    title: "Run the Session",
    description:
      "The coaching staff are short-handed and ask you to lead today's session yourself. It's a chance to stamp your authority on the group — or to fall flat in front of your peers.",
    choices: [
      {
        id: "take_charge",
        label: "Take command",
        effects: [
          { type: "attribute", key: "leadership", delta: 3 },
          { type: "status", key: "teamChemistry", delta: 4 },
          { type: "traitProgress", traitId: "LEADER", amount: 20 },
        ],
        resultText: "You run a sharp, demanding session. The staff are impressed; the lads bought in.",
      },
      {
        id: "keep_low",
        label: "Keep it low-key",
        effects: [{ type: "status", key: "teamChemistry", delta: 2 }],
        resultText: "You keep things simple and uncontroversial. No glory, no disaster.",
      },
    ],
    weight: 4,
  },
  {
    id: "training_gk_distribution",
    category: "TRAINING",
    title: "Sweeping Up",
    description:
      "The goalkeeping coach wants to modernise your game — playing higher, sweeping behind the line, starting attacks with your feet. \"It's the future,\" he says, \"but one misjudgement and it's in your own net.\"",
    choices: [
      {
        id: "modernise",
        label: "Buy into the modern role",
        effects: [
          { type: "attribute", key: "positioning", delta: 2 },
          { type: "attribute", key: "passing", delta: 2 },
          { type: "traitProgress", traitId: "SWEEPER_KEEPER", amount: 25 },
        ],
        resultText: "You start playing like an extra defender. Risky, thrilling, and very on-trend.",
      },
      {
        id: "stay_traditional",
        label: "Stick to shot-stopping",
        effects: [
          { type: "attribute", key: "goalkeeping", delta: 2 },
          { type: "traitProgress", traitId: "SAFE_HANDS", amount: 20 },
        ],
        resultText: "\"My job is keeping it out of the net.\" You double down on the basics.",
      },
    ],
    weight: 3,
  },
  {
    id: "training_aerial_work",
    category: "TRAINING",
    title: "Owning the Box",
    description:
      "The coach drags you into extra aerial work — defending crosses, attacking set pieces, bullying for position. It's exhausting, unglamorous, and exactly the part of your game that gets exposed.",
    choices: [
      {
        id: "grind_aerial",
        label: "Grind out the aerial work",
        effects: [
          { type: "attribute", key: "aerialAbility", delta: 3 },
          { type: "attribute", key: "strength", delta: 1 },
          { type: "status", key: "fatigue", delta: 4 },
          { type: "traitProgress", traitId: "TARGET_MAN", amount: 15 },
        ],
        resultText: "You win headers you'd have lost a month ago. The unglamorous work pays off.",
      },
      {
        id: "skip_aerial",
        label: "Focus on your strengths instead",
        effects: [
          { type: "attribute", key: "dribbling", delta: 1 },
          { type: "status", key: "fatigue", delta: -2 },
        ],
        resultText: "You play to type and sharpen what you're already good at. A missed area, perhaps.",
      },
    ],
    weight: 4,
  },
  {
    id: "teammate_penalty_dispute",
    category: "TEAMMATE",
    title: "Who Takes the Penalty?",
    description:
      "The team wins a crucial penalty and two of you reach for the ball at once. The crowd holds its breath. Your teammate is the designated taker — but you're feeling it tonight.",
    choices: [
      {
        id: "take_it",
        label: "Grab the ball and take it",
        effects: [
          { type: "status", key: "confidence", delta: 6 },
          { type: "status", key: "teamChemistry", delta: -5 },
          { type: "traitProgress", traitId: "PENALTY_SPECIALIST", amount: 20 },
        ],
        resultText: "You snatch the ball and stroke it home. Glorious — and the taker won't forget the snub.",
      },
      {
        id: "hand_over",
        label: "Hand it to the designated taker",
        effects: [
          { type: "status", key: "teamChemistry", delta: 5 },
          { type: "traitProgress", traitId: "TEAM_PLAYER", amount: 15 },
        ],
        resultText: "You step back and let him take it. The right call, even if you fancied it.",
      },
    ],
    weight: 4,
  },
  {
    id: "teammate_cover_for_mate",
    category: "TEAMMATE",
    title: "A Teammate's Secret",
    description:
      "A close teammate confides he's been struggling badly off the pitch and begs you not to tell the staff. But it's affecting his football, and the manager keeps asking you what's wrong with him.",
    choices: [
      {
        id: "keep_secret",
        label: "Keep his confidence",
        effects: [
          { type: "status", key: "teamChemistry", delta: 7 },
          { type: "status", key: "coachTrust", delta: -3 },
        ],
        resultText: "You cover for him and help quietly. He'll have your back forever now.",
      },
      {
        id: "alert_staff",
        label: "Quietly alert the support staff",
        effects: [
          { type: "status", key: "coachTrust", delta: 4 },
          { type: "status", key: "teamChemistry", delta: -2 },
          { type: "attribute", key: "professionalism", delta: 1 },
        ],
        resultText: "You get him real help, even if he's angry at first. The club handles it with care.",
      },
    ],
    weight: 4,
  },
  {
    id: "personal_burnout",
    category: "PERSONAL_LIFE",
    title: "Running on Empty",
    description:
      "The relentless grind has worn you down — not just the body, but the mind. The joy feels distant. A trusted friend suggests you talk to someone, or at least step back and breathe.",
    choices: [
      {
        id: "seek_help",
        label: "Take care of your head",
        effects: [
          { type: "status", key: "morale", delta: 8 },
          { type: "status", key: "fatigue", delta: -6 },
          { type: "attribute", key: "composure", delta: 2 },
        ],
        resultText: "You talk it through and take a real break. Slowly, the love for the game returns.",
      },
      {
        id: "bottle_it",
        label: "Bottle it up and push on",
        effects: [
          { type: "status", key: "fatigue", delta: 6 },
          { type: "status", key: "morale", delta: -5 },
          { type: "status", key: "form", delta: -3 },
        ],
        resultText: "You tell yourself you're fine and play on. The weight only grows heavier.",
      },
    ],
    conditions: [{ field: "morale", op: "lt", value: 40 }],
    weight: 5,
  },
  {
    id: "coach_press_resistance",
    category: "TRAINING",
    title: "Under the Cosh",
    description:
      "The assistant coach sets up a rondo nightmare — you in the middle, surrounded, hounded, with one second to make the right pass. \"This is how you beat a high press,\" he barks. \"Now do it under pressure.\"",
    choices: [
      {
        id: "embrace_press",
        label: "Embrace the chaos",
        effects: [
          { type: "attribute", key: "composure", delta: 2 },
          { type: "status", key: "fatigue", delta: 3 },
          { type: "traitProgress", traitId: "PRESS_RESISTANT", amount: 25 },
        ],
        resultText: "You learn to find the gap before it closes. Pressure becomes an old friend.",
      },
      {
        id: "play_safe",
        label: "Play it safe and simple",
        effects: [
          { type: "attribute", key: "passing", delta: 1 },
          { type: "status", key: "teamChemistry", delta: 2 },
        ],
        resultText: "You recycle possession sensibly. Tidy, if a touch predictable.",
      },
    ],
    weight: 4,
  },
  {
    id: "teammate_hard_tackle_rep",
    category: "TEAMMATE",
    title: "The Enforcer's Lesson",
    description:
      "The squad's hard man takes you aside. \"You're too soft in the duels. Let me show you how to win the ball — properly. Referees won't love it, but strikers will hate playing you.\"",
    choices: [
      {
        id: "learn_dark_arts",
        label: "Learn the dark arts",
        effects: [
          { type: "attribute", key: "defending", delta: 3 },
          { type: "attribute", key: "strength", delta: 1 },
          { type: "traitProgress", traitId: "HARD_TACKLER", amount: 25 },
        ],
        resultText: "You start winning the fifty-fifties. A few extra yellow cards is a price worth paying.",
      },
      {
        id: "stay_clean",
        label: "Keep your game clean",
        effects: [
          { type: "attribute", key: "positioning", delta: 2 },
          { type: "status", key: "reputation", delta: 2 },
        ],
        resultText: "\"I'll win it with my brain, not my elbows.\" You read the game to compensate.",
      },
    ],
    weight: 4,
  },
  {
    id: "agent_brand_clash",
    category: "AGENT",
    title: "A Conflict of Interest",
    description:
      "Your agent reveals he's just signed a rival player who plays your exact position — at a club that's been sniffing around you. \"It's all business,\" he assures you. But can you really trust his advice now?",
    choices: [
      {
        id: "stay_loyal",
        label: "Stick with your agent",
        effects: [
          { type: "status", key: "morale", delta: 2 },
          { type: "status", key: "reputation", delta: -2 },
        ],
        resultText: "You give him the benefit of the doubt. He's served you well so far.",
      },
      {
        id: "switch_agent",
        label: "Find new representation",
        effects: [
          { type: "money", delta: -100000 },
          { type: "status", key: "confidence", delta: 3 },
          { type: "attribute", key: "professionalism", delta: 1 },
        ],
        resultText: "You cut ties and find someone whose interests are yours alone. Costly, but clean.",
      },
    ],
    weight: 3,
  },
  {
    id: "coach_super_sub_role",
    category: "COACH",
    title: "The Impact Role",
    description:
      "\"I'm not starting you,\" the manager says bluntly, \"but I'm building the team around bringing you on to win games. Embrace the impact role and you'll be a hero off the bench.\" It stings your pride.",
    choices: [
      {
        id: "accept_role",
        label: "Own the impact role",
        effects: [
          { type: "status", key: "confidence", delta: 5 },
          { type: "status", key: "coachTrust", delta: 5 },
          { type: "traitProgress", traitId: "SUPER_SUB", amount: 30 },
        ],
        resultText: "You make peace with the bench and start changing games late. The fans roar when your name's called.",
      },
      {
        id: "demand_start",
        label: "Demand to start",
        effects: [
          { type: "status", key: "coachTrust", delta: -6 },
          { type: "status", key: "confidence", delta: 3 },
          { type: "status", key: "form", delta: 2 },
        ],
        resultText: "\"I'm a starter, not a sub.\" The gaffer files your ambition away — for better or worse.",
      },
    ],
    weight: 4,
  },
  {
    id: "media_loyalty_question",
    category: "MEDIA",
    title: "\"Will You Stay Loyal?\"",
    description:
      "After years at the club, a reporter asks the question the fans dread: \"With all this interest in you, can you promise the supporters you'll stay?\" The cameras zoom in on your face.",
    choices: [
      {
        id: "pledge_loyalty",
        label: "Pledge your loyalty",
        effects: [
          { type: "status", key: "morale", delta: 5 },
          { type: "status", key: "reputation", delta: 3 },
          { type: "traitProgress", traitId: "ONE_CLUB_HERO", amount: 25 },
        ],
        resultText: "\"This is my home.\" The terraces sing your name for a week straight.",
      },
      {
        id: "keep_options",
        label: "Keep your options open",
        effects: [
          { type: "status", key: "reputation", delta: 2 },
          { type: "status", key: "morale", delta: -3 },
          { type: "status", key: "mediaPressure", delta: 4 },
        ],
        resultText: "\"I never say never.\" Diplomatic — but the fans hear the door creaking open.",
      },
    ],
    conditions: [{ field: "reputation", op: "gte", value: 45 }],
    weight: 4,
    phases: ["PRIME", "VETERAN"],
  },
  {
    id: "coach_contract_extension",
    category: "COACH",
    title: "A Contract on the Table",
    description:
      "The chairman and manager present a long-term extension together — a statement of faith in you as the spine of the club for years to come. The terms are good, the commitment is real.",
    choices: [
      {
        id: "sign_extension",
        label: "Sign the extension",
        effects: [
          { type: "status", key: "coachTrust", delta: 8 },
          { type: "status", key: "morale", delta: 6 },
          { type: "money", delta: 300000 },
          { type: "traitProgress", traitId: "LOYAL_SERVANT", amount: 25 },
        ],
        resultText: "You put pen to paper. The club is yours to lead, and the relief in the boardroom is palpable.",
      },
      {
        id: "delay",
        label: "Ask for time to consider",
        effects: [
          { type: "status", key: "coachTrust", delta: -4 },
          { type: "status", key: "reputation", delta: 3 },
        ],
        resultText: "\"Let me think.\" They smile tightly. Speculation begins immediately.",
      },
    ],
    weight: 4,
    phases: ["PRIME"],
  },
  {
    id: "national_retirement_intl",
    category: "NATIONAL_TEAM",
    title: "Hanging Up the National Shirt",
    description:
      "The international grind is taking its toll, and the long flights are stealing weeks from your club season. The federation wants a decision: commit to the next cycle, or retire from international duty.",
    choices: [
      {
        id: "retire_intl",
        label: "Retire from internationals",
        effects: [
          { type: "status", key: "fatigue", delta: -10 },
          { type: "status", key: "reputation", delta: -3 },
          { type: "status", key: "form", delta: 3 },
        ],
        resultText: "You step away from the national team to protect your club career. A bittersweet farewell.",
      },
      {
        id: "carry_on_intl",
        label: "Carry on for your country",
        effects: [
          { type: "status", key: "reputation", delta: 5 },
          { type: "status", key: "fatigue", delta: 6 },
          { type: "status", key: "morale", delta: 4 },
        ],
        resultText: "You're not done yet. The anthem still gives you goosebumps.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 31 }],
    weight: 3,
    phases: ["VETERAN", "FINAL_CHAPTER"],
  },
  {
    id: "training_vision_study",
    category: "TRAINING",
    title: "The Film Room",
    description:
      "The analyst offers extra video sessions dissecting how the world's best playmakers find space and time. It's hours of screens and notebooks — the opposite of glamour, but the patterns are everywhere once you see them.",
    choices: [
      {
        id: "study_hard",
        label: "Live in the film room",
        effects: [
          { type: "attribute", key: "vision", delta: 3 },
          { type: "attribute", key: "positioning", delta: 1 },
          { type: "traitProgress", traitId: "PLAYMAKER", amount: 20 },
        ],
        resultText: "Your reading of the game sharpens dramatically. You see passes before they exist.",
      },
      {
        id: "trust_instinct",
        label: "Trust your instincts on the pitch",
        effects: [
          { type: "attribute", key: "dribbling", delta: 1 },
          { type: "status", key: "confidence", delta: 3 },
        ],
        resultText: "\"I play what I feel.\" You back your gut over the whiteboard.",
      },
    ],
    weight: 4,
  },
  {
    id: "personal_doubters_motivation",
    category: "PERSONAL_LIFE",
    title: "The Doubters",
    description:
      "An old coach who once told you you'd never make it is quoted in the papers, doubling down. It lands harder than you'd admit. You can let it fuel you, or let it go entirely.",
    choices: [
      {
        id: "fuel",
        label: "Let it fuel you",
        effects: [
          { type: "status", key: "form", delta: 5 },
          { type: "status", key: "fatigue", delta: 3 },
          { type: "traitProgress", traitId: "LATE_BLOOMER", amount: 15 },
        ],
        resultText: "You pin the quote above your locker. Every session has an edge now.",
      },
      {
        id: "let_go",
        label: "Rise above it",
        effects: [
          { type: "attribute", key: "composure", delta: 2 },
          { type: "status", key: "morale", delta: 3 },
        ],
        resultText: "You smile and move on. Their words have no power over your week.",
      },
    ],
    weight: 4,
  },
  {
    id: "agent_wonderkid_hype",
    category: "AGENT",
    title: "The Hype Machine",
    description:
      "Your agent wants to lean hard into the wonderkid narrative — magazine covers, the 'next big thing' label, the whole circus. \"Strike while the iron's hot,\" he urges. \"But hype is a heavy thing to carry.\"",
    choices: [
      {
        id: "ride_hype",
        label: "Ride the wave",
        effects: [
          { type: "status", key: "reputation", delta: 8 },
          { type: "status", key: "mediaPressure", delta: 8 },
          { type: "traitProgress", traitId: "WONDERKID", amount: 30 },
        ],
        resultText: "Your face is everywhere. The world expects greatness now — no pressure.",
      },
      {
        id: "stay_grounded",
        label: "Stay grounded and quiet",
        effects: [
          { type: "attribute", key: "professionalism", delta: 2 },
          { type: "status", key: "mediaPressure", delta: -3 },
          { type: "traitProgress", traitId: "PROFESSIONAL", amount: 15 },
        ],
        resultText: "\"Let the football do the talking.\" Wise heads at the club nod approvingly.",
      },
    ],
    conditions: [{ field: "age", op: "lt", value: 23 }],
    weight: 4,
    phases: ["PROSPECT", "RISING_PLAYER"],
  },
  {
    id: "injury_comeback_match",
    category: "INJURY",
    title: "The Comeback Decision",
    description:
      "Cleared to return after a long lay-off, you're handed a choice: ease back in with twenty minutes off the bench, or back yourself to start the big match the staff have penciled you in for.",
    choices: [
      {
        id: "ease_in",
        label: "Ease back gently",
        effects: [
          { type: "status", key: "injuryRisk", delta: -4 },
          { type: "status", key: "fatigue", delta: -2 },
          { type: "status", key: "confidence", delta: -2 },
        ],
        resultText: "Twenty minutes, no drama. The body responds well to the gentle reintroduction.",
      },
      {
        id: "start_big",
        label: "Throw yourself back in",
        effects: [
          { type: "status", key: "confidence", delta: 6 },
          { type: "status", key: "injuryRisk", delta: 8 },
          { type: "status", key: "coachTrust", delta: 4 },
        ],
        resultText: "You start the big one and survive ninety minutes. Bold — and your body held.",
      },
    ],
    weight: 4,
  },
  {
    id: "teammate_chemistry_initiation",
    category: "TEAMMATE",
    title: "The Initiation",
    description:
      "As the new signing, tradition demands you sing for the squad at dinner. It's mortifying, the whole room is filming, and your reputation in the dressing room hangs on how you take it.",
    choices: [
      {
        id: "embrace_it",
        label: "Belt it out and own it",
        effects: [
          { type: "status", key: "teamChemistry", delta: 8 },
          { type: "status", key: "morale", delta: 3 },
        ],
        resultText: "You butcher the song with total commitment. The squad adopts you on the spot.",
      },
      {
        id: "refuse_shy",
        label: "Bashfully refuse",
        effects: [
          { type: "status", key: "teamChemistry", delta: -4 },
          { type: "status", key: "confidence", delta: -2 },
        ],
        resultText: "You can't bring yourself to do it. The lads let it slide — but it's a missed bonding chance.",
      },
    ],
    weight: 4,
    phases: ["PROSPECT", "RISING_PLAYER", "PRIME"],
  },
  {
    id: "coach_veteran_squad_role",
    category: "COACH",
    title: "The Elder Statesman",
    description:
      "The manager is honest with you: your minutes will shrink, but he wants you in the squad as a leader and mentor to the next generation. \"Your legs may be going,\" he says, \"but your influence is priceless.\"",
    choices: [
      {
        id: "accept_mentor_role",
        label: "Accept the mentor role",
        effects: [
          { type: "attribute", key: "leadership", delta: 3 },
          { type: "status", key: "coachTrust", delta: 6 },
          { type: "traitProgress", traitId: "VETERAN_MENTOR", amount: 30 },
        ],
        resultText: "You become the dressing-room sage. The young ones grow under your wing.",
      },
      {
        id: "want_minutes",
        label: "Insist you can still play",
        effects: [
          { type: "status", key: "confidence", delta: 4 },
          { type: "status", key: "coachTrust", delta: -4 },
          { type: "status", key: "fatigue", delta: 4 },
        ],
        resultText: "\"I'm not done.\" You fight for every minute. Admirable, exhausting, defiant.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 32 }],
    weight: 4,
    phases: ["VETERAN", "FINAL_CHAPTER"],
  },
  {
    id: "media_award_nomination",
    category: "MEDIA",
    title: "Up for an Award",
    description:
      "You've been shortlisted for a major individual award, and the media wants your reaction. It's recognition you've craved — but a rival is the favourite, and a graceless quote could backfire.",
    choices: [
      {
        id: "gracious",
        label: "Be gracious about your rivals",
        effects: [
          { type: "status", key: "reputation", delta: 5 },
          { type: "status", key: "morale", delta: 3 },
          { type: "traitProgress", traitId: "MEDIA_DARLING", amount: 15 },
        ],
        resultText: "\"Whoever wins deserves it.\" Class personified — the public warms to you.",
      },
      {
        id: "confident_claim",
        label: "Stake your claim boldly",
        effects: [
          { type: "status", key: "confidence", delta: 5 },
          { type: "status", key: "mediaPressure", delta: 5 },
        ],
        resultText: "\"I think I've earned it.\" Bold — now you have to back it up.",
      },
    ],
    conditions: [{ field: "reputation", op: "gte", value: 60 }],
    weight: 3,
    phases: ["PRIME"],
  },
  {
    id: "transfer_homecoming",
    category: "TRANSFER",
    title: "The Homecoming Call",
    description:
      "Your boyhood club — the one whose shirt you wore as a kid — comes calling. It's a step down in level and wages, but the pull of finishing where it all began is powerful.",
    choices: [
      {
        id: "go_home",
        label: "Answer the homecoming call",
        effects: [
          { type: "status", key: "morale", delta: 8 },
          { type: "money", delta: -300000 },
          { type: "status", key: "reputation", delta: 4 },
          { type: "traitProgress", traitId: "ONE_CLUB_HERO", amount: 20 },
        ],
        resultText: "You go home a hero. The supporters who watched you grow up weep in the stands.",
      },
      {
        id: "stay_elite",
        label: "Stay at the top a while longer",
        effects: [
          { type: "status", key: "reputation", delta: 5 },
          { type: "status", key: "confidence", delta: 3 },
        ],
        resultText: "\"Not yet.\" There's still elite football left in you, and you mean to play it.",
      },
    ],
    conditions: [{ field: "age", op: "gte", value: 30 }],
    weight: 3,
    phases: ["VETERAN", "FINAL_CHAPTER"],
  },
];
