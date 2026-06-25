// ============================================================
// STAGE 1 허브 — 아크코어 드론 활성 조건 (React → 아크코어 서브코어)
// ============================================================

export type ArcInboundDroneHubBridge = {
  planetId: string | null;
  systemId: string | null;
  /** 허브 자본궤도 전투 연출 중 — 시뮬·연출 일시정지 (캠페인 유지) */
  hubCombatActive: boolean;
  routeFocused: boolean;
  appActive: boolean;
  stageSessionActive: boolean;
};

const INACTIVE: ArcInboundDroneHubBridge = {
  planetId: null,
  systemId: null,
  hubCombatActive: false,
  routeFocused: false,
  appActive: false,
  stageSessionActive: false,
};

let bridge: ArcInboundDroneHubBridge = { ...INACTIVE };

export function publishArcInboundDroneHubBridge(next: ArcInboundDroneHubBridge): void {
  bridge = next;
}

export function readArcInboundDroneHubBridge(): ArcInboundDroneHubBridge {
  return bridge;
}

export function resetArcInboundDroneHubBridge(): void {
  bridge = { ...INACTIVE };
}

/**
 * 벽시계 캠페인 tick — 허브·체류 행성 일치 + 중단 조건 없을 때만 진행.
 * false = PAUSE (drones/pending/waveAccSec 유지, catch-up 없음).
 */
export function isArcInboundDroneCampaignSimActive(
  playerPlanetId: string | null,
  hub: ArcInboundDroneHubBridge = readArcInboundDroneHubBridge(),
): boolean {
  if (!hub.planetId || !hub.systemId) return false;
  if (!hub.routeFocused || !hub.appActive || !hub.stageSessionActive) return false;
  if (hub.hubCombatActive) return false;
  if (!playerPlanetId || playerPlanetId !== hub.planetId) return false;
  return true;
}

/** Skia/RN 드론 레이어 연출 — simActive 와 동일 게이트 (2026-06-25) */
export function isArcInboundDroneHubRenderEligible(
  playerPlanetId: string | null,
  hub: ArcInboundDroneHubBridge = readArcInboundDroneHubBridge(),
): boolean {
  return isArcInboundDroneCampaignSimActive(playerPlanetId, hub);
}

/** @deprecated — `isArcInboundDroneCampaignSimActive` 별칭 */
export function isArcInboundDroneHubEligible(
  playerPlanetId: string | null,
  hub: ArcInboundDroneHubBridge = readArcInboundDroneHubBridge(),
): boolean {
  return isArcInboundDroneCampaignSimActive(playerPlanetId, hub);
}
