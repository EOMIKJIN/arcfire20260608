const fs = require('fs');
const b = fs.readFileSync('tools/long-run-monitor/logs/_RKStorage.db', 'latin1');
for (const k of ['currentPlanetId', 'currentSystemId', 'lastHubPlanetId', 'credits']) {
  const re = new RegExp('"' + k + '":(null|"[^"]{0,48}"|\\d+)', 'g');
  const s = new Set();
  let m;
  while ((m = re.exec(b))) s.add(m[1]);
  console.log(k, '=>', [...s].join(' | ') || '(none)');
}
