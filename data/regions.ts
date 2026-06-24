import type { Region, RegionIdentity } from "@/lib/game/types";

export const REGIONS: Record<Region, RegionIdentity> = {
  EUROPE: {
    id: "EUROPE",
    name: "Europe",
    blurb:
      "Highest prestige, toughest competition, elite trophies and relentless media pressure.",
    prestige: 95,
    difficulty: 92,
    wageLevel: 90,
    mediaPressure: 90,
  },
  ASIA_PACIFIC: {
    id: "ASIA_PACIFIC",
    name: "Asia-Pacific",
    blurb:
      "A strong starting path — Southeast Asian leagues, Japan/Korea-style football and Australian clubs.",
    prestige: 60,
    difficulty: 58,
    wageLevel: 55,
    mediaPressure: 55,
  },
  MIDDLE_EAST_GULF: {
    id: "MIDDLE_EAST_GULF",
    name: "Middle East & Gulf",
    blurb:
      "High wages and ambitious projects. Where money meets legacy decisions late in a career.",
    prestige: 62,
    difficulty: 55,
    wageLevel: 95,
    mediaPressure: 60,
  },
  SOUTH_AMERICA: {
    id: "SOUTH_AMERICA",
    name: "South America",
    blurb:
      "Passionate football culture, raw technical talent and a pipeline that funnels stars to Europe.",
    prestige: 72,
    difficulty: 74,
    wageLevel: 50,
    mediaPressure: 75,
  },
  NORTH_AMERICA: {
    id: "NORTH_AMERICA",
    name: "North America",
    blurb:
      "A franchise-style league with growing prestige — good for lifestyle, mid-career and veteran moves.",
    prestige: 58,
    difficulty: 55,
    wageLevel: 70,
    mediaPressure: 50,
  },
  CENTRAL_AMERICA_CARIBBEAN: {
    id: "CENTRAL_AMERICA_CARIBBEAN",
    name: "Central America & Caribbean",
    blurb:
      "Underdog national-team stories and a gateway to Mexico, the USA, South America and Europe.",
    prestige: 45,
    difficulty: 48,
    wageLevel: 38,
    mediaPressure: 45,
  },
  AFRICA: {
    id: "AFRICA",
    name: "Africa",
    blurb:
      "Academy pipelines and raw talent, strong national-team narratives and a springboard to Europe.",
    prestige: 55,
    difficulty: 60,
    wageLevel: 42,
    mediaPressure: 55,
  },
  OCEANIA: {
    id: "OCEANIA",
    name: "Oceania",
    blurb:
      "A smaller ecosystem across Australia, New Zealand and the Pacific — an underdog route to Asia and Europe.",
    prestige: 40,
    difficulty: 42,
    wageLevel: 40,
    mediaPressure: 38,
  },
  INTERNATIONAL_GLOBAL: {
    id: "INTERNATIONAL_GLOBAL",
    name: "International",
    blurb:
      "National-team tournaments, continental cups, world tournaments and global awards.",
    prestige: 100,
    difficulty: 95,
    wageLevel: 0,
    mediaPressure: 100,
  },
};

/** Regions a player can start a club career in (excludes the international meta-region). */
export const PLAYABLE_REGIONS: Region[] = [
  "EUROPE",
  "ASIA_PACIFIC",
  "MIDDLE_EAST_GULF",
  "SOUTH_AMERICA",
  "NORTH_AMERICA",
  "CENTRAL_AMERICA_CARIBBEAN",
  "AFRICA",
  "OCEANIA",
];

export function regionIdentity(region: Region): RegionIdentity {
  return REGIONS[region];
}
