import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TABLE_DIR = resolve(ROOT, 'tables', 'content');
const OUT_DIR = resolve(ROOT, 'src', 'data', 'generated');
const DEFAULT_NPC_SHIP_CAPTAIN_ID = 'npc_cpt_ai_robot_default';

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadCsv(name) {
  const raw = readFileSync(resolve(TABLE_DIR, name), 'utf8').trim();
  const rows = parseCsv(raw);
  if (rows.length < 2) return [];
  const header = [...rows[0]];
  if (header.length > 0 && typeof header[0] === 'string') {
    // Excel UTF-8 BOM 파일의 첫 컬럼명(\uFEFFid) 정규화
    header[0] = header[0].replace(/^\uFEFF/, '');
  }
  return rows.slice(1).map(cols => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) {
      out[header[i]] = cols[i] ?? '';
    }
    return out;
  });
}

function loadCsvOptional(name) {
  const p = resolve(TABLE_DIR, name);
  if (!existsSync(p)) return [];
  const raw = readFileSync(p, 'utf8').trim();
  if (!raw) return [];
  const rows = parseCsv(raw);
  if (rows.length < 2) return [];
  const header = [...rows[0]];
  if (header.length > 0 && typeof header[0] === 'string') {
    // Excel UTF-8 BOM 파일의 첫 컬럼명(\uFEFFid) 정규화
    header[0] = header[0].replace(/^\uFEFF/, '');
  }
  return rows.slice(1).map(cols => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) {
      out[header[i]] = cols[i] ?? '';
    }
    return out;
  });
}

function toInt(v, fallback = 0) {
  const n = Number.parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}
function toNum(v, fallback = 0) {
  const n = Number(v ?? '');
  return Number.isFinite(n) ? n : fallback;
}
function toNumOptional(v) {
  const s = String(v ?? '').trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
function toBool(v) {
  return String(v ?? '').trim().toLowerCase() === 'true';
}

const CAPITAL_SHIP_ARCHETYPES = new Set(['fighter', 'ranger', 'survival', 'special', 'neutral']);

function normalizeCapitalShipArchetype(v) {
  const s = String(v ?? '').trim().toLowerCase();
  return CAPITAL_SHIP_ARCHETYPES.has(s) ? s : 'neutral';
}

/** CSV 1/0, true/false, 비어 있음(기본값) */
function toLayerBoolWithDefault(v, whenEmpty) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return whenEmpty;
  if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
  return true;
}
function splitPipe(v) {
  return String(v ?? '')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);
}

/** CSV attrsJson — 표준 JSON + 레거시(키·팩션코드 무인용) */
function parseAttrsJson(v) {
  const s = String(v ?? '').trim();
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    try {
      const normalized = s
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/:([A-Za-z_][A-Za-z0-9_]*)(?=[,}])/g, ':"$1"');
      return JSON.parse(normalized);
    } catch {
      console.warn(`[item_defs] attrsJson parse failed (id row may be wrong): ${s.slice(0, 160)}`);
      return {};
    }
  }
}
function nullable(v) {
  const s = String(v ?? '').trim();
  return s.length === 0 || s.toLowerCase() === 'null' ? null : s;
}
function q(v) {
  return JSON.stringify(v);
}

/** weapon_list.csv — 한글·영문 헤더 모두 수용 */
function readFeatureDescription(r) {
  return String(
    r.featureDescription ?? r['특징설명'] ?? r['특성설명'] ?? '',
  ).trim();
}

/** weapon_list.csv — 한글·영문 헤더 모두 수용 */
function normalizeWeaponListRow(r) {
  const id = String(r.id ?? '').trim();
  if (!id) return null;
  const name = String(r.name ?? r['이름'] ?? id).trim();
  const nameEn = String(r.nameEn ?? r['영문명'] ?? '').trim() || undefined;
  const familyKind = String(r.kind ?? r['종류'] ?? 'laser').trim().toLowerCase();
  const combatKind = familyKind === 'laser' ? 'laser' : 'missile';
  const targeting = String(r.targeting ?? r['타겟팅'] ?? '').trim();
  const lockImpactPoint =
    targeting.includes('타겟점') ||
    targeting.toLowerCase() === 'target_point' ||
    targeting.toLowerCase() === 'point';
  return {
    id,
    name,
    nameEn,
    familyKind,
    combatKind,
    damage: toInt(r.damage ?? r['대미지'], 0),
    cooldownMs: toInt(r.cooldownMs ?? r['재장전ms'], 0),
    rangePx: toNum(r.rangePx ?? r['사거리px'], 0),
    salvoCount: Math.max(1, toInt(r.salvoCount ?? r['연발수'], 1)),
    unguidedPerSalvo: toInt(r.unguidedPerSalvo ?? r['비유도연발'], 0),
    salvoIntervalMs: toInt(r.salvoIntervalMs ?? r['연발간격ms'], 0),
    projectileSpeedPxPerSec: toNum(
      r.projectileSpeedPxPerSec ?? r['탄속px초'],
      combatKind === 'laser' ? 5200 : 64,
    ),
    purchasePrice: toInt(r.purchasePrice ?? r['구매가'], 0),
    requiredLevel: Math.max(1, toInt(r.requiredLevel ?? r['요구레벨'], 1)),
    tierLabel: String(r.tierLabel ?? r['등급라벨'] ?? '').trim(),
    tradePortListed: toBool(r.tradePortListed),
    targeting,
    lockImpactPoint,
    hitAreaNote: String(r.hitAreaNote ?? r['타격범위'] ?? '').trim(),
    featureDescription: readFeatureDescription(r),
    laserColor: String(r.laserColor ?? r['레이저색'] ?? r['색상'] ?? '').trim(),
    projectileColor: String(r.projectileColor ?? r['발사체색'] ?? '').trim(),
    glowColor: String(r.glowColor ?? r['글로우색'] ?? '').trim(),
  };
}
function unescapeStoryText(v) {
  return String(v ?? '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n');
}

function buildShips() {
  const rows = loadCsv('npc_ai_ships.csv').filter(
    r => String(r.id ?? '').trim().startsWith('Player_')
      || String(r.captainId ?? '').trim().startsWith('Player_'),
  );
  const body = rows
    .map(r => `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    name: ${q(r.name)},
    description: ${q(`${r.name} 플레이어 템플릿`)},
    maxHp: ${toInt(r.maxHp)},
    maxShield: ${toInt(r.maxShield)},
    armor: ${toInt(r.armor)},
    speed: ${Math.max(1, Math.round((toNum(r.maxMoveSpeedPxPerMs, 0.02) * 1000) / 4))},
    cargoCapacity: ${Math.max(10, Math.round(toInt(r.maxHp, 100) / 6))},
    weaponSlots: 1,
    equipSlots: 2,
    baseWeapon: {
      id: ${q(r.laserWeaponId || 'w_laser_light_01')},
      name: ${q(r.laserWeaponId || '기본 레이저')},
      type: ${q('laser')},
      attackBonus: ${toInt(r.attackBonus)},
      range: ${Math.max(120, Math.round(toNum(r.detectRangeScale, 1) * 160))},
      damageDice: {
        count: ${toInt(r.damageDiceCount)},
        sides: ${toInt(r.damageDiceSides)},
        bonus: ${toInt(r.damageDiceBonus)},
      },
    },
    pixelSprite: PIXEL_SPRITES.starter,
  }`)
    .join(',\n');
  return `import type { ShipTemplate } from '../../types';

const PIXEL_SPRITES: Record<string, number[][]> = {
  starter: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [2, 1, 1, 1, 1, 1, 2],
    [0, 1, 3, 1, 3, 1, 0],
    [0, 0, 1, 0, 1, 0, 0],
  ],
};

export const SHIP_TEMPLATES_FROM_CSV: Record<string, ShipTemplate> = {
${body}
};
`;
}

function assertUniqueNpcCaptainDisplayNames(rows) {
  const seen = new Map();
  for (const r of rows) {
    const name = String(r.displayName ?? '').trim();
    if (!name) {
      throw new Error(`[npc_ai_captains] displayName 비어 있음: id=${r.id}`);
    }
    if (seen.has(name)) {
      throw new Error(
        `[npc_ai_captains] displayName 중복(항상 서로 다른 이름 유지): "${name}" — ${seen.get(name)} vs ${r.id}`,
      );
    }
    seen.set(name, r.id);
  }
}

function buildNpcCaptains() {
  const rows = loadCsv('npc_ai_captains.csv');
  assertUniqueNpcCaptainDisplayNames(rows);
  const body = rows
    .map(r => `  {
    id: ${q(r.id)},
    displayName: ${q(r.displayName)},
    rank: ${q(r.rank)},
    factionId: ${q(nullable(r.factionId))},
    aiAggression: ${q(r.aiAggression)},
    aiRole: ${q(r.aiRole)},
    bioShort: ${q(r.bioShort)},
    operationalState: ${q(r.operationalState || 'general')},
    combatTeam: ${q(r.combatTeam || 'none')},
    friendlyFactionIds: ${JSON.stringify(splitPipe(r.friendlyFactionIdsPipe))},
    hostileFactionIds: ${JSON.stringify(splitPipe(r.hostileFactionIdsPipe))},
    basePlanetId: ${q(nullable(r.basePlanetId))},
    activityPlanetIds: ${JSON.stringify(splitPipe(r.activityPlanetIdsPipe))},
    baseSystemId: ${q(nullable(r.baseSystemId))},
    activitySystemIds: ${JSON.stringify(splitPipe(r.activitySystemIdsPipe))},
    assignedShipId: ${q(r.assignedShipId || '')},
    isAiClanLeader: ${toBool(r.aiClanLeader)},
    aiClanName: ${q(String(r.aiClanName ?? '').trim())},
    aiClanZone: ${['safe', 'neutral', 'pvp'].includes(String(r.aiClanZone ?? '').trim()) ? q(String(r.aiClanZone).trim()) : 'null'},
    arcOrbitPresenceFill: ${toBool(r.arcOrbitPresenceFill)},
    mainStageTalkEnabled: ${toBool(r.mainStageTalkEnabled)},
    mainStageTalkPriority: ${toInt(r.mainStageTalkPriority || 5, 5)},
    mainStageTalkSceneId: ${q(nullable(r.mainStageTalkSceneId))},
    mainStageMissionTriggerId: ${q(nullable(r.mainStageMissionTriggerId))},
    mainStageEventTriggerId: ${q(nullable(r.mainStageEventTriggerId))},
    tavernPlanetIds: ${JSON.stringify(splitPipe(r.tavernPlanetIdsPipe))},
    portraitImageAssetKey: ${q(nullable(r.portraitImageAssetKey))},
    progression: {
      initialLevel: ${toInt(r.initialLevel || 1)},
      initialExp: ${toInt(r.initialExp || 0)},
      expCurveBase: ${toInt(r.expCurveBase || 80)},
      expCurveLinear: ${toInt(r.expCurveLinear || 35)},
      expCurveQuadratic: ${toInt(r.expCurveQuadratic || 12)},
    },
  }`)
    .join(',\n');
  return `import type { NpcCaptain } from '../../types';

export const NPC_CAPTAINS_FROM_CSV: readonly NpcCaptain[] = [
${body}
];
`;
}

function buildNpcShips() {
  const rows = loadCsv('npc_ai_ships.csv');
  const body = rows
    .map(r => `  {
    id: ${q(r.id)},
    name: ${q(r.name)},
    nameEn: ${readCsvEnField(r, 'nameEn', 'name_en') ? q(readCsvEnField(r, 'nameEn', 'name_en')) : 'undefined'},
    hullTypeId: ${q(r.hullTypeId)},
    // captainId는 전함 미배정 fallback 식별자만 유지한다.
    // 정본 매핑은 npc_ai_captains.csv 의 assignedShipId를 사용한다.
    captainId: ${q(DEFAULT_NPC_SHIP_CAPTAIN_ID)},
    homeSystemId: ${q(nullable(r.homeSystemId))},
    combat: {
      maxHp: ${toInt(r.maxHp)},
      maxShield: ${toInt(r.maxShield)},
      armor: ${toInt(r.armor)},
      attackBonus: ${toInt(r.attackBonus)},
      damageDice: { count: ${toInt(r.damageDiceCount)}, sides: ${toInt(r.damageDiceSides)}, bonus: ${toInt(r.damageDiceBonus)} },
      expReward: ${toInt(r.expReward, Math.max(20, Math.round(toInt(r.maxHp, 300) / 4)))},
      strStat: ${toInt(r.strStat, Math.min(24, Math.max(6, Math.round(toInt(r.maxHp, 300) / 10))))},
      dexStat: ${toInt(r.dexStat, Math.min(24, Math.max(6, Math.round(toNum(r.maxMoveSpeedPxPerMs, 0.02) * 1000))))},
      sizeClass: ${toInt(r.sizeClass, 0)},
      capitalShipArchetype: ${q(normalizeCapitalShipArchetype(r.capitalShipArchetype))},
    },
    ${r.infoLineSuffix && String(r.infoLineSuffix).trim() ? `infoLineSuffix: ${q(String(r.infoLineSuffix).trim())},` : ''}
    arcTrafficDwellRadPerSec: ${toNum(r.arcTrafficDwellRadPerSec, 0.46)},
    arcTrafficPhaseDurationMul: ${toNum(r.arcTrafficPhaseDurationMul, 2)},
    arcTrafficPlanetDwellSecMin: ${toNum(r.arcTrafficPlanetDwellSecMin, 60)},
    arcTrafficPlanetDwellSecMax: ${toNum(r.arcTrafficPlanetDwellSecMax, 600)},
    tradePortListed: ${toBool(r.tradePortListed)},
    ${String(r.portraitImageAssetKey ?? '').trim() ? `portraitImageAssetKey: ${q(String(r.portraitImageAssetKey).trim())},` : ''}
  }`)
    .join(',\n');
  const configBody = rows
    .map(r => `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    displayName: ${q(r.name)},
    npcMode: ${q(r.npcMode || 'combat')},
    maxMoveSpeedPxPerMs: ${toNumOptional(r.maxMoveSpeedPxPerMs) ?? 'undefined'},
    accelPxPerMs2: ${toNumOptional(r.accelPxPerMs2) ?? 'undefined'},
    maxTurnRateRadPerMs: ${toNumOptional(r.maxTurnRateRadPerMs) ?? 'undefined'},
    turnAccelRadPerMs2: ${toNumOptional(r.turnAccelRadPerMs2) ?? 'undefined'},
    detectRangeScale: ${toNumOptional(r.detectRangeScale) ?? 'undefined'},
    laserCooldownJitterMinMs: ${toNumOptional(r.laserCooldownJitterMinMs) ?? 'undefined'},
    laserCooldownJitterMaxMs: ${toNumOptional(r.laserCooldownJitterMaxMs) ?? 'undefined'},
    missileCooldownJitterMinMs: ${toNumOptional(r.missileCooldownJitterMinMs) ?? 'undefined'},
    missileCooldownJitterMaxMs: ${toNumOptional(r.missileCooldownJitterMaxMs) ?? 'undefined'},
    salvoStepMinMs: ${toNumOptional(r.salvoStepMinMs) ?? 'undefined'},
    salvoStepMaxMs: ${toNumOptional(r.salvoStepMaxMs) ?? 'undefined'},
    engageStartDelayMinMs: ${toNumOptional(r.engageStartDelayMinMs) ?? 'undefined'},
    engageStartDelayMaxMs: ${toNumOptional(r.engageStartDelayMaxMs) ?? 'undefined'},
    laserWeaponId: ${q(r.laserWeaponId || '')},
    missileWeaponId: ${q(r.missileWeaponId || '')},
    closeRangeWeaponId: ${q(r.closeRangeWeaponId || 'w_missile_arc_005')},
    auxWeaponId: ${q(r.auxWeaponId || '')},
  }`)
    .join(',\n');
  return `import type { NpcCapitalShip } from '../../types';

export const NPC_CAPITAL_SHIPS_FROM_CSV: readonly NpcCapitalShip[] = [
${body}
];

export type NpcCapitalShipCombatRuntimeConfig = {
  id: string;
  displayName: string;
  npcMode?: 'general' | 'combat';
  maxMoveSpeedPxPerMs?: number;
  accelPxPerMs2?: number;
  maxTurnRateRadPerMs?: number;
  turnAccelRadPerMs2?: number;
  detectRangeScale?: number;
  laserCooldownJitterMinMs?: number;
  laserCooldownJitterMaxMs?: number;
  missileCooldownJitterMinMs?: number;
  missileCooldownJitterMaxMs?: number;
  salvoStepMinMs?: number;
  salvoStepMaxMs?: number;
  engageStartDelayMinMs?: number;
  engageStartDelayMaxMs?: number;
  laserWeaponId?: string;
  missileWeaponId?: string;
  closeRangeWeaponId?: string;
  auxWeaponId?: string;
};

export const NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV: Record<string, NpcCapitalShipCombatRuntimeConfig> = {
${configBody}
};
`;
}

function buildNpcCapitalShipEquipSlots() {
  const rows = loadCsvOptional('npc_capital_ship_equip_slots.csv').filter(
    (r) => String(r.npcShipId ?? '').trim() && String(r.slotId ?? '').trim(),
  );
  const body = rows
    .map(
      (r) => `  {
    id: ${q(r.id)},
    npcShipId: ${q(r.npcShipId)},
    slotOrder: ${toInt(r.slotOrder, 1)},
    slotId: ${q(r.slotId)},
    itemDefId: ${String(r.itemDefId ?? '').trim() ? q(String(r.itemDefId).trim()) : 'undefined'},
    ${String(r.notesKo ?? '').trim() ? `notesKo: ${q(String(r.notesKo).trim())},` : ''}
  }`,
    )
    .join(',\n');
  return `export type NpcCapitalShipEquipSlotRow = {
  id: string;
  npcShipId: string;
  slotOrder: number;
  slotId: string;
  itemDefId?: string;
  notesKo?: string;
};

export const NPC_CAPITAL_SHIP_EQUIP_SLOTS_FROM_CSV: readonly NpcCapitalShipEquipSlotRow[] = [
${body}
];
`;
}

function buildWeapons() {
  const rows = loadCsvOptional('weapon_list.csv')
    .map(normalizeWeaponListRow)
    .filter(Boolean);
  const body = rows
    .map(r => `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    name: ${q(r.name)},
    nameEn: ${r.nameEn ? q(r.nameEn) : 'undefined'},
    kind: ${q(r.combatKind)},
    familyKind: ${q(r.familyKind)},
    damage: ${r.damage},
    cooldownMs: ${r.cooldownMs},
    rangePx: ${r.rangePx},
    salvoCount: ${r.salvoCount},
    unguidedPerSalvo: ${r.unguidedPerSalvo},
    salvoIntervalMs: ${r.salvoIntervalMs},
    projectileSpeedPxPerSec: ${r.projectileSpeedPxPerSec},
    purchasePrice: ${r.purchasePrice},
    targeting: ${q(r.targeting)},
    lockImpactPoint: ${r.lockImpactPoint},
    hitAreaNote: ${q(r.hitAreaNote)},
    requiredLevel: ${r.requiredLevel},
    tierLabel: ${q(r.tierLabel)},
    tradePortListed: ${r.tradePortListed},
    featureDescription: ${q(r.featureDescription)},
    laserColor: ${q(r.laserColor)},
    projectileColor: ${q(r.projectileColor)},
    glowColor: ${q(r.glowColor)},
  }`)
    .join(',\n');
  return `export type CapitalWeaponCsvRow = {
  id: string;
  name: string;
  nameEn?: string;
  /** 전투 엔진 슬롯(laser/missile) */
  kind: 'laser' | 'missile';
  /** CSV 종류 원본(laser/missile/rocket/drone/carrier 등) */
  familyKind: string;
  damage: number;
  cooldownMs: number;
  rangePx: number;
  salvoCount: number;
  unguidedPerSalvo: number;
  salvoIntervalMs: number;
  projectileSpeedPxPerSec: number;
  purchasePrice: number;
  targeting: string;
  lockImpactPoint: boolean;
  hitAreaNote: string;
  requiredLevel: number;
  tierLabel: string;
  tradePortListed: boolean;
  featureDescription: string;
  laserColor: string;
  projectileColor: string;
  glowColor: string;
};

export const CAPITAL_WEAPON_LIST_FROM_CSV: Record<string, CapitalWeaponCsvRow> = {
${body}
};
`;
}

function buildMissions() {
  const missions = loadCsv('missions.csv');
  const objectives = loadCsv('mission_objectives.csv');
  const missionPrereqs = loadCsvOptional('mission_prerequisites.csv');
  const missionRewardItems = loadCsvOptional('mission_reward_items.csv');
  const objByMission = new Map();
  const prereqByMission = new Map();
  const rewardItemsByMission = new Map();
  for (const o of objectives) {
    const arr = objByMission.get(o.missionId) ?? [];
    arr.push(o);
    objByMission.set(o.missionId, arr);
  }
  for (const row of missionPrereqs) {
    const arr = prereqByMission.get(row.missionId) ?? [];
    arr.push(row.prerequisiteMissionId);
    prereqByMission.set(row.missionId, arr);
  }
  for (const row of missionRewardItems) {
    const arr = rewardItemsByMission.get(row.missionId) ?? [];
    arr.push(row.itemId);
    rewardItemsByMission.set(row.missionId, arr);
  }
  const body = missions
    .map(m => {
      const objs = (objByMission.get(m.id) ?? [])
        .map(o => `      {
        id: ${q(o.id)},
        description: ${q(o.description)},
        descriptionEn: ${readCsvEnField(o, 'descriptionEn', 'description_en') ? q(readCsvEnField(o, 'descriptionEn', 'description_en')) : 'undefined'},
        type: ${q(o.type)},
        targetId: ${q(o.targetId)},
        quantity: ${o.quantity ? toInt(o.quantity) : 'undefined'},
        complete: false,
      }`)
        .join(',\n');
      const prereqList = prereqByMission.get(m.id) ?? splitPipe(m.prerequisiteIdsPipe);
      const rewardItems = rewardItemsByMission.get(m.id) ?? splitPipe(m.rewardItemsPipe);
      const offerCaptainId = nullable(m.offerCaptainId);
      const offerPlanetId = nullable(m.offerPlanetId);
      const levelRequired = m.levelRequired ? toInt(m.levelRequired) : 'undefined';
      const clearDialogSceneId = nullable(m.clearDialogSceneId);
      return `  ${JSON.stringify(m.id)}: {
    id: ${q(m.id)},
    title: ${q(m.title)},
    titleEn: ${readCsvEnField(m, 'titleEn', 'title_en') ? q(readCsvEnField(m, 'titleEn', 'title_en')) : 'undefined'},
    description: ${q(m.description)},
    descriptionEn: ${readCsvEnField(m, 'descriptionEn', 'description_en') ? q(readCsvEnField(m, 'descriptionEn', 'description_en')) : 'undefined'},
    type: ${q(m.type)},
    objectives: [
${objs}
    ],
    rewards: {
      credits: ${toInt(m.rewardCredits)},
      exp: ${toInt(m.rewardExp)},
      items: ${JSON.stringify(rewardItems)},
      skillPointBonus: ${m.rewardSkillPointBonus ? toInt(m.rewardSkillPointBonus) : 'undefined'},
    },
    prerequisiteIds: ${JSON.stringify(prereqList)},
    nextMissionId: ${q(nullable(m.nextMissionId))},
    dc: ${toInt(m.dc)},
    offerCaptainId: ${offerCaptainId ? q(offerCaptainId) : 'undefined'},
    offerPlanetId: ${offerPlanetId ? q(offerPlanetId) : 'undefined'},
    levelRequired: ${levelRequired},
    clearDialogSceneId: ${clearDialogSceneId ? q(clearDialogSceneId) : 'undefined'},
  }`;
    })
    .join(',\n');
  return `import type { Mission } from '../../types';

export const MISSIONS_FROM_CSV: Record<string, Mission> = {
${body}
};
`;
}

function buildMissionCombatCaptains() {
  const rows = loadCsvOptional('mission_combat_captains.csv');
  const body = rows
    .map((row) => {
      const planetId = nullable(row.planetId);
      return `  {
    id: ${q(row.id)},
    enemyTemplateId: ${q(row.enemyTemplateId)},
    planetId: ${planetId ? q(planetId) : 'null'},
    captainId: ${q(row.captainId)},
    priority: ${toInt(row.priority)},
  }`;
    })
    .join(',\n');
  return `export type MissionCombatCaptainRow = {
  id: string;
  enemyTemplateId: string;
  planetId: string | null;
  captainId: string;
  priority: number;
};

export const MISSION_COMBAT_CAPTAINS_FROM_CSV: MissionCombatCaptainRow[] = [
${body}
];
`;
}

function buildPlanetGovernorCommanders() {
  const rows = loadCsv('planet_governor_commanders.csv').filter((r) => String(r.planetId ?? '').trim());
  const body = rows
    .map((row) => {
      return `  {
    planetId: ${q(row.planetId)},
    systemId: ${q(row.systemId)},
    occupationSide: ${q(String(row.occupationSide ?? 'NEUTRAL').trim().toUpperCase())},
    ownershipTier: ${q(row.ownershipTier)},
    governorCaptainId: ${q(row.governorCaptainId)},
    governorTitleKo: ${q(row.governorTitleKo ?? '')},
    hostileToPlayerBlue: ${toBool(row.hostileToPlayerBlue)},
    talkEnabled: ${toBool(row.talkEnabled)},
    talkPriority: ${toInt(row.talkPriority, 5)},
    dialogSceneId: ${q(row.dialogSceneId ?? '')},
    instanceMissionTag: ${q(row.instanceMissionTag ?? '')},
    hostileEntryCombatEnabled: ${toBool(row.hostileEntryCombatEnabled)},
    notesKo: ${q(row.notesKo ?? '')},
  }`;
    })
    .join(',\n');
  return `export type PlanetGovernorCommanderRow = {
  planetId: string;
  systemId: string;
  occupationSide: 'BLUE' | 'RED' | 'NEUTRAL';
  ownershipTier: string;
  governorCaptainId: string;
  governorTitleKo: string;
  hostileToPlayerBlue: boolean;
  talkEnabled: boolean;
  talkPriority: number;
  dialogSceneId: string;
  instanceMissionTag: string;
  hostileEntryCombatEnabled: boolean;
  notesKo: string;
};

export const PLANET_GOVERNOR_COMMANDERS_FROM_CSV: PlanetGovernorCommanderRow[] = [
${body}
];
`;
}

function buildPlanetGovernorReserveCommanders() {
  const rows = loadCsv('planet_governor_reserve_commanders.csv').filter((r) =>
    String(r.captainId ?? '').trim(),
  );
  const body = rows
    .map((row) => {
      return `  {
    captainId: ${q(row.captainId)},
    occupationSide: ${q(String(row.occupationSide ?? 'NEUTRAL').trim().toUpperCase())},
    rankKo: ${q(row.rankKo ?? '')},
    governorTitleKo: ${q(row.governorTitleKo ?? '')},
    dialogSceneId: ${q(row.dialogSceneId ?? '')},
    assignedShipId: ${q(row.assignedShipId ?? '')},
    reserveOrder: ${toInt(row.reserveOrder, 0)},
    enabled: ${toBool(row.enabled)},
    notesKo: ${q(row.notesKo ?? '')},
  }`;
    })
    .join(',\n');
  return `export type PlanetGovernorReserveCommanderRow = {
  captainId: string;
  occupationSide: 'BLUE' | 'RED' | 'NEUTRAL';
  rankKo: string;
  governorTitleKo: string;
  dialogSceneId: string;
  assignedShipId: string;
  reserveOrder: number;
  enabled: boolean;
  notesKo: string;
};

export const PLANET_GOVERNOR_RESERVE_COMMANDERS_FROM_CSV: PlanetGovernorReserveCommanderRow[] = [
${body}
];
`;
}

function buildSystems() {
  const planets = loadCsv('planets.csv');
  const systemConnections = loadCsvOptional('star_system_connections.csv');
  const systemsById = new Map();
  const planetsBySystem = new Map();
  const connectionsBySystem = new Map();
  for (const p of planets) {
    if (!systemsById.has(p.systemId)) {
      systemsById.set(p.systemId, {
        id: p.systemId,
        name: p.systemName,
        nameEn: readCsvEnField(p, 'systemNameEn', 'system_name_en'),
        posX: p.systemPosX,
        posY: p.systemPosY,
        zone: p.systemZone,
        connectionsPipe: p.systemConnectionsPipe,
        enemyLevel: p.systemEnemyLevel,
        description: p.systemDescription,
        descriptionEn: readCsvEnField(p, 'systemDescriptionEn', 'system_description_en'),
      });
    }
    const arr = planetsBySystem.get(p.systemId) ?? [];
    arr.push(p);
    planetsBySystem.set(p.systemId, arr);
  }
  for (const c of systemConnections) {
    const arr = connectionsBySystem.get(c.systemId) ?? [];
    arr.push(c.connectedSystemId);
    connectionsBySystem.set(c.systemId, arr);
  }
  const body = Array.from(systemsById.values())
    .map(s => {
      const pls = (planetsBySystem.get(s.id) ?? [])
        .map(p => {
          // 행성 거래 품목은 planets.csv의 tradeGoodsPipe를 단일 진입점으로 관리
          const goods = splitPipe(p.tradeGoodsPipe);
          const backdropImageAssetKey = nullable(p.backdropImageAssetKey);
          const infoPanelPortraitAssetKey = nullable(p.infoPanelPortraitAssetKey);
          const defaultBackdropImageLayer = Boolean(backdropImageAssetKey);
          const mainStageSkiaNebulaEnabled = toLayerBoolWithDefault(
            p.mainStageSkiaNebulaLayer,
            true,
          );
          const mainStageBackdropImageEnabled = toLayerBoolWithDefault(
            p.mainStageBackdropImageLayer,
            defaultBackdropImageLayer,
          );
          const planetNameEn = readCsvEnField(p, 'nameEn', 'name_en');
          const planetDescEn = readCsvEnField(p, 'descriptionEn', 'description_en');
          return `      {
        id: ${q(p.id)},
        systemId: ${q(p.systemId)},
        name: ${q(p.name)},
        nameEn: ${planetNameEn ? q(planetNameEn) : 'undefined'},
        description: ${q(p.description)},
        descriptionEn: ${planetDescEn ? q(planetDescEn) : 'undefined'},
        hasTradePort: ${toBool(p.hasTradePort)},
        hasShipyard: ${toBool(p.hasShipyard)},
        hasTavern: ${toBool(p.hasTavern)},
        tradeGoods: ${JSON.stringify(goods)},
        factionId: ${q(p.factionId)},
        coreResource: ${Math.min(100, Math.max(0, toInt(p.coreResource, 50)))},
        corePopulation: ${Math.min(100, Math.max(0, toInt(p.corePopulation, 50)))},
        coreDefense: ${Math.min(100, Math.max(0, toInt(p.coreDefense, 50)))},
        coreTechnology: ${Math.min(100, Math.max(0, toInt(p.coreTechnology, 50)))},
        coreEnvironment: ${Math.min(100, Math.max(0, toInt(p.coreEnvironment, 50)))},
        backdropImageAssetKey: ${q(backdropImageAssetKey)},
        infoPanelPortraitAssetKey: ${q(infoPanelPortraitAssetKey)},
        mainStageSkiaNebulaEnabled: ${mainStageSkiaNebulaEnabled},
        mainStageBackdropImageEnabled: ${mainStageBackdropImageEnabled},
      }`;
        })
        .join(',\n');
      const connections = connectionsBySystem.get(s.id) ?? splitPipe(s.connectionsPipe);
      return `  ${JSON.stringify(s.id)}: {
    id: ${q(s.id)},
    name: ${q(s.name)},
    nameEn: ${s.nameEn ? q(s.nameEn) : 'undefined'},
    position: { x: ${toNum(s.posX, 0)}, y: ${toNum(s.posY, 0)} },
    zone: ${q(s.zone)},
    planets: [
${pls}
    ],
    connections: ${JSON.stringify(connections)},
    enemyLevel: ${toInt(s.enemyLevel)},
    description: ${q(s.description)},
    descriptionEn: ${s.descriptionEn ? q(s.descriptionEn) : 'undefined'},
  }`;
    })
    .join(',\n');
  return `import type { StarSystem } from '../../types';

export const STAR_SYSTEMS_FROM_CSV: Record<string, StarSystem> = {
${body}
};
`;
}

function buildMineralEconomy() {
  const itemRows = loadCsv('item_defs.csv').filter(r => String(r.id ?? '').trim());
  const regions = loadCsv('mineral_regions.csv');
  const members = loadCsvOptional('mineral_region_members.csv');
  const pool = itemRows
    .map(r => {
      const tags = splitPipe(r.tagsPipe);
      const attrs = parseAttrsJson(r.attrsJson);
      const fromTag = tags.includes('galactic_mineral');
      const mineralId = String(attrs.poolMineralId || r.id || '').trim();
      if (!fromTag || !mineralId) return null;
      return {
        mineralId,
        displayName: String(r.name || mineralId).trim(),
        poolWeight: toNum(attrs.poolWeight, 1),
      };
    })
    .filter(Boolean);
  const poolBody = pool
    .map(
      r => `  {
    mineralId: ${q(r.mineralId)},
    displayName: ${q(r.displayName)},
    poolWeight: ${toNum(r.poolWeight, 1)},
  }`,
    )
    .join(',\n');
  const regionBody = regions
    .map(
      r => `  {
    id: ${q(r.id)},
    displayName: ${q(r.displayName)},
    clusterShareOfGalaxy: ${toNum(r.clusterShareOfGalaxy, 0)},
  }`,
    )
    .join(',\n');
  const memberBody = members
    .map(
      r => `  {
    regionId: ${q(r.regionId)},
    planetId: ${q(r.planetId)},
  }`,
    )
    .join(',\n');
  return `import type {
  GalacticMineralPoolEntry,
  MineralRegionDef,
  MineralRegionMember,
} from '../../types';

export const GALACTIC_MINERAL_POOL_FROM_CSV: readonly GalacticMineralPoolEntry[] = [
${poolBody}
];

export const MINERAL_REGIONS_FROM_CSV: readonly MineralRegionDef[] = [
${regionBody}
];

export const MINERAL_REGION_MEMBERS_FROM_CSV: readonly MineralRegionMember[] = [
${memberBody}
];
`;
}

function capitalShipTradeItemBasePriceFromShipRow(r) {
  const hp = toInt(r.maxHp, 400);
  const sh = toInt(r.maxShield, 150);
  const ar = toInt(r.armor, 12);
  const atk = toInt(r.attackBonus, 0);
  const dice =
    toInt(r.damageDiceCount, 2) * toInt(r.damageDiceSides, 8) + toInt(r.damageDiceBonus, 0);
  const raw = Math.round(hp * 42 + sh * 36 + ar * 520 + atk * 880 + dice * 35);
  return Math.min(220000, Math.max(14000, raw));
}

function verifyTradeRouteItemDefs(rows) {
  const errors = [];
  for (const r of rows) {
    const id = String(r.id ?? '').trim();
    const type = String(r.type ?? '').trim();
    if (!id.startsWith('tg_') && type !== 'trade_route') continue;
    const attrs = parseAttrsJson(r.attrsJson);
    const tradeRoute = attrs.tradeRoute === true || attrs.tradeRoute === 'true';
    if (!tradeRoute) {
      errors.push(`${id}: attrsJson.tradeRoute missing — CSV attrsJson 손상 또는 파싱 실패`);
    }
  }
  if (errors.length > 0) {
    const preview = errors.slice(0, 8).join('\n  ');
    const suffix = errors.length > 8 ? `\n  ... 외 ${errors.length - 8}건` : '';
    throw new Error(
      `[build-content-from-csv] item_defs 교역품 검증 실패 (${errors.length}건)\n  ${preview}${suffix}`,
    );
  }
}

function readCsvEnField(r, ...keys) {
  for (const k of keys) {
    const v = String(r[k] ?? '').trim();
    if (v) return v;
  }
  return undefined;
}

function buildItemDefs() {
  const rows = loadCsv('item_defs.csv').filter(r => String(r.id ?? '').trim());
  const weaponRows = loadCsvOptional('weapon_list.csv')
    .map(normalizeWeaponListRow)
    .filter(Boolean);
  const shipRows = loadCsv('npc_ai_ships.csv').filter(
    r => String(r.id ?? '').trim() && toBool(r.tradePortListed),
  );
  const manualIds = new Set(rows.map(r => String(r.id ?? '').trim()));
  const weaponItemRows = weaponRows
    .map(r => {
      const weaponId = r.id;
      const itemId = `weapon_item_${weaponId}`;
      if (!weaponId || manualIds.has(itemId)) return null;
      const name = r.name;
      const damage = r.damage;
      const rangePx = r.rangePx;
      const speed = r.projectileSpeedPxPerSec;
      const basePrice = r.purchasePrice > 0
        ? String(r.purchasePrice)
        : String(Math.max(600, Math.floor(damage * 280 + rangePx * 2 + speed * 0.6)));
      return {
        id: itemId,
        name,
        nameEn: r.nameEn,
        description: `${r.familyKind.toUpperCase()} · DMG ${damage} · RANGE ${Math.round(rangePx)}`,
        descriptionEn: `${r.familyKind.toUpperCase()} · DMG ${damage} · RANGE ${Math.round(rangePx)}`,
        featureDescription: r.featureDescription,
        featureDescriptionEn: r.featureDescriptionEn,
        basePrice,
        priceVariance: '0',
        volume: '1',
        category: 'weapon',
        kind: 'equipment',
        type: 'weapon_module',
        tradeable: r.tradePortListed ? 'true' : 'false',
        sellable: 'true',
        cargoHoldable: 'true',
        capitalShipMountable: 'true',
        nonRepurchase: 'false',
        tagsPipe: 'weapon_module',
        attrsJson: JSON.stringify({
          weaponId,
          weaponKind: r.combatKind,
          weaponFamilyKind: r.familyKind,
          weaponRequiredLevel: r.requiredLevel,
          ...(r.tierLabel ? { weaponTierLabel: r.tierLabel } : {}),
          damage,
          rangePx,
          projectileSpeedPxPerSec: speed,
          salvoCount: r.salvoCount,
          lockImpactPoint: r.lockImpactPoint,
        }),
      };
    })
    .filter(Boolean);
  const shipItemRows = shipRows
    .filter(r => !manualIds.has(`capital_ship_${String(r.id).trim()}`))
    .map(r => {
      const npcId = String(r.id).trim();
      const id = `capital_ship_${npcId}`;
      const shipName = String(r.name ?? '').trim() || npcId;
      const shipNameEn = readCsvEnField(r, 'nameEn', 'name_en');
      const basePrice = capitalShipTradeItemBasePriceFromShipRow(r);
      return {
        id,
        name: `${shipName} (인도)`,
        nameEn: shipNameEn ? `${shipNameEn} (Delivery)` : `${shipName} (Delivery)`,
        description:
          '무역소 전함 인도. 구매 시 해당 전함이 조선소 격납고에 보관됩니다.',
        descriptionEn:
          'Capital ship delivery from the trade port. The purchased ship is stored in your shipyard hangar.',
        featureDescription: readFeatureDescription(r),
        featureDescriptionEn: readCsvEnField(r, 'featureDescriptionEn', 'featureDescription_en', '특징설명_en'),
        basePrice: String(basePrice),
        priceVariance: '14',
        volume: '1',
        category: 'luxury',
        kind: 'misc',
        type: 'capital_ship',
        tradeable: 'true',
        sellable: 'false',
        cargoHoldable: 'false',
        capitalShipMountable: 'false',
        nonRepurchase: 'false',
        tagsPipe: 'capital_ship|trade_port',
        attrsJson: JSON.stringify({ npcCapitalShipId: npcId }),
      };
    });
  const merged = [...rows, ...weaponItemRows, ...shipItemRows];
  verifyTradeRouteItemDefs(merged);
  const body = merged
    .map(
      r => {
        const tags = splitPipe(r.tagsPipe);
        const attrs = parseAttrsJson(r.attrsJson);
        const hasExplicitSellable = String(r.sellable ?? '').trim() !== '';
        const legacyNoResale = tags.includes('no_resale') || attrs.noResale === true;
        const sellable = hasExplicitSellable ? toBool(r.sellable) : !legacyNoResale;
        return `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    name: ${q(r.name)},
    nameEn: ${r.nameEn ? q(r.nameEn) : readCsvEnField(r, 'nameEn', 'name_en') ? q(readCsvEnField(r, 'nameEn', 'name_en')) : 'undefined'},
    description: ${q(r.description)},
    descriptionEn: ${r.descriptionEn ? q(r.descriptionEn) : readCsvEnField(r, 'descriptionEn', 'description_en') ? q(readCsvEnField(r, 'descriptionEn', 'description_en')) : 'undefined'},
    featureDescription: ${q(readFeatureDescription(r) || r.description)},
    featureDescriptionEn: ${r.featureDescriptionEn ? q(r.featureDescriptionEn) : readCsvEnField(r, 'featureDescriptionEn', 'featureDescription_en', '특징설명_en') ? q(readCsvEnField(r, 'featureDescriptionEn', 'featureDescription_en', '특징설명_en')) : 'undefined'},
    basePrice: ${toInt(r.basePrice)},
    priceVariance: ${toInt(r.priceVariance)},
    volume: ${toInt(r.volume)},
    category: ${q(r.category)},
    kind: ${q(r.kind || 'trade_good')},
    type: ${q(r.type || '')},
    tradeable: ${toBool(r.tradeable)},
    sellable: ${sellable},
    cargoHoldable: ${String(r.cargoHoldable ?? '').trim() === '' ? true : toBool(r.cargoHoldable)},
    capitalShipMountable: ${String(r.capitalShipMountable ?? '').trim() === '' ? false : toBool(r.capitalShipMountable)},
    nonRepurchase: ${String(r.nonRepurchase ?? '').trim() === '' ? false : toBool(r.nonRepurchase)},
    tags: ${JSON.stringify(tags)},
    attrs: ${JSON.stringify(attrs)},
  }`;
      },
    )
    .join(',\n');
  return `import type { ItemDef } from '../../types';

export const ITEM_DEFS_FROM_CSV: Record<string, ItemDef> = {
${body}
};
`;
}

function buildSkills() {
  const rows = loadCsvOptional('skills.csv').filter(r => String(r.id ?? '').trim());
  const body = rows
    .map(
      r => `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    name: ${q(r.name)},
    description: ${q(r.description)},
    category: ${q(r.category || 'combat')},
    tier: ${toInt(r.tier, 1)},
    prerequisiteIds: ${JSON.stringify(splitPipe(r.prerequisiteIdsPipe))},
    levelRequired: ${toInt(r.levelRequired, 1)},
    effect: {
      type: ${q(r.effectType || 'passive')},
      stat: ${toNumOptional(r.effectValue) === undefined ? 'undefined' : q(r.effectStat || '')},
      value: ${toNumOptional(r.effectValue) === undefined ? 'undefined' : toNum(r.effectValue, 0)},
      description: ${q(r.effectDescription || '')},
    },
    icon: ${q(r.icon || '✦')},
  }`,
    )
    .join(',\n');
  return `import type { Skill } from '../../types';

export const SKILLS_FROM_CSV: Record<string, Skill> = {
${body}
};
`;
}

function buildPlayerLevelExp() {
  const rows = loadCsvOptional('player_level_exp.csv').filter(r => String(r.level ?? '').trim());
  const body = rows
    .map(r => `  {
    level: ${toInt(r.level)},
    currentExp: ${toInt(r.currentExp)},
    nextLevelExp: ${toNumOptional(r.nextLevelExp) === undefined ? 'null' : toInt(r.nextLevelExp)},
  }`)
    .join(',\n');
  return `export type PlayerLevelExpRow = {
  level: number;
  currentExp: number;
  nextLevelExp: number | null;
};

export const PLAYER_LEVEL_EXP_FROM_CSV: readonly PlayerLevelExpRow[] = [
${body}
];
`;
}

function buildEnemyTemplates() {
  const rows = loadCsvOptional('enemy_templates.csv').filter(r => String(r.id ?? '').trim());
  const body = rows
    .map(r => `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    name: ${q(r.name)},
    level: ${toInt(r.level, 1)},
    hp: ${toInt(r.hp, 1)},
    shield: ${toInt(r.shield, 0)},
    armor: ${toInt(r.armor, 10)},
    attackBonus: ${toInt(r.attackBonus, 0)},
    damageDiceCount: ${toInt(r.damageDiceCount, 1)},
    damageDiceSides: ${toInt(r.damageDiceSides, 6)},
    damageDiceBonus: ${toInt(r.damageDiceBonus, 0)},
    expReward: ${toInt(r.expReward, 0)},
    creditReward: ${toInt(r.creditReward, 0)},
  }`)
    .join(',\n');
  return `export type EnemyTemplateCsvRow = {
  id: string;
  name: string;
  level: number;
  hp: number;
  shield: number;
  armor: number;
  attackBonus: number;
  damageDiceCount: number;
  damageDiceSides: number;
  damageDiceBonus: number;
  expReward: number;
  creditReward: number;
};

export const ENEMY_TEMPLATES_FROM_CSV: Record<string, EnemyTemplateCsvRow> = {
${body}
};
`;
}

function buildPlayerProfessions() {
  const rows = loadCsvOptional('player_professions.csv')
    .filter(r => String(r.id ?? '').trim())
    .sort((a, b) => toInt(a.sortOrder, 0) - toInt(b.sortOrder, 0));
  const body = rows
    .map(r => `  ${JSON.stringify(r.id)}: {
    id: ${q(r.id)},
    sortOrder: ${toInt(r.sortOrder, 0)},
    nameKo: ${q(r.nameKo || r.id)},
    nameEn: ${readCsvEnField(r, 'nameEn', 'name_en') ? q(readCsvEnField(r, 'nameEn', 'name_en')) : 'undefined'},
    labelKo: ${q(r.labelKo || '')},
    labelEn: ${readCsvEnField(r, 'labelEn', 'label_en') ? q(readCsvEnField(r, 'labelEn', 'label_en')) : 'undefined'},
    gender: ${q((r.gender || 'male').trim())},
    summaryKo: ${q(r.summaryKo || '')},
    summaryEn: ${readCsvEnField(r, 'summaryEn', 'summary_en') ? q(readCsvEnField(r, 'summaryEn', 'summary_en')) : 'undefined'},
    personalityKo: ${q(r.personalityKo || '')},
    personalityEn: ${readCsvEnField(r, 'personalityEn', 'personality_en') ? q(readCsvEnField(r, 'personalityEn', 'personality_en')) : 'undefined'},
    traitIds: ${JSON.stringify(String(r.traitIdsPipe || '').split('|').map(s => s.trim()).filter(Boolean))},
    portraitImageAssetKey: ${q(r.portraitImageAssetKey || '')},
    combatArchetype: ${q((r.combatArchetype || 'neutral').trim())},
    socialStats: {
      wisdom: ${toInt(r.statWisdom, 10)},
      charisma: ${toInt(r.statCharisma, 10)},
    },
  }`)
    .join(',\n');
  return `import type { CapitalShipArchetype, PlayerPilotGender, PlayerStats } from '../../types';

export type PlayerProfessionCsvRow = {
  id: string;
  sortOrder: number;
  nameKo: string;
  nameEn?: string;
  labelKo: string;
  labelEn?: string;
  gender: PlayerPilotGender;
  summaryKo: string;
  summaryEn?: string;
  personalityKo: string;
  personalityEn?: string;
  traitIds: string[];
  portraitImageAssetKey: string;
  combatArchetype: CapitalShipArchetype;
  socialStats: PlayerStats;
};

export const PLAYER_PROFESSIONS_FROM_CSV: Record<string, PlayerProfessionCsvRow> = {
${body}
};

export const PLAYER_PROFESSION_LIST_FROM_CSV: readonly PlayerProfessionCsvRow[] = [
${rows.map(r => `  PLAYER_PROFESSIONS_FROM_CSV[${JSON.stringify(r.id)}]!,`).join('\n')}
];
`;
}

function buildStoryScenes() {
  const scenes = loadCsvOptional('story_scenes.csv').filter(r => String(r.id ?? '').trim());
  const pages = loadCsvOptional('story_scene_pages.csv').filter(r => String(r.sceneId ?? '').trim());
  const pagesByScene = new Map();
  for (const p of pages) {
    const arr = pagesByScene.get(p.sceneId) ?? [];
    arr.push(p);
    pagesByScene.set(p.sceneId, arr);
  }

  const body = scenes
    .map((s) => {
      const pageRows = (pagesByScene.get(s.id) ?? [])
        .sort((a, b) => toInt(a.pageIndex, 0) - toInt(b.pageIndex, 0))
        .map((p) => `      {
        sceneId: ${q(s.id)},
        pageIndex: ${toInt(p.pageIndex, 0)},
        label: ${q(p.label || '')},
        text: ${q(unescapeStoryText(p.text || ''))},
        labelEn: ${q(nullable(p.label_en))},
        textEn: ${String(p.text_en ?? '').trim() === '' ? 'null' : q(unescapeStoryText(p.text_en))},
        imageAssetKey: ${q(nullable(p.imageAssetKey))},
        speakerNpcCaptainId: ${q(nullable(p.speakerNpcCaptainId))},
        viewMode: ${q((p.viewMode || 'cinematic').trim() || 'cinematic')},
        textBoxPreset: ${q((p.textBoxPreset || 'default').trim() || 'default')},
        imageScalePct: ${toInt(p.imageScalePct, 100)},
      }`)
        .join(',\n');

      return `  ${JSON.stringify(s.id)}: {
    id: ${q(s.id)},
    displayName: ${q(s.displayName || s.id)},
    triggerKey: ${q(s.triggerKey || 'manual')},
    triggerTargetId: ${q(nullable(s.triggerTargetId))},
    triggerRepeat: ${q(s.triggerRepeat || 'once')},
    maxLinesPerPage: ${toInt(s.maxLinesPerPage, 5)},
    completionPolicy: ${q(s.completionPolicy || 'none')},
    nextRoute: ${q(nullable(s.nextRoute))},
    skippable: ${String(s.skippable ?? '').trim() === '' ? true : toBool(s.skippable)},
    typewriterSpeedMs: ${toInt(s.typewriterSpeedMs, 40)},
    fadeInEnabled: ${String(s.fadeInEnabled ?? '').trim() === '' ? true : toBool(s.fadeInEnabled)},
    fadeInDurationMs: ${toInt(s.fadeInDurationMs, 700)},
    fadeOutEnabled: ${String(s.fadeOutEnabled ?? '').trim() === '' ? true : toBool(s.fadeOutEnabled)},
    fadeOutDurationMs: ${toInt(s.fadeOutDurationMs, 600)},
    pages: [
${pageRows}
    ],
  }`;
    })
    .join(',\n');

  return `import type { StorySceneDef } from '../../types';

export const STORY_SCENES_FROM_CSV: Record<string, StorySceneDef> = {
${body}
};
`;
}

function writeOut(fileName, content) {
  writeFileSync(resolve(OUT_DIR, fileName), `// AUTO-GENERATED by tools/content-tables/build-content-from-csv.mjs\n${content}`, 'utf8');
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  writeOut('csvShipTemplates.ts', buildShips());
  writeOut('csvNpcCaptains.ts', buildNpcCaptains());
  writeOut('csvNpcCapitalShips.ts', buildNpcShips());
  writeOut('csvNpcCapitalShipEquipSlots.ts', buildNpcCapitalShipEquipSlots());
  writeOut('csvWeapons.ts', buildWeapons());
  writeOut('csvMissions.ts', buildMissions());
  writeOut('csvMissionCombatCaptains.ts', buildMissionCombatCaptains());
  writeOut('csvPlanetGovernorCommanders.ts', buildPlanetGovernorCommanders());
  writeOut('csvPlanetGovernorReserveCommanders.ts', buildPlanetGovernorReserveCommanders());
  writeOut('csvSystems.ts', buildSystems());
  writeOut('csvMineralEconomy.ts', buildMineralEconomy());
  writeOut('csvPlayerLevelExp.ts', buildPlayerLevelExp());
  writeOut('csvEnemyTemplates.ts', buildEnemyTemplates());
  writeOut('csvItemDefs.ts', buildItemDefs());
  writeOut('csvSkills.ts', buildSkills());
  writeOut('csvPlayerProfessions.ts', buildPlayerProfessions());
  writeOut('csvStoryScenes.ts', buildStoryScenes());
  writeOut(
    'index.ts',
    `export { SHIP_TEMPLATES_FROM_CSV } from './csvShipTemplates';
export { NPC_CAPTAINS_FROM_CSV } from './csvNpcCaptains';
export {
  NPC_CAPITAL_SHIPS_FROM_CSV,
  NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV,
  type NpcCapitalShipCombatRuntimeConfig,
} from './csvNpcCapitalShips';
export {
  NPC_CAPITAL_SHIP_EQUIP_SLOTS_FROM_CSV,
  type NpcCapitalShipEquipSlotRow,
} from './csvNpcCapitalShipEquipSlots';
export { CAPITAL_WEAPON_LIST_FROM_CSV, type CapitalWeaponCsvRow } from './csvWeapons';
export { MISSIONS_FROM_CSV } from './csvMissions';
export {
  MISSION_COMBAT_CAPTAINS_FROM_CSV,
  type MissionCombatCaptainRow,
} from './csvMissionCombatCaptains';
export {
  PLANET_GOVERNOR_COMMANDERS_FROM_CSV,
  type PlanetGovernorCommanderRow,
} from './csvPlanetGovernorCommanders';
export {
  PLANET_GOVERNOR_RESERVE_COMMANDERS_FROM_CSV,
  type PlanetGovernorReserveCommanderRow,
} from './csvPlanetGovernorReserveCommanders';
export { STAR_SYSTEMS_FROM_CSV } from './csvSystems';
export {
  GALACTIC_MINERAL_POOL_FROM_CSV,
  MINERAL_REGIONS_FROM_CSV,
  MINERAL_REGION_MEMBERS_FROM_CSV,
} from './csvMineralEconomy';
export { PLAYER_LEVEL_EXP_FROM_CSV, type PlayerLevelExpRow } from './csvPlayerLevelExp';
export { ENEMY_TEMPLATES_FROM_CSV, type EnemyTemplateCsvRow } from './csvEnemyTemplates';
export { ITEM_DEFS_FROM_CSV } from './csvItemDefs';
export { SKILLS_FROM_CSV } from './csvSkills';
export { STORY_SCENES_FROM_CSV } from './csvStoryScenes';
export {
  PLAYER_PROFESSIONS_FROM_CSV,
  PLAYER_PROFESSION_LIST_FROM_CSV,
  type PlayerProfessionCsvRow,
} from './csvPlayerProfessions';
`,
  );
  console.log('Generated CSV-driven content TS files at src/data/generated');
}

main();
