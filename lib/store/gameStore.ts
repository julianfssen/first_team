"use client";

/**
 * Game store: the bridge between pure engine functions and the React UI.
 *
 * Screen state machine:
 *   LANDING → CREATE → HUB → WEEKLY → (EVENT) → MATCH_DAY → LIVE_MATCH
 *           → POST_MATCH → (SEASON_RECAP → TRANSFER) → HUB ... → RETIREMENT
 *
 * The match is the "Living Match": LIVE_MATCH streams beats from the simulator
 * (advanceOne) and pauses for player decisions (resolveLiveChoice).
 */

import { create } from "zustand";
import type {
  Career,
  CareerEvent,
  CreateCareerInput,
  MatchBeat,
  MatchContext,
  MatchResult,
  MatchState,
  RetirementReason,
  SeasonRecap,
  TransferOffer,
  WeeklyChoiceId,
} from "@/lib/game/types";
import { createCareer } from "@/lib/game/createCareer";
import { advanceWeek } from "@/lib/game/weeklyEngine";
import { generateCareerEvent, applyEventChoice } from "@/lib/game/eventEngine";
import { generateMatchContext, applyMatchResult, commitWeek } from "@/lib/game/matchEngine";
import {
  startMatch,
  advanceMatch,
  resolvePlayerBeat,
  finalizeMatch,
} from "@/lib/game/matchSimEngine";
import { finishSeason } from "@/lib/game/seasonEngine";
import {
  generateTransferOffers,
  acceptTransferOffer,
  rejectTransferOffers,
} from "@/lib/game/transferEngine";
import { isForcedRetirement } from "@/lib/game/careerEngine";
import { retireCareer } from "@/lib/game/retirementEngine";
import { autosave, getSave, saveToSlot } from "@/lib/game/saveEngine";
import { pushTimeline } from "@/lib/game/timeline";

export type Screen =
  | "LANDING"
  | "CREATE"
  | "HUB"
  | "WEEKLY"
  | "EVENT"
  | "INJURED"
  | "MATCH_DAY"
  | "LIVE_MATCH"
  | "POST_MATCH"
  | "SEASON_RECAP"
  | "TRANSFER"
  | "TIMELINE"
  | "RETIREMENT";

interface GameState {
  screen: Screen;
  career: Career | null;

  weekLog: string[];
  pendingMatch: boolean;
  currentEvent: CareerEvent | null;
  eventResultText: string | null;
  matchContext: MatchContext | null;

  // Live match.
  matchState: MatchState | null;
  feed: MatchBeat[];
  awaitingChoice: boolean;
  matchOver: boolean;
  matchResult: MatchResult | null;

  seasonRecap: SeasonRecap | null;
  transferOffers: TransferOffer[];

  setScreen: (screen: Screen) => void;
  goHub: () => void;

  newCareer: (input: CreateCareerInput) => void;
  loadSlot: (id: string) => void;
  saveManual: (slotIndex: number) => void;

  startWeek: () => void;
  chooseWeekly: (choiceId: WeeklyChoiceId) => void;
  chooseEvent: (choiceId: string) => void;
  dismissEventResult: () => void;
  continueFromInjured: () => void;

  kickOff: () => void;
  advanceOne: () => void;
  resolveLiveChoice: (choiceId: string) => void;
  finishLiveMatch: () => void;
  continueFromPostMatch: () => void;

  continueFromSeasonRecap: () => void;
  acceptOffer: (offer: TransferOffer) => void;
  declineOffers: () => void;
  retire: (reason: RetirementReason) => void;
}

const TRANSIENT_RESET: Pick<
  GameState,
  | "weekLog"
  | "pendingMatch"
  | "currentEvent"
  | "eventResultText"
  | "matchContext"
  | "matchState"
  | "feed"
  | "awaitingChoice"
  | "matchOver"
  | "matchResult"
> = {
  weekLog: [],
  pendingMatch: false,
  currentEvent: null,
  eventResultText: null,
  matchContext: null,
  matchState: null,
  feed: [],
  awaitingChoice: false,
  matchOver: false,
  matchResult: null,
};

export const useGame = create<GameState>((set, get) => {
  function commitAndRoute(career: Career) {
    const { career: next, seasonComplete } = commitWeek(career);
    if (seasonComplete) {
      const recap = finishSeason(next);
      autosave(recap.career);
      set({ career: recap.career, seasonRecap: recap, screen: "SEASON_RECAP", ...TRANSIENT_RESET });
    } else {
      autosave(next);
      set({ career: next, screen: "HUB", ...TRANSIENT_RESET });
    }
  }

  function proceedAfterEvent() {
    const { pendingMatch, career } = get();
    if (!career) return;
    if (!pendingMatch) {
      set({ screen: "INJURED" });
      return;
    }
    const ctx = generateMatchContext(career);
    set({ matchContext: ctx, currentEvent: null, eventResultText: null, screen: "MATCH_DAY" });
  }

  return {
    screen: "LANDING",
    career: null,
    ...TRANSIENT_RESET,
    seasonRecap: null,
    transferOffers: [],

    setScreen: (screen) => set({ screen }),
    goHub: () => set({ screen: "HUB", seasonRecap: null, transferOffers: [] }),

    newCareer: (input) => {
      const career = createCareer(input);
      autosave(career);
      set({ career, screen: "HUB", seasonRecap: null, transferOffers: [], ...TRANSIENT_RESET });
    },

    loadSlot: (id) => {
      const slot = getSave(id);
      if (!slot) return;
      set({
        career: slot.career,
        screen: slot.career.retired ? "RETIREMENT" : "HUB",
        seasonRecap: null,
        transferOffers: [],
        ...TRANSIENT_RESET,
      });
    },

    saveManual: (slotIndex) => {
      const { career } = get();
      if (career) saveToSlot(slotIndex, career);
    },

    startWeek: () => set({ screen: "WEEKLY", weekLog: [] }),

    chooseWeekly: (choiceId) => {
      const { career } = get();
      if (!career) return;
      const wk = advanceWeek(career, choiceId);
      const event = generateCareerEvent(wk.career);
      set({
        career: wk.career,
        weekLog: wk.log,
        pendingMatch: wk.hadMatch,
        currentEvent: event,
        eventResultText: null,
      });
      if (event) set({ screen: "EVENT" });
      else proceedAfterEvent();
    },

    chooseEvent: (choiceId) => {
      const { career, currentEvent } = get();
      if (!career || !currentEvent) return;
      const updated = applyEventChoice(career, currentEvent, choiceId);
      const choice = currentEvent.choices.find((c) => c.id === choiceId);
      set({ career: updated, eventResultText: choice?.resultText ?? "Decision made." });
    },

    dismissEventResult: () => proceedAfterEvent(),

    continueFromInjured: () => {
      const { career } = get();
      if (career) commitAndRoute(career);
    },

    kickOff: () => {
      const { career, matchContext } = get();
      if (!career || !matchContext) return;
      const matchState = startMatch(career, matchContext);
      set({ matchState, feed: [], awaitingChoice: false, matchOver: false, screen: "LIVE_MATCH" });
    },

    advanceOne: () => {
      const { career, matchState, awaitingChoice, matchOver } = get();
      if (!career || !matchState || awaitingChoice || matchOver) return;
      const { state, beat } = advanceMatch(career, matchState);
      set({
        matchState: state,
        feed: [...get().feed, beat],
        awaitingChoice: beat.kind === "PLAYER",
        matchOver: beat.kind === "FULL_TIME",
      });
    },

    resolveLiveChoice: (choiceId) => {
      const { career, matchState } = get();
      if (!career || !matchState) return;
      const { state, beat } = resolvePlayerBeat(career, matchState, choiceId);
      set({ matchState: state, feed: [...get().feed, beat], awaitingChoice: false });
    },

    finishLiveMatch: () => {
      const { career, matchState } = get();
      if (!career || !matchState) return;
      const result = finalizeMatch(career, matchState);
      const updated = applyMatchResult(career, result);
      set({ career: updated, matchResult: result, screen: "POST_MATCH" });
    },

    continueFromPostMatch: () => {
      const { career } = get();
      if (career) commitAndRoute(career);
    },

    continueFromSeasonRecap: () => {
      const { career } = get();
      if (!career) return;
      if (isForcedRetirement(career)) {
        get().retire("FORCED_AGE");
        return;
      }
      const offers = generateTransferOffers(career);
      if (offers.length > 0) {
        set({ transferOffers: offers, screen: "TRANSFER", seasonRecap: null });
      } else {
        set({ screen: "HUB", seasonRecap: null });
      }
    },

    acceptOffer: (offer) => {
      const { career } = get();
      if (!career) return;
      const updated = acceptTransferOffer(career, offer);
      autosave(updated);
      set({ career: updated, screen: "HUB", transferOffers: [], seasonRecap: null });
    },

    declineOffers: () => {
      const { career } = get();
      if (!career) return;
      const updated = rejectTransferOffers(career);
      autosave(updated);
      set({ career: updated, screen: "HUB", transferOffers: [], seasonRecap: null });
    },

    retire: (reason) => {
      const { career } = get();
      if (!career) return;
      const recap = retireCareer(career, reason);
      const c = structuredClone(career);
      c.retired = true;
      c.retirementRecap = recap;
      pushTimeline(c, "RETIREMENT", `Retired from football — ${recap.legacyTitle}.`);
      autosave(c);
      set({ career: c, screen: "RETIREMENT", seasonRecap: null, transferOffers: [] });
    },
  };
});
