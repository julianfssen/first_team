// @vitest-environment jsdom
/**
 * DOM smoke tests: confirm key screens actually mount in a browser-like
 * environment and that their handlers drive the store (catches client-runtime
 * errors that SSR build checks miss).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Landing } from "@/components/screens/Landing";
import { CreatePlayer } from "@/components/screens/CreatePlayer";
import { CareerHub } from "@/components/screens/CareerHub";
import { LiveMatch } from "@/components/screens/LiveMatch";
import { Practice } from "@/components/screens/Practice";
import { SkillChallengeView } from "@/components/game/Skill";
import { generateMatchContext } from "@/lib/game/matchEngine";
import { useGame } from "@/lib/store/gameStore";

beforeEach(() => useGame.setState({ screen: "LANDING", career: null }));
afterEach(() => cleanup());

describe("screen rendering", () => {
  it("renders the landing screen", () => {
    render(<Landing />);
    expect(screen.getByText("TEAM")).toBeTruthy();
    expect(screen.getByText("New Career")).toBeTruthy();
  });

  it("creates a player through the create screen and lands in the hub", () => {
    render(<CreatePlayer />);
    expect(screen.getByText("Create Your Footballer")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Player name"), {
      target: { value: "Render Tester" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Nationality/), {
      target: { value: "Brazil" },
    });
    fireEvent.click(screen.getByText("Start Career"));

    expect(useGame.getState().screen).toBe("HUB");
    expect(useGame.getState().career?.player.name).toBe("Render Tester");
  });

  it("renders the career hub for an active career", () => {
    useGame.getState().newCareer({
      name: "Hub Tester",
      nationality: "Spain",
      startingRegion: "EUROPE",
      position: "GK",
      strongFoot: "RIGHT",
      playstyle: "BALANCED",
      personality: "LOYAL",
      background: "ACADEMY_KID",
      seed: "render-seed-1",
    });
    render(<CareerHub />);
    expect(screen.getByText("Hub Tester")).toBeTruthy();
    expect(screen.getByText(/Continue/)).toBeTruthy();
    // Goalkeeper-specific stat should appear.
    expect(screen.getByText("Clean Sheets")).toBeTruthy();
  });

  it("renders the live match HUD without streaming yet", () => {
    vi.useFakeTimers(); // freeze the auto-advance timer so we can assert the initial state
    try {
      useGame.getState().newCareer({
        name: "Live Tester",
        nationality: "Argentina",
        startingRegion: "SOUTH_AMERICA",
        position: "RW",
        strongFoot: "LEFT",
        playstyle: "TECHNICAL",
        personality: "FLASHY",
        background: "STREET_FOOTBALLER",
        seed: "live-seed-1",
      });
      const ctx = generateMatchContext(useGame.getState().career!);
      useGame.setState({ matchContext: ctx });
      useGame.getState().kickOff();
      expect(useGame.getState().screen).toBe("LIVE_MATCH");

      render(<LiveMatch />);
      expect(screen.getByText(ctx.opponentName)).toBeTruthy();
      expect(screen.getByText("0–0")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shot scene mounts with its aim/power UI", () => {
    render(
      <SkillChallengeView
        challenge={{ kind: "AIM", flavor: "SHOT", forgiveness: 0.8, label: "Strike!", prompt: "p", reachBase: 0.18, reachGrow: 0.18, powerFloor: 0.25, windowMs: 1700 }}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Strike!")).toBeTruthy();
    expect(screen.getByText("Power")).toBeTruthy();
  });

  it("timing scene reports a value when committed", () => {
    vi.useFakeTimers();
    try {
      const onComplete = vi.fn();
      render(
        <SkillChallengeView
          challenge={{ kind: "TIMING", flavor: "TACKLE", forgiveness: 0.6, label: "Time the tackle", prompt: "p", sweetCenter: 0.5, sweetWidth: 0.3 }}
          onComplete={onComplete}
          onCancel={() => {}}
        />,
      );
      fireEvent.click(screen.getByText("SLIDE!"));
      vi.advanceTimersByTime(700);
      expect(onComplete).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the shot practice screen", () => {
    vi.useFakeTimers();
    try {
      useGame.getState().newCareer({
        name: "Practice Tester",
        nationality: "Brazil",
        startingRegion: "SOUTH_AMERICA",
        position: "ST",
        strongFoot: "RIGHT",
        playstyle: "CLINICAL",
        personality: "AMBITIOUS",
        background: "ACADEMY_KID",
        seed: "practice-seed-1",
      });
      render(<Practice />);
      expect(screen.getByText("Shot Practice")).toBeTruthy();
      expect(screen.getByText("Elite (88)")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("through-ball scene uses a play-it action", () => {
    render(
      <SkillChallengeView
        challenge={{ kind: "RUN", flavor: "THROUGH_BALL", forgiveness: 0.6, label: "Lead the run", prompt: "p", sweetCenter: 0.5, sweetWidth: 0.3 }}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("PLAY IT!")).toBeTruthy();
  });
});
