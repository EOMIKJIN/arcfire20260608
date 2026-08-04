// 순수 O(N^2) vs O(N) 마이크로벤치 — patchPlanetCoreStatOpsTrendBulk류 패턴 격리 검증.
const N = 757;
const base = {};
for (let i = 0; i < N; i += 1) {
  base[`planet_${i}`] = { resource: 50, population: 50, defense: 50, technology: 50, environment: 50, updatedAt: 0, detail: {} };
}

function oldOn2() {
  let next = { ...base };
  for (const key of Object.keys(base)) {
    next = { ...next, [key]: { ...next[key], detail: { ...next[key].detail, statOpsTrend: { v: 1 } } } };
  }
  return next;
}

function newOn() {
  const next = { ...base };
  for (const key of Object.keys(base)) {
    next[key] = { ...next[key], detail: { ...next[key].detail, statOpsTrend: { v: 1 } } };
  }
  return next;
}

let t0 = Date.now();
oldOn2();
console.log(`old O(N^2) pattern, N=${N}: ${Date.now() - t0}ms`);

t0 = Date.now();
newOn();
console.log(`new O(N) pattern, N=${N}: ${Date.now() - t0}ms`);
