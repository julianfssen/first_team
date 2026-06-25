"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SkillChallenge, SkillInput } from "@/lib/game/types";
import { sfx, haptics } from "@/lib/ui/fx";
import { clamp } from "@/lib/game/util";

// --- input math (mirrors the 2D ShotScene so both feel identical) ---
const ANCHOR = { x: 50, y: 64 };
const AIM_RANGE = 56;
const MAX_PULL_Y = 26;
const CURL_SCALE = 12;

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
const BALL_R = 0.22;
const START_Z = 9;
const FLIGHT_MS = 600;
const BOW3D = 1.3; // lateral swerve from curl
const ARC = 0.95; // flight height

type Shot = { aim: number; power: number; curl: number; fireAt: number };

function landingX(aim: number, curl: number): number {
  return (bentLanding(aim, curl) - 0.5) * GOAL_W;
}

function Pitch() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 2]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1f7a44" />
      </mesh>
      {[-2, 1, 4, 7].map((z, i) => (
        <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.01, z]}>
          <planeGeometry args={[80, 1.6]} />
          <meshStandardMaterial color={i % 2 ? "#1c6f3e" : "#23874c"} />
        </mesh>
      ))}
    </group>
  );
}

function Goal() {
  const post = <meshStandardMaterial color="#f2f5f8" />;
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[-GOAL_W / 2, GOAL_H / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, GOAL_H, 10]} />
        {post}
      </mesh>
      <mesh position={[GOAL_W / 2, GOAL_H / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.07, GOAL_H, 10]} />
        {post}
      </mesh>
      <mesh position={[0, GOAL_H, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.07, 0.07, GOAL_W + 0.14, 10]} />
        {post}
      </mesh>
      {/* net */}
      <mesh position={[0, GOAL_H / 2, -0.7]}>
        <planeGeometry args={[GOAL_W, GOAL_H]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, GOAL_H, -0.35]} rotation-x={-Math.PI / 2.4}>
        <planeGeometry args={[GOAL_W, 0.9]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
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
      g.rotation.z = 0;
      return;
    }
    const p = clamp((performance.now() - shot.fireAt) / FLIGHT_MS, 0, 1);
    const end = landingX(shot.aim, shot.curl);
    g.position.x = end * 0.5 * p;
    g.position.y = -0.15 * Math.sin(Math.PI * p);
    g.rotation.z = -Math.sign(end || 1) * 0.7 * p;
  });
  return (
    <group ref={ref} position={[0, 0, 0.3]}>
      <mesh position={[0, 0.78, 0]}>
        <capsuleGeometry args={[0.26, 0.8, 4, 10]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color="#f5c98a" />
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
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

function AimMarker({ x }: { x: number }) {
  return (
    <mesh position={[x, GOAL_H * 0.5, 0]} rotation-x={Math.PI / 2}>
      <torusGeometry args={[0.28, 0.05, 8, 20]} />
      <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.6} />
    </mesh>
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
          camera={{ position: [0, 1.9, 13], fov: 42 }}
          onCreated={({ camera }) => camera.lookAt(0, 1, 0)}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[5, 12, 8]} intensity={1.1} />
          <Pitch />
          <Goal />
          <Keeper shot={shot} />
          <Ball shot={shot} />
          {live && <AimMarker x={liveEnd} />}
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
