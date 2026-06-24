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
- **Stage 3 — todo:** stat-gated skill flourishes on marquee beats (shot
  pick-a-corner, penalty timing, 1v1 read, last-ditch tackle).
- **Stage 4 — todo:** consequences & juice (substitution risk, confidence
  streak surfacing, Moment-of-the-Match presentation, animation).

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
