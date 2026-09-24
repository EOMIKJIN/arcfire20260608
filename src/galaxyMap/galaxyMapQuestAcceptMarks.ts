/**
 * 은하 지도 — 수락 전 퀘스트 위치 다이아.
 *
 * 복구: GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED = false
 *       → 계산 스킵 · Path 미표시 · 지금 지도와 동일
 *
 * 수락·진행·완료 전이면 offer 성계에 표시. 레벨·선행 미달은 숨기지 않음.
 * visibleSystemIds = 여행 안개가 풀린 성계만. 안개 밖은 찍지 않음.
 * 메인 = ready story_* · 서브 = 챕터1 정식 5종(sandbox_034–038).
 * 바 의뢰 sandbox_001–033 · 목적지 행성은 찍지 않음.
 */
import type { Mission, MissionProgress } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated/csvMissions';
import {
  MAIN_STORY_CHAIN_STEPS_FROM_CSV,
  MAIN_STORY_QUESTS_FROM_CSV,
} from '../data/generated/csvMainStorySpine';
import { STAR_SYSTEMS } from '../data/systems';
import {
  CHAPTER1_NAMED_SIDE_QUEST_IDS,
} from '../missions/missionTrack';

let planetToSystemId: Map<string, string> | null = null;

function getCsvMission(missionId: string): Mission | undefined {
  return MISSIONS_FROM_CSV[missionId];
}

/** 코어 21 + `synth_*_p` → `synth_*`. galaxy100/RN 초상 경로를 타지 않는다. */
function resolveOfferSystemId(planetId: string): string | null {
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

/** 문제 시 false. persist 없음. */
export const GALAXY_MAP_QUEST_ACCEPT_MARKS_ENABLED = true;

/** 점유 블루·ZONE safe 블루와 구분 */
export const GALAXY_MAP_QUEST_MARK_MAIN_FILL = '#4DA3FF';
export const GALAXY_MAP_QUEST_MARK_MAIN_STROKE = '#163A72';
/** 허브 흰점과 위치·형태로 구분. 어두운 테두리로 성운 위 가독 */
export const GALAXY_MAP_QUEST_MARK_SIDE_FILL = '#FFFFFF';
export const GALAXY_MAP_QUEST_MARK_SIDE_STROKE = 'rgba(16,22,36,0.88)';
export const GALAXY_MAP_QUEST_MARK_STROKE_WIDTH = 0.9;

/** 다이아 중심→꼭짓점 (원 r=8 위, 작게·인지 가능) */
export const GALAXY_MAP_QUEST_MARK_HALF_PX = 3.15;
/** 성계 원 꼭대기 ↔ 다이아 하단 */
export const GALAXY_MAP_QUEST_MARK_ABOVE_GAP_PX = 3.4;
/** 메인+서브 동시 — 좌 블루 · 우 흰 */
export const GALAXY_MAP_QUEST_MARK_PAIR_DX_PX = 5.4;

export type GalaxyMapQuestAcceptMarkSlot = 'solo' | 'main' | 'side';

export type GalaxyMapQuestAcceptMarkFlags = {
  readonly main: boolean;
  readonly side: boolean;
};

export type GalaxyMapQuestAcceptMarks = Readonly<
  Record<string, GalaxyMapQuestAcceptMarkFlags>
>;

export const EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS: GalaxyMapQuestAcceptMarks =
  Object.freeze({});

export type ResolveGalaxyMapQuestAcceptMarksInput = {
  enabled: boolean;
  visibleSystemIds: readonly string[];
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

/** 수락 전(미수락)만. 레벨·선행은 보지 않음. */
function isUnacceptedOffer(
  mission: Mission,
  progress: MissionProgress | undefined,
): boolean {
  if (mission.objectives.length === 0) return false;
  if (!mission.offerPlanetId) return false;
  if (progress?.status === 'complete' || progress?.status === 'active') return false;
  return true;
}

function markSystem(
  out: Record<string, { main: boolean; side: boolean }>,
  systemId: string,
  kind: 'main' | 'side',
): void {
  const prev = out[systemId];
  if (prev) {
    if (kind === 'main') prev.main = true;
    else prev.side = true;
    return;
  }
  out[systemId] = {
    main: kind === 'main',
    side: kind === 'side',
  };
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

/** 구독 축소 — ready 본편 + 정식 서브 5종 수락/완료 상태만. */
export function readGalaxyMapQuestAcceptMarkRevision(
  progresses: Record<string, MissionProgress>,
): string {
  const mains = listReadyMainStoryBindIds();
  let main = '';
  for (let i = 0; i < mains.length; i += 1) {
    const id = mains[i]!;
    const st = progresses[id]?.status;
    main += st ? st.charAt(0) : '-';
  }
  let side = '';
  for (let i = 0; i < CHAPTER1_NAMED_SIDE_QUEST_IDS.length; i += 1) {
    const id = CHAPTER1_NAMED_SIDE_QUEST_IDS[i]!;
    const st = progresses[id]?.status;
    side += st ? st.charAt(0) : '-';
  }
  return `${main}|${side}`;
}

export function resolveGalaxyMapQuestAcceptMarks(
  input: ResolveGalaxyMapQuestAcceptMarksInput,
): GalaxyMapQuestAcceptMarks {
  if (!input.enabled) return EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS;

  const visible = new Set<string>();
  for (let i = 0; i < input.visibleSystemIds.length; i += 1) {
    const id = input.visibleSystemIds[i];
    if (id) visible.add(id);
  }
  if (visible.size === 0) return EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS;

  const out: Record<string, { main: boolean; side: boolean }> = {};
  const { progresses } = input;

  const mains = listReadyMainStoryBindIds();
  for (let i = 0; i < mains.length; i += 1) {
    const mission = getCsvMission(mains[i]!);
    if (!mission || !isUnacceptedOffer(mission, progresses[mission.id])) continue;
    const systemId = resolveOfferSystemId(mission.offerPlanetId!);
    if (systemId && visible.has(systemId)) markSystem(out, systemId, 'main');
  }

  for (let i = 0; i < CHAPTER1_NAMED_SIDE_QUEST_IDS.length; i += 1) {
    const mission = getCsvMission(CHAPTER1_NAMED_SIDE_QUEST_IDS[i]!);
    if (!mission || !isUnacceptedOffer(mission, progresses[mission.id])) continue;
    const systemId = resolveOfferSystemId(mission.offerPlanetId!);
    if (systemId && visible.has(systemId)) markSystem(out, systemId, 'side');
  }

  return Object.keys(out).length === 0 ? EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS : out;
}
