"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
  const post = <meshToonMaterial color="#f4f7fa" />;
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[-GOAL_W / 2, GOAL_H / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, GOAL_H, 10]} />
        {post}
      </mesh>
      <mesh position={[GOAL_W / 2, GOAL_H / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, GOAL_H, 10]} />
        {post}
      </mesh>
      <mesh position={[0, GOAL_H, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.08, 0.08, GOAL_W + 0.16, 10]} />
        {post}
      </mesh>
      {/* net */}
      <mesh position={[0, GOAL_H / 2, -0.7]}>
        <planeGeometry args={[GOAL_W, GOAL_H]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} side={THREE.DoubleSide} wireframe />
      </mesh>
    </group>
  );
}

/** Speckled crowd on a dark stand behind the goal. */
function Crowd() {
  const { pos, col } = useMemo(() => {
    const N = 800;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const palette = [
      [0.92, 0.25, 0.25], [0.22, 0.45, 0.92], [0.96, 0.85, 0.25],
      [0.92, 0.92, 0.96], [0.25, 0.82, 0.45], [0.95, 0.55, 0.2],
    ];
    const r = rng("crowd-3d"); // deterministic (pure) instead of Math.random
    for (let i = 0; i < N; i++) {
      const x = r.range(-19, 19);
      const y = 1.8 + r.float() * 7.5;
      const z = -8 - r.float() * 6 - Math.abs(x) * 0.12;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      const c = r.pick(palette);
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return { pos, col };
  }, []);
  return (
    <group>
      <mesh position={[0, 5, -12.5]} rotation-x={0.35}>
        <planeGeometry args={[48, 13]} />
        <meshBasicMaterial color="#0b1220" />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.24} vertexColors sizeAttenuation />
      </points>
    </group>
  );
}

function Keeper({ shot }: { shot: Shot | null }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    if (!shot) {
      g.position.x = 0;
      g.position.y = 0;
      g.rotation.z = 0;
      return;
    }
    const p = clamp((performance.now() - shot.fireAt) / FLIGHT_MS, 0, 1);
    const end = landingX(shot.aim, shot.curl);
    g.position.x = end * 0.5 * p;
    g.position.y = -0.2 * Math.sin(Math.PI * p);
    g.rotation.z = -Math.sign(end || 1) * 0.8 * p;
  });
  const kit = <meshToonMaterial color="#fbbf24" />;
  const dark = <meshToonMaterial color="#1b3a8a" />;
  const skin = <meshToonMaterial color="#e8b48a" />;
  const glove = <meshToonMaterial color="#eef4f8" />;
  return (
    <group ref={ref} position={[0, 0, 0.3]}>
      <mesh position={[-0.15, 0.32, 0]}>
        <capsuleGeometry args={[0.11, 0.42, 4, 8]} />
        {dark}
      </mesh>
      <mesh position={[0.15, 0.32, 0]}>
        <capsuleGeometry args={[0.11, 0.42, 4, 8]} />
        {dark}
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <capsuleGeometry args={[0.27, 0.6, 4, 10]} />
        {kit}
      </mesh>
      {/* raised arms (making himself big) + gloves */}
      <mesh position={[-0.42, 1.1, 0.05]} rotation-z={0.7}>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        {kit}
      </mesh>
      <mesh position={[0.42, 1.1, 0.05]} rotation-z={-0.7}>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        {kit}
      </mesh>
      <mesh position={[-0.66, 1.34, 0.08]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        {glove}
      </mesh>
      <mesh position={[0.66, 1.34, 0.08]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        {glove}
      </mesh>
      <mesh position={[0, 1.52, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        {skin}
      </mesh>
    </group>
  );
}

/** The shooter, foreground, seen from behind — swings a leg through on the strike. */
function Striker({ shot }: { shot: Shot | null }) {
  const legRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = legRef.current;
    if (!g) return;
    if (!shot) {
      g.rotation.x = -0.2;
      return;
    }
    const p = clamp((performance.now() - shot.fireAt) / 240, 0, 1);
    g.rotation.x = -0.2 - Math.sin(Math.PI * p) * 1.6; // wind up + swing through
  });
  const kit = <meshToonMaterial color="#2bd4a8" />;
  const dark = <meshToonMaterial color="#1f2937" />;
  const skin = <meshToonMaterial color="#e8b48a" />;
  return (
    <group position={[-0.95, 0, 9.9]}>
      <mesh position={[0.16, 0.34, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        {dark}
      </mesh>
      <group ref={legRef} position={[-0.1, 0.72, 0]}>
        <mesh position={[0, -0.32, 0.02]}>
          <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
          {dark}
        </mesh>
      </group>
      <mesh position={[0, 1.02, 0]}>
        <capsuleGeometry args={[0.24, 0.6, 4, 10]} />
        {kit}
      </mesh>
      <mesh position={[-0.32, 1.06, 0]} rotation-z={0.3}>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        {kit}
      </mesh>
      <mesh position={[0.32, 1.06, 0]} rotation-z={-0.3}>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        {kit}
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        {skin}
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
      <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-b from-[#0a1a2e] to-[#0c2a18]">
        <Canvas
          camera={{ position: [0, 5, 18], fov: 38 }}
          onCreated={({ camera }) => camera.lookAt(0, 0.6, 3)}
          dpr={[1, 2]}
        >
          <fog attach="fog" args={["#0a1424", 20, 46]} />
          <ambientLight intensity={0.85} />
          <directionalLight position={[5, 12, 8]} intensity={1.0} />
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
