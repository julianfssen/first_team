/**
 * Lookups over the static world data (clubs, leagues, regions).
 */

import type { Club, League, Region } from "./types";
import { CLUBS } from "@/data/clubs";
import { LEAGUES } from "@/data/leagues";

const CLUB_BY_ID = new Map<string, Club>(CLUBS.map((c) => [c.id, c]));
const LEAGUE_BY_ID = new Map<string, League>(LEAGUES.map((l) => [l.id, l]));

export function getClub(id: string): Club | undefined {
  return CLUB_BY_ID.get(id);
}

export function getLeague(id: string): League | undefined {
  return LEAGUE_BY_ID.get(id);
}

export function leagueForClub(club: Club): League | undefined {
  return LEAGUE_BY_ID.get(club.leagueId);
}

export function clubsInRegion(region: Region): Club[] {
  return CLUBS.filter((c) => c.region === region);
}

export function allClubs(): Club[] {
  return CLUBS;
}

/** Display helper: "Club Name (Country)". */
export function clubLabel(id: string): string {
  const club = CLUB_BY_ID.get(id);
  return club ? club.name : "Free Agent";
}
