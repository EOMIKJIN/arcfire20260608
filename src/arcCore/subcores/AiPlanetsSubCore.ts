import { BaseArcSubCore } from './BaseArcSubCore';
import { runPlanetEnvironmentDiversityPass } from '../planetEnvironment/runPlanetEnvironmentDiversityPass';
import { runPlanetEnergyCorePass } from '../planetEnergy/runPlanetEnergyCorePass';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

/**
 * AI Planets 서브코어
 * - 행성 기후/환경/생산성 등 행성 단위 시뮬·갱신의 아크코어 진입점.
 * - 핵심 5지표 **정본**은 `planetCoreRuntimeStore`(로컬 행성 DB); CSV/Planet 객체는 초기 시드만.
 *   Resource 스칼라에 **에너지·광물망** 개념을 통합(`runPlanetEnergyCorePass`).
 * - 행성 허브 **원형 초상**은 `planetCorePortrait`(프로시저 SVG)가 동일 5지표·구역·planetId로 합성하며,
 *   지표가 바뀌면 스토어 구독으로 UI가 재합성된다(별도 PNG 리소스 없음).
 * - `planet_asteroid_resource_cycle` 완료 시: `runPlanetEnergyCorePass` — 소행성·전역 광물 자동배분을 **R 지표**에 반영.
 *   실제 인벤토리 적재는 행성 허브의 클릭 기반 채굴 세션에서만 수행한다(아크코어 자동 적재 금지).
 *   향후: 동 미션(또는 인접 단계)에서 **DB 기반 광물 생성·관리**를 붙이고, 지표를 입력으로 삼는다.
 * - `planet_environment_diversity_pass`: 플레이어 **현재 성계 기준 주변 약 20행성**의 5지표 재조정 +
 *   `planetDevelopmentAccStore`에 쌓인 **궤도 수송 누적(발전도)** 을 같은 타이밍에 코어에 반영.
 *   수송 누적은 `AiNpcSubCore` 벽시계 틱이 주입. 전투 스냅샷은 **착륙 행성**만. 이미지 전용 연동은 추후.
 */
export class AiPlanetsSubCore extends BaseArcSubCore {
  constructor() {
    super('ai_planets_subcore', 'AI Planets 서브코어');
    /**
     * 임무: 소행성 채굴 자원 생성·관리 사이클
     * 단계별로 벽시계 시간을 소모하며 순환(살아있는 세계 연출의 기반).
     */
    this.registerTimedMission({
      id: 'planet_asteroid_resource_cycle',
      name: '행성 소행성 채굴 자원 생성/관리',
      stepDurationsSec: [10, 8, 12],
      repeat: true,
      onCompleted: () => {
        runPlanetEnergyCorePass();
      },
    });
    this.registerTimedMission({
      id: 'planet_environment_diversity_pass',
      name: '행성 환경 다양성 분석·5지표 재조정',
      stepDurationsSec: [84],
      repeat: true,
      onCompleted: () => {
        runPlanetEnvironmentDiversityPass();
      },
    });
  }

  override onBoot(): void {
    /** 루트 레이아웃에서도 부트스트랩하지만, 아크만 단독 기동되는 경로 대비 이중 안전망. */
    void usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }
}
