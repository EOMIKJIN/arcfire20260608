/** 결정적 mulberry32 — 틱당 신규 클로저 없음. */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T extends string>(
  rng: Rng,
  weights: Readonly<Record<T, number>>,
): T {
  const keys = Object.keys(weights) as T[];
  let sum = 0;
  for (let i = 0; i < keys.length; i += 1) sum += Math.max(0, weights[keys[i]] ?? 0);
  if (sum <= 0) return keys[0];
  let roll = rng() * sum;
  for (let i = 0; i < keys.length; i += 1) {
    roll -= Math.max(0, weights[keys[i]] ?? 0);
    if (roll <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}
