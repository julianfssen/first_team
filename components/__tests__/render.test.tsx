// @vitest-environment jsdom
/**
 * DOM smoke tests: confirm key screens actually mount in a browser-like
 * environment and that their handlers drive the store (catches client-runtime
 * errors that SSR build checks miss).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Landing } from "@/components/screens/Landing";
import { CreatePlayer } from "@/components/screens/CreatePlayer";
import { CareerHub } from "@/components/screens/CareerHub";
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
});
