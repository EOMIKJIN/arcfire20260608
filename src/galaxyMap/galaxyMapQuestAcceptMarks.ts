/**
 * 은하 지도 — 수락한 메인·정식 서브의 현재 세부미션 목적지 다이아.
 *
 * 복구: GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED = false
 *       → 계산 스킵 · Path 미표시 · 지금 지도와 동일
 *
 * 미수락·바 sandbox_001–033 은 찍지 않음.
 * 튜토리얼 mission_* 현재 세부미션 목적지는 녹색(tutorial)만 찍음.
 * 여행 안개로 노드가 꺼진 성계에도 찍음(좌표만 있으면).
 * 메인 = ready story_* · 서브 = 챕터1 정식 13종(sandbox_034–038 · 056–063).
 */
import type { Mission, MissionObjective, MissionProgress } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated/csvMissions';
import {
  MAIN_STORY_CHAIN_STEPS_FROM_CSV,
  MAIN_STORY_QUESTS_FROM_CSV,
} from '../data/generated/csvMainStorySpine';
import { STAR_SYSTEMS } from '../data/systems';
import { CHAPTER1_NAMED_SIDE_QUEST_IDS } from '../missions/missionTrack';
import { getCurrentSequentialObjective } from '../missions/missionObjectiveSequence';
import { MISSION_QUEST_COMBAT_OPS_FROM_CSV } from '../data/generated/csvMissionQuestCombatOps';
import { MISSION_QUEST_PLACEMENTS_FROM_CSV } from '../data/generated/csvMissionQuestPlacements';

let planetToSystemId: Map<string, string> | null = null;

function getCsvMission(missionId: string): Mission | undefined {
  return MISSIONS_FROM_CSV[missionId];
}

/** 코어 21 + `synth_*_p` → `synth_*`. galaxy100/RN 초상 경로를 타지 않는다. */
function resolvePlanetToSystemId(planetId: string): string | null {
  const id = planetId.trim();
  if (!id) return null;
  if (!planetToSystemId) {
    const map = new Map<string, string>();
    const systems = Object.values(STAR_SYSTEMS);
    for (let i = 0; i < systems.length; i += 1) {
      const sys = systems[i]!;
      const planets = sys.planets;
      for (let j = 0; j < planets.length; j += 1) {
        map.set(planets[j]!.id, sys.id);
      }
    }
    planetToSystemId = map;
  }
  const hit = planetToSystemId.get(id);
  if (hit) return hit;
  if (id.startsWith('synth_') && id.endsWith('_p') && id.length > 7) {
    return id.slice(0, -2);
  }
  return null;
}

function extractPlanetIdFromTarget(targetId: string): string | null {
  const raw = targetId.trim();
  if (!raw) return null;
  const pipe = raw.indexOf('|');
  if (pipe >= 0) {
    const planetId = raw.slice(pipe + 1).trim();
    return planetId || null;
  }
  return raw;
}

/** 현재 세부미션 성계. 행성/성계를 못 읽으면 null — offer 폴백 없음. */
export function resolveObjectiveDestSystemId(obj: MissionObjective): string | null {
  const raw = (obj.targetId ?? '').trim();
  if (!raw) return null;

  if (obj.type === 'reach_system') {
    if (STAR_SYSTEMS[raw]) return raw;
    return resolvePlanetToSystemId(raw);
  }

  if (
    obj.type === 'reach_planet' ||
    obj.type === 'talk_npc' ||
    obj.type === 'deliver_cargo'
  ) {
    const planetId = extractPlanetIdFromTarget(raw);
    return planetId ? resolvePlanetToSystemId(planetId) : null;
  }

  const pipe = raw.indexOf('|');
  if (pipe >= 0) {
    const planetId = raw.slice(pipe + 1).trim();
    return planetId ? resolvePlanetToSystemId(planetId) : null;
  }
  return null;
}

function resolveActiveDestSystemId(
  mission: Mission,
  progress: MissionProgress | undefined,
): string | null {
  if (progress?.status !== 'active') return null;
  const obj = getCurrentSequentialObjective(mission, progress);
  if (!obj) return null;
  return resolveObjectiveDestSystemId(obj);
}

/** 문제 시 false. persist 없음. */
export const GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED = true;

/** 점유 블루·ZONE safe 블루와 구분 */
export const GALAXY_MAP_QUEST_MARK_MAIN_FILL = '#4DA3FF';
export const GALAXY_MAP_QUEST_MARK_MAIN_STROKE = '#163A72';
/** 허브 흰점과 위치·형태로 구분. 어두운 테두리로 성운 위 가독 */
export const GALAXY_MAP_QUEST_MARK_SIDE_FILL = '#FFFFFF';
export const GALAXY_MAP_QUEST_MARK_SIDE_STROKE = 'rgba(16,22,36,0.88)';
/** 튜토리얼 mission_* 목적지. 점유 블루·메인 다이아와 구분 */
export const GALAXY_MAP_QUEST_MARK_TUTORIAL_FILL = '#3DDC7A';
export const GALAXY_MAP_QUEST_MARK_TUTORIAL_STROKE = '#0E3D22';
export const GALAXY_MAP_QUEST_MARK_STROKE_WIDTH = 0.9;

/** 다이아 중심→꼭짓점 (원 r=8 위, 작게·인지 가능) */
export const GALAXY_MAP_QUEST_MARK_HALF_PX = 3.15;
/** 성계 원 꼭대기 ↔ 다이아 하단 */
export const GALAXY_MAP_QUEST_MARK_ABOVE_GAP_PX = 3.4;
/** 메인+서브 동시 — 좌 블루 · 우 흰 */
export const GALAXY_MAP_QUEST_MARK_PAIR_DX_PX = 5.4;

export type GalaxyMapQuestAcceptMarkSlot = 'solo' | 'main' | 'side' | 'tutorial';

export type GalaxyMapQuestAcceptMarkFlags = {
  readonly main: boolean;
  readonly side: boolean;
  /** 튜토리얼 mission_* 만. 없으면 필드 자체를 두지 않는다. */
  readonly tutorial?: boolean;
};

export type GalaxyMapQuestAcceptMarks = Readonly<
  Record<string, GalaxyMapQuestAcceptMarkFlags>
>;

export const EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS: GalaxyMapQuestAcceptMarks =
  Object.freeze({});

export type ResolveGalaxyMapQuestAcceptMarksInput = {
  enabled: boolean;
  progresses: Record<string, MissionProgress>;
};

let readyMainBindIds: string[] | null = null;

function listReadyMainStoryBindIds(): readonly string[] {
  if (readyMainBindIds) return readyMainBindIds;
  const ids: string[] = [];
  const seen = new Set<string>();
  const quests = MAIN_STORY_QUESTS_FROM_CSV;
  for (let i = 0; i < quests.length; i += 1) {
    const row = quests[i]!;
    if (row.contentStatus !== 'ready' || !row.bindMissionId) continue;
    if (seen.has(row.bindMissionId)) continue;
    seen.add(row.bindMissionId);
    ids.push(row.bindMissionId);
  }
  const steps = MAIN_STORY_CHAIN_STEPS_FROM_CSV;
  for (let i = 0; i < steps.length; i += 1) {
    const row = steps[i]!;
    if (row.contentStatus !== 'ready' || !row.bindMissionId) continue;
    if (seen.has(row.bindMissionId)) continue;
    seen.add(row.bindMissionId);
    ids.push(row.bindMissionId);
  }
  readyMainBindIds = ids;
  return ids;
}

function markSystem(
  out: Record<string, { main: boolean; side: boolean; tutorial?: boolean }>,
  systemId: string,
  kind: 'main' | 'side' | 'tutorial',
): void {
  const prev = out[systemId];
  if (prev) {
    if (kind === 'main') prev.main = true;
    else if (kind === 'side') prev.side = true;
    else prev.tutorial = true;
    return;
  }
  out[systemId] = {
    main: kind === 'main',
    side: kind === 'side',
    ...(kind === 'tutorial' ? { tutorial: true } : {}),
  };
}

let tutorialMissionIds: string[] | null = null;
let combatAnchorByObjectiveId: Map<string, string> | null = null;
let placementPlanetByObjectiveId: Map<string, string> | null = null;

function listTutorialMissionIds(): readonly string[] {
  if (tutorialMissionIds) return tutorialMissionIds;
  const ids: string[] = [];
  const keys = Object.keys(MISSIONS_FROM_CSV);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i]!;
    if (id.startsWith('mission_')) ids.push(id);
  }
  tutorialMissionIds = ids;
  return ids;
}

function combatAnchorPlanetId(objectiveId: string): string | null {
  if (!combatAnchorByObjectiveId) {
    const map = new Map<string, string>();
    const rows = MISSION_QUEST_COMBAT_OPS_FROM_CSV;
    for (let i = 0; i < rows.length; i += 1) {
      const planetId = rows[i]!.anchorPlanetId?.trim() ?? '';
      if (planetId) map.set(rows[i]!.objectiveId, planetId);
    }
    combatAnchorByObjectiveId = map;
  }
  return combatAnchorByObjectiveId.get(objectiveId) ?? null;
}

function placementPlanetId(objectiveId: string): string | null {
  if (!placementPlanetByObjectiveId) {
    const map = new Map<string, string>();
    const rows = MISSION_QUEST_PLACEMENTS_FROM_CSV;
    for (let i = 0; i < rows.length; i += 1) {
      const planetId = rows[i]!.planetId.trim();
      if (planetId) map.set(rows[i]!.objectiveId, planetId);
    }
    placementPlanetByObjectiveId = map;
  }
  return placementPlanetByObjectiveId.get(objectiveId) ?? null;
}

/** 튜토리얼만 — 격파 앵커·구매 배치 행성. 본편 격파는 여기로 넘기지 않는다. */
function resolveTutorialObjectiveDestSystemId(obj: MissionObjective): string | null {
  const direct = resolveObjectiveDestSystemId(obj);
  if (direct) return direct;
  if (obj.type === 'defeat_enemy') {
    const planetId = combatAnchorPlanetId(obj.id);
    return planetId ? resolvePlanetToSystemId(planetId) : null;
  }
  if (obj.type === 'buy_goods') {
    const planetId = placementPlanetId(obj.id);
    return planetId ? resolvePlanetToSystemId(planetId) : null;
  }
  return null;
}

export function resolveQuestMarkCenter(
  nodeX: number,
  nodeY: number,
  nodeR: number,
  slot: GalaxyMapQuestAcceptMarkSlot,
): { x: number; y: number } {
  const y = nodeY - nodeR - GALAXY_MAP_QUEST_MARK_ABOVE_GAP_PX - GALAXY_MAP_QUEST_MARK_HALF_PX;
  if (slot === 'main') {
    return { x: nodeX - GALAXY_MAP_QUEST_MARK_PAIR_DX_PX, y };
  }
  if (slot === 'side') {
    return { x: nodeX + GALAXY_MAP_QUEST_MARK_PAIR_DX_PX, y };
  }
  if (slot === 'tutorial') {
    const lift = GALAXY_MAP_QUEST_MARK_HALF_PX * 2 + 2;
    return { x: nodeX, y: y - lift };
  }
  return { x: nodeX, y };
}

export function diamondPathD(cx: number, cy: number, half = GALAXY_MAP_QUEST_MARK_HALF_PX): string {
  const x = cx.toFixed(1);
  const y = cy.toFixed(1);
  const t = (cy - half).toFixed(1);
  const r = (cx + half).toFixed(1);
  const b = (cy + half).toFixed(1);
  const l = (cx - half).toFixed(1);
  return `M${x} ${t}L${r} ${y}L${x} ${b}L${l} ${y}Z`;
}

/** 구독 축소 — 활성 본편/정식 서브의 현재 세부미션 id만. */
export function readGalaxyMapQuestAcceptMarkRevision(
  progresses: Record<string, MissionProgress>,
): string {
  const mains = listReadyMainStoryBindIds();
  let main = '';
  for (let i = 0; i < mains.length; i += 1) {
    const id = mains[i]!;
    const progress = progresses[id];
    if (progress?.status !== 'active') continue;
    const mission = getCsvMission(id);
    const obj = mission ? getCurrentSequentialObjective(mission, progress) : undefined;
    main += `${id}:${obj?.id ?? '.'};`;
  }
  let side = '';
  const tutorials = listTutorialMissionIds();
  let tutorial = '';
  for (let i = 0; i < tutorials.length; i += 1) {
    const id = tutorials[i]!;
    const progress = progresses[id];
    if (progress?.status !== 'active') continue;
    const mission = getCsvMission(id);
    const obj = mission ? getCurrentSequentialObjective(mission, progress) : undefined;
    tutorial += `${id}:${obj?.id ?? '.'};`;
  }
  for (let i = 0; i < CHAPTER1_NAMED_SIDE_QUEST_IDS.length; i += 1) {
    const id = CHAPTER1_NAMED_SIDE_QUEST_IDS[i]!;
    const progress = progresses[id];
    if (progress?.status !== 'active') continue;
    const mission = getCsvMission(id);
    const obj = mission ? getCurrentSequentialObjective(mission, progress) : undefined;
    side += `${id}:${obj?.id ?? '.'};`;
  }
  return `${main}|${side}|${tutorial}`;
}

export function resolveGalaxyMapQuestAcceptMarks(
  input: ResolveGalaxyMapQuestAcceptMarksInput,
): GalaxyMapQuestAcceptMarks {
  if (!input.enabled) return EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS;

  const out: Record<string, { main: boolean; side: boolean; tutorial?: boolean }> = {};
  const { progresses } = input;

  const mains = listReadyMainStoryBindIds();
  for (let i = 0; i < mains.length; i += 1) {
    const mission = getCsvMission(mains[i]!);
    if (!mission) continue;
    const systemId = resolveActiveDestSystemId(mission, progresses[mission.id]);
    if (systemId) markSystem(out, systemId, 'main');
  }

  for (let i = 0; i < CHAPTER1_NAMED_SIDE_QUEST_IDS.length; i += 1) {
    const mission = getCsvMission(CHAPTER1_NAMED_SIDE_QUEST_IDS[i]!);
    if (!mission) continue;
    const systemId = resolveActiveDestSystemId(mission, progresses[mission.id]);
    if (systemId) markSystem(out, systemId, 'side');
  }

  const tutorials = listTutorialMissionIds();
  for (let i = 0; i < tutorials.length; i += 1) {
    const mission = getCsvMission(tutorials[i]!);
    if (!mission) continue;
    const progress = progresses[mission.id];
    if (progress?.status !== 'active') continue;
    const obj = getCurrentSequentialObjective(mission, progress);
    if (!obj) continue;
    const systemId = resolveTutorialObjectiveDestSystemId(obj);
    if (systemId) markSystem(out, systemId, 'tutorial');
  }

  return Object.keys(out).length === 0 ? EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS : out;
}
