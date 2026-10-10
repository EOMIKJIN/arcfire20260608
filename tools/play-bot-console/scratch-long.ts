import { runSimulation } from './src/simulate';
import { winChance } from './src/actions';
import { CRIMSON_CAPITAL_PLANET_ID } from './src/catalog';
import { paintOf } from './src/world';
const seed = Number(process.argv[2] ?? 1);
const days = Number(process.argv[3] ?? 3000);
const marks = new Set([1200, 2000, 3000, 3500, 4000, 4500, 5000]);
let hullLost = 0; let capDay = 0; let prevRank = 0;
const snap = (w: any) => {
  const cap = w.planets[CRIMSON_CAPITAL_PLANET_ID];
  const mains = Object.values(w.planets).filter((p: any) => !p.planetId.startsWith('synth_')) as any[];
  const reds = mains.filter((p) => paintOf(p) === 'RED');
  const blues = mains.filter((p) => paintOf(p) === 'BLUE');
  const winnable = reds.filter((p) => winChance(w, p.tcl, p.planetId) >= 0.5).length;
  const maxSat = Math.max(0, ...blues.map((p) => p.satLevel));
  return `D${w.day} L${w.level} hull=${w.hullTierKey} capWin=${cap ? winChance(w, cap.tcl, cap.planetId).toFixed(3) : '-'} capDestroyed=${w.capitalDestroyed} RED${reds.length}(win${winnable}) BLUE${blues.length} maxSat${maxSat} hullLost${hullLost} story${w.storyCursor} Q${w.questCleared} cr${w.credits}`;
};
const lines: string[] = [];
runSimulation({ persona: 'mixed_ref', days, seed, runId: `bench-${seed}`, allowSides: true, stronger: false,
  hooks: {
    onEntry: (w) => { const r = w.hullRank ?? 0; if (prevRank > 0 && r < prevRank) hullLost++; prevRank = r; },
    onDay: (w) => { if (marks.has(w.day)) lines.push(snap(w)); if (w.capitalDestroyed && !capDay) capDay = w.day; },
  } });
console.log(`seed${seed} capitalDestroyedDay=${capDay}\n  ` + lines.join('\n  '));
