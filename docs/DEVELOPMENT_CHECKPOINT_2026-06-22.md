# 개발 체크포인트 — Heavy UI · BM v2.1 · 교환 1단계 (2026-06-22)

> **상태**: 🟡 **개발 진행 중** — BM 교환 1단계·Heavy UI 파이프라인 완료, IAP·스타터팩·VIP 미착수.
> **목적**: 다음 세션에서 **어디까지 했는지·무엇을 먼저 할지** 바로 이어가기 위한 기록.
> **Git**: 대량 **미커밋** (BM·Heavy UI·순환참조 수정 등). 커밋 전 `tsc`·`audit:bm-value` 재확인 권장.

---

## 0. 한 줄 요약

| 축 | 완료 | 미완 |
|----|------|------|
| **Heavy UI** | preflight → hydrate → build 파이프라인, 8개 진입점 연동 | 실기기 전 서브메뉴 탭 런타임 검증 |
| **BM v2.1** | CSV 정본·catalog index·가치 감사 PASS | IAP·스타터팩·VIP 일일·보석 직구 |
| **교환** | 💎→Cr 단방향 + 일/주 cap ledger + UI | 보석 획득 경로(IAP mock) 없으면 테스트 불가 |
| **안정화** | 8h+ soak PASS, 순환참조·번들 이슈 해결 | incident handoff 미 ack |

---

## 1. Heavy UI Data Session (완료)

### 코어 모듈

`src/ui/heavyUiDataSession/`

| 파일 | 역할 |
|------|------|
| `types.ts` | 세션 타입·단계 정의 |
| `runHeavyUiDataSession.ts` | preflight → hydrate → build 오케스트레이션 |
| `useHeavyUiDataSession.ts` | React 훅 |
| `HeavyUiOverlayShell.tsx` / `HeavyUiStageGate.tsx` / `HeavyUiStageErrorPanel.tsx` | 로딩·에러 UI |
| `preflightPlanetHub.ts` / `preflightPlanetHubFacility.ts` | 허브·시설 preflight |
| `hydrateRecipes.ts` | hydrate 레시피 |
| `sessions/*` | 화면별 세션 (아래 표) |

### 세션·연동 지점

| 진입 | 세션 파일 | 연동 위치 |
|------|-----------|-----------|
| 행성 경제 정보 | `planetEconomyInfoSession.ts` | `PlanetEconomyInfoOverlayContent.tsx` |
| 행성 개발 목록 | `planetDevelopmentListSession.ts` | `PlanetDevelopmentListContent.tsx` |
| 개발 상세(방위위성·궤도조선소) | `planetDevDetailSession.ts` | `PlanetDevelopmentOverlayContent.tsx` (**gate 인라인**) |
| 무역 | `tradeScreenSession.ts` | `app/(game)/trade.tsx` |
| 조선소 | `shipyardScreenSession.ts` | `app/(game)/shipyard.tsx` |
| 선술집 | `tavernScreenSession.ts` | `app/(game)/tavern.tsx` |
| 스킬트리 | `skilltreeScreenSession.ts` | `app/(game)/skilltree.tsx` |
| 월드맵 | `worldmapScreenSession.ts` | `app/(game)/worldmap.tsx` |

허브 버튼: `PlanetMainScanActionRow.tsx`, `planetHubFeatureSystems.ts`

### 부가 수정

- **행성정보 크래시 방어**: `src/game/planetHub/planetEconomyInfoSnapshot.ts` — `finiteCredits()`, `normalizeTradeFeeBucket()`, `formatCredits()`

### 해결한 이슈

| 이슈 | 원인 | 조치 |
|------|------|------|
| `Unable to resolve PlanetDevDetailHydrateGate` | 신규 파일 + Metro watch/캐시 | gate를 `PlanetDevelopmentOverlayContent.tsx`에 **인라인**, 별도 파일 삭제 |
| `Require cycle: showArcAlert ↔ arcOverlayStore` | Heavy UI preflight에서 `showArcAlert` import | store는 `presentArcOverlayAlert` 직접 호출; `showArcAlert.ts`는 `require()` 지연 로드 |

### 미검증

Metro `r` 리로드 후 아래 **실기기 탭** 확인 필요:

- [ ] 행성정보 오버레이
- [ ] 행성개발 목록·방위위성·궤도조선소 상세
- [ ] trade / shipyard / tavern / skilltree / worldmap

---

## 2. BM v2.1 — Table-First + 가치 감사 (완료)

### CSV 정본 (`tables/balance/`)

| 파일 | 핵심 |
|------|------|
| `bm_economy_policy.csv` | 400 Cr/💎, 일 cap 500💎, 주 cap 2000💎 |
| `gem_exchange_catalog.csv` | 400~500 Cr/💎 티어 |
| `gem_pack_catalog.csv` | 특대팩 2000→2600💎 (zone18 69% 이하) |
| `gem_spend_catalog.csv` | 부활·이동·함선 직구 (UI 미연동) |

### 코드

| 파일 | 역할 |
|------|------|
| `src/bm/bmCatalogIndex.ts` | CSV O(1) Map 인덱스 |
| `src/bm/bmShopCatalog.ts` | 상품 빌드 (VIP `vip_tier_policy.csv` 포함) |
| `src/bm/index.ts` | 공개 export |
| `tools/bm-value-audit/run-bm-value-audit.cjs` | KPI 감사 |
| `npm run audit:bm-value` | **PASS** (최종 확인 시) |

### 설계 원칙 (유지)

- **크레딧**: 플레이 획득, 현금 직구 불가. 교환 크레딧은 AABS/lifetime 미적용.
- **보석**: IAP·VIP·이벤트. →Cr **단방향**만.
- `BM_DUMMY_GEM_TO_CREDIT_RATE` 폐기 → `getGemExchangeBaseCrPerGem()` (400) Table-First.

---

## 3. BM 교환 1단계 (완료 · IAP 미연동)

| 파일 | 역할 |
|------|------|
| `src/bm/gemExchangeModel.ts` | 순수 preflight/quote |
| `src/store/bmExchangeLedgerStore.ts` | KST 일/주 cap (`arcfire_bm_exchange_ledger_v1`) |
| `src/bm/gemExchangeService.ts` | `executeGemToCreditExchange()` |
| `src/store/playerStore.ts` | `spendGems`, `addGems`, `grantExchangeCredits` |
| `src/ui/overlay/content/BmShopOverlayContent.tsx` | **exchange만** 실제 동작; **premium = comingSoon** |
| `src/account/localAccountReset.ts` | ledger `resetLocal()` 연동 |

**i18n**: ko/en `bmShop` 교환 성공·실패·일일 cap HUD v2.1 수치 동기화.

### 교환 테스트 방법

- `player.gems > 0` 필요 — IAP 미연동이면 0 → 「보석 부족」이 **정상**.
- Dev에서 gems 시드 후 BM 상점 → 교환 탭 확인.

---

## 4. Long-run Monitor (상시 감시)

| 항목 | 값 |
|------|-----|
| 스크립트 | `tools/long-run-monitor/start-watch-30m.ps1` |
| 종료 예정 | **2026-06-23 08:00 KST** (`logs/watch-until.json`) |
| 8h+ soak (01:13~09:04) | GL peak ~55MB, PSS ~761MB, 크래시·재시작 없음 — **PASS** |
| 미처리 | `tools/long-run-monitor/outbox/cursor-incident-handoff.md` — **미 ack** |

재가동·ack:

```powershell
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-watch-30m.ps1
node tools/long-run-monitor/ack-incident-handoff.cjs
```

재빌드 중 자동조치 차단: `tools/long-run-monitor/monitor-paused.flag`

---

## 5. 게이트 통과 기록

| 게이트 | 결과 |
|--------|------|
| `npx tsc --noEmit -p tsconfig.client.json` | **PASS** |
| `npm run audit:bm-value` | **PASS** |
| Heavy UI 런타임 (전 서브메뉴) | **미완** (사용자 측) |
| `npm run audit:skia-memory` | 이번 BM 작업 범위外 |

---

## 6. 다음 작업 (난이도 순 · 미착수)

| 순서 | 작업 | 참고 |
|------|------|------|
| **1** | Heavy UI 런타임 검증 | Metro `r` 후 §1 체크리스트 |
| **2** | 스타터팩 1회 지급 | `starter_pack_policy.csv` — 250💎+25k Cr+장비, 1계정 1회 |
| **3** | VIP 일일 보석 | `vip_tier_policy.csv` — basic 15 / plus 35 / max 60 |
| **4** | IAP mock → `addGems` | 결제 SDK 전 더미 구매 |
| **5** | 보석 직구 | `gem_spend_catalog.csv` — 부활·이동·함선 |
| **6** | incident handoff ack | §4 명령 |
| **7** | (선택) 커밋 | Heavy UI / BM 분할 커밋 권장 |

---

## 7. 세션 재개 시 빠른 명령

```powershell
# 타입·BM 감사
npx tsc --noEmit -p tsconfig.client.json
npm run audit:bm-value

# CSV 변경 후 (해당 시)
npm run build:balance-tables

# Metro 캐시 이슈 시
npx expo start --clear

# 모니터 상태
Get-Content tools/long-run-monitor/logs/mem-timeline.csv -Tail 5
```

---

## 8. 관련 문서·이전 체크포인트

- 안정화 기준 (2026-06-16): `docs/STABILIZATION_CHECKPOINT_2026-06-16.md`
- i18n 로드맵: `docs/I18N_MIGRATION_ROADMAP.md`
- 김경제 handoff: `tools/kim-team-lead/reports/kim-economy-handoff.md`
- 대화 전체 맥락: agent transcript `ff8d069a-e2d4-47f3-8376-70b565a93d60`

---

## 9. 커밋 가이드 (테스트 통과 후)

예시 (분할 가능):

```
feat: Heavy UI data session — preflight/hydrate for hub overlays and sub-screens

feat(bm): v2.1 CSV catalog + gem-to-credit exchange with daily/weekly cap
```

커밋 전: `tsc` + `audit:bm-value` + Heavy UI §1 체크리스트.
