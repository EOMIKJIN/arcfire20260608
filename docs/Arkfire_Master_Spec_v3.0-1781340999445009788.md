# 🚀 아크파이어 온라인 — React Native 모바일게임 프로젝트 아키텍처 마스터 스펙 v3.0

> **문서 버전**: v3.0 (Single-Player Ultimate & ArcCore Native)  
> **최종 업데이트**: 2026-06-13  
> **문서 상태**: 설계 및 구현 동기화 완결판 (Master Spec)  
> **감사**: `Arcfire_Architecture_Audit_2026-06-13.md` · `ARCHITECTURE_RISK_REGISTER.md`  
> **통합 출처**: flowchart v2026.05 · Memory Spec v1.0 · AABS v2.2 · Master Spec v2.1 · Agent Context(UI/Skia/Ops)  
> **핵심 원칙**: `Table-First` · `Session-Based Memory` · `Hybrid Rendering` · `Navigation.replace()` · `Local-AI-First`

---

## 🔄 v2.1 → v3.0 주요 설계 결함 수정 및 충돌 해결 (Changelog)

기존 v2.1 문서는 본문(가상 유저 스토어 도입)과 §18(구현 정본 - 스토어 없음) 사이에 치명적인 모순이 존재했습니다. v3.0은 에이전트 개발 규칙(Agent Context)과 실제 구현체를 완벽하게 분석, 통합하여 충돌을 100% 해결한 최종 버전입니다.

| 해결된 충돌/오류 (Collision / Design Flaw) | v3.0 해결 방안 (해결 완료) |
|--------------------------------------------|----------------------------|
| **[설계 충돌] `aiVirtualPlayerStore` 모순** | `aiVirtualPlayerStore` 개념 **전면 폐기**. 가상 유저는 독자적 객체가 아닌 `AiNpcSubCore`의 궤도 수송 트래픽(`nearbyOrbitPresenceSystem`)과 `npc_ai_captains.csv`에 완벽히 병합하여 단일화. |
| **[설계 충돌] 실시간 AABS vs 일일 배치** | 고빈도 실시간 밸런스 패스 전면 금지. 모든 밸런싱(AABS)과 정책 배포는 벽시계 기준 **일 1회(12:00) `runArcCoreDailyOpsBatch()`** 로 수렴하도록 아키텍처 강제. |
| **[누락 보완] 메인 레이아웃 수학적 제약** | `PlanetStageBackground`, `PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX` 등 화면 렌더링이 어긋나지 않도록 에이전트 컨텍스트의 UI 제약 사항을 공식 편입. |
| **[잔재 제거] 멀티플레이 용어 완벽 소거** | 멀티플레이, 채널, 고스트, `battle_logs_queue` 등 서버 통신을 암시하는 모든 잔재를 100% 소거. 완전한 오프라인/싱글 샌드박스로 확정. |
| **[렌더링 중복] Skia vs SVG 이중 구현** | SVG 렌더 경로를 완전 비활성화. 전투 렌더링은 `PlanetEdenRaidOrbitSkiaCombat` 단일 파이프라인으로 강제. |

---

## 🎯 0. 게임 핵심 컨셉 정의 (Core Concept)

> **이 섹션은 모든 설계 판단의 최상위 기준이다. 구현 방향이 모호할 때 반드시 이 컨셉으로 돌아와 판단한다.**

### 0-1. 게임 장르 및 규모

| 항목 | 정의 |
|------|------|
| **장르** | **싱글플레이 우주 전략 샌드박스** — 실유저 간 네트워크 상호작용 완전 배제. |
| **플랫폼** | React Native 모바일 (iOS / Android) |
| **서버 구조** | **서버리스 (Serverless)** — 실시간 게임 서버 없음. Firestore는 프로필/BM 세이브 용도로만 제한. |
| **오프라인** | 세계 시뮬레이션(전투/경제/트래픽)은 100% 클라이언트 ArcCore가 로컬에서 처리하므로 **오프라인 진행 가능**. |

### 0-2. AI 기반 세계관 계층 구조 (World Layer)

멀티플레이의 빈자리는 **ArcCore(AI 마스터)** 가 지배하는 세계층 연출로 채워집니다.
- **채널 개념 없음**: 플레이어는 자신만의 독립된 은하(로컬)에서 플레이.
- **세계 근원 마스터 (ArcCore)**: 세계가 어떻게 돌아가는지에 대한 최종 책임은 데이터 테이블(정본)과 ArcCore(허브·명령 버스·서브코어)에 있음.
- **생동감 연출 (NPC Traffic)**: 실유저처럼 보이는 다른 전함들은 `AiNpcSubCore`가 `npc_ai_captains.csv`, `aiVirtualPlayerDensity.csv` 테이블을 기반으로 렌더링하는 **AI 트래픽**임.

### 0-3. Firestore 역할 (최소화 원칙)

```text
Firestore 사용 범위 (실 플레이어 영속 데이터 전용):
  ✅ arcfire_player_v1 (유저 프로필 및 진행도, BM)
  ✅ ship.equipSlots (함선 장착 정보)
  
  ❌ 실시간 위치 X,Y 좌표 업데이트 → 절대 금지 (비용 폭탄)
  ❌ onSnapshot (실시간 리스너) → 절대 금지
  ❌ AI 함선 및 경제 시뮬레이션 결과 업로드 → 절대 금지 (로컬 처리)
```

---

## 📑 목차

1. 시스템 개요 및 5대 설계 원칙
2. 기술 스택
3. 앱 초기화 및 부트스트랩 (Table-First)
4. 스테이지 구조 및 메모리 예산
5. 행성 메인 허브 (Stage 1) 및 UI 레이아웃 계약
6. 게임플레이 루프: 출격·이동·전투 (Stage 2~3)
7. 메모리 관리 핵심 설계 (누수 방지 패턴)
8. 하이브리드 렌더링 파이프라인 (Skia)
9. ArcCore 및 일일 운영 배치 (Daily Ops)
10. AABS: 능동형 밸런싱 시스템
11. AGDS: 자율형 개발 운영 시스템 (Cursor 연동)
12. BM 구조 및 스테이지 매핑
13. 파일 아키텍처 트리
14. **🚨 절대 금지 사항 (Do Not Drift - System Rule 15)**

---

## 1. 시스템 개요 및 5대 설계 원칙

| 원칙 | 내용 | 위반 시 결과 |
|------|------|-------------|
| **Table-First** | `tables/content/` CSV 정본 데이터를 앱 시작 시 `Map`으로 인덱싱. 코드 하드코딩 금지 | O(N) 검색 부하, 데이터 파편화 |
| **Session-Based Memory** | STAGE 전환 시 이전 세션 자원 명시적 `dispose`. 영속성은 `planetCoreRuntimeStore`만. | OOM(Out of Memory) 크래시 |
| **Hybrid Rendering** | 대량 객체(전투/트래픽)는 Skia, 상호작용 마커는 RN Animated로 레이어 분리 | 프레임 드롭 (FPS 저하) |
| **Navigation.replace()** | STAGE 전환 시 `navigate` 절대 금지, 무조건 `replace()` 강제 | 네비게이션 스택 누적, 메모리 터짐 |
| **Local-AI-First** | 밸런스, 트래픽 이동, 전투는 100% 클라이언트 ArcCore에서 로컬 연산 | 파이어베이스 네트워크/비용 폭탄 |

---

## 2. 기술 스택

| 영역 | 기술 | 역할 |
|------|------|------|
| **프레임워크** | React Native | 앱 전체 기반 및 UI 셸 |
| **렌더링 (대량)**| `@shopify/react-native-skia` | 전투 미사일 궤적, 함선, 파티클, AI 트래픽 렌더링 |
| **데이터베이스** | Firebase Firestore | 단발성 `.get()`, `.set()` 프로필 동기화 전용 |
| **로컬 DB (영속)**| `planetCoreRuntimeStore` | 게임 내 행성 핵심지표(5필드) 및 AABS 보정값 |
| **로컬 DB (휘발)**| `planetMemoCache` | 세션 단위 캐시. 스테이지 이탈 시 `.clear()` 강제 |

---

## 3. 앱 초기화 및 부트스트랩 (Table-First)

부트스트랩 시 CSV 인덱싱은 핫 패스 최적화를 위해 **앱 생명주기 동안 단 1회**만 실행한다.

```typescript
// src/game/buildCsvStaticIndexes.ts
export function buildCsvStaticIndexes(csvData: CsvBundle): void {
  // O(1) 조회를 위한 Map 구조체 캐싱
  csvData.ships.forEach(row => shipMap.set(row.id, row));
  csvData.weapons.forEach(row => weaponMap.set(row.id, row));
  csvData.npcs.forEach(row => npcMap.set(row.id, row));
  csvData.aiVirtualPlayerDensity.forEach(row => aiDensityMap.set(row.zoneId, row));
}

// ⚠️ 절대 금지: 화면 렌더링 틱 내부에서 Array.prototype.find() 또는 filter() 사용 금지
```

새로운 NPC 함장이나 전함은 코드에 하드코딩·랜덤 이름 풀로 만들지 않고, 반드시 `tables/content/` CSV에 등록한 뒤 `npm run build:content-tables`로 생성 TS를 갱신한다.

---

## 4. 스테이지 구조 및 메모리 예산

> **배경**: 앱 초기 메모리 200MB → 화면 전환 반복 후 800MB 돌파 → 스마트폰 크래시 현상 방지.

```text
┌─────────────────────────────────────────────────────────────┐
│  STAGE 0: Splash / Auth              목표: < 50MB           │
│  STAGE 1: Planet Hub (Main)          목표: < 200MB          │
│           └─ AI 궤도 트래픽 (AiNpcSubCore) 렌더링 포함          │
│  STAGE 2: Galaxy Map                 목표: < 120MB          │
│  STAGE 3: Combat                     목표: < 250MB          │
│  SUB-STAGE: 행성 시설 (Hub 위 Modal) 목표: < 80MB           │
└─────────────────────────────────────────────────────────────┘
```

모든 주요 스테이지 전환 시 `useStageMemory` 훅을 통해 반드시 직전 메모리 캐시 및 Skia Canvas 자원을 `dispose` 해야 한다.

---

## 5. 행성 메인 허브 (Stage 1) 및 UI 레이아웃 계약

> **설계 철학**: 단일 기준 아키텍처. STAGE 1 레이아웃은 수십 개의 모듈이 의존하므로, 임의로 패딩/마진 상수를 수정해선 안 된다 (`src/stages/planetMainStageLayout.ts`).

### 5-1. 레이아웃 수학적 제약 (수정 절대 금지)
1. **탑바 및 Quest HUD**: `PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX`의 `translateY` 값으로만 이동. 이를 배경 `paddingTop`으로 수정하면 행성 렌더링 위치가 어긋난다.
2. **Quest HUD 세로 높이**: `PLANET_MAIN_QUEST_HUD_ACTIVE_EST_PX`는 실제 레이아웃 크기와 100% 동기화되어야 한다.
3. **배경 높이 고정**: `PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX` 등은 `PlanetStageBackground` 스타일 슬롯과 맞춰 궤도 세로 흔들림을 방지한다.
4. **배경 이미지 레이어**: `planets.csv`의 `backdropImageAssetKey`를 참조하여 그린다. 범용 단일 이미지 하드코딩은 금지.
5. **하단 공백 (Bottom Chrome)**: 시설물 바텀시트 여백은 오직 `PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX` 상수 하나만 쓰며, `ScrollView` 안의 마지막 spacer로 적용한다. 뷰포트를 줄이는 외곽 블록 추가 금지.

### 5-2. 메인 허브 기능
- **스캔 (Distance Sort)**: `INFO_DISTANCE_SORT_INTERVAL_MS = 5000ms` 간격으로 스로틀링. 매 프레임 계산 금지.
- **궤도 트래픽 (AI 생태계)**: `AiNpcSubCore`가 허브 주변을 배회하는 NPC Traffic을 렌더링.
- **이탈 시 해제**: 행성 변경 또는 이탈 시 `releasePlanetMainStageSession()`이 호출되어 rAF 취소, 캐시 파기 자동 수행.

---

## 6. 게임플레이 루프: 출격·이동·전투 (Stage 2~3)

### 6-1. 은하 이동 (Stage 2)
```typescript
releasePlanetMainStageSession(); // 이전 STAGE 자원 완전 파괴
Navigation.replace('GalaxyMap'); // 스택 비우며 전환
beginPlanetHubSuspendingNavigation(); // 이동 시뮬레이션 시작
```

### 6-2. 전투 파이프라인 (Stage 3)
전투는 100% 클라이언트 로컬 물리 시뮬레이션 기반이다. 이중 구현(SVG) 없이 단일 렌더러로 강제한다.

```text
PlanetEdenRaidOrbitSkiaCombat (단일 활성 렌더러)
    │
    ├─ Physics Simulation Step (60FPS 로컬 연산)
    │       │ 
    │       └─ postStepRef 콜백 (구독)
    │
    └─ Skia Render Sync (화면 출력)
```

**시각 규칙 (수정 금지):** 
```typescript
const shouldRenderHead = !m.hitApplied; // 미사일 명중 시 탄두 즉시 제거. 궤적 잔상만 남김.
```

### 6-3. STAGE 3 이탈 시 메모리 계약 (필수)
1. 시뮬레이션 루프 정지 (`cancelAnimationFrame`)
2. `combatOrbitPostStepRef.current = null` (콜백 참조 완벽 해제)
3. `PlanetEdenRaidOrbitSkiaCombat.dispose()` (Skia 메모리 C++ 자원 반환)
4. 객체 배열 무효화 (`missiles.length = 0`)
5. 해제 완료 후 `Navigation.replace('PlanetHub')`로 복귀

---

## 7. 메모리 관리 핵심 설계 (누수 방지 패턴)

### 7-1. dispose() 체이닝 강제
자원 할당과 해제는 `useDisposable` 훅 또는 `useEffect` 클린업에서 항상 쌍(Pair)으로 동작해야 한다.

```typescript
// ✅ 올바른 패턴 (Cleanup 보장)
useEffect(() => {
  const rafId = requestAnimationFrame(renderLoop);
  const sub = eventEmitter.addListener('step', onStep);
  return () => {
    cancelAnimationFrame(rafId);
    sub.remove();
  };
}, []);
```

### 7-2. Animated 메모리 누수 방지
`new Animated.Value(0)`를 렌더링 함수 내에 매번 선언하는 것을 절대 금지한다.
위치 이동은 항상 `transform: [{ translateX }, { translateY }]`를 사용하며, Layout(`top`, `left`) 변경은 렌더링 부하를 일으키므로 금지한다.

---

## 8. 하이브리드 렌더링 파이프라인 (Skia)

### 8-1. 이중 구현 배제 원칙
과거 존재했던 SVG 레거시 경로(`PlanetEdenRaidOrbitSvgRafCombat`)는 전면 폐기/비활성화 상태를 유지한다. **`PlanetEdenRaidOrbitSkiaCombat` 단일 파이프라인**만을 100% 정본으로 사용한다.

### 8-2. Skia 성능 보호 규약
1. Skia Canvas 언마운트 시 반드시 `.dispose()`를 호출한다.
2. Arc packing 업데이트는 시그니처가 변경될 때만 실행(`repackArcs()`)한다. 매 프레임 연산 금지.
3. 렌더링 스레드 내부에서 `findIndex()`를 사용한 O(N) 순회를 절대 금지한다.

---

## 9. ArcCore 및 일일 운영 시스템 (Daily Ops)

> 아크코어는 아크파이어 세계 전체를 구축·유지하는 "근원 마스터 AI"이다. 화면마다 흩어진 `setInterval`을 늘리기 전에 아크코어 확장 여부를 먼저 검토한다.

### 9-1. 일일 운영 (Daily Batch) — 필수 계약
모든 경제, 코어, 환경 정책, AABS 밸런싱 재배치는 **벽시계 24시간 관측 → 정오(12:00) 1회 일괄 실행**으로 수렴한다. 고빈도 행성 코어 연산(수십 초 주기)은 절대 금지한다.

*   **정책 테이블**: `arc_core_daily_ops_policy.csv` (`Asia/Seoul 12:00` 기준)
*   **배치 실행체**: `runArcCoreDailyOpsBatch()`
*   **실행 순서**: `runPlanetEnergyCorePass` → `runPlanetEnvironmentDiversityPass` → `runGlobalPlanetMasterBalancePass` → `runPlayScenarioEconomyPass` → `runDailyPolicyAlignment` → `tryArcCoreWorldDailyUnlock`.
*   **플래그 관리**: `AsyncStorage`(`arcfire_arc_core_daily_ops_v1`)에 마지막 실행일을 기록하여, 배치 시각 이후 첫 포그라운드 진입 시 단 1회만 연산.

### 9-2. 실시간 연출 (Tick 유지)
궤도 수송 시뮬레이션, 행성 교통 체류 시간, `planetDevelopmentAccStore` 누적 지표 수집 등 **단순 연출과 관측**에 한해서만 실시간(`AiNpcSubCore`) 루프를 허용한다.

---

## 10. AABS: 능동형 밸런싱 시스템

### 10-1. 밸런스 보정 제약 (Safe Guard)
AABS 보정은 CSV 정본 데이터를 수정하지 않고, `planetCoreRuntimeStore.globalMultipliers`를 통해서만 개입한다.
*   **보정 한계**: 1회 최대 **5%**, 누적 최대 **±15%**. 임계치 도달 시 Safe Mode(배율 1.0) 강제 복구.
*   **기준 지표**: 싱글 오프라인 환경에 맞추어, 내부 시뮬레이션 봇(Sim-Bot)의 예상 시간/경험치 지표와 실제 유저의 진행도 격차를 분석하여 보정한다.

---

## 11. AGDS: 자율형 개발 운영 시스템 (Cursor 연동)

이 프로젝트는 Cursor AI와 결합된 자율 감사 최적화를 지원한다.
*   **정기 감사**: `npm run audit:daily`, `npm run audit:memory`, `npm run audit:balance`
*   **AI 자율 인수인계**: `npm run audit:arc-self-optimize:pack` 명령을 통해 에이전트 지시문과 리포트를 `cursor-handoff.md`에 패킹하여, 다음 세션의 AI 에이전트가 아크코어 범위만 최적화하도록 지시한다.
*   **버그 워크플로우**: 크래시 발생 시 에이전트가 logcat을 캡처하여 `.cursor/rules/arcfire-bug-debug-workflow.mdc`를 기반으로 원인 분석 및 수정을 제안한다.

---

## 12. BM 구조 및 스테이지 매핑

싱글플레이 샌드박스의 특성에 맞춰, BM 결제 검증은 Firestore 단일 소스를 통해 이루어진다. 멀티플레이 경쟁 지표(서버 랭킹 등)는 존재하지 않는다.

| BM 항목 | 제약 사항 / 위치 |
|---------|-----------------|
| **시즌패스 / VIP** | STAGE 1 (Hub) Modal에서 노출. 오프라인 진행도 단축 및 편의성에 초점. |
| **전투 부활권** | **절대 주의**: STAGE 3 전투 종료 시 팝업을 띄울 때, **반드시 Skia Canvas가 `dispose()` 완료된 이후에만** 상점 Modal을 호출한다. (메모리 OOM 크래시 방어) |
| **데이터 테이블** | `season_pass_rewards.csv`, `vip_benefits.csv`, `purchase_funnel.csv` |

---

## 13. 파일 아키텍처 트리

```text
app/(game)/                    
  planet.tsx                   ← STAGE 1 (Hub) 
  worldmap.tsx                 ← STAGE 2 (Map)
  combat.tsx                   ← STAGE 3 (Combat)

src/
├── arcCore/                   ← 아크코어 근원 마스터
│   ├── subcores/
│   │   ├── ArcCoreDailyOpsSubCore.ts   ← [핵심] 일 1회 배치 (12:00)
│   │   ├── AiNpcSubCore.ts             ← [핵심] 궤도 연출 (가상유저 대체재)
│   │   └── AiEconomySubCore.ts         
│   └── schedule/
│       └── runArcCoreDailyOpsBatch.ts  ← Batch 정본
├── game/
│   ├── buildCsvStaticIndexes.ts        ← Table-First 인덱싱 (O(1))
│   └── planetSessionRegistry.ts        ← STAGE 자원 등록/해제
├── hooks/
│   ├── useStageMemory.ts               ← 메모리 20대 계약 훅
│   └── useDisposable.ts
├── components/planet/
│   └── PlanetEdenRaidOrbitSkiaCombat.tsx  ← Skia 전투 렌더 정본
└── npc/
    └── nearbyOrbitPresenceSystem.ts       ← 궤도 트래픽 시각화 매핑

tables/
├── content/                   ← 함선, 무기, NPC, 행성 정본 (CSV)
└── balance/                   ← AABS, Daily Ops 파라미터 (CSV)
```

---

## 14. 🚨 절대 금지 사항 (Do Not Drift - System Rule 15)

> **Agent & Human Developer Rules**: 코드를 수정하는 모든 에이전트는 아래 15개 항목을 **최우선 시스템 헌법**으로 준수해야 한다. 위반 시 시스템 붕괴로 간주한다.

1. **[데이터]** CSV 정본 데이터를 런타임에 직접 수정/Overwrite 금지 (AABS GlobalMultiplier만 사용).
2. **[메모리]** STAGE 전환 시 `Navigation.navigate()` 절대 금지. 네비게이션 스택 누적을 막기 위해 무조건 `replace()` 강제.
3. **[성능]** Combat Skia 렌더링 스레드에 독립적인 `requestAnimationFrame(rAF)` 루프 추가 금지. `postStepRef` 콜백 동기화 유지.
4. **[시각]** 미사일 탄두 제거 조건인 `!m.hitApplied`를 절대 우회/변경하지 마라.
5. **[성능]** STAGE 1 스캔 렌더링 시 거리 정렬(Distance Sort)을 매 프레임 실행 금지. `INFO_DISTANCE_SORT_INTERVAL_MS = 5000` 간격 스로틀링 필수.
6. **[UI/레이아웃]** RN UI 마커 애니메이션 시 `layout left/top` 속성 변경 절대 금지. 반드시 `Animated.transform` 사용.
7. **[알고리즘]** 렌더링 루프나 빈번한 조회 로직 내에서 `findIndex()`, `filter()` 등 O(N) 순회 금지. 부트스트랩 시 생성한 Map 객체로 O(1) 조회 강제.
8. **[기획/AABS]** AABS 보정 시 1회 5%, 누적 ±15% 상한선 초과 로직 작성 금지.
9. **[UI/레이아웃]** `PLANET_MAIN_FOREGROUND_TOP_CHROME_LIFT_PX`, `PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX` 등 Stage 1 수학적 레이아웃 상수를 임의 변경하거나 우회 뷰(View) 추가 금지.
10. **[아키텍처]** 멀티플레이/채널 관리를 위한 Firestore `onSnapshot` 통신, 유저 간 X/Y 실시간 좌표 동기화 로직 절대 금지. (본 게임은 완전한 로컬 시뮬레이션 기반임).
11. **[크래시 방지]** Stage 3 전투 종료 후 Skia Canvas `dispose()`가 완전 실행되기 전에 BM 결제/팝업 모달 진입 절대 금지 (OOM 유발).
12. **[아키텍처/가상유저]** `aiVirtualPlayerStore` 같은 가상 유저 전용 독자 스토어 임의 재생성 전면 금지. 모든 생태계 트래픽은 `AiNpcSubCore` 궤도 수송 시스템으로 병합 통제된다.
13. **[렌더링]** 전투 시각화를 위한 SVG 레거시 경로 활성화 및 이중 구현 금지. `PlanetEdenRaidOrbitSkiaCombat` 단일 경로만 유지.
14. **[운영]** AABS 및 경제 정책 재정렬을 실시간 틱(Tick) 단위로 고빈도 실행 금지. 반드시 `runArcCoreDailyOpsBatch()`를 통해 하루 1회만 일괄 처리.
15. **[UI/알림]** 에이전트 임의로 Alert/Modal 셸을 산재시키지 마라. 알림은 반드시 `ArcOverlayHost` 파이프라인(`showArcAlert` / `useArcBlockingOverlay`)을 경유하라.

---
**Arcfire Online Architecture Master Spec v3.0 Final — END**
