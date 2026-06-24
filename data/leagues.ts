import type { League } from "@/lib/game/types";

/**
 * Fictional leagues for the footballer career RPG.
 *
 * Everything here is invented — no real league names. Real country names are
 * used to anchor each region. Stat values (0-100) reflect regional identity:
 * Europe is the prestige/difficulty peak, the Middle East pays the highest
 * wages, South America couples high difficulty + media with modest pay, North
 * America sits mid-table, and Oceania / Central America & Caribbean sit lowest.
 */
export const LEAGUES: League[] = [
  // ---------------------------------------------------------------------------
  // EUROPE — top + second tier
  // ---------------------------------------------------------------------------
  {
    id: "eur-premier-division",
    name: "Continental Premier Division",
    region: "EUROPE",
    country: "England",
    tier: 1,
    reputation: 96,
    difficulty: 94,
    averageWage: 92,
    mediaPressure: 95,
    scoutingVisibility: 97,
  },
  {
    id: "eur-liga-corona",
    name: "Liga Corona",
    region: "EUROPE",
    country: "Spain",
    tier: 1,
    reputation: 94,
    difficulty: 92,
    averageWage: 88,
    mediaPressure: 90,
    scoutingVisibility: 95,
  },
  {
    id: "eur-bundesklasse",
    name: "Bundesklasse",
    region: "EUROPE",
    country: "Germany",
    tier: 1,
    reputation: 92,
    difficulty: 90,
    averageWage: 86,
    mediaPressure: 87,
    scoutingVisibility: 94,
  },
  {
    id: "eur-championship-tier",
    name: "National Championship Tier",
    region: "EUROPE",
    country: "England",
    tier: 2,
    reputation: 72,
    difficulty: 74,
    averageWage: 64,
    mediaPressure: 70,
    scoutingVisibility: 78,
  },
  // ---------------------------------------------------------------------------
  // SOUTH AMERICA — top + second tier
  // ---------------------------------------------------------------------------
  {
    id: "sam-copa-primera",
    name: "Copa Primera",
    region: "SOUTH_AMERICA",
    country: "Brazil",
    tier: 1,
    reputation: 76,
    difficulty: 80,
    averageWage: 50,
    mediaPressure: 82,
    scoutingVisibility: 74,
  },
  {
    id: "sam-liga-platense",
    name: "Liga Platense",
    region: "SOUTH_AMERICA",
    country: "Argentina",
    tier: 1,
    reputation: 74,
    difficulty: 82,
    averageWage: 46,
    mediaPressure: 85,
    scoutingVisibility: 72,
  },
  {
    id: "sam-segunda-andina",
    name: "Segunda Andina",
    region: "SOUTH_AMERICA",
    country: "Colombia",
    tier: 2,
    reputation: 54,
    difficulty: 64,
    averageWage: 34,
    mediaPressure: 60,
    scoutingVisibility: 52,
  },
  // ---------------------------------------------------------------------------
  // ASIA-PACIFIC — top + second tier
  // ---------------------------------------------------------------------------
  {
    id: "asi-j-elite-league",
    name: "J-Elite League",
    region: "ASIA_PACIFIC",
    country: "Japan",
    tier: 1,
    reputation: 64,
    difficulty: 62,
    averageWage: 58,
    mediaPressure: 58,
    scoutingVisibility: 66,
  },
  {
    id: "asi-k-premier",
    name: "K Premier Circuit",
    region: "ASIA_PACIFIC",
    country: "South Korea",
    tier: 1,
    reputation: 60,
    difficulty: 60,
    averageWage: 54,
    mediaPressure: 56,
    scoutingVisibility: 62,
  },
  {
    id: "asi-second-division",
    name: "Pan-Asian Second Division",
    region: "ASIA_PACIFIC",
    country: "Thailand",
    tier: 2,
    reputation: 42,
    difficulty: 46,
    averageWage: 38,
    mediaPressure: 40,
    scoutingVisibility: 44,
  },
  // ---------------------------------------------------------------------------
  // MIDDLE EAST & GULF — high wages
  // ---------------------------------------------------------------------------
  {
    id: "mes-gulf-pro-league",
    name: "Gulf Pro League",
    region: "MIDDLE_EAST_GULF",
    country: "Saudi Arabia",
    tier: 1,
    reputation: 66,
    difficulty: 58,
    averageWage: 96,
    mediaPressure: 64,
    scoutingVisibility: 60,
  },
  {
    id: "mes-emirates-circuit",
    name: "Emirates Circuit",
    region: "MIDDLE_EAST_GULF",
    country: "United Arab Emirates",
    tier: 1,
    reputation: 60,
    difficulty: 54,
    averageWage: 90,
    mediaPressure: 58,
    scoutingVisibility: 56,
  },
  // ---------------------------------------------------------------------------
  // NORTH AMERICA — mid prestige, decent wages
  // ---------------------------------------------------------------------------
  {
    id: "nam-major-soccer-conference",
    name: "Major Soccer Conference",
    region: "NORTH_AMERICA",
    country: "United States",
    tier: 1,
    reputation: 62,
    difficulty: 56,
    averageWage: 72,
    mediaPressure: 54,
    scoutingVisibility: 64,
  },
  {
    id: "nam-liga-azteca",
    name: "Liga Azteca",
    region: "NORTH_AMERICA",
    country: "Mexico",
    tier: 1,
    reputation: 64,
    difficulty: 64,
    averageWage: 60,
    mediaPressure: 66,
    scoutingVisibility: 60,
  },
  // ---------------------------------------------------------------------------
  // AFRICA — academy pipelines, springboard to Europe
  // ---------------------------------------------------------------------------
  {
    id: "afr-premier-league",
    name: "African Premier League",
    region: "AFRICA",
    country: "Nigeria",
    tier: 1,
    reputation: 56,
    difficulty: 62,
    averageWage: 42,
    mediaPressure: 56,
    scoutingVisibility: 54,
  },
  {
    id: "afr-coupe-elite",
    name: "Coupe Elite",
    region: "AFRICA",
    country: "Morocco",
    tier: 1,
    reputation: 54,
    difficulty: 58,
    averageWage: 44,
    mediaPressure: 52,
    scoutingVisibility: 56,
  },
  // ---------------------------------------------------------------------------
  // CENTRAL AMERICA & CARIBBEAN — lower ecosystem, gateway league
  // ---------------------------------------------------------------------------
  {
    id: "cac-liga-istmo",
    name: "Liga del Istmo",
    region: "CENTRAL_AMERICA_CARIBBEAN",
    country: "Costa Rica",
    tier: 1,
    reputation: 46,
    difficulty: 50,
    averageWage: 38,
    mediaPressure: 46,
    scoutingVisibility: 44,
  },
  {
    id: "cac-caribbean-cup-league",
    name: "Caribbean Cup League",
    region: "CENTRAL_AMERICA_CARIBBEAN",
    country: "Jamaica",
    tier: 1,
    reputation: 40,
    difficulty: 44,
    averageWage: 32,
    mediaPressure: 42,
    scoutingVisibility: 40,
  },
  // ---------------------------------------------------------------------------
  // OCEANIA — smallest ecosystem, underdog route
  // ---------------------------------------------------------------------------
  {
    id: "oce-a-conference",
    name: "Oceanic A-Conference",
    region: "OCEANIA",
    country: "Australia",
    tier: 1,
    reputation: 48,
    difficulty: 46,
    averageWage: 44,
    mediaPressure: 42,
    scoutingVisibility: 48,
  },
  {
    id: "oce-island-premiership",
    name: "Island Premiership",
    region: "OCEANIA",
    country: "New Zealand",
    tier: 1,
    reputation: 38,
    difficulty: 40,
    averageWage: 36,
    mediaPressure: 36,
    scoutingVisibility: 40,
  },
];
