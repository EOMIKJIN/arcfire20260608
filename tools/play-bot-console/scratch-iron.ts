import { runSimulation } from './src/simulate';
import { winChance } from './src/actions';
const out: string[] = []; let follow = 0; let shown = 0;
runSimulation({ persona: 'mixed_ref', days: 1500, seed: 1, runId: 'bench-1', allowSides: true, stronger: false,
  hooks: { onEntry: (w, e) => {
    if (follow > 0) { out.push(`   +${6 - follow} ${w.lastAction} @${w.currentPlanetId} ${e.kind} ${e.line.slice(0, 80)}`); follow--; }
    if (shown < 4 && e.kind === 'LAND' && e.line.startsWith('iron_remnant') && w.day > 300) {
      const s = w.planets['iron_remnant'];
      out.push(`D${w.day} L${w.level} land iron_remnant paint=${s.occupierClanId} tcl${s.tcl} win=${winChance(w, s.tcl, 'iron_remnant').toFixed(2)} detour=${(w.detourUntilTick ?? 0) > w.tick} hull=${w.hullTierKey}`);
      follow = 5; shown++;
    }
  } } });
console.log(out.join('\n'));
