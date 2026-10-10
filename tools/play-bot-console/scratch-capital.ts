import { runSimulation } from './src/simulate';
import { CRIMSON_CAPITAL_PLANET_ID } from './src/catalog';
let prev = ''; const ev: string[] = []; let fights = 0;
const { world } = runSimulation({ persona: 'mixed_ref', days: 4000, seed: 4, runId: 'bench-4', allowSides: true, stronger: false,
  hooks: { onEntry: (w, e) => {
    const s = w.planets[CRIMSON_CAPITAL_PLANET_ID];
    const occ = s ? s.occupierClanId : '-';
    if (occ !== prev) { ev.push(`D${w.day} L${w.level} ${prev}->${occ} | ${e.kind} ${e.line.slice(0, 90)}`); prev = occ; }
    if (w.currentPlanetId === CRIMSON_CAPITAL_PLANET_ID && e.kind === 'COMBAT') fights++;
  } } });
console.log(ev.slice(0, 12).join('\n'));
console.log('fights at capital', fights, 'combatEnabled', world.planets[CRIMSON_CAPITAL_PLANET_ID]?.combatEnabled, 'flag', world.capitalDestroyed);
