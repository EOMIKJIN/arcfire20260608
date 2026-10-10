import { runSimulation } from './src/simulate';
const seed = Number(process.argv[2] ?? 4);
const by: Record<string, number> = {}; let prevRank = 0; let prevVal = 0;
runSimulation({ persona: 'mixed_ref', days: 1200, seed, runId: `bench-${seed}`, allowSides: true, stronger: false,
  hooks: { onEntry: (w, e) => {
    const r = w.hullRank ?? 0;
    if (prevRank > 0 && r < prevRank) {
      const m = e.line.match(/(이동중 조우|웨이브|퀘스트|전선|수련|자금|수도|유랑|조우)/);
      const k = `${m ? m[1] : e.kind}:${w.lastAction}`;
      by[k] = (by[k] ?? 0) + 1;
    }
    prevRank = r;
  } } });
console.log(`seed${seed} hull lost by`, JSON.stringify(Object.entries(by).sort((a, b) => b[1] - a[1])));
