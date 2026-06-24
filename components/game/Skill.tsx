"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { SkillChallenge, SkillInput } from "@/lib/game/types";
import { keeperReach } from "@/lib/game/skillEngine";
import { cx } from "@/components/ui";
import { clamp } from "@/lib/game/util";

type SceneProps = { challenge: SkillChallenge; onComplete: (input: SkillInput) => void };

export function SkillChallengeView({
  challenge,
  onComplete,
  onCancel,
}: {
  challenge: SkillChallenge;
  onComplete: (input: SkillInput) => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-pop rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface-2)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--accent)]">{challenge.label}</p>
        <button onClick={onCancel} className="text-xs text-[var(--muted)]">
          ← back
        </button>
      </div>
      <p className="mb-2 text-xs text-[var(--muted)]">{challenge.prompt}</p>
      {challenge.flavor === "SHOT" ? (
        <ShotScene challenge={challenge} onComplete={onComplete} />
      ) : (
        <TimingScene challenge={challenge} onComplete={onComplete} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shot — drag back & flick
// ---------------------------------------------------------------------------

const ANCHOR = { x: 50, y: 58 };
const GOAL_Y = 20;
const MOUTH_L = 12;
const MOUTH_R = 88;
const AIM_RANGE = 64; // horizontal drag (svg units) to swing post-to-post
const MAX_PULL_Y = 26; // downward pull for full power

function ShotScene({ challenge, onComplete }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [shot, setShot] = useState<{ crossX: number } | null>(null);
  const [t, setT] = useState(0); // fraction of the closing window elapsed
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const fireRef = useRef<(() => void) | null>(null);

  const span = MOUTH_R - MOUTH_L;
  const windowMs = challenge.windowMs ?? 1700;

  function toSvg(e: React.PointerEvent): { x: number; y: number } {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return ANCHOR;
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 72 };
  }

  function compute(p: { x: number; y: number }): { aim: number; power: number; crossX: number } {
    // Decoupled & predictable: steer left/right to aim, pull back (down) for power.
    const dx = p.x - ANCHOR.x;
    const pullDown = Math.max(0, p.y - ANCHOR.y);
    const aim = clamp(0.5 + dx / AIM_RANGE, 0, 1);
    const power = clamp(pullDown / MAX_PULL_Y, 0, 1);
    const crossX = MOUTH_L + aim * span;
    return {
      aim: Number.isFinite(aim) ? aim : 0.5,
      power: Number.isFinite(power) ? power : 0.4,
      crossX: Number.isFinite(crossX) ? crossX : ANCHOR.x,
    };
  }

  function doFire(aim: number, power: number, crossX: number) {
    if (firedRef.current) return;
    firedRef.current = true;
    setShot({ crossX });
    const timing = clamp(t, 0, 1);
    window.setTimeout(() => onComplete({ value: aim, power, timing }), 700);
  }
  // Keep the auto-fire closure fresh so the rAF loop fires with the latest drag
  // (a weak, central effort if you dithered until the window ran out).
  useEffect(() => {
    fireRef.current = () => {
      const c = drag ? compute(drag) : { aim: 0.5, power: 0.4, crossX: ANCHOR.x };
      doFire(c.aim, c.power, c.crossX);
    };
  });

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const tt = Math.min(1, (now - startRef.current) / windowMs);
      setT(tt);
      if (tt >= 1) fireRef.current?.();
      else if (!firedRef.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [windowMs]);

  const live = drag && !shot ? compute(drag) : null;

  function onDown(e: React.PointerEvent) {
    if (shot) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag(toSvg(e));
  }
  function onMove(e: React.PointerEvent) {
    if (shot || !drag) return;
    setDrag(toSvg(e));
  }
  function onUp() {
    if (shot || !drag) return;
    const c = compute(drag);
    doFire(c.aim, c.power, c.crossX);
  }

  // The keeper's reach (drawn = what's scored), reacting to time + your power.
  const livePower = live?.power ?? 0.55;
  const reach = keeperReach(challenge, t, livePower);
  const bandHalf = reach * span;
  const ballPos = shot ? { x: shot.crossX, y: GOAL_Y } : drag ? drag : ANCHOR;
  const powerPct = Math.round((live?.power ?? 0) * 100);
  const clockPct = Math.max(0, (1 - t) * 100);

  return (
    <div className="select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 100 72"
        className="w-full touch-none rounded-xl bg-gradient-to-b from-[#0f2a1a] to-[#0c1f14]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {/* goal frame (crossbar emphasised — too much power sails over) */}
        <line x1={MOUTH_L} y1="6" x2={MOUTH_R} y2="6" stroke="#e8edf4" strokeWidth="2" />
        <line x1={MOUTH_L} y1="6" x2={MOUTH_L} y2={GOAL_Y + 6} stroke="#e8edf4" strokeWidth="1.4" />
        <line x1={MOUTH_R} y1="6" x2={MOUTH_R} y2={GOAL_Y + 6} stroke="#e8edf4" strokeWidth="1.4" />
        {[26, 40, 54, 68].map((x) => (
          <line key={x} x1={x} y1="6" x2={x} y2={GOAL_Y + 6} stroke="#ffffff" strokeWidth="0.3" opacity="0.15" />
        ))}

        {/* keeper's reach — the danger zone grows as the window closes */}
        <rect x={50 - bandHalf} y="7" width={bandHalf * 2} height={GOAL_Y + 4} fill="var(--danger)" opacity="0.2" />

        {/* keeper */}
        <motion.g
          animate={shot ? { x: (shot.crossX - 50) * 0.5, rotate: shot.crossX < 50 ? -18 : 18 } : { x: 0, rotate: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ originX: "50px", originY: `${GOAL_Y}px` }}
        >
          <circle cx="50" cy="13" r="3" fill="#fbbf24" />
          <rect x="47" y="15" width="6" height="9" rx="2" fill="#fbbf24" />
          <text x="50" y="22" fontSize="6" textAnchor="middle">🧤</text>
        </motion.g>

        {/* aim guide */}
        {live && (
          <>
            <line x1={ANCHOR.x} y1={ANCHOR.y} x2={live.crossX} y2={GOAL_Y} stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.85" />
            <circle cx={live.crossX} cy={GOAL_Y} r="1.8" fill="var(--accent)" />
          </>
        )}

        {/* ball */}
        <motion.circle
          r="3"
          fill="#ffffff"
          stroke="#0c1f14"
          strokeWidth="0.6"
          animate={{ cx: ballPos.x, cy: ballPos.y }}
          transition={{ duration: shot ? 0.45 : 0, ease: "easeOut" }}
        />
        <circle cx={ANCHOR.x} cy={ANCHOR.y} r="0.8" fill="#ffffff" opacity="0.4" />
      </svg>

      {/* shot clock */}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${clockPct}%`, backgroundColor: clockPct < 30 ? "var(--danger)" : "var(--warn)" }}
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="w-12 text-[10px] uppercase tracking-wider text-[var(--muted)]">Power</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface)]">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{ width: `${powerPct}%`, backgroundColor: powerPct > 92 ? "var(--danger)" : "var(--accent)" }}
          />
        </div>
      </div>
      <p className="mt-1 text-center text-[10px] text-[var(--muted)]">
        {shot ? "Struck!" : "Pull back for power, steer to a corner, release before the gap shuts"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timing — tackle / save / through-ball (a moving object you commit on)
// ---------------------------------------------------------------------------

const TIMING_FLAVOR: Record<string, { actor: string; mover: string; action: string; track: string }> = {
  TACKLE: { actor: "🛡️", mover: "⚽", action: "SLIDE!", track: "Win the ball as it reaches your feet" },
  SAVE: { actor: "🧤", mover: "⚽", action: "DIVE!", track: "Commit as the shot comes in" },
  THROUGH_BALL: { actor: "🅿️", mover: "🏃", action: "PLAY IT!", track: "Release as the runner hits the gap" },
};

function TimingScene({ challenge, onComplete }: SceneProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const [committed, setCommitted] = useState(false);

  const center = challenge.sweetCenter ?? 0.5;
  const width = challenge.sweetWidth ?? 0.25;
  const greenLeft = clamp(center - width / 2, 0, 1) * 100;
  const greenW = clamp(width, 0, 1) * 100;
  const dur = 1.6 - challenge.forgiveness * 0.5; // easier → slower sweep
  const f = TIMING_FLAVOR[challenge.flavor] ?? TIMING_FLAVOR.TACKLE;

  function commit() {
    if (committed) return;
    const track = trackRef.current;
    const mover = moverRef.current;
    let value = 0.5;
    if (track && mover) {
      const t = track.getBoundingClientRect();
      const m = mover.getBoundingClientRect();
      if (t.width) value = clamp((m.left + m.width / 2 - t.left) / t.width, 0, 1);
    }
    setCommitted(true);
    window.setTimeout(() => onComplete({ value }), 550);
  }

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        className="relative mb-3 h-16 overflow-hidden rounded-xl bg-gradient-to-b from-[#0f2a1a] to-[#0c1f14]"
      >
        {/* sweet window */}
        <div
          className="absolute top-0 h-full"
          style={{ left: `${greenLeft}%`, width: `${greenW}%`, backgroundColor: "color-mix(in oklab, var(--accent) 22%, transparent)" }}
        />
        {/* the actor sits at the sweet zone */}
        <div
          className="absolute top-1/2 -translate-y-1/2 text-2xl"
          style={{ left: `calc(${center * 100}% - 0.6rem)` }}
        >
          {f.actor}
        </div>
        {/* the moving object */}
        <div
          ref={moverRef}
          className={cx("absolute top-1/2 -ml-3 -translate-y-1/2 text-2xl", committed ? "" : "skill-marker")}
          style={{ ["--sweep-dur" as string]: `${dur}s` }}
        >
          {f.mover}
        </div>
        {/* ground line */}
        <div className="absolute bottom-2 left-0 h-px w-full bg-white/10" />
      </div>
      <button
        onClick={commit}
        disabled={committed}
        className="w-full rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-[#06281b] transition active:scale-[0.98] disabled:opacity-50"
      >
        {committed ? "…" : f.action}
      </button>
      <p className="mt-1 text-center text-[10px] text-[var(--muted)]">{f.track}</p>
    </div>
  );
}
