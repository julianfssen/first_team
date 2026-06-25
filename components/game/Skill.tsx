"use client";

import { Component, ReactNode, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import type { SkillChallenge, SkillInput } from "@/lib/game/types";
import { keeperReach } from "@/lib/game/skillEngine";
import { sfx, haptics } from "@/lib/ui/fx";
import { cx } from "@/components/ui";
import { clamp } from "@/lib/game/util";

type SceneProps = { challenge: SkillChallenge; onComplete: (input: SkillInput) => void };

/** Lazy-load the WebGL shot scene so three.js only ships when it's actually used. */
const ShotScene3D = dynamic(() => import("./ShotScene3D").then((m) => m.ShotScene3D), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-[var(--surface-2)]" />,
});

function supportsWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

/** If the 3D scene errors (or fails to load), fall back to the 2D scene. */
class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SkillChallengeView({
  challenge,
  onComplete,
  onCancel,
}: {
  challenge: SkillChallenge;
  onComplete: (input: SkillInput) => void;
  onCancel: () => void;
}) {
  const [use3D] = useState(() => supportsWebGL());

  let scene: ReactNode;
  if (challenge.flavor === "SHOT") {
    const flat = <ShotScene challenge={challenge} onComplete={onComplete} />;
    scene = use3D ? (
      <SceneBoundary fallback={flat}>
        <ShotScene3D challenge={challenge} onComplete={onComplete} />
      </SceneBoundary>
    ) : (
      flat
    );
  } else {
    scene = <TimingScene challenge={challenge} onComplete={onComplete} />;
  }

  return (
    <div className="animate-pop rounded-2xl border border-[var(--accent)]/40 bg-[var(--surface-2)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--accent)]">{challenge.label}</p>
        <button onClick={onCancel} className="text-xs text-[var(--muted)]">
          ← back
        </button>
      </div>
      <p className="mb-2 text-xs text-[var(--muted)]">{challenge.prompt}</p>
      {scene}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shot — drag back & flick
// ---------------------------------------------------------------------------

const ANCHOR = { x: 50, y: 64 };
const GOAL_Y = 19; // where the ball finishes, in the net (perspective: far away)
const GOAL_TOP = 12; // crossbar
const GOAL_LINE = 30; // front of the goal / goal line
const MOUTH_L = 28; // perspective-narrowed goal mouth (it's "far")
const MOUTH_R = 72;
const SPAN = MOUTH_R - MOUTH_L;
const AIM_RANGE = 56; // horizontal drag (svg units) to swing post-to-post
const MAX_PULL_Y = 26; // downward pull for full power
const CURL_SCALE = 10; // pull-back bow (svg units) for full curl
const BOW = 14; // visual flight bend per unit curl

/** Signed curl (-1 left .. +1 right) from how much the pull-back path bowed. */
function computeCurl(path: { x: number; y: number }[]): number {
  if (path.length < 3) return 0;
  const a = path[0];
  const b = path[path.length - 1];
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len = Math.hypot(vx, vy);
  if (len < 5) return 0;
  let dev = 0;
  for (let i = 1; i < path.length - 1; i++) {
    const p = path[i];
    const d = (vx * (p.y - a.y) - vy * (p.x - a.x)) / len; // perpendicular offset from the chord
    if (Math.abs(d) > Math.abs(dev)) dev = d;
  }
  // Pulling/hooking to the right curls the ball right-to-left (and vice versa) —
  // the natural way to think about putting curl on it.
  return Math.max(-1, Math.min(1, dev / CURL_SCALE));
}

/** Where the ball ends up after the bend (matches the engine's bent landing). */
function bentLanding(aim: number, curl: number): number {
  return Math.max(0, Math.min(1, aim + curl * 0.25));
}

/** Quadratic control point that bows a path from the ball toward (endX, endY). */
function controlPoint(endX: number, endY: number, curl: number): { x: number; y: number } {
  const dx = endX - ANCHOR.x;
  const dy = endY - ANCHOR.y;
  const L = Math.hypot(dx, dy) || 1;
  const off = curl * BOW;
  return { x: (ANCHOR.x + endX) / 2 + (-dy / L) * off, y: (ANCHOR.y + endY) / 2 + (dx / L) * off };
}

function ShotScene({ challenge, onComplete }: SceneProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [curl, setCurl] = useState(0); // live curl from the pull-back bow
  const [shot, setShot] = useState<{ crossX: number; curl: number } | null>(null);
  const [t, setT] = useState(0); // fraction of the closing window elapsed
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const fireRef = useRef<(() => void) | null>(null);

  const span = SPAN;
  const windowMs = challenge.windowMs ?? 1700;

  function toSvg(e: React.PointerEvent): { x: number; y: number } {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return ANCHOR;
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 80 };
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

  function doFire(aim: number, power: number, curl: number) {
    if (firedRef.current) return;
    firedRef.current = true;
    sfx.kick();
    haptics.light();
    const landing = MOUTH_L + bentLanding(aim, curl) * span; // where the bend takes it
    setShot({ crossX: landing, curl });
    const timing = clamp(t, 0, 1);
    window.setTimeout(() => onComplete({ value: aim, power, timing, curl }), 700);
  }
  // Keep the auto-fire closure fresh so the rAF loop fires with the latest drag
  // (a weak, central effort if you dithered until the window ran out).
  useEffect(() => {
    fireRef.current = () => {
      const c = drag ? compute(drag) : { aim: 0.5, power: 0.4, crossX: ANCHOR.x };
      doFire(c.aim, c.power, computeCurl(pathRef.current));
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
    const p = toSvg(e);
    pathRef.current = [p];
    setCurl(0);
    setDrag(p);
  }
  function onMove(e: React.PointerEvent) {
    if (shot || !drag) return;
    const p = toSvg(e);
    if (pathRef.current.length < 80) pathRef.current.push(p);
    setCurl(computeCurl(pathRef.current));
    setDrag(p);
  }
  function onUp() {
    if (shot || !drag) return;
    const c = compute(drag);
    doFire(c.aim, c.power, computeCurl(pathRef.current));
  }

  // The keeper's reach (drawn = what's scored), reacting to time + your power.
  const livePower = live?.power ?? 0.55;
  const reach = keeperReach(challenge, t, livePower);
  const bandHalf = reach * span;
  const liveCurl = drag && !shot ? curl : 0;
  const liveLandingX = live ? MOUTH_L + bentLanding(live.aim, liveCurl) * span : ANCHOR.x;
  const guideCtrl = controlPoint(liveLandingX, GOAL_Y, liveCurl);
  const flightCtrl = shot ? controlPoint(shot.crossX, GOAL_Y, shot.curl) : null;
  const ballPos = shot ? { x: shot.crossX, y: GOAL_Y } : drag ? drag : ANCHOR;
  const powerPct = Math.round((live?.power ?? 0) * 100);
  const clockPct = Math.max(0, (1 - t) * 100);

  return (
    <div className="select-none">
      <svg
        ref={svgRef}
        viewBox="0 0 100 80"
        className="w-full touch-none rounded-xl bg-gradient-to-b from-[#08160e] to-[#0c2a18]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        {/* pitch receding to the goal (perspective) */}
        <polygon points="20,30 80,30 112,80 -12,80" fill="#0f3a22" />
        {[-12, 14, 50, 86, 112].map((xb, i) => (
          <line key={`s${i}`} x1={xb} y1="80" x2={50 + (xb - 50) * 0.2} y2="30" stroke="#ffffff" strokeWidth="0.3" opacity="0.06" />
        ))}
        {[42, 56, 70].map((y) => (
          <line key={`b${y}`} x1={50 - (y - 30) * 1.7} y1={y} x2={50 + (y - 30) * 1.7} y2={y} stroke="#ffffff" strokeWidth="0.3" opacity="0.05" />
        ))}

        {/* goal: net backing + grid */}
        <rect x={MOUTH_L} y={GOAL_TOP} width={SPAN} height={GOAL_LINE - GOAL_TOP} fill="#0a1a12" opacity="0.55" />
        {[36, 44, 52, 60].map((x) => (
          <line key={`nv${x}`} x1={x} y1={GOAL_TOP} x2={x} y2={GOAL_LINE} stroke="#ffffff" strokeWidth="0.25" opacity="0.12" />
        ))}
        {[16, 20, 24, 28].map((y) => (
          <line key={`nh${y}`} x1={MOUTH_L} y1={y} x2={MOUTH_R} y2={y} stroke="#ffffff" strokeWidth="0.25" opacity="0.12" />
        ))}

        {/* keeper's reach — the danger zone grows as the window closes */}
        <rect x={50 - bandHalf} y={GOAL_TOP + 1} width={bandHalf * 2} height={GOAL_LINE - GOAL_TOP - 1} fill="var(--danger)" opacity="0.2" />

        {/* goal frame (crossbar emphasised — too much power sails over) */}
        <line x1={MOUTH_L} y1={GOAL_TOP} x2={MOUTH_R} y2={GOAL_TOP} stroke="#e8edf4" strokeWidth="1.6" />
        <line x1={MOUTH_L} y1={GOAL_TOP} x2={MOUTH_L} y2={GOAL_LINE} stroke="#e8edf4" strokeWidth="1.4" />
        <line x1={MOUTH_R} y1={GOAL_TOP} x2={MOUTH_R} y2={GOAL_LINE} stroke="#e8edf4" strokeWidth="1.4" />

        {/* keeper */}
        <motion.g
          animate={shot ? { x: (shot.crossX - 50) * 0.6, rotate: shot.crossX < 50 ? -20 : 20 } : { x: 0, rotate: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ originX: "50px", originY: `${GOAL_LINE}px` }}
        >
          <circle cx="50" cy="20" r="2.4" fill="#fbbf24" />
          <rect x="47.6" y="22" width="4.8" height="7" rx="1.6" fill="#fbbf24" />
        </motion.g>

        {/* aim guide — bends with your hooked pull-back */}
        {live && (
          <>
            <path
              d={`M ${ANCHOR.x} ${ANCHOR.y} Q ${guideCtrl.x} ${guideCtrl.y} ${liveLandingX} ${GOAL_Y}`}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.85"
            />
            <circle cx={liveLandingX} cy={GOAL_Y} r="1.6" fill="var(--accent)" />
          </>
        )}

        {/* ground shadow — stays on the pitch as the ball rises and flies away */}
        <motion.ellipse
          fill="#000000"
          animate={
            shot && flightCtrl
              ? {
                  cx: [ANCHOR.x, flightCtrl.x, shot.crossX],
                  cy: [ANCHOR.y, (ANCHOR.y + GOAL_LINE) / 2, GOAL_LINE],
                  rx: [4.5, 3, 1.6],
                  ry: [1.6, 1, 0.6],
                  opacity: [0.32, 0.24, 0.16],
                }
              : { cx: ballPos.x, cy: ANCHOR.y, rx: 4.5, ry: 1.6, opacity: 0.3 }
          }
          transition={{ duration: shot ? 0.5 : 0, ease: "easeOut" }}
        />

        {/* ball — scales down as it flies away, curling along the bent path */}
        <motion.g
          animate={
            shot && flightCtrl
              ? { x: [ANCHOR.x, flightCtrl.x, shot.crossX], y: [ANCHOR.y, flightCtrl.y, GOAL_Y], scale: [1, 0.72, 0.46] }
              : { x: ballPos.x, y: ballPos.y, scale: 1 }
          }
          transition={{ duration: shot ? 0.5 : 0, ease: "easeOut" }}
        >
          <circle r="3.4" fill="#ffffff" stroke="#0c1f14" strokeWidth="0.5" />
        </motion.g>
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
        {shot ? "Struck!" : "Pull back for power, steer to aim — hook the pull to curl it round the keeper"}
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
