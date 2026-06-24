/**
 * Seeded, deterministic RNG.
 *
 * All randomness in the game derives from a career seed plus contextual keys
 * (season, week, match id, moment id, ...). The same inputs always produce the
 * same sequence, which makes simulations reproducible and tests stable.
 */

/** FNV-1a string hash → 32-bit unsigned int. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: fast, good enough for a game, fully deterministic. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;

  constructor(...keys: (string | number)[]) {
    this.next = mulberry32(hashString(keys.join(":")));
  }

  /** Float in [0, 1). */
  float(): number {
    return this.next();
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with the given probability (0-1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Pick a uniformly random element. */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Pick `count` distinct elements (or fewer if the array is smaller). */
  sample<T>(arr: readonly T[], count: number): T[] {
    const pool = [...arr];
    const out: T[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(this.next() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  /** Weighted pick. Items with higher weight are more likely. */
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    const total = items.reduce((sum, it) => sum + Math.max(0, weightOf(it)), 0);
    if (total <= 0) return items[Math.floor(this.next() * items.length)];
    let r = this.next() * total;
    for (const it of items) {
      r -= Math.max(0, weightOf(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }

  /** Gaussian-ish noise centred on 0 (sum of uniforms), scaled by `spread`. */
  noise(spread: number): number {
    const n = (this.next() + this.next() + this.next()) / 3 - 0.5;
    return n * 2 * spread;
  }
}

/** Convenience factory. */
export function rng(...keys: (string | number)[]): Rng {
  return new Rng(...keys);
}
