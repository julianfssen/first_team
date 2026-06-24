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

  it("AIM skill mini-game reports the tapped zone", () => {
    const onComplete = vi.fn();
    render(
      <SkillChallengeView
        challenge={{ kind: "AIM", forgiveness: 0.9, label: "Pick your spot", prompt: "p", zones: 5, keeperZones: [2] }}
        onComplete={onComplete}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getAllByLabelText("corner")[0]);
    expect(onComplete).toHaveBeenCalledWith({ value: 0 });
  });

  it("TIMING skill mini-game reports a value on STOP", () => {
    const onComplete = vi.fn();
    render(
      <SkillChallengeView
        challenge={{ kind: "TIMING", forgiveness: 0.6, label: "Time it", prompt: "p", sweetCenter: 0.5, sweetWidth: 0.3 }}
        onComplete={onComplete}
        onCancel={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("STOP"));
    expect(onComplete).toHaveBeenCalled();
  });
});
