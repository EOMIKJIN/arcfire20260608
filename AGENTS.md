# 에이전트 안내 (Arcfire Online)

## 사용자 호칭 (전체 팀 · 2026-07-05~)

**사용자 = 「대표님」** — 김팀장 · Fable · 김경제 · 김클로드 · Auto/Sonnet **전원** 한국어 응답·handoff·리포트에서 동일 적용.  
정본: `.cursor/rules/arcfire-user-addressing.mdc`

## 🚨 개발규칙 1순위 (무조건 · 2026-07-01~)

**모든 작업은 「1차 메모리·PSS 검수」 후에만 개발을 진행한다.**  
Skia/STAGE/틱/persist/부트/**memo·cache·store 순환** 전부 해당 · **1차 검수·게이트 없이 구현·완료 선언 금지**.

**PSS 누적식 floor 상승(native_heap·Views)** 은 GL과 별도 **특별조치(§0-A)** — 개발 전 `[pss-pre-dev]` 3줄 필수 · idle floor **+40MB↑ = FAIL**.

정본: `.cursor/rules/arcfire-memory-leak-audit-first.mdc` (§0-A PSS 특별조치)

### Cursor 훅 — 개발 프로세스 상시 강제 (2026-07-04~)

| 시점 | 훅 | 역할 |
|------|-----|------|
| **sessionStart** | `on-session-start-pss-pre-dev-brief.cjs` | [pss-pre-dev] · 완료 게이트 상시 리마인드 |
| **sessionStart** | `on-session-start-mem-post-dev-trigger.cjs` | `src/app/tables` dirty → mem-post-dev-recheck P0 |
| **beforeSubmitPrompt** | `on-before-submit-prompt-kim-claude-handoff-review.cjs` | handoff `PENDING` → **검수 P0 자동 시작** (기존 대화창 포함) |
| **beforeSubmitPrompt** | `on-before-submit-prompt-pss-pre-dev-gate.cjs` | 기능·버그 요청 시 1차 검수 3줄 의무 주입 |

```bash
npm run audit:dev-process-gate      # 훅·규칙 무결성
npm run audit:mem-post-dev-recheck    # 개발 반영 후 handoff·status 갱신
```

상태: `tools/kim-team-lead/reports/DEV_PROCESS_GATE_STATUS.md`

## 유료 모델 전용 — Composer·Cursor 폴백 개발 배제 (2026-07-11~)

> **대표님 지시**: API 소진으로 Composer·글록(내장 Auto/폴백)이 **강제**될 때만 예외. 그 외 **코드 개발 금지**.

| 항목 | 경로 |
|------|------|
| 정본 규칙 | `.cursor/rules/arcfire-paid-model-exclusion-gate.mdc` |
| 구독 갱신일 | `tools/kim-team-lead/reports/SUBSCRIPTION_RENEWAL_ANCHOR.json` |
| API 소진 예외 | `tools/kim-team-lead/reports/API_EXHAUST_FALLBACK_ACTIVE.flag` (없으면 폴백 **금지**) |

- **허용 개발 모델**: Opus(김팀장) · Fable · Sonnet — Task 위임 시 slug **필수**
- **금지**: Composer · `composer-2.5*` · Cursor Auto/폴백/글록 · Task `model` 생략
- **훅**: `on-session-start-paid-model-gate.cjs` · `on-before-submit-prompt-paid-model-gate.cjs`

## 기존값 변경 — 사전 재확인 (상시 · 사용자 지시)

**확정 CSV·밸런스·UI/i18n 등 기존값**을 바꿀 때는 **수정 전 사용자에게 한 번 더 질문·승인** 후 작업. 신규 추가만(L11~15 행 추가 등)이고 L1~N 기존 행을 건드리지 않으면 생략.  
정본: `.cursor/rules/arcfire-existing-value-change-confirm.mdc`

## 메인 개발 · 팀 구조 (2026-06-19 단일 지휘)

| 에이전트 | 호출 | 역할 | 코드 |
|---------|------|------|------|
| **김팀장** | `@김팀장` · 「김팀장」 | **유일한 사용자 지시** — Skia·UI·STAGE·arcCore·일일배치·메모리·버그 **런타임** | **O** |
| **Fable** | `@Fable` · `@페이블` | **Table-First 구현 핵심** — CSV·시드·점유·카탈로그·registry·72단계 (김팀장 Task 위임) | **O (해당 축)** |
| **김경제** (팀원) | `@김경제` · 「김경제」 | **김팀장 배정만** — 감시·**메모리 프로파일링**·`audit:balance-ops` **점검·리포트** · **개발 업데이트 시 메모리 즉각 재검수·보고** | **X** |
| **김클로드** (보조) | `@김클로드` · Cursor ✱ / `claude` | **초안 구현** — handoff 후 **김팀장 검수·커밋** | **초안만 (커밋 X)** |

> 사용자는 **김팀장 대화창 하나**에만 작업 지시. 김경제 별도 창 = 감시·점검 전용(충돌 방지).
> **김클로드** 산출물은 `tools/kim-team-lead/reports/kim-claude-handoff-pending.md` → **김팀장 재검수·최종 커밋** 필수 (`CLAUDE.md` · `.cursor/rules/arcfire-main-lead-agent.mdc`).

### 김클로드 → 김팀장 검수 (2026-07-04~)

```text
[김클로드] 구현 → handoff PENDING
[김팀장 Cursor] diff·audit·수정 → verdict → 커밋(사용자 요청 시) → mem-post-dev-recheck
```

handoff `PENDING` 시 김팀장 sessionStart 훅이 검수 리마인드.

- **협업 워크플로**: `docs/KIM_TEAM_ECONOMY_WORKFLOW.md`
- **김팀장 일일 검수**: `npm run audit:team-lead:daily` → `tools/kim-team-lead/reports/daily-review-latest.md`
- **김경제 handoff**: `tools/kim-team-lead/reports/kim-economy-handoff.md` — **`## [관측]`** · retention FAIL → **김팀장 본 세션 코드 반영**
- **프로파일러**: `tools/memory-profiler/` · `npm run audit:memory:retention`
- **김팀장 규칙**: `.cursor/rules/arcfire-main-lead-agent.mdc` · `docs/KIM_TEAM_LEAD_AGENT.md`
- **김경제 규칙**: `.cursor/rules/arcfire-economy-specialist-agent.mdc` · `docs/KIM_ECONOMY_AGENT.md`

## 장기 메모리·안정화 감시 (상시 · 개발과 독립) — **기본 장기앱 실행 테스트 (2026-06-19)**

> **`ensure-always-on-watch-stack.ps1`** 멱등 가동 — **앱 무영향**: PC(adb) 전용 · `MONITOR_APP_ZERO_IMPACT.md`
> 이상 시 **코드 자동픽스 핸드오프**(incident·retention) → 김팀장 P0 · 앱 force-stop은 `monitor-paused.flag` 없을 때만(throttle)
> 정본: `tools/long-run-monitor/logs/WATCH_README.md` · `docs/KIM_ECONOMY_AGENT.md`

```powershell
npm run monitor:ensure-always-on   # watch-30m + retention(60m) + 08:00 보고 (멱등)
npm run monitor:ensure-daily-8am   # 08:00 스케줄러만 확인
```

### 상시 가동 — **이상탐지 → 김팀장 handoff (P0)**

| # | 구성 | 주기 | 역할 |
|---|------|------|------|
| 0 | **perpetual watchdog** | 5m ensure | PC/게임/Cursor 재시작 후 **자동 재가동** · status·HTML 대시보드 |
| 1 | **mem watch** | 15m | mem-timeline · remediate · handoff (adb budget) |
| 2 | **report-watch** | 15m | 실시간 크래시·incident heartbeat |
| 3 | **incident poll** | 5m | 신규 incident → `CHAT_REPORT_PENDING` · optional webhook |
| 4 | **profiler extras** | 60m | retention audit |
| 5 | **08:00 · Cursor 훅** | — | 데일리 보고 · incident triage |
| 6 | **PR gate (CI)** | PR/push | tsc · skia · worklet · memory 정적 |

```powershell
npm run monitor:register-perpetual   # Windows 로그온·5m 백업 (1회)
npm run monitor:ensure-perpetual
npm run monitor:status              # PID · handoff · mem 한 줄
npm run monitor:dashboard           # logs/MONITOR_DASHBOARD_LATEST.html
```

**운영 정본**: `tools/long-run-monitor/logs/MONITOR_OPS_REALTIME.md`

**Windows 작업**: `ArcfirePerpetualDetection` · **중단**: `perpetual-detection-DISABLED.flag`

### 데일리 08:00 KST 상시 보고 (필수 · 2026-06-27~)

- **매일 08:00 KST 무조건 보고** — 김팀장·김경제 동일 · 앱 on/off 무관
- **adb 미연결·데이터 없음 → FAIL** 기록 · 변경 없어도 보고서·ledger 생성
- **중단**은 `tools/long-run-monitor/logs/schedule-8am-report-DISABLED.flag` **명시 시에만**
- 산출: `overnight-final-report-YYYYMMDD-0800.md` · `DAILY_8AM_REPORT_LATEST.md` · `daily-8am-report-ledger.csv`
- Cursor `sessionStart` 훅 + `ensure-daily-8am-report.ps1` 멱등 자동 가동

- **30분** `mem-timeline.csv` · crash logcat · v2 계단식 GL 누수 판정
- **60분** retention audit · `[MEM_PROFILE]` logcat (`ensure-profiler-extras.ps1`)
- **코드 자동픽스**: incident handoff + Cursor triage 훅 · 앱 재시작은 `monitor-paused` 없을 때만
- **김경제(감시)**: 상시 스택 · retention · incident **탐지·보고만** (코드 수정 없음)
- **김팀장**: handoff·`latest-retention-audit.md` FAIL → STAGE·Skia·reclaim **코드 수정**
- **김팀장**: incident·audit FAIL **코드 조치** · 자동조치 정책 · Skia/허브/STAGE 패치
- **P0 집중(2026-06-23~):** release **5h+ soak** · GL/PSS floor 계단식 상승 후 **은하계 지도(worldmap) 진입·전투 복귀** 크래시 — `PLAYTEST_WATCH.md` · `WATCH_README.md` §집중 검사 항목

## AI 페르소나·모델 자동 라우팅 (Auto)

- **정본**: `.cursor/rules/gemini-code-agent-routing.mdc` — `alwaysApply`, 매 턴 @김팀장/@김경제/@Fable/@Opus/@Sonnet **없이** 자동 선별 (김팀장 세션 내부 라우팅).
- **원본 기획**: `.cursor/rules/gemini-code-1781406772084.md`
- **세션 훅**: `.cursor/hooks/on-session-start-agent-routing.cjs` (`sessionStart`)
- **Task 위임 model**: **Fable(Table-First 구현)** `claude-fable-5-thinking-high` · 김경제(감시만) `claude-fable-5-thinking-high` · 김팀장(런타임·Skia·STAGE) `claude-opus-4-8-thinking-high` · Sonnet `claude-4.6-sonnet-medium-thinking`
- **Fable 규칙**: `.cursor/rules/arcfire-fable-implementation-agent.mdc`

Cursor 및 기타 코딩 에이전트는 **`.cursor/rules/Arcfire_Master_Spec_v4.0-1781368341848295041.mdc`** (프로젝트 헌법 v4.0)를 따릅니다. 구현·운영 세부 요약은 아래와 `AGENTS.md`에 둡니다.

- **아크코어**: `src/arcCore` — **세계 전체를 구축·유지하는 근원 마스터 AI(최종 시스템 축)**로 둔다. 인간 플레이 계정은 그 위에서 플레이·경험·행성 환경 상호작용을 한다. 신규 AI 시계·틱·세계 규칙은 가능하면 **`arcCoreHub`·명령 버스·서브코어**로 수렴시키고, 화면 전용 백그라운드 루프를 남발하지 않는다.
- **아크코어 일일 운영**: 벽시계 **24h 관측** 후 **하루 1회**(기본 12:00 `Asia/Seoul`) `ArcCoreDailyOpsSubCore`가 행성 코어·경제·AABS·성계 개방을 일괄 재배치한다. 정책: `tables/balance/arc_core_daily_ops_policy.csv`. 궤도 수송·연출은 실시간 틱 유지.
- **경제·무역 생태계 참고**: `docs/ECONOMY_TRADE_ECOSYSTEM_REFERENCE.md` — 무역소 카탈로그·tg_* 교역·zone 진열·17/21 허브·갭 목록(2026-06-12 스냅샷).
- **Macro economy SIM**: `npm run sim:economy` → `docs/ECONOMY_SIM_DAILY_OPS.md` — delta ingest → 일일 배치 overlay.
- **경제·밸런스 운영 감사**: `npm run audit:balance-ops` (3h 로컬·CI) · `tools/balance-ops-audit/README.md` · 학습 상태 `reports/learning-state.json`.
- **경제 시스템 종합 평가 히스토리**: `docs/economy-evaluation/README.md` (타이틀 비교·효율성 스냅샷).
- **테이블 우선**: 환경 부트스트랩·NPC 함장·전함은 **`tables/content` CSV → `npm run build:content-tables`** 가 정본이다. 아크코어가 스스로 환경을 깔 때도 **코드에 임의 엔티티·이름 풀을 두지 말고** CSV·레지스트리(`npcFleetRegistry`, `arcNpcTrafficTableRegistry`, `nearbyOrbitPresenceSystem`) 패턴을 따른다. 헌법: `.cursor/rules/Arcfire_Master_Spec_v4.0-1781368341848295041.mdc` §1·§6.
- **행성 소유권 증서(Table-First · 2026-07-02~ · 단일 정본)**: **`tables/content/item_defs.csv`만** — `ownership_{planetId}` · `type=planet_ownership`. A(21)+synth **별도 CSV·빌드 merge·런타임 lazy 합성 금지**. synth 신규: `synth_system_colonization.csv` → `sync-synth-ownership-into-item-defs.mjs` → item_defs append → `build:content-tables`. 무역 진열=eligibility+카탈로그 resync(**렌더/useMemo dispatch 금지**). 감사: `npx tsx tools/debug/audit-planet-ownership-item-defs.ts`.
- **미션 시스템(Table-First)**: 정본 `missions.csv` + `mission_objectives.csv` + `mission_combat_captains.csv` → `missionCatalog.ts` · 진행 `missionStore.ts`. 작업 인수인계·다음 스프린트: **`docs/MISSION_SYSTEM_HANDOFF.md`**
- **전략·전술 자동화(아크코어 자동전투 · 노드/라인 1홉)**: 성계 그래프 공격 가시성·접전 전선 확장 설계 정본 — **`docs/strategy/README.md`** · **`docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md`** (v0.1 분석·Phase 0~6 · 코드 미착수)
- **허브 궤도 트래픽(v4.0 §6-2)**: STAGE 1 동시 최대 **5척**, **15초** spawn/despawn — `src/game/hubOrbitTrafficSession.ts` + `planetMemoCache/hub_traffic` 풀. info 패널 `‹AI›` 접두. `onSnapshot`·`hub_peers`·`aiVirtualPlayerStore` 금지.
- **행성 로컬 점유(v4.0 §6-3)**: `planet_holds` 프로필 단발 병합(`userDataSync.planet_holds`) — `ownership_claim` 트랜잭션 금지.
- **경제 탄력(v4.0 §10-2)**: `price_elasticity=0` — 실시간 가격 변동 없음, `runArcCoreDailyOpsBatch` → `runMarketPricePass`만.
- **통합 레벨링(v4.0 §10-3)**: 전투 종료 `recordMatchSummary`(로컬) → 일일 배치 `runIntegratedEngageHpAdjustPass` → `globalEngageHpMul`(0.7~1.3).
- **전함 식별자(v4.0 §7-2)**: `npc_mock_pvp_ship_*` → **`npc_mock_ai_ship_*`** (CSV 정본).
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

- **React Native Skia (벡터·고프레임 UI)**: 매 프레임 그리기가 많은 2D(궤도·탄도·게이지 등)는 **Skia를 기본 후보**로 두고, 적용 범위는 **점진적으로 넓힌다**. 현재 실시간 전함 궤도: `PlanetEdenRaidOrbitSkiaCombat` (`CapitalRealtimeCombatOrbitSkia` / `capitalRealtimeBridge` 경유). **안정화**: `orbitSize`/좌표 `NaN` 방어, sim 교체·언마운트 시 **rAF 중단 플래그 + `cancelAnimationFrame`**. Skia는 **`expo run:*` 등 네이티브 재빌드** 전제; Path 등 **프레임당 생성량**은 이후 LOD·재사용·worklet로 튜닝 가능.
- **전투 렌더 단일 구현 고정**: 전투 궤도 렌더의 정본은 `PlanetEdenRaidOrbitSkiaCombat` 하나만 유지한다. `CapitalRealtimeCombatOrbitSvg`는 **deprecated 별칭** — 신규 코드는 `CapitalRealtimeCombatOrbitSkia`만 사용.

- **일일 성능·위생 점검**: `npm run audit:daily` → `tools/daily-perf-audit/reports/latest.md`. GitHub에는 `.github/workflows/daily-performance-audit.yml` 스케줄(1일 1회)이 있으며, 로컬은 `tools/daily-perf-audit/README.md`의 작업 스케줄러 예시를 참고.
- **초기화 단축 (보류 · 2026-06-23)**: 타이틀까지 부트·STAGE lazy·RN import 다이어트 방향 정본 — **`docs/BOOT_INIT_OPTIMIZATION_ROADMAP.md`**. 「초기화 단축」「부트 최적화」 언급 시 에이전트는 본 문서를 먼저 읽는다. 부트 마커: `tools/boot-perf/README.md` · `src/game/bootPerformance.ts`.
- **아크코어 × Cursor 에이전트 자기 최적화**: `npm run audit:arc-self-optimize:pack` → `tools/arc-core-self-optimize/outbox/cursor-handoff.md` 를 Cloud Agent 등에 첨부. 옵트인 `stop` 훅은 `.cursor/trigger-arc-self-optimize-on-stop` 플래그 파일로 1회 안내 — `tools/arc-core-self-optimize/README.md`.
- **런타임 버그 수정**: `.cursor/rules/arcfire-bug-debug-workflow.mdc` — adb logcat 캡처 → 사용자 재현 → 로그 근거 수정. Cursor **Agent 모드 그대로** 사용(Debug 전환 불필요).
- **크래시·SIGSEGV·worklet 수정 (반쪽 패치 방지)**: `.cursor/rules/arcfire-crash-fix-structural-gate.mdc` — **코드 diff 전** 이전 수정·동일 스택 logcat·`planetHubWorkletContract` **전수검사** → 수정 설계·체크리스트 PASS 후에만 구현. 완료 시 `[crash-fix-gate]` 한 줄 기록.
- **Skia GL 메모리 헌법 (P0 · 2026-06-14~ 필수)**: `.cursor/rules/arcfire-skia-memory-lifecycle.mdc` — **다음 기능개발부터** Skia/Reanimated 고프레임 코드는 Zero-Allocation(Pre-allocation + `rewind()` + 단일 Canvas)만 허용. **완료 게이트**: `npm run audit:skia-memory` PASS + `tsc` + GL mtrack Δ ±15MB. 루프 내 `Skia.Path.Make()`/`Paint()`·`<Path>` `.map()`·이벤트마다 Canvas 리마운트 **금지**. `docs/(구현)SKIA_WORKLET_MEMORY_CONTRACT.md` · UI 스레드 SharedValue Path **dispose 금지**.
- **장거리 미사일(1차)**: 2026-06 제거됨 — 메모리 격리 테스트 중. 방어위성은 `planetaryDefense` + 궤도 마커만 유지. 재도입 시 Skia 단일 Canvas·GL 실측 필수.
- **UI 오버레이·모달**: `src/ui/overlay/` — `ArcOverlayHost` 루트 단일 호스트, `showArcAlert` 등 imperative API. RN `Modal`·magic bottom padding 금지. **`showArcAlert` / alert kind 기본 30초 자동 닫힘** (`overlayAlertContract` · 예외 `autoDismissMs: 0`만). 점검: `npm run audit:ui-overlay`. **범용 UI 현황·로드맵**: `docs/OVERLAY_UI_UNIVERSAL_SPEC.md` · 에이전트 계약: `.cursor/rules/arcfire-overlay-ui-contract.mdc`. **조립 정본**: `ArcOverlayCard` + `ArcOverlayTitleHeader` + `ArcOverlayFooterActions` + `overlayPanelLayout.ts`(패널 세로 85~96%, center bias 36px). 패널형(planetEconomy·planetDevelopment·settings·bmShop·tradeQuantity) 마이그레이션 **완료** — alert/levelUp/reward/waveResult는 compact 잔존(Phase A 예정).
- **인게임 대사 UI (기본 디폴트 · 2026-06-18)**: `NarrativeDialogRow` + `NARRATIVE_DIALOG_LAYOUT` — 고정 204px·초상 145px·3줄 세그먼트·`[ 다음 ]` 진행. 규칙: `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc` · 초상: `resolveIngameDialogPortraitSource`.

## Metro·앱 반영 (사용자 안내)

에이전트는 검증·완료 안내 시 **기본은 앱 리로드(`r`)** 만 제안한다. **Metro 재시작·앱 완전 재시작·네이티브 재빌드**가 **실제로 필요할 때만** 아래 형식으로 **반드시** 표시한다(불필요한 Metro 재시작 권유 금지).

```text
⚠️ 중요 — Metro 재시작 필요
(이유 한 줄 · 명령 예: npx expo start --clear)

또는

⚠️ 중요 — 앱 완전 재시작 필요
(이유: 모듈 캐시·balance policy 등)

또는

⚠️ 중요 — 네이티브 재빌드 필요
(이유 · 명령 예: npx expo run:android)
```

| 변경 종류 | 보통 충분 | ⚠️ 중요 표시가 필요한 경우 |
|---|---|---|
| TS/TSX·JS만 | Metro에서 **`r` 리로드** | — |
| `npm run build:*-tables` 후 **모듈 캐시 정책** | 앱 **완전 종료 후 재실행** | `getArcCoreInboundDronePolicy` 등 **프로세스 생명주기 캐시** |
| Metro/Hermes 꼬임·구버전 번들 | — | **`npx expo start --clear`** |
| 네이티브·Skia·gradle | — | **`expo run:android`** (또는 iOS 동등) |

자세한 헌법·16대 금지·STAGE 계약은 **`.cursor/rules/Arcfire_Master_Spec_v4.0-1781368341848295041.mdc`** 를 읽으세요. 런타임 버그는 **`.cursor/rules/arcfire-bug-debug-workflow.mdc`**.
