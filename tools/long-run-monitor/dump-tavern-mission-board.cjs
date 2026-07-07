'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB = process.argv[2] || path.join(__dirname, 'logs/_rkstorage_live.db');
if (!fs.existsSync(DB)) {
  console.error('missing db:', DB);
  process.exit(1);
}
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
const missions = getJson('arcfire_missions_v1');
const instanceBoard = getJson('arcfire_arc_core_instance_missions_v1');
const tavernBoard = getJson('arcfire_tavern_board_v1');
const planetDev = getJson('arcfire_planet_development_v1');
const planetCore = getJson('arcfire_planet_core_runtime_v1');

const currentPlanetId =
  player?.currentPlanetId ?? player?.player?.currentPlanetId ?? null;
const playerLevel = player?.level ?? player?.player?.level ?? 1;

const progresses = missions?.progresses ?? missions?.byMissionId ?? {};

function resolveProgress(missionId) {
  if (progresses[missionId]) return progresses[missionId];
  for (const p of Object.values(progresses)) {
    if (p && p.missionId === missionId) return p;
  }
  return undefined;
}

function offerState(mission, level) {
  const p = resolveProgress(mission.id);
  if (p?.status === 'complete') return 'completed';
  if (p?.status === 'active') return 'in_progress';
  const req = mission.levelRequired ?? 1;
  if (level < req) return 'level_locked';
  return 'available';
}

// Load sandbox missions from generated csv via missions storage keys - fallback parse missions csv count
const MISSIONS_CSV = path.join(__dirname, '../../tables/content/missions.csv');
const sandboxByPlanet = {};
if (fs.existsSync(MISSIONS_CSV)) {
  const lines = fs.readFileSync(MISSIONS_CSV, 'utf8').split(/\r?\n/);
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line || !line.startsWith('sandbox_')) continue;
    const cols = line.split(',');
    const id = cols[0];
    const title = cols[1];
    const type = cols[3];
    const offerPlanetId = cols[5];
    const levelRequired = Number(cols[6]) || 1;
    if (!offerPlanetId) continue;
    if (!sandboxByPlanet[offerPlanetId]) sandboxByPlanet[offerPlanetId] = [];
    sandboxByPlanet[offerPlanetId].push({ id, title, type, levelRequired });
  }
}

function devTavernLevel(planetId) {
  const row = planetDev?.byPlanetId?.[planetId] ?? planetDev?.[planetId];
  const mod = row?.byModuleId?.dev_population_dome ?? row?.modules?.dev_population_dome;
  if (!mod) return { installed: false, level: 0 };
  return { installed: Boolean(mod.installed), level: mod.level ?? 0 };
}

function bountyBoard(planetId) {
  const rt = planetCore?.byPlanetId?.[planetId];
  const bb = rt?.detail?.population?.bountyBoard ?? rt?.detail?.bountyBoard;
  const count = Array.isArray(bb) ? bb.length : rt?.detail?.population?.activeBountyCount ?? 0;
  return { entries: Array.isArray(bb) ? bb.length : 0, activeBountyCount: count };
}

const planetOffers = currentPlanetId
  ? (sandboxByPlanet[currentPlanetId] ?? []).map((m) => ({
      ...m,
      state: offerState(m, playerLevel),
    }))
  : [];

const arcEntries = (instanceBoard?.entries ?? []).filter(
  (e) => e.offerPlanetId === currentPlanetId,
);

console.log(
  JSON.stringify(
    {
      observedAtKst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace('T', ' '),
      player: { currentPlanetId, playerLevel },
      tavernFacility: currentPlanetId ? devTavernLevel(currentPlanetId) : null,
      bountyBoard: currentPlanetId ? bountyBoard(currentPlanetId) : null,
      galacticNewsBoard: {
        loaded: Boolean(tavernBoard),
        visibleNotices: tavernBoard?.notices?.length ?? 0,
        recentTitles: (tavernBoard?.notices ?? []).slice(0, 5).map((n) => ({
          tag: n.tag,
          title: n.title,
        })),
      },
      arcCoreInstanceBoard: {
        totalEntries: instanceBoard?.entries?.length ?? 0,
        lastRegistrationDayKeyKst: instanceBoard?.lastRegistrationDayKeyKst ?? null,
        onCurrentPlanet: arcEntries.map((e) => ({
          instanceId: e.instanceId,
          categoryTag: e.categoryTag,
          templateMissionId: e.templateMissionId,
          boardStatus: e.boardStatus,
          dayKeyKst: e.dayKeyKst,
        })),
      },
      currentPlanetQuestOffers: {
        staticSandboxCount: planetOffers.length,
        byType: planetOffers.reduce((acc, m) => {
          acc[m.type] = (acc[m.type] ?? 0) + 1;
          return acc;
        }, {}),
        byState: planetOffers.reduce((acc, m) => {
          acc[m.state] = (acc[m.state] ?? 0) + 1;
          return acc;
        }, {}),
        offers: planetOffers,
      },
      globalSandboxCatalog: {
        totalQuests: Object.values(sandboxByPlanet).flat().length,
        planetsWithQuests: Object.keys(sandboxByPlanet).length,
        typeTotals: Object.values(sandboxByPlanet)
          .flat()
          .reduce((acc, m) => {
            acc[m.type] = (acc[m.type] ?? 0) + 1;
            return acc;
          }, {}),
      },
    },
    null,
    2,
  ),
);
