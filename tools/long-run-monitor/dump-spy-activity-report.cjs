'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB = process.argv[2] || path.join(__dirname, 'logs/_rkstorage_live.db');
const db = new Database(DB, { readonly: true });

function getJson(key) {
  const row = db.prepare('SELECT value FROM catalystLocalStorage WHERE key = ?').get(key);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

const player = getJson('arcfire_player_v1');
const core = getJson('arcfire_planet_core_runtime_v1');
const spyExpelled = getJson('arcfire_arc_core_spy_expelled_v1');

const currentPlanetId =
  player?.currentPlanetId ?? player?.player?.currentPlanetId ?? null;
const currentSystemId =
  player?.currentSystemId ?? player?.player?.currentSystemId ?? null;

const by = core?.byPlanetId || {};
const spyKind = 'arc_core_spy_infiltration';
const planets = [];

for (const [planetId, runtime] of Object.entries(by)) {
  const ad = runtime?.detail?.attackDamage;
  if (!ad) continue;
  const lastSpy = (ad.lastEvents || []).filter(
    (e) => e.attackKind === spyKind || String(e.sourceId || '').startsWith('spy:'),
  );
  const dailyCount = ad.daily?.byKind?.[spyKind] ?? 0;
  if (lastSpy.length === 0 && dailyCount === 0) continue;
  planets.push({
    planetId,
    gauge: {
      R: runtime.resource,
      P: runtime.population,
      D: runtime.defense,
      T: runtime.technology,
      E: runtime.environment,
    },
    kstDayKey: ad.daily?.kstDayKey,
    dailySpyEvents: dailyCount,
    totalAttackEvents: ad.totalEvents,
    lastSpyEvents: lastSpy.slice(-8),
  });
}

planets.sort((a, b) => (b.dailySpyEvents || 0) - (a.dailySpyEvents || 0));

let expelledIds = [];
if (spyExpelled?.expelledCaptainIds && Array.isArray(spyExpelled.expelledCaptainIds)) {
  expelledIds = spyExpelled.expelledCaptainIds;
} else if (spyExpelled?.byCaptainId && typeof spyExpelled.byCaptainId === 'object') {
  expelledIds = Object.keys(spyExpelled.byCaptainId);
}

const currentPlanetRuntime = currentPlanetId ? by[currentPlanetId] : null;
const currentAd = currentPlanetRuntime?.detail?.attackDamage;

console.log(
  JSON.stringify(
    {
      observedAtKst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' '),
      adbSource: DB,
      playerLocation: { currentPlanetId, currentSystemId },
      currentPlanetSpyTelemetry: currentPlanetId
        ? {
            gauge: currentPlanetRuntime
              ? {
                  R: currentPlanetRuntime.resource,
                  P: currentPlanetRuntime.population,
                  D: currentPlanetRuntime.defense,
                  T: currentPlanetRuntime.technology,
                  E: currentPlanetRuntime.environment,
                }
              : null,
            dailyAttackByKind: currentAd?.daily?.byKind ?? {},
            dailySpyEvents: currentAd?.daily?.byKind?.[spyKind] ?? 0,
            kstDayKey: currentAd?.daily?.kstDayKey,
            microRemainder: currentAd?.microRemainder,
            lastEvents: (currentAd?.lastEvents || []).slice(-8),
          }
        : null,
      expelledSpyCaptainCount: expelledIds.length,
      expelledSpyCaptainIds: expelledIds.slice(0, 20),
      planetsWithSpyInfiltrationToday: planets.length,
      planets,
    },
    null,
    2,
  ),
);
