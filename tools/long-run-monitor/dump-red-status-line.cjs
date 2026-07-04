'use strict';
const Database = require('better-sqlite3');
const db = new Database('tools/long-run-monitor/logs/_rkstorage_pull3.db', { readonly: true });
const data = JSON.parse(
  db.prepare("SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_planet_core_runtime_v1'").get().value,
);
const RED = [
  'omega_hub', 'sirius_border', 'perseus_memorial', 'crimson_base', 'dark_haven',
  'blood_station', 'abyss_gate', 'nightfall_citadel', 'core_prime',
];
const now = Date.now();
console.log('now', new Date(now).toISOString(), 'KST~', new Date(now).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

for (const pid of RED) {
  const mods = data.byPlanetId[pid]?.detail?.development?.byModuleId || {};
  const lines = [];
  for (const [mid, m] of Object.entries(mods)) {
    if (!m || typeof m !== 'object') continue;
    const job = m.upgradeJob;
    let jobState = 'none';
    if (job?.completeAtMs) {
      jobState = now >= job.completeAtMs ? 'DUE_complete' : `in_progress_${Math.round((job.completeAtMs - now) / 60000)}m_left`;
    }
    lines.push(`${mid}: inst=${m.installed} lv=${m.level} job=${jobState}`);
  }
  console.log(pid, lines.length ? lines.join(' | ') : '(no modules)');
}
console.log('\ncrimson_base full:', JSON.stringify(mods = data.byPlanetId.crimson_base?.detail?.development?.byModuleId, null, 2));
db.close();
