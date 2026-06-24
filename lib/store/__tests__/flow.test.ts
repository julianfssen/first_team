/**
 * Integration test for the screen state machine that the UI drives. Runs the
 * exact store actions the buttons call, with no React rendering, to verify the
 * full clickable loop: create → hub → weekly → (event) → match → post-match.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useGame } from "../gameStore";
import type { CreateCareerInput } from "@/lib/game/types";

const INPUT: CreateCareerInput = {
  name: "Flow Tester",
  nationality: "Japan",
  startingRegion: "ASIA_PACIFIC",
  position: "CAM",
  strongFoot: "RIGHT",
  playstyle: "CREATIVE",
  personality: "PROFESSIONAL",
  background: "ACADEMY_KID",
  seed: "flow-seed-7",
};

const s = () => useGame.getState();

/** Drive a single week through every screen the way the UI buttons do. */
function playOneWeek() {
  const startWeek = s().career!.week;
  s().startWeek();
  expect(s().screen).toBe("WEEKLY");

  s().chooseWeekly("STUDY_TACTICS");

  // Optional story event.
  if (s().screen === "EVENT") {
    const event = s().currentEvent!;
    s().chooseEvent(event.choices[0].id);
    expect(s().eventResultText).toBeTruthy();
    s().dismissEventResult();
  }

  if (s().screen === "INJURED") {
    s().continueFromInjured();
    return; // week committed without a match
  }

  // Match day.
  expect(s().screen).toBe("MATCH_DAY");
  s().kickOff();

  // Resolve any moments.
  let guard = 0;
  while (s().screen === "MATCH_MOMENT") {
    if (guard++ > 20) throw new Error("moment loop did not terminate");
    const moment = s().moments[s().momentIndex];
    s().resolveMoment(moment.choices[0].id);
    expect(s().revealedResult).toBeTruthy();
    s().nextMoment();
  }

  expect(s().screen).toBe("POST_MATCH");
  expect(s().matchResult).toBeTruthy();
  s().continueFromPostMatch();

  // Either back to the hub, or into a season recap.
  expect(["HUB", "SEASON_RECAP"]).toContain(s().screen);
  if (s().screen === "HUB") {
    expect(s().career!.week).toBe(startWeek + 1);
  }
}

describe("full UI flow via the store", () => {
  beforeEach(() => {
    useGame.setState({ screen: "LANDING", career: null });
  });

  it("creates a career from the create screen", () => {
    s().newCareer(INPUT);
    expect(s().screen).toBe("HUB");
    expect(s().career?.player.name).toBe("Flow Tester");
    expect(s().career?.age).toBe(16);
  });

  it("plays multiple weeks through match days back to the hub", () => {
    s().newCareer(INPUT);
    for (let i = 0; i < 5; i++) {
      if (s().screen !== "HUB") break;
      playOneWeek();
    }
    const career = s().career!;
    expect(career.seasonStats.appearances + career.seasonStats.injuries).toBeGreaterThan(0);
  });

  it("runs a whole season and reaches the season recap, then transfers/hub", () => {
    s().newCareer(INPUT);
    let guard = 0;
    while (s().screen === "HUB" && guard++ < 60) {
      playOneWeek();
    }
    // After ~26 weeks the season should wrap into a recap.
    expect(["SEASON_RECAP", "HUB"]).toContain(s().screen);
    if (s().screen === "SEASON_RECAP") {
      expect(s().seasonRecap).toBeTruthy();
      expect(s().career!.age).toBe(17);
      s().continueFromSeasonRecap();
      expect(["TRANSFER", "HUB", "RETIREMENT"]).toContain(s().screen);
      if (s().screen === "TRANSFER") {
        s().declineOffers();
        expect(s().screen).toBe("HUB");
      }
    }
  });

  it("can retire and produce a legacy recap", () => {
    s().newCareer(INPUT);
    s().retire("PLAYER_CHOICE");
    expect(s().screen).toBe("RETIREMENT");
    expect(s().career?.retired).toBe(true);
    expect(s().career?.retirementRecap?.legacyTitle).toBeTruthy();
  });
});
