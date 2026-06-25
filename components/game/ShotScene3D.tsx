"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";

const OUTLINE = { thickness: 0.06, color: "#0a0f14" } as const;
function Ink() {
  return <Outlines thickness={OUTLINE.thickness} color={OUTLINE.color} />;
}
import type { SkillChallenge, SkillInput } from "@/lib/game/types";
import { sfx, haptics } from "@/lib/ui/fx";
import { rng } from "@/lib/game/rng";
import { clamp } from "@/lib/game/util";

// --- input math (mirrors the 2D ShotScene so both feel identical) ---
const ANCHOR = { x: 50, y: 64 };
const AIM_RANGE = 56;
const MAX_PULL_Y = 26;
const CURL_SCALE = 10;

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
    const d = (vx * (p.y - a.y) - vy * (p.x - a.x)) / len;
    if (Math.abs(d) > Math.abs(dev)) dev = d;
  }
  return clamp(dev / CURL_SCALE, -1, 1);
}
function aimPower(p: { x: number; y: number }): { aim: number; power: number } {
  const dx = p.x - ANCHOR.x;
  const pull = Math.max(0, p.y - ANCHOR.y);
  return {
    aim: clamp(0.5 + dx / AIM_RANGE, 0, 1),
    power: clamp(pull / MAX_PULL_Y, 0, 1),
  };
}
function bentLanding(aim: number, curl: number): number {
  return clamp(aim + curl * 0.25, 0, 1);
}

// --- 3D field constants (metres) ---
const GOAL_W = 7.32;
const GOAL_H = 2.44;
const BALL_R = 0.26;
const START_Z = 9;
const FLIGHT_MS = 780;
const BOW3D = 2.6; // lateral swerve from curl (visible from the elevated camera)
const ARC = 1.15; // flight height

type Shot = { aim: number; power: number; curl: number; fireAt: number };

function landingX(aim: number, curl: number): number {
  return (bentLanding(aim, curl) - 0.5) * GOAL_W;
}

// easing — the difference between robotic (linear) and lively motion
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function Pitch() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 2]}>
        <planeGeometry args={[80, 80]} />
        <meshToonMaterial color="#2a9d54" />
      </mesh>
      {[-4, -1, 2, 5, 8].map((z, i) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.01, z]}>
          <planeGeometry args={[80, 1.8]} />
          <meshToonMaterial color={i % 2 ? "#249049" : "#31b063"} />
        </mesh>
      ))}
    </group>
  );
}

function Goal() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[-GOAL_W / 2, GOAL_H / 2, 0]}>
        <cylinderGeometry args={[0.09, 0.09, GOAL_H, 10]} />
        <meshToonMaterial color="#f4f7fa" />
        <Ink />
      </mesh>
      <mesh position={[GOAL_W / 2, GOAL_H / 2, 0]}>
        <cylinderGeometry args={[0.09, 0.09, GOAL_H, 10]} />
        <meshToonMaterial color="#f4f7fa" />
        <Ink />
      </mesh>
      <mesh position={[0, GOAL_H, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.09, 0.09, GOAL_W + 0.18, 10]} />
        <meshToonMaterial color="#f4f7fa" />
        <Ink />
      </mesh>
      {/* net */}
      <mesh position={[0, GOAL_H / 2, -0.7]}>
        <planeGeometry args={[GOAL_W, GOAL_H]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} wireframe />
      </mesh>
    </group>
  );
}

/** A packed grandstand behind the goal — rows of little jerseys, not stars. */
const CROWD_COLS = 100;
const CROWD_ROWS = 18;
const CROWD_COUNT = CROWD_COLS * CROWD_ROWS;

function Crowd() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const fans = useMemo(() => {
    const r = rng("crowd-3d");
    const palette = [
      [0.9, 0.2, 0.22], [0.15, 0.4, 0.92], [0.96, 0.86, 0.2], [0.93, 0.94, 0.98],
      [0.2, 0.75, 0.45], [0.95, 0.5, 0.15], [0.62, 0.22, 0.72], [0.1, 0.6, 0.7],
    ];
    const out: { x: number; y: number; z: number; c: number[] }[] = [];
    for (let row = 0; row < CROWD_ROWS; row++) {
      for (let c = 0; c < CROWD_COLS; c++) {
        out.push({
          x: (c - CROWD_COLS / 2 + 0.5) * 0.3 + r.range(-0.05, 0.05),
          y: 1.1 + row * 0.36 + r.range(-0.04, 0.04),
          z: -6 - row * 0.42,
          c: r.pick(palette),
        });
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    fans.forEach((f, i) => {
      o.position.set(f.x, f.y, f.z);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, new THREE.Color(f.c[0], f.c[1], f.c[2]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [fans]);

  return (
    <group>
      {/* stand structure (concrete grey, fills behind the jerseys) */}
      <mesh position={[0, 4.2, -14]} rotation-x={0.3}>
        <planeGeometry args={[70, 22]} />
        <meshBasicMaterial color="#2b3340" />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, CROWD_COUNT]}>
        <boxGeometry args={[0.26, 0.32, 0.08]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Keeper({ shot }: { shot: Shot | null }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    if (!shot) {
      // alive on his toes
      const tt = state.clock.elapsedTime;
      g.position.x = Math.sin(tt * 1.7) * 0.08;
      g.position.y = Math.abs(Math.sin(tt * 3.2)) * 0.04;
      g.rotation.z = Math.sin(tt * 1.7) * 0.05;
      return;
    }
    const p = clamp((performance.now() - shot.fireAt) / FLIGHT_MS, 0, 1);
    const end = landingX(shot.aim, shot.curl);
    // react, then commit a smooth dive across most of the flight (no robotic snap)
    const dp = easeOutCubic(clamp((p - 0.12) / 0.65, 0, 1));
    g.position.x = end * 0.6 * dp;
    g.position.y = -0.28 * Math.sin(Math.PI * clamp((p - 0.12) / 0.8, 0, 1));
    g.rotation.z = -Math.sign(end || 1) * 1.05 * dp;
  });
  return (
    <group ref={ref} position={[0, 0, 0.3]}>
      {/* legs */}
      <mesh position={[-0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.13, 0.34, 4, 8]} />
        <meshToonMaterial color="#1b3a8a" />
        <Ink />
      </mesh>
      <mesh position={[0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.13, 0.34, 4, 8]} />
        <meshToonMaterial color="#1b3a8a" />
        <Ink />
      </mesh>
      {/* body */}
      <mesh position={[0, 1.0, 0]}>
        <capsuleGeometry args={[0.32, 0.55, 4, 12]} />
        <meshToonMaterial color="#fbbf24" />
        <Ink />
      </mesh>
      {/* head (overlaps the body — no gap) */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.3, 18, 18]} />
        <meshToonMaterial color="#e8b48a" />
        <Ink />
      </mesh>
      {/* raised arms + gloves */}
      <mesh position={[-0.36, 1.36, 0.04]} rotation-z={0.8}>
        <capsuleGeometry args={[0.1, 0.46, 4, 8]} />
        <meshToonMaterial color="#fbbf24" />
        <Ink />
      </mesh>
      <mesh position={[0.36, 1.36, 0.04]} rotation-z={-0.8}>
        <capsuleGeometry args={[0.1, 0.46, 4, 8]} />
        <meshToonMaterial color="#fbbf24" />
        <Ink />
      </mesh>
      <mesh position={[-0.58, 1.64, 0.06]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshToonMaterial color="#eef4f8" />
        <Ink />
      </mesh>
      <mesh position={[0.58, 1.64, 0.06]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshToonMaterial color="#eef4f8" />
        <Ink />
      </mesh>
    </group>
  );
}

/** The shooter, foreground, seen from behind — swings a leg through on the strike. */
function Striker({ shot }: { shot: Shot | null }) {
  const bodyRef = useRef<THREE.Group>(null);
  const legRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const b = bodyRef.current;
    const l = legRef.current;
    if (!b || !l) return;
    if (!shot) {
      const tt = state.clock.elapsedTime; // gentle idle
      b.rotation.x = Math.sin(tt * 2) * 0.03;
      l.rotation.x = -0.15 + Math.sin(tt * 2) * 0.06;
      return;
    }
    const k = clamp((performance.now() - shot.fireAt) / 360, 0, 1);
    if (k < 0.32) {
      const w = easeOutCubic(k / 0.32); // plant + wind the leg back, lean back
      l.rotation.x = -0.15 + w * 0.95;
      b.rotation.x = -w * 0.14;
    } else {
      const s = easeInOutCubic((k - 0.32) / 0.68); // snap through + follow-through lean
      l.rotation.x = 0.8 - s * 2.5;
      b.rotation.x = -0.14 + s * 0.32;
    }
  });
  return (
    <group ref={bodyRef} position={[-0.95, 0, 9.9]}>
      {/* standing leg */}
      <mesh position={[0.16, 0.3, 0]}>
        <capsuleGeometry args={[0.13, 0.4, 4, 8]} />
        <meshToonMaterial color="#1f2937" />
        <Ink />
      </mesh>
      {/* kicking leg (pivots at the hip) */}
      <group ref={legRef} position={[-0.12, 0.74, 0]}>
        <mesh position={[0, -0.3, 0.02]}>
          <capsuleGeometry args={[0.13, 0.4, 4, 8]} />
          <meshToonMaterial color="#1f2937" />
          <Ink />
        </mesh>
      </group>
      {/* body */}
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.3, 0.55, 4, 12]} />
        <meshToonMaterial color="#2bd4a8" />
        <Ink />
      </mesh>
      {/* head (overlaps the body) */}
      <mesh position={[0, 1.66, 0]}>
        <sphereGeometry args={[0.28, 18, 18]} />
        <meshToonMaterial color="#e8b48a" />
        <Ink />
      </mesh>
      {/* arms hanging naturally */}
      <mesh position={[-0.3, 1.08, 0]} rotation-z={0.13}>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshToonMaterial color="#2bd4a8" />
        <Ink />
      </mesh>
      <mesh position={[0.3, 1.08, 0]} rotation-z={-0.13}>
        <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
        <meshToonMaterial color="#2bd4a8" />
        <Ink />
      </mesh>
    </group>
  );
}

function Ball({ shot }: { shot: Shot | null }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    if (!shot) {
      m.position.set(0, BALL_R, START_Z);
      return;
    }
    const p = clamp((performance.now() - shot.fireAt) / FLIGHT_MS, 0, 1);
    const end = landingX(shot.aim, shot.curl);
    m.position.set(
      end * p - shot.curl * BOW3D * Math.sin(Math.PI * p),
      BALL_R + ARC * Math.sin(Math.PI * p),
      START_Z + (-START_Z - 0.4) * p,
    );
    m.rotation.x -= 0.4;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[BALL_R, 18, 18]} />
      <meshToonMaterial color="#ffffff" />
      <Ink />
    </mesh>
  );
}

function AimMarker({ x }: { x: number }) {
  return (
    <mesh position={[x, GOAL_H * 0.5, 0]} rotation-x={Math.PI / 2}>
      <torusGeometry args={[0.3, 0.06, 8, 20]} />
      <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.6} />
    </mesh>
  );
}

/** Dotted preview of the (curving) shot path while you're aiming. */
function Trajectory({ aim, curl }: { aim: number; curl: number }) {
  const end = landingX(aim, curl);
  const dots = [];
  for (let i = 1; i <= 9; i++) {
    const p = i / 10;
    dots.push([
      end * p - curl * BOW3D * Math.sin(Math.PI * p),
      BALL_R + ARC * Math.sin(Math.PI * p),
      START_Z + (-START_Z - 0.4) * p,
    ] as const);
  }
  return (
    <>
      {dots.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.7} />
        </mesh>
      ))}
    </>
  );
}

export function ShotScene3D({ challenge, onComplete }: { challenge: SkillChallenge; onComplete: (input: SkillInput) => void }) {
  const inputRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const fireRef = useRef<(() => void) | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [curl, setCurl] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const [t, setT] = useState(0);

  const windowMs = challenge.windowMs ?? 1700;

  function toLocal(e: React.PointerEvent): { x: number; y: number } {
    const r = inputRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return ANCHOR;
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 80 };
  }

  function doFire(aim: number, power: number, c: number) {
    if (firedRef.current) return;
    firedRef.current = true;
    sfx.kick();
    haptics.light();
    setShot({ aim, power, curl: c, fireAt: performance.now() });
    const timing = clamp(t, 0, 1);
    window.setTimeout(() => onComplete({ value: aim, power, timing, curl: c }), 700);
  }
  useEffect(() => {
    fireRef.current = () => {
      const ap = drag ? aimPower(drag) : { aim: 0.5, power: 0.4 };
      doFire(ap.aim, ap.power, computeCurl(pathRef.current));
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

  const live = drag && !shot ? aimPower(drag) : null;
  const liveEnd = live ? landingX(live.aim, curl) : 0;

  function onDown(e: React.PointerEvent) {
    if (shot) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toLocal(e);
    pathRef.current = [p];
    setCurl(0);
    setDrag(p);
  }
  function onMove(e: React.PointerEvent) {
    if (shot || !drag) return;
    const p = toLocal(e);
    if (pathRef.current.length < 80) pathRef.current.push(p);
    setCurl(computeCurl(pathRef.current));
    setDrag(p);
  }
  function onUp() {
    if (shot || !drag) return;
    const ap = aimPower(drag);
    doFire(ap.aim, ap.power, computeCurl(pathRef.current));
  }

  const powerPct = Math.round((live?.power ?? 0) * 100);
  const clockPct = Math.max(0, (1 - t) * 100);

  return (
    <div className="select-none">
      <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#6fb0e0] via-[#bfe0ee] to-[#3f9b63]">
        <Canvas
          camera={{ position: [0, 5, 18], fov: 38 }}
          onCreated={({ camera }) => camera.lookAt(0, 0.6, 3)}
          dpr={[1, 2]}
        >
          <fog attach="fog" args={["#cfe6f2", 34, 66]} />
          <hemisphereLight args={["#ffffff", "#3a7d44", 0.7]} />
          <ambientLight intensity={0.75} />
          <directionalLight position={[6, 14, 8]} intensity={1.05} />
          <Crowd />
          <Pitch />
          <Goal />
          <Keeper shot={shot} />
          <Striker shot={shot} />
          <Ball shot={shot} />
          {live && (
            <>
              <Trajectory aim={live.aim} curl={curl} />
              <AimMarker x={liveEnd} />
            </>
          )}
        </Canvas>
        <div
          ref={inputRef}
          className="absolute inset-0 touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
      </div>

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
