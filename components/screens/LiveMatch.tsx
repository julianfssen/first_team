"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store/gameStore";
import type { MatchBeat, MatchMomentChoiceTemplate, MatchSituation } from "@/lib/game/types";
import { clubLabel } from "@/lib/game/world";
import { skillKindForChoice, buildSkillChallenge } from "@/lib/game/skillEngine";
import { Button, ActionBar, Pill, cx } from "@/components/ui";
import { RiskBadge } from "@/components/game/Cards";
import { SkillChallengeView } from "@/components/game/Skill";
import { GoalBanner } from "@/components/game/GoalBanner";
import { outcomeIsPositive, pretty } from "@/lib/ui/format";

/** A celebratory/grim flash for the most recent beat, if it warrants one. */
function flashFor(beat: MatchBeat | undefined): { text: string; color: string } | null {
  if (!beat) return null;
  if (beat.kind === "NARRATED" && beat.scored === "TEAM") return { text: "GOAL!", color: "var(--accent)" };
  if (beat.kind === "NARRATED" && beat.scored === "OPP") return { text: "CONCEDED", color: "var(--danger)" };
  if (beat.kind === "RESULT") {
    const o = beat.result?.outcome;
    if (o === "GOAL") return { text: "GOAL!", color: "var(--accent)" };
    if (o === "ASSIST") return { text: "ASSIST!", color: "var(--accent)" };
    if (o === "PENALTY_SAVE") return { text: "PENALTY SAVED!", color: "var(--accent)" };
    if (o === "SAVE") return { text: "SAVE!", color: "var(--accent)" };
  }
  return null;
}

function confidenceChip(matchConfidence: number): { text: string; color: string } | null {
  if (matchConfidence >= 45) return { text: "🔥 In the zone", color: "var(--accent)" };
  if (matchConfidence <= -45) return { text: "😰 Rattled", color: "var(--danger)" };
  return null;
}

function MomentumBar({ momentum }: { momentum: number }) {
  const pct = Math.abs(momentum) / 2; // 0-50% from centre
  const toYou = momentum >= 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-right text-[9px] uppercase tracking-wider text-[var(--muted)]">
        Them
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--border)]" />
        <div
          className="bar-fill absolute top-0 h-full"
          style={{
            width: `${pct}%`,
            [toYou ? "left" : "right"]: "50%",
            backgroundColor: toYou ? "var(--accent)" : "var(--danger)",
          }}
        />
      </div>
      <span className="w-12 shrink-0 text-[9px] uppercase tracking-wider text-[var(--muted)]">You</span>
    </div>
  );
}

function SituationBanner({ situation, score, minute }: { situation: MatchSituation; score: string; minute: number }) {
  if (situation === "NEUTRAL") return null;
  const map: Record<Exclude<MatchSituation, "NEUTRAL">, { text: string; color: string; icon: string }> = {
    CHASING_HARD: { text: `Chasing hard — ${minute}', ${score} down. Be brave.`, color: "var(--danger)", icon: "🔥" },
    CHASING: { text: `Chasing the game — the team needs more.`, color: "var(--warn)", icon: "⏳" },
    PROTECTING: { text: `Protecting the lead — see it out.`, color: "var(--accent)", icon: "🛡️" },
  };
  const s = map[situation];
  return (
    <div
      className="rounded-lg px-3 py-1.5 text-xs font-semibold"
      style={{ color: s.color, backgroundColor: `color-mix(in oklab, ${s.color} 14%, transparent)` }}
    >
      {s.icon} {s.text}
    </div>
  );
}

function NarratedLine({ beat }: { beat: MatchBeat }) {
  const goal = !!beat.scored;
  const color = beat.scored === "TEAM" ? "var(--accent)" : beat.scored === "OPP" ? "var(--danger)" : undefined;
  return (
    <div className="flex gap-2 py-1">
      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-[var(--muted)]">{beat.minute}&apos;</span>
      <p className={cx("text-sm", goal ? "font-bold" : "text-[var(--text)]/80")} style={color ? { color } : undefined}>
        {goal ? "⚽ " : ""}
        {beat.text}
      </p>
    </div>
  );
}

function ResultLine({ beat }: { beat: MatchBeat }) {
  if (!beat.result) return null;
  const positive = outcomeIsPositive(beat.result.outcome);
  const color = positive ? "var(--accent)" : "var(--danger)";
  return (
    <div
      className="my-1 animate-pop rounded-xl border p-3"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 10%, transparent)`,
      }}
    >
      <p className="text-sm font-bold" style={{ color }}>
        {beat.result.outcome.replace(/_/g, " ")} · {beat.result.tier}
        <span className="ml-2 text-xs font-semibold">
          ({beat.result.ratingDelta >= 0 ? "+" : ""}
          {beat.result.ratingDelta.toFixed(1)})
        </span>
      </p>
      <p className="text-sm text-[var(--text)]/80">{beat.result.narrative}</p>
      {beat.contextNote && (
        <p className="mt-1 text-xs italic text-[var(--muted)]">{beat.contextNote}</p>
      )}
    </div>
  );
}

export function LiveMatch() {
  const career = useGame((s) => s.career)!;
  const matchState = useGame((s) => s.matchState)!;
  const feed = useGame((s) => s.feed);
  const awaitingChoice = useGame((s) => s.awaitingChoice);
  const matchOver = useGame((s) => s.matchOver);
  const screen = useGame((s) => s.screen);
  const advanceOne = useGame((s) => s.advanceOne);
  const resolveLiveChoice = useGame((s) => s.resolveLiveChoice);
  const finishLiveMatch = useGame((s) => s.finishLiveMatch);

  const bottomRef = useRef<HTMLDivElement>(null);
  const [skillChoiceId, setSkillChoiceId] = useState<string | null>(null);

  function onChooseActive(choice: MatchMomentChoiceTemplate) {
    if (skillKindForChoice(choice) && buildSkillChallenge(career, matchState, choice.id)) {
      setSkillChoiceId(choice.id);
    } else {
      resolveLiveChoice(choice.id);
    }
  }

  // Stream the next beat on a timer, pausing for decisions and at full time.
  useEffect(() => {
    if (screen !== "LIVE_MATCH" || awaitingChoice || matchOver) return;
    const delay = feed.length === 0 ? 200 : 850;
    const id = setTimeout(() => advanceOne(), delay);
    return () => clearTimeout(id);
  }, [feed.length, awaitingChoice, matchOver, screen, advanceOne]);

  // Keep the latest beat in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [feed.length, awaitingChoice]);

  const ctx = matchState.context;
  const score = `${matchState.teamScore}–${matchState.oppScore}`;
  const flash = flashFor(feed[feed.length - 1]);
  const confidence = confidenceChip(matchState.matchConfidence);

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      {flash && <GoalBanner key={feed[feed.length - 1]?.id} text={flash.text} color={flash.color} />}
      {/* Sticky HUD */}
      <div className="sticky top-0 z-10 space-y-2 border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{clubLabel(career.clubId)}</span>
          <span className="shrink-0 text-2xl font-extrabold tabular-nums">{score}</span>
          <span className="min-w-0 flex-1 truncate text-right text-sm font-bold">{ctx.opponentName}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Pill>{pretty(ctx.competition)}</Pill>
          <span className="rounded-md bg-[var(--surface-2)] px-2 py-0.5 text-xs font-bold tabular-nums">
            {matchOver ? "FT" : `${matchState.minute}'`}
          </span>
          {confidence && <Pill color={confidence.color}>{confidence.text}</Pill>}
        </div>
        <MomentumBar momentum={matchState.momentum} />
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-right text-[9px] uppercase tracking-wider text-[var(--muted)]">
            🫁 {Math.round(matchState.stamina)}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="bar-fill h-full rounded-full"
              style={{
                width: `${matchState.stamina}%`,
                backgroundColor: matchState.stamina > 40 ? "var(--accent)" : "var(--danger)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="scroll-area flex-1 px-4 py-3">
        {feed.map((beat, i) => {
          if (beat.kind === "NARRATED") return <NarratedLine key={beat.id} beat={beat} />;
          if (beat.kind === "RESULT") return <ResultLine key={beat.id} beat={beat} />;
          if (beat.kind === "FULL_TIME") {
            return (
              <div key={beat.id} className="my-3 text-center text-sm font-bold uppercase tracking-widest text-[var(--muted)]">
                — Full Time —
              </div>
            );
          }
          if (beat.kind === "SUB") {
            return (
              <div key={beat.id} className="my-2 flex gap-2 rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3">
                <span className="text-sm">🔻</span>
                <p className="text-sm font-semibold text-[var(--danger)]">
                  {beat.minute}&apos; — {beat.text}
                </p>
              </div>
            );
          }
          // PLAYER beat: prompt (+ choices if it's the active decision).
          const active = awaitingChoice && i === feed.length - 1;
          const moment = beat.moment;
          if (!moment) return null;
          return (
            <div
              key={beat.id}
              className={cx(
                "my-2 rounded-2xl border bg-[var(--surface)] p-4",
                beat.continuation ? "border-[var(--accent)]/20 ml-4" : "border-[var(--accent)]/30",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold tabular-nums text-[var(--accent)]">
                  {beat.continuation ? "▸" : "⚡"} {moment.minute}&apos;
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  {beat.continuation ? "The move continues" : "Your moment"}
                </span>
              </div>
              <h3 className="text-base font-bold">{moment.title}</h3>
              <p className="mt-0.5 text-sm text-[var(--text)]/85">{moment.description}</p>
              {active && (
                <div className="mt-3 space-y-2">
                  {beat.situation && (
                    <SituationBanner situation={beat.situation} score={score} minute={moment.minute} />
                  )}
                  {skillChoiceId ? (
                    (() => {
                      const challenge = buildSkillChallenge(career, matchState, skillChoiceId);
                      if (!challenge) return null;
                      const id = skillChoiceId;
                      return (
                        <SkillChallengeView
                          challenge={challenge}
                          onComplete={(input) => {
                            setSkillChoiceId(null);
                            resolveLiveChoice(id, input);
                          }}
                          onCancel={() => setSkillChoiceId(null)}
                        />
                      );
                    })()
                  ) : (
                    moment.choices.map((choice) => {
                      const skill = skillKindForChoice(choice);
                      return (
                        <button
                          key={choice.id}
                          onClick={() => onChooseActive(choice)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left transition hover:border-[var(--accent)]/60 active:scale-[0.99]"
                        >
                          <span className="font-semibold">
                            {choice.label}
                            {skill && (
                              <span className="ml-2 text-[var(--accent)]">{skill === "AIM" ? "🎯" : "⏱"}</span>
                            )}
                          </span>
                          <RiskBadge risk={choice.risk} />
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {matchOver && (
        <ActionBar>
          <Button full onClick={finishLiveMatch}>
            See Full-Time Report
          </Button>
        </ActionBar>
      )}
    </div>
  );
}
