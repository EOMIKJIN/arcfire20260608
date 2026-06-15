// ============================================================
// STAGE 1 허브 — 아크코어 드론 활성 조건 (React → 아크코어 서브코어)
// ============================================================

export type ArcInboundDroneHubBridge = {
  planetId: string | null;
  systemId: string | null;
  /** 허브 자본궤도 전투 연출 중 — 드론 웨이브 중단 */
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

/** 플레이어 체류 행성 + 허브 활성 + 전투 비활성일 때만 드론 웨이브 */
export function isArcInboundDroneHubEligible(
  playerPlanetId: string | null,
  hub: ArcInboundDroneHubBridge = readArcInboundDroneHubBridge(),
): boolean {
  if (!hub.planetId || !hub.systemId) return false;
  if (!hub.routeFocused || !hub.appActive || !hub.stageSessionActive) return false;
  if (hub.hubCombatActive) return false;
  if (!playerPlanetId || playerPlanetId !== hub.planetId) return false;
  return true;
}
