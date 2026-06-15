import { BaseArcSubCore } from './BaseArcSubCore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

/**
 * AI Planets 서브코어
 * - 행성 기후/환경/생산성 등 행성 단위 시뮬·갱신의 아크코어 진입점.
 * - 핵심 5지표 **정본**은 `planetCoreRuntimeStore`(로컬 행성 DB); CSV/Planet 객체는 초기 시드만.
 * - **일일 재배치·밸런스 패스**는 `ArcCoreDailyOpsSubCore` 일괄 배치(기본 12:00)에서만 실행한다.
 *   관측: `AiNpcSubCore` 벽시계(궤도·수송 누적) + 플레이어 상호작용 신호.
 * - 행성 허브 **원형 초상**은 `planetCorePortrait`가 5지표 구독으로 재합성.
 */
export class AiPlanetsSubCore extends BaseArcSubCore {
  constructor() {
    super('ai_planets_subcore', 'AI Planets 서브코어');
  }

  override onBoot(): void {
    void usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }
}
