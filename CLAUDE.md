@AGENTS.md

# First Team — Footballer Career RPG

A mobile-first, single-player footballer career simulator. Create a 16-year-old,
play weekly training + key match moments, develop attributes/traits, transfer
across a fictional global game, age through a full career, and retire with a
legacy. No monetization, no real-world football IP.

## Golden rule: engine is separate from UI

All game logic lives in **pure TypeScript** functions under `lib/game`. React
components **only render state and call engine/store actions** — never embed
simulation logic in a component.

```
lib/game/        Pure engine (deterministic, seeded RNG, no React/DOM)
  types.ts         Single source of truth for all data shapes
  rng.ts           Seeded RNG (mulberry32 + FNV-1a); derive from career.seed + keys
  constants.ts     Tunables (SEASON_WEEKS, ages, position→family map, phases)
  weights.ts       Attribute weighting tables (per family + per match-check)
  createCareer.ts  Player creation
  weeklyEngine.ts  advanceWeek (training/recovery; does NOT advance the counter)
  eventEngine.ts   Story events: eligibility, weighted pick, applyEventChoice
  matchEngine.ts   Context, moment templates, shared resolveChoiceOutcome core, applyMatchResult, commitWeek
  matchSimEngine.ts "Living Match": startMatch → advanceMatch (beats) → resolvePlayerBeat → finalizeMatch; momentum/stamina/in-match confidence + contextual payoff (safe is sometimes wrong)
  passages.ts      Multi-stage passage pool: wraps single moments, walks stages (ADVANCE/FINISH/END)
  skillEngine.ts   Marquee skill mini-games: skillKindForChoice (AIM/TIMING/RUN + flavor), buildSkillChallenge (stat-sized window/keeper band), scoreSkillInput (aim+power / timing) → tier
  ratingEngine.ts  OUTCOME_EFFECTS table (rating + stat deltas per outcome) + match rating
  progressionEngine.ts  Training growth (age-gated, diminishing returns)
  agingEngine.ts   End-of-season aging (physical decline / mental growth)
  seasonEngine.ts  finishSeason (awards, record, aggregate, national team, aging)
  transferEngine.ts     Offer generation, accept/reject
  injuryEngine.ts  Injury risk, severity, recovery
  careerEngine.ts  Totals, phase, position change, retirement gating
  retirementEngine.ts   retireCareer → legacy recap
  effects.ts       GameEffect interpreter (shared by events + traits) + trait unlock
  saveEngine.ts    localStorage saves (autosave + 3 slots), Zod-validated
  schemas.ts       Zod schemas for save validation

data/            Static fictional content (plain TS, no logic)
  regions, leagues, clubs (~100), matchMoments (~63 single templates),
  passages (~21 multi-stage), traits (27), events (59), headlines (32),
  commentary (narration lines)

lib/store/gameStore.ts   Zustand store = screen state machine bridging engine ↔ UI
lib/ui/format.ts         Label maps + colour helpers
components/              ui.tsx primitives; game/* widgets; screens/* one per screen
app/page.tsx             Client component switching on store.screen
```

## Determinism

Every random outcome derives from `career.seed` + context keys (season, week,
match id, moment id). `rng(career.seed, "resolve", momentId, choiceId)` always
yields the same result → reproducible, testable. Do not use `Math.random()` or
`Date.now()` inside resolution logic.

## Commands

```
npm run dev        # play locally (http://localhost:3000)
npm run build      # production build (also full typecheck + static gen)
npx tsc --noEmit   # typecheck only
npx vitest run     # tests: engine determinism, store flow, DOM render
npx eslint app components lib
```

### Testing the shot without a human

Two harnesses exist to validate the shot mini-game headlessly (so balance/feel
can be checked without manual playtesting):

- **Balance sim** — `npm run sim:shots`. Monte-Carlos thousands of shots through
  the real engine (`buildSkillChallenge → keeperGuess → resolvePlayerBeat`) for
  poor/avg/elite finishers × reader/sloppy/naive strategies and prints conversion
  + keeper-guess balance. Pure TS, deterministic (seeded). The test
  (`lib/game/__tests__/shotSim.test.ts`) is gated behind `SHOT_SIM=1` so it
  doesn't run in the normal suite. Use this for "is it too easy / fair / varied".
- **Visual harness** — `npm run build && PORT=3210 npm run start`, then
  `npm run visual:shots` (`scripts/visual-shot.mjs`). Drives the real app in
  headless Chromium (WebGL via SwiftShader, so the true-3D scene renders), aims
  configurable spots (`PW_SHOTS="0.9:0.85,0.5:0.25"`), screenshots the dive +
  result, and prints each shot's GOAL/SAVED + running conversion. Use this to
  inspect how the scene *looks* (keeper dive/telegraph, curl, net). Add
  `?slomo=6` to the URL to slow the shot animation 6× (a dev aid in
  `ShotScene3D`, no-op without the param) so individual frames are inspectable
  despite SwiftShader's low capture rate.

## Adding content

It's all data — append to the relevant file in `data/` and it's picked up:
- New match moments → `data/matchMoments.ts` (set `positionFamilies`, `check`, outcomes).
- New events → `data/events.ts` (conditions/phases gate eligibility; effects are `GameEffect[]`).
- New clubs/leagues → `data/clubs.ts` / `data/leagues.ts` (keep `leagueId` valid).

## Match redesign ("Living Match")

The match is a continuous simulated timeline (`matchSimEngine` + `LiveMatch`
screen), not a slideshow: a beat feed with a sticky HUD (score · clock ·
momentum · stamina), the scoreline evolving via narrated beats, the player's
moments embedded with live context, and **contextual payoff** (the safe option
is sometimes the wrong one). Built in stages:

- **Stage 1 — done:** living timeline + live state + contextual payoff.
- **Stage 2 — done:** multi-beat passages. A "moment" is a `MomentPassageTemplate`
  of 1+ stages; each choice has a `flow` (ADVANCE carries the move on if it
  succeeds, FINISH/END close it out). Single moments are wrapped as 1-stage
  passages (`lib/game/passages.ts`); genuine multi-stage ones live in
  `data/passages.ts` (~21, ≥3 per family) and are biased to appear on big moments.
- **Stage 3 — done:** stat-gated skill flourishes on marquee beats, presented as
  animated football scenes (`components/game/Skill.tsx`, SVG + Framer Motion):
  SHOOT → **drag-and-flick**; GK_SAVE → **dive** timing; high-risk DEFEND →
  **slide** timing; high-risk PASS → **through-ball** "lead the run" timing.
  `skillEngine` sizes difficulty from deterministic competence (stats/form/traits
  − fatigue − pressure); the player's input resolves execution → tier → normal
  outcome pipeline. Falls back to the RNG roll if no input (back-compatible).
  Skill kind/flavor inferred from the choice's `check`.

  **True 3D shot (WebGL):** `components/game/ShotScene3D.tsx` renders the shot in
  real 3D via react-three-fiber/three (low-poly pitch/goal/keeper/ball, camera
  behind the striker, ball flight with curl + arc in 3D, diving keeper). Same
  drag→aim/power/curl input + same `SkillInput`, so the engine/scoring/tests are
  unchanged. It's **lazy-loaded** (`next/dynamic`, ssr:false — three ships in its
  own async chunk, not the initial bundle) and only used when WebGL is available;
  otherwise (and on any 3D error, via an error boundary) it falls back to the 2D
  `ShotScene`. jsdom/SSR → 2D. Tackle/save/through-ball stay 2D.

  **Game feel:** `lib/ui/fx.ts` synthesises SFX at runtime via Web Audio (no
  asset files) — kick/goal/save/concede/whistle — plus `navigator.vibrate`
  haptics, gated by one persisted mute toggle (on the hub), all safe no-ops on
  SSR/iOS/muted. The shot scene is 2.5D: a perspective pitch + goal, a ball that
  scales down + casts a tracking ground shadow as it flies, the curl arc in
  depth, a diving keeper; `GoalBanner` adds a particle burst. (The tackle/save/
  through-ball scenes are still flat — 2.5D for those is a follow-up.)

  **Curl:** hooking the pull-back path curls the shot (`SkillInput.curl`, signed
  from the drag's bow). The ball bends late around the keeper (curl slightly
  beats their reach) — aim near the keeper and curl it into the corner — but
  over-bending sails wide. Aim guide + ball flight render the bend.

  **Shot model — 2D spot-aiming + a committing keeper:** you drag to a *spot in
  the goal* (sideways = `SkillInput.value`, up = `aimY` height; over the top or
  outside the posts = a miss). Power is auto (it was the weakest axis). The keeper
  no longer just sits centrally: each shot he **commits to a guessed corner**
  (`keeperGuess(challenge)`, deterministic per shot → varies shot-to-shot, shared
  by scene + scorer) and covers *that* region (`dGuess`) plus a tighter central
  reflex (`dCentre`); you score by placing it where he *isn't*. He **telegraphs**
  the guess in the scene (a growing lean toward his side as the shot-clock runs)
  so going the other way is a read, not a coin-flip, and on a goal he dives the
  *wrong* way while on a save he dives to the ball (varied dives, low sprawl vs
  high leap from the target height). `keeperReach()` still grows with elapsed
  time / low power and shrinks with finishing. Per-shot **execution variance**
  (seeded `noise` keyed on the inputs, so scene == scorer) means a marginal shot
  can go either way. Seeded `shotType` (NORMAL / ONE_ON_ONE / LONG_RANGE) varies
  window, reach growth and power needs. No more "aim at the labelled green gap".
- **Stage 4 — done:** consequences & juice. In-match **substitution risk**
  (poor + gassed + low coach trust late → hooked early: moments skipped, fewer
  minutes, coach-trust/morale hit) and the impact-sub reward; in-match
  **confidence chip** (in the zone / rattled) in the HUD; **goal-flash** overlay
  (`GoalBanner`); Post-Match **rating count-up** (`lib/ui/useCountUp.ts`) and an
  emphasised Moment of the Match. `MatchResult` now carries `minutesPlayed`,
  `subbedOff`, `cameOnAsSub`.

The match redesign is complete — all four stages shipped.

## Status / what's stubbed for later

Implemented end-to-end: creation, weekly loop, the Living Match, ratings/stats,
progression, traits, story events, injuries, transfers across regions, aging +
phases, season recaps, a light national-team system, retirement + legacy recap,
local saves.

Lighter/for later: national team is auto-resolved at season end (no playable
international matches yet); position changes exist in the engine
(`changePosition`) but aren't yet surfaced via a dedicated UI flow (hook them to
a POSITION_CHANGE event); manual multi-slot save UI is minimal (autosave + quick
save to slot 1).
