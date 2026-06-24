"use client";

import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/lib/store/gameStore";
import { Landing } from "@/components/screens/Landing";
import { CreatePlayer } from "@/components/screens/CreatePlayer";
import { CareerHub } from "@/components/screens/CareerHub";
import { WeeklyChoice } from "@/components/screens/WeeklyChoice";
import { StoryEvent } from "@/components/screens/StoryEvent";
import { InjuredWeek } from "@/components/screens/InjuredWeek";
import { MatchDay } from "@/components/screens/MatchDay";
import { LiveMatch } from "@/components/screens/LiveMatch";
import { PostMatch } from "@/components/screens/PostMatch";
import { SeasonRecap } from "@/components/screens/SeasonRecap";
import { TransferWindow } from "@/components/screens/TransferWindow";
import { CareerTimeline } from "@/components/screens/CareerTimeline";
import { Retirement } from "@/components/screens/Retirement";

function ScreenBody() {
  const screen = useGame((s) => s.screen);
  const hasCareer = useGame((s) => s.career !== null);

  // Screens that require an active career; guard against orphaned states.
  const needsCareer = screen !== "LANDING" && screen !== "CREATE";
  if (needsCareer && !hasCareer) return <Landing />;

  switch (screen) {
    case "LANDING": return <Landing />;
    case "CREATE": return <CreatePlayer />;
    case "HUB": return <CareerHub />;
    case "WEEKLY": return <WeeklyChoice />;
    case "EVENT": return <StoryEvent />;
    case "INJURED": return <InjuredWeek />;
    case "MATCH_DAY": return <MatchDay />;
    case "LIVE_MATCH": return <LiveMatch />;
    case "POST_MATCH": return <PostMatch />;
    case "SEASON_RECAP": return <SeasonRecap />;
    case "TRANSFER": return <TransferWindow />;
    case "TIMELINE": return <CareerTimeline />;
    case "RETIREMENT": return <Retirement />;
    default: return <Landing />;
  }
}

export default function Home() {
  const screen = useGame((s) => s.screen);
  return (
    <main className="app-frame">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex flex-1 flex-col"
        >
          <ScreenBody />
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
