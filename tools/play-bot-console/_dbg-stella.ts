import path from 'node:path';
import { getStellaObserveGatePolicy, listStellaObserveSituations } from '../../src/arcCore/chat/stellaObserveTableIndex';
import { loadHumanClock } from './src/humanClock';
import { toolRoot } from './src/io';
import { runSimulation } from './src/simulate';
import { createStellaReplay, summarizeStellaReplay } from './src/stellaReplay';
const clock = loadHumanClock(path.join(toolRoot(), 'logs', 'learned'));
const rows = listStellaObserveSituations();
const base = getStellaObserveGatePolicy();
const combos = [
  {},
  { restraintHalfLifeMin: 45 },
  { restraintHalfLifeMin: 30 },
  { restraintHalfLifeMin: 30, restraintMax: 0.6 },
  { restraintHalfLifeMin: 30, repeatDamp: 0.6 },
  { restraintHalfLifeMin: 20, restraintMax: 0.6, repeatDamp: 0.6 },
  { restraintHalfLifeMin: 30, speakThreshold: 0.3 },
  { restraintHalfLifeMin: 20, restraintMax: 0.6, repeatDamp: 0.7, speakThreshold: 0.35 },
];
for (const patch of combos) {
  const policy = { ...base, ...patch };
  const results = [];
  for (let s = 1; s <= 2; s += 1) {
    const r = createStellaReplay({ seed: s, rows, policy, clock, cfg: { inbound: 'off', life: 'judge' } });
    runSimulation({ persona: 'mixed_ref', days: 300, seed: s, runId: 'x', allowSides: true, stronger: false, hooks: { onEntry: (w, e) => r.onEntry(w, e) } });
    results.push(r.finish());
  }
  const sum = summarizeStellaReplay(results);
  const ch = sum.channels;
  const pd = (n: number) => (n / sum.playDays).toFixed(2);
  console.log(JSON.stringify(patch), `req=${pd((ch.ask ?? 0) + (ch.message ?? 0))} ask=${pd(ch.ask ?? 0)} msg=${pd(ch.message ?? 0)} remark=${pd(ch.remark ?? 0)} life=${pd(ch.life ?? 0)} ` + sum.criteria.map((c) => `${c.id}=${c.value.toFixed(2)}`).join(' '));
}
