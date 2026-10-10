import { runSimulation } from './src/simulate';
const c: Record<string, number> = {}; const samples: string[] = [];
const { world } = runSimulation({ persona: 'mixed_ref', days: 2500, seed: 1, runId: 'bench-1', allowSides: true, stronger: false,
  hooks: { onEntry: (w, e) => {
    let k = '';
    if (e.kind === 'COMBAT' && /전선 승/.test(e.line)) k = /→ 중립/.test(e.line) ? 'front-win-neutralize' : 'front-win-keep';
    else if (e.kind === 'SAT') k = 'sat:' + (/정복 유지/.test(e.line) ? 'fortify' : 'annex-prep');
    else if (e.kind === 'ANNEX') k = 'annex';
    else if (e.hold && e.reason?.startsWith('annex')) k = e.reason;
    if (w.lastAction === 'annex_path' || w.lastAction === 'capital') { const kk = 'AP:' + e.kind + ':' + e.line.replace(/[0-9,.]+/g, '#').replace(/synth_#_p/g,'S').slice(0, 26); c[kk] = (c[kk] ?? 0) + 1; }
    if (w.lastAction === 'capital') c['act:capital'] = (c['act:capital'] ?? 0) + 1;
    if (k) { c[k] = (c[k] ?? 0) + 1; if (k === 'front-win-neutralize' && samples.length < 5) samples.push(`D${w.day} L${w.level} ${e.line.slice(0, 60)}`); }
  } } });
console.log(JSON.stringify(Object.entries(c).filter(([k]) => k.startsWith('AP:')).sort((a, b) => b[1] - a[1]).slice(0, 16))); console.log(samples.join('\n'));
