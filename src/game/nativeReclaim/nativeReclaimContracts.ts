/** STAGE blur 시 Native(PSS) floor 회수 패스 — 프로세스 재시작 대체가 아닌 1차 대응 */

export type NativeReclaimStage = 'planet_hub' | 'galaxy_map' | 'combat';

export type NativeReclaimPhase = 'immediate' | 'deferred';

export type NativeReclaimListener = {
  id: string;
  stages: readonly NativeReclaimStage[];
  phase: NativeReclaimPhase;
  priority: number;
  onReclaim: (ctx: NativeReclaimContext) => void;
};

export type NativeReclaimContext = {
  stage: NativeReclaimStage;
  reason: string;
  keepPlanetIds?: readonly string[];
};
