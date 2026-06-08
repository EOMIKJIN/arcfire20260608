# 에이전트 안내 (Arcfire Online)

Cursor 및 기타 코딩 에이전트는 **`.cursor/rules/arcfire-online.mdc`**를 따릅니다. 요약만 여기 둡니다.

- **아크코어**: `src/arcCore` — **세계 전체를 구축·유지하는 근원 마스터 AI(최종 시스템 축)**로 둔다. 인간 플레이 계정은 그 위에서 플레이·경험·행성 환경 상호작용을 한다. 신규 AI 시계·틱·세계 규칙은 가능하면 **`arcCoreHub`·명령 버스·서브코어**로 수렴시키고, 화면 전용 백그라운드 루프를 남발하지 않는다.
- **아크코어 일일 운영**: 벽시계 **24h 관측** 후 **하루 1회**(기본 12:00 `Asia/Seoul`) `ArcCoreDailyOpsSubCore`가 행성 코어·경제·AABS·성계 개방을 일괄 재배치한다. 정책: `tables/balance/arc_core_daily_ops_policy.csv`. 궤도 수송·연출은 실시간 틱 유지.
- **테이블 우선**: 환경 부트스트랩·NPC 함장·전함은 **`tables/content` CSV → `npm run build:content-tables`** 가 정본이다. 아크코어가 스스로 환경을 깔 때도 **코드에 임의 엔티티·이름 풀을 두지 말고** CSV·레지스트리(`npcFleetRegistry`, `arcNpcTrafficTableRegistry`, `nearbyOrbitPresenceSystem`) 패턴을 따른다. 상세는 `.cursor/rules/arcfire-online.mdc`의 “테이블 우선” 절.
- **궤도 수송선(아크코어)**: `listArcNpcTrafficRowsFromTables`는 **`arcOrbitPresenceFill` 함장·전함만**(현재 12척 P-01…); 다음 행성은 **월드 전 행성 균등**; 체류(dwell)는 `npc_ai_ships.csv`의 `arcTrafficPlanetDwellSecMin`/`Max`(초), **상한 600초(10분)**.
- **행성 핵심지표**: `planets.csv`의 `coreResource/corePopulation/coreDefense/coreTechnology/coreEnvironment`(0..100)는 **초기 시드**만. 변화하는 값은 **`planetCoreRuntimeStore`**(AsyncStorage, `arcfire_planet_core_runtime_v1`)가 정본이다. **일일 갱신**은 `ArcCoreDailyOpsSubCore` 배치; `AiPlanetsSubCore`는 코어 DB 부트스트랩만. UI는 `R,P,D,T,E` 5색 디지털 게이지(20%/칸). **에너지는 R(Resource)에 통합**.
- **아키텍처 감사·리스크**: `docs/README_ARCHITECTURE.md` → `Arcfire_Architecture_Audit_2026-06-08.md`, `ARCHITECTURE_RISK_REGISTER.md`. 마스터 스펙 정본: `docs/Arcfire_RN_Architecture_Master_Spec(single).md` **§18**.
- **함선 장착 슬롯(`ship.equipSlots`)**: 정본은 **`arcfire_player_v1`** 안의 현재 `player`와 동일 `uid`로 묶인다. 로드 시 슬롯 id·필드 검증, `persist()` 시 정규화 후 저장·`accountProfileStore`의 `shipEquippedSlotCount` 요약 동기. `purgeAccountDataByUid(uid)`는 해당 uid의 로컬 플레이어가 있으면 **`resetLocalPlayer()`로 플레이어 스토리지까지 비운다**(장착 포함).
- **광물·Resource(지표) 고지 — 되는 것 / 안 되는 것** (에이전트는 답변·구현 시 **한계를 숨기지 말 것**):
  - **되는 것**: CSV(`galactic_mineral_pool`, `mineral_regions`, `mineral_region_members`) → `buildPlanetMineralDepositIndex` → 행성별 `shareOfGalaxyByMineral`. **프로필이 붙은 모든 행성**을 합산한 `computeGalaxyMineralUniverseStats`로 전역 광물 비중·행성 풍부도 퍼센타일·정렬도를 쓴다. **일일 배치**에서 `runPlanetEnergyCorePass`가 **월드의 모든 행성**에 대해 목표 R을 잡고(패스당 변화 상한 있음), `planetCoreRuntimeStore`에 반영한다. 소행성 궤도 수는 `resolvePlanetAsteroidOrbitCount`(테스트 오버라이드 + 매장 총합 기반)가 목표 R에 섞인다.
  - **안 되는 것**: 런타임에 `worldStore` 전 행성을 돌며 **채굴 DB·실제 매장량을 재집계**하지는 않는다. **광물 CSV에 멤버로 없는 행성**은 매장 프로필이 없어, 우주 통계·정렬도에 **참여하지 않고** R은 **CSV 시드 + 궤도 폴백**만 쓴다. **광물 스폰·소모·가격**은 이 패스만으로 돌아가지 않는다(로드맵: DB + 아크코어). `resolvePlanetAsteroidOrbitCount`는 내부 **메모리 캐시**를 쓰므로, 런타임에 광물 테이블만 핫교체하는 식이면 **캐시 무효화 정책이 따로 필요**하다(현재 일반 플레이 경로에서는 거의 해당 없음).
  - **코드 위치**: `src/world/mineralDepositModel.ts`, `src/world/computeGalaxyMineralUniverseStats.ts`, `src/arcCore/planetEnergy/runPlanetEnergyCorePass.ts`, `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts`.
- **행성 허브**: `src/stages/planetMainStageLayout.ts`가 메인 스테이지 세로·탑바·퀘스트 추정·배경 슬롯의 기준입니다. `app/(game)/planet.tsx`의 배경/포그라운드는 이 식과 어긋나면 안 됩니다.
- **하단 공백 규칙(회귀 방지)**: `trade/shipyard/tavern/skilltree` 등 서브 화면의 하단 여백은 메인스테이지 기준값(`PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX`)을 쓰되, 적용 위치는 메인스테이지처럼 **`ScrollView` 내부 마지막 spacer**로 고정합니다. `ScrollView` 바깥 고정 reserve 블록으로 뷰포트를 줄이는 방식은 사용하지 않습니다.
- **메인스테이지 콘텐츠 라이프사이클(필수 패턴)**: 행성 허브에 새 콘텐츠(월드오브젝트·NPC 함장/함선·스토리 트리거·이벤트 등)를 추가할 때는 다음 두 채널만 사용한다 — 어디서든 행성 변경/이탈 시 누수 없이 정리되도록 단일 정책을 유지한다.
  - **dispose 등록**: 행성 진입 중 만든 타이머·구독·저장 핸들 등은 `registerPlanetSessionResource({ ownerId, planetId, dispose })`(`src/game/planetSessionRegistry.ts`)로 등록한다. 행성 변경/이탈 시 `releasePlanetMainStageSession`이 자동으로 호출한다. 화면 단에서 `setInterval`·구독을 직접 만들고 정리만 잊는 패턴은 금지.
  - **행성 단위 메모 캐시**: `(planetId)` 또는 `(planetId, systemId)`에만 의존하는 정적 결과(예: NPC 슬롯 빌더, 월드오브젝트 정적 인덱스)는 `memoizePerPlanet` / `memoizePerPlanetSystem`(`src/game/planetMemoCache.ts`)로 감싼다. 행성 변경/이탈 시 자동 무효화. 런타임 스토어 상태(시간·플레이어 진행도)에 의존하면 캐싱 대상이 아니다.
  - **CSV 정적 인덱스**: CSV 전체에서 매번 `new Map(rows.map(...))`을 만들지 말고 모듈 레벨 1회 캐시(`getXxxIndex()`)로 빌드한다. 예: `nearbyOrbitPresenceSystem.ts`의 `getShipByIdIndex`·`getArcOrbitPresenceFillRows`.
- **배경이미지 레이어 규칙(행성별)**: 배경 이미지는 `app/(game)/planet.tsx`의 **`nebulaBackdropLayer`**를 사용하되, 적용 여부·에셋은 **`planets.csv`의 `backdropImageAssetKey`**로 관리한다(미할당이면 Skia 성운만 표시, 범용 단일 이미지 금지). 향후 배경 이미지 추가·교체는 테이블 값과 `src/game/planetBackdropAssets.ts` 정적 맵만 확장하고, 전투영역 레이어(예: `PlanetEdenRaidOrbitSkiaCombat`)에는 배경 이미지를 넣지 않는다.
- **포그라운드 탑 크롬**은 `translateY`로만 올리고, 그 때문에 **배경 `paddingTop`을 같이 바꾸지 마세요**.
- **`.git` 없음**일 수 있으니 대규모 변경 전 Git 사용을 권장합니다.

- **React Native Skia (벡터·고프레임 UI)**: 매 프레임 그리기가 많은 2D(궤도·탄도·게이지 등)는 **Skia를 기본 후보**로 두고, 적용 범위는 **점진적으로 넓힌다**. 현재 실시간 전함 궤도: `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx` (`PlanetEdenRaidOrbitSvg` 경유). **안정화**: `orbitSize`/좌표 `NaN` 방어, sim 교체·언마운트 시 **rAF 중단 플래그 + `cancelAnimationFrame`**. Skia는 **`expo run:*` 등 네이티브 재빌드** 전제; Path 등 **프레임당 생성량**은 이후 LOD·재사용·worklet로 튜닝 가능.
- **전투 렌더 단일 구현 고정**: 전투 궤도 렌더의 정본은 `PlanetEdenRaidOrbitSkiaCombat` 하나만 유지한다. 동일 기능(궤적/탄두/빔/명중 FX)의 이중 구현을 상시 유지하지 않는다. 무기 연결은 `weapon_list.csv` → `missileWeaponId`/`laserWeaponId` 단일 체인을 고정한다. 테스트 때문에 이중 구현이 필요한 경우에는 구현 전에 목적·임시 범위·제거 시점을 사용자에게 먼저 고지한다.

- **일일 성능·위생 점검**: `npm run audit:daily` → `tools/daily-perf-audit/reports/latest.md`. GitHub에는 `.github/workflows/daily-performance-audit.yml` 스케줄(1일 1회)이 있으며, 로컬은 `tools/daily-perf-audit/README.md`의 작업 스케줄러 예시를 참고.
- **아크코어 × Cursor 에이전트 자기 최적화**: `npm run audit:arc-self-optimize:pack` → `tools/arc-core-self-optimize/outbox/cursor-handoff.md` 를 Cloud Agent 등에 첨부. 옵트인 `stop` 훅은 `.cursor/trigger-arc-self-optimize-on-stop` 플래그 파일로 1회 안내 — `tools/arc-core-self-optimize/README.md`.

자세한 규칙은 `.cursor/rules/arcfire-online.mdc`를 읽으세요.
