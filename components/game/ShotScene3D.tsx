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
import { scoreSkillInput, tierFromAccuracy } from "@/lib/game/skillEngine";
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
    // allow aiming past the posts so over-doing it misses wide
    aim: clamp(0.5 + dx / AIM_RANGE, -0.2, 1.2),
    power: clamp(pull / MAX_PULL_Y, 0, 1),
  };
}

// --- 3D field constants (metres) ---
const GOAL_W = 7.32;
const GOAL_H = 2.44;
const BALL_R = 0.26;
const START_Z = 9;
const CONTACT_MS = 300; // run-up + backswing before the foot connects
const FLIGHT_MS = 720; // ball travel after contact
const BOW3D = 2.6; // lateral swerve from curl (visible from the elevated camera)
const ARC = 1.15; // flight height

type ResultKind = "GOAL" | "CATCH" | "PARRY" | "POST" | "OVER" | "WIDE";
type Shot = { aim: number; power: number; curl: number; fireAt: number; kind: ResultKind; goalX: number };

/** Where the ball ends up across the goal, in metres (can be beyond the posts). */
function landingX(aim: number, curl: number): number {
  return (clamp(aim + curl * 0.25, -0.3, 1.3) - 0.5) * GOAL_W;
}

/** Decide the visual outcome so the animation MATCHES the engine's result. */
function resolveKind(challenge: SkillChallenge, input: SkillInput): ResultKind {
  const power = input.power ?? 0.5;
  if (power > 0.96) return "OVER";
  const bent = clamp(input.value + (input.curl ?? 0) * 0.25, -0.3, 1.3);
  if (bent < -0.06 || bent > 1.06) return "WIDE"; // outside the posts — a miss (matches engine)
  const acc = scoreSkillInput(challenge, input);
  const tier = tierFromAccuracy(acc);
  if (tier === "GREAT" || tier === "GOOD") return "GOAL"; // matches engine (success → GOAL)
  const dist = Math.abs(bent - 0.5);
  const r = rng(
    "shot3d",
    Math.round(input.value * 100),
    Math.round(power * 100),
    Math.round(((input.curl ?? 0) + 1) * 100),
    Math.round((input.timing ?? 1) * 100),
  );
  if (dist > 0.45 && r.chance(0.5)) return "POST"; // aimed tight to the post → woodwork
  if (acc >= 0.36 && r.chance(0.6)) return "PARRY"; // nearly beat him → tipped away
  return "CATCH"; // comfortable stop
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
    </group>
  );
}

/** Net (back + roof + sides) with a bulge that pops when the ball hits it. */
function Net({ shot }: { shot: Shot | null }) {
  const bulge = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = bulge.current;
    if (!m) return;
    if (!shot || shot.kind !== "GOAL") {
      m.scale.setScalar(0.0001);
      return;
    }
    const e = performance.now() - shot.fireAt - CONTACT_MS;
    const p = clamp(e / FLIGHT_MS, 0, 1);
    const bp = clamp((p - 0.82) / 0.18, 0, 1); // grows as the ball enters
    const s = Math.sin(bp * Math.PI * 0.5);
    m.position.set(shot.goalX, 0.5 + ARC * Math.sin(Math.PI * 0.85) * 0.5, -0.5 - s * 0.5);
    m.scale.set(0.0001 + s * 0.7, 0.0001 + s * 0.7, 0.0001 + s * 0.9);
  });
  const net = <meshBasicMaterial color="#e6eef5" wireframe transparent opacity={0.22} side={THREE.DoubleSide} />;
  return (
    <group>
      <mesh position={[0, GOAL_H / 2, -0.95]}>
        <planeGeometry args={[GOAL_W, GOAL_H, 16, 7]} />
        {net}
      </mesh>
      <mesh position={[0, GOAL_H, -0.48]} rotation-x={-Math.PI / 2.5}>
        <planeGeometry args={[GOAL_W, 1.05, 16, 3]} />
        {net}
      </mesh>
      <mesh position={[-GOAL_W / 2, GOAL_H / 2, -0.48]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.95, GOAL_H, 3, 7]} />
        {net}
      </mesh>
      <mesh position={[GOAL_W / 2, GOAL_H / 2, -0.48]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[0.95, GOAL_H, 3, 7]} />
        {net}
      </mesh>
      <mesh ref={bulge} scale={0.0001}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
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
    const tt = state.clock.elapsedTime;
    // react to the strike (after contact), not the release
    const e = shot ? performance.now() - shot.fireAt - CONTACT_MS : -1;
    if (!shot || e < 0) {
      // set and alive on his toes
      g.position.set(Math.sin(tt * 1.7) * 0.07, Math.abs(Math.sin(tt * 3.2)) * 0.04, 0.3);
      g.rotation.set(0, 0, Math.sin(tt * 1.7) * 0.05);
      return;
    }
    const dp = clamp(e / 540, 0, 1);
    const dir = Math.sign(shot.goalX || 1);
    const ant = Math.min(dp / 0.14, 1); // crouch + tiny counter-step
    const launch = easeOutCubic(clamp((dp - 0.14) / 0.86, 0, 1)); // push off, then extend
    // reach the ball on a save; fall just short on a goal; token dive on miss/over
    const reachF =
      shot.kind === "CATCH" || shot.kind === "PARRY" ? 1.0 : shot.kind === "POST" ? 0.86 : shot.kind === "GOAL" ? 0.48 : 0.35;
    const leapH = shot.kind === "OVER" ? 0.85 : 0.55;
    g.position.x = -dir * 0.14 * ant * (1 - launch) + shot.goalX * reachF * launch;
    g.position.y = -0.16 * ant * (1 - launch) + leapH * Math.sin(Math.PI * launch);
    g.position.z = 0.3;
    g.rotation.z = -dir * 1.4 * launch;
    g.rotation.x = -0.18 * launch;
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

/** The shooter, foreground, seen from behind — runs up, plants, and strikes through. */
const STRIKER_START: [number, number, number] = [-1.3, 0, 10.6];
const STRIKER_PLANT: [number, number, number] = [-0.95, 0, 9.95];

function Striker({ shot }: { shot: Shot | null }) {
  const bodyRef = useRef<THREE.Group>(null);
  const kickRef = useRef<THREE.Group>(null);
  const standRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const b = bodyRef.current;
    const k = kickRef.current;
    const s = standRef.current;
    if (!b || !k || !s) return;
    if (!shot) {
      const tt = state.clock.elapsedTime; // gentle idle, waiting to run up
      b.position.set(...STRIKER_START);
      b.rotation.x = Math.sin(tt * 2) * 0.03;
      k.rotation.x = Math.sin(tt * 2) * 0.05;
      s.rotation.x = -Math.sin(tt * 2) * 0.05;
      return;
    }
    const e = performance.now() - shot.fireAt;
    const RUN = CONTACT_MS - 90; // approach, then a short plant+backswing into contact
    if (e < RUN) {
      const t = e / RUN;
      const et = easeOutCubic(t);
      b.position.set(
        STRIKER_START[0] + (STRIKER_PLANT[0] - STRIKER_START[0]) * et,
        0,
        STRIKER_START[2] + (STRIKER_PLANT[2] - STRIKER_START[2]) * et,
      );
      b.rotation.x = 0.06;
      const stride = Math.sin(t * 3 * Math.PI); // ~1.5 running strides
      k.rotation.x = stride * 0.7;
      s.rotation.x = -stride * 0.7;
    } else if (e < CONTACT_MS) {
      const t = (e - RUN) / 90; // plant the standing foot, wind the kicking leg back
      b.position.set(...STRIKER_PLANT);
      b.rotation.x = 0.06 - t * 0.18;
      k.rotation.x = 0.2 + t * 0.85;
      s.rotation.x = 0;
    } else {
      const t = easeInOutCubic(clamp((e - CONTACT_MS) / 300, 0, 1)); // snap through + follow lean
      b.position.set(...STRIKER_PLANT);
      b.rotation.x = -0.12 + t * 0.34;
      k.rotation.x = 1.05 - t * 2.7;
      s.rotation.x = 0;
    }
  });
  return (
    <group ref={bodyRef} position={STRIKER_START}>
      {/* standing leg (pivots at the hip too, for the run-up strides) */}
      <group ref={standRef} position={[0.16, 0.7, 0]}>
        <mesh position={[0, -0.34, 0]}>
          <capsuleGeometry args={[0.13, 0.4, 4, 8]} />
          <meshToonMaterial color="#1f2937" />
          <Ink />
        </mesh>
      </group>
      {/* kicking leg */}
      <group ref={kickRef} position={[-0.12, 0.72, 0]}>
        <mesh position={[0, -0.32, 0.02]}>
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
    const e = performance.now() - shot.fireAt - CONTACT_MS;
    if (e < 0) {
      m.position.set(0, BALL_R, START_Z); // wait at the spot through the run-up
      return;
    }
    const p = clamp(e / FLIGHT_MS, 0, 1);
    const gx = shot.goalX;
    const bow = (q: number) => -shot.curl * BOW3D * Math.sin(Math.PI * q);
    const sgn = Math.sign(gx || 1);
    let x: number, y: number, z: number;

    if (shot.kind === "GOAL") {
      x = gx * p + bow(p);
      y = BALL_R + ARC * Math.sin(Math.PI * p * 0.85); // still rising as it enters
      z = START_Z + (-START_Z - 0.85) * p; // ends inside the net
    } else if (shot.kind === "OVER") {
      x = gx * p + bow(p);
      y = BALL_R + (GOAL_H + 1.6) * Math.sin(Math.PI * 0.5 * p); // sails up and over
      z = START_Z + (-START_Z - 2.5) * p;
    } else if (shot.kind === "WIDE") {
      x = gx * p + bow(p); // gx is beyond the post → flies wide of the goal
      y = BALL_R + ARC * Math.sin(Math.PI * p * 0.85);
      z = START_Z + (-START_Z - 1.6) * p; // past the line, outside the posts
    } else {
      const pc = 0.82;
      const tx = shot.kind === "POST" ? sgn * (GOAL_W / 2 - 0.08) : gx;
      // saves are stopped IN FRONT of the line (at the keeper); the post is on the line
      const contactZ = shot.kind === "POST" ? 0.05 : 0.5;
      if (p <= pc) {
        const pp = p / pc;
        x = tx * pp + bow(pp);
        y = BALL_R + ARC * Math.sin(Math.PI * pp * 0.8);
        z = START_Z + (contactZ - START_Z) * pp; // reach the keeper, not the net
      } else {
        const pa = (p - pc) / (1 - pc);
        const cy = BALL_R + ARC * Math.sin(Math.PI * 0.8);
        if (shot.kind === "CATCH") {
          x = tx;
          y = cy * (1 - pa) + (BALL_R + 0.5) * pa; // gathered into the keeper
          z = contactZ + 0.2 * pa; // toward the camera, never into the net
        } else if (shot.kind === "PARRY") {
          x = tx + sgn * 2.4 * pa; // tipped away, wide and up
          y = cy + 1.6 * pa;
          z = contactZ + 3.5 * pa;
        } else {
          x = tx - sgn * 1.7 * pa; // off the post, back out into play
          y = cy * (1 - 0.25 * pa);
          z = contactZ + 4 * pa;
        }
      }
    }
    m.position.set(x, y, z);
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
    const timing = clamp(t, 0, 1);
    const input = { value: aim, power, timing, curl: c };
    const kind = resolveKind(challenge, input);
    setShot({ aim, power, curl: c, fireAt: performance.now(), kind, goalX: landingX(aim, c) });
    // the thwack lands when the foot connects, after the run-up
    window.setTimeout(() => {
      sfx.kick();
      haptics.light();
    }, CONTACT_MS);
    window.setTimeout(() => onComplete(input), CONTACT_MS + FLIGHT_MS - 40);
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
          <Net shot={shot} />
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
