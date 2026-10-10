import { runSimulation } from './src/simulate';
const holds: Record<string, number> = {}; let annexTries = 0; let vaultMax = 0;
const { world } = runSimulation({ persona: 'mixed_ref', days: 2500, seed: 1, runId: 'bench-1', allowSides: true, stronger: false,
  hooks: { onEntry: (w, e) => {
    if (e.hold && e.reason?.startsWith('annex')) holds[e.reason] = (holds[e.reason] ?? 0) + 1;
    if (e.kind === 'SAT' || e.kind === 'ANNEX') annexTries++;
    vaultMax = Math.max(vaultMax, w.blueVault);
  } } });
console.log('annex holds', JSON.stringify(holds), 'sat/annex entries', annexTries, 'annexOk', world.annexOk, 'vault now', world.blueVault, 'vaultMax', vaultMax);
