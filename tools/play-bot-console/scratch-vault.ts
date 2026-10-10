import { runSimulation } from './src/simulate';
import { paintOf } from './src/world';
const rows: string[] = [];
runSimulation({ persona: 'mixed_ref', days: 400, seed: 1, runId: 'bench-1', allowSides: true, stronger: false,
  hooks: { onDay: (w) => { if ([1, 5, 10, 20, 50, 100, 200, 400].includes(w.day)) { const blue = Object.values(w.planets).filter((p) => paintOf(p) === 'BLUE').length; rows.push(`D${w.day} vault=${w.blueVault} BLUE=${blue}`); } } } });
console.log(rows.join(' | '));
