// ============================================================
// 전투 재개 대기(쿨다운) — 허브 교전·웨이브 디펜스 공통 단일 정본(2026-07-27 범용화).
//
// 규칙(대표님 지시 2026-07-22, 2026-07-27 허브 메인스테이지 교전에도 범용 적용): 적 행성
// 전투(웨이브 디펜스든 허브 메인스테이지 비-웨이브 교전이든, 플레이어가 참전한 블루 승)에서
// 승리하면 해당 행성은 30분간 새 교전이 트리거되지 않는다.
// - 웨이브: 승리 결과창 표시 중 즉시 재기동(중복 처리) 회귀의 구조적 차단 축.
// - 허브 비-웨이브: 격침 직후 10초 자동 리스폰 재교전(개발테스트 전술) 삭제에 따른 대체 —
//   자동 리스폰 대신 이 30분 쿨다운 경유로만 재교전 여부를 결정한다.
// - 이 30분은 전체 전술의 일부 규칙 — 향후 「전투 재개 전술화」 고도화 시
//   이 모듈의 시간·조건만 확장한다(웨이브 트리거 정본 resolvePlanetWaveCombatTrigger ·
//   허브 진입 게이트 정본 `app/(game)/planet.tsx` `enemyFleetEntered` 양쪽 소비).
//
// 메모리: 행성별 승리 시각 bounded 맵(최대 24) + AsyncStorage 1키.
// 기록은 승리 이벤트당 1회(저빈도) — 틱/렌더 경로 할당 없음.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

/** 승리 후 웨이브 전투 재개 대기 시간 (30분) */
export const WAVE_COMBAT_VICTORY_COOLDOWN_MS = 30 * 60_000;

const STORAGE_KEY = 'arcfire_wave_combat_cooldown_v1';
/** 오래된 항목부터 정리 — 무한 증가 방지 */
const MAX_ENTRIES = 24;

let lastVictoryAtByPlanet = new Map<string, number>();
let hydrateStarted = false;
let dirty = false;

function persist(): void {
  if (!dirty) return;
  dirty = false;
  const obj: Record<string, number> = {};
  for (const [pid, at] of lastVictoryAtByPlanet) obj[pid] = at;
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(obj)).catch(() => {
    /* 디스크 기록 실패는 무해 — 다음 승리 기록에서 재시도 */
  });
}

/** 부트/최초 접근 시 1회 하이드레이트 (idempotent) */
export function hydrateWaveCombatCooldowns(): void {
  if (hydrateStarted) return;
  hydrateStarted = true;
  void AsyncStorage.getItem(STORAGE_KEY)
    .then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const pid of Object.keys(parsed)) {
        const at = Number(parsed[pid]);
        // 인메모리에 이미 새 승리 기록이 있으면(하이드레이트 경합) 덮어쓰지 않음
        if (Number.isFinite(at) && at > 0 && !lastVictoryAtByPlanet.has(pid)) {
          lastVictoryAtByPlanet.set(pid, at);
        }
      }
    })
    .catch(() => {
      /* 손상 시 빈 상태로 시작 */
    });
}

// 모듈 로드 시 하이드레이트 킥 — 트리거 판정(착륙 +10초)보다 항상 선행
hydrateWaveCombatCooldowns();

/** 전투 승리 시 1회 기록(웨이브·허브 메인스테이지 공통) — 이후 30분간 해당 행성 재교전 트리거 차단 */
export function markWaveCombatVictoryCooldown(planetId: string): void {
  const id = planetId?.trim();
  if (!id) return;
  lastVictoryAtByPlanet.set(id, Date.now());
  // bounded — 가장 오래된 항목 제거
  while (lastVictoryAtByPlanet.size > MAX_ENTRIES) {
    let oldestPid: string | null = null;
    let oldestAt = Infinity;
    for (const [pid, at] of lastVictoryAtByPlanet) {
      if (at < oldestAt) {
        oldestAt = at;
        oldestPid = pid;
      }
    }
    if (!oldestPid) break;
    lastVictoryAtByPlanet.delete(oldestPid);
  }
  dirty = true;
  persist();
}

/** 해당 행성이 승리 후 대기 시간(30분) 안인지 — 트리거 정본에서 sync 조회 */
export function isWaveCombatCooldownActive(planetId: string | null | undefined): boolean {
  const id = planetId?.trim();
  if (!id) return false;
  const at = lastVictoryAtByPlanet.get(id);
  if (!at) return false;
  if (Date.now() - at >= WAVE_COMBAT_VICTORY_COOLDOWN_MS) {
    lastVictoryAtByPlanet.delete(id);
    dirty = true;
    persist();
    return false;
  }
  return true;
}

/** 계정 초기화(purge) — 플레이어 진행 데이터이므로 함께 리셋 */
export async function resetWaveCombatCooldownsForAccountPurge(): Promise<void> {
  lastVictoryAtByPlanet = new Map();
  dirty = false;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
