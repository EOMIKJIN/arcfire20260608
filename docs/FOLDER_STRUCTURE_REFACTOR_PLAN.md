# 폴더구조 리팩토링 계획 — 김팀장 검수 확정본 (2026-07-18)

> 분석: 김클로드(2026-07-17 세션, 분석만·코드 수정 없음) → **김팀장 전수 검수·재검증 완료**.
> 착수 전제였던 「파이어스토어 정식출시 개선」은 2026-07-18 완료·실서버 배포·검증됨 — **착수 가능 상태**.
> 원칙: **로직 불변·위치만 이동** · 단계당 독립 diff 1개 · 매 단계 `tsc` + `audit:memory:all` + handoff 검수.

## 김팀장 검수 결과 요약

| 김클로드 주장 | 김팀장 재검증 | 판정 |
|---|---|---|
| trade.tsx 108-337행에 훅 의존성 없는 순수 함수 ~13개 잔존 | 코드 확인 — `isSellableByTable`·`resolveTradeBuyBlock` 등 실재 | ✅ 사실 |
| (1차 분석) arcCore/game 무기·시설 로직 이중구현 → (재점검) **과장이었음, 정정** | `capitalWeaponPipeline.ts`는 재export 배럴, `planetFacilityInstallJob`은 arcCore 정책을 정상 import — **정상 계층 구조** 확인 | ✅ 정정 타당 — 통합 리팩토링 제외 승인 |
| store 30개 통합은 리스크 대비 실익 낮음 → 보류 | selector 영향범위 광범위 — 동의 | ✅ 보류 승인 |
| worldmap.tsx는 훅 106개로 얽힘 심함 → 신중 진행 | worklet SIGSEGV 크래시 이력 파일 — 아래 조건 추가 | ⚠️ 조건부 승인 |
| docs 마스터 스펙 3개+ 경쟁·체크포인트 누적 | 사실 — 단 rules/AGENTS가 참조하는 문서 있음, 삭제 금지 조건 추가 | ⚠️ 조건부 승인 |

## 진행 현황 (2026-07-18 김팀장 직접 반영)

| 단계 | 상태 | 비고 |
|---|---|---|
| 0-A | ✅ 완료 | 체크포인트 4개 문서 → `docs/archive/` 이동 (rules·AGENTS 참조 없음 확인, 상호 참조는 아카이브 내부끼리라 무해) |
| 0-B | ⏸ 보류 | tools README 34개 보강은 실익 대비 비용 커서 필요 시 개별 도구 수정 시점에 병행 |
| 1 | ✅ 완료 | `trade.tsx` 순수 함수 12개+상수 → `src/game/tradeScreenPolicy.ts` (본문 무변경·이동만), trade.tsx 1,152→943줄, 미사용 import 정리 |
| 2 | ✅ 부분 완료 | `utils/logger.ts` → `src/utils/logger.ts` 이동(루트 utils/ 폴더 제거). `planetCoreMetricTypes.ts`는 import 파일 31개로 churn 과다 — 실익 없어 보류. `TradeListingIcon` 등 오배치는 코스메틱이라 보류 |
| 3 | ⏸ 미착수 | worldmap.tsx 분리 — worklet 리스크로 별도 세션에서 함수 단위 진행 |

게이트: `tsc` PASS · `audit:memory:all` 전부 PASS (memory·skia-worklet·worklet-contract·native-reclaim·resident-set 7/7·hot-path hits=0)

## 확정 단계 (착수 순서)

| 단계 | 내용 | 리스크 | 김팀장 조건 |
|---|---|---|---|
| **0-A** | `docs/` 정리 — 체크포인트·구세대 스펙을 `docs/archive/`로 **이동**(삭제 금지) | 없음 | `.cursor/rules`·`AGENTS.md`·`CLAUDE.md`가 참조하는 경로는 이동 전 참조 갱신 필수 |
| **0-B** | `tools/` 34개 서브디렉터리 README 보강 | 없음 | — |
| **1** | `trade.tsx` 순수 함수 13개 → `src/game/trade*` (기존 동반 모듈 네이밍 준수) | 낮음 | 함수 본문 1자도 변경 금지 · import 경로만 |
| **2** | `components/` vs `ui/` 오배치 소수 이동 + `utils/logger.ts`→`src/utils/` + `store/planetCoreMetricTypes.ts`→`src/types/` 부근 | 낮음 | 기계적 이동만 |
| **3** | `worldmap.tsx` 순수 데이터 가공만 분리 | 중간 | **worklet·제스처·SharedValue 접점은 절대 이동 금지** (`arcfire-crash-fix-structural-gate` 이력 파일) · 함수 단위 diff · 이동 후 릴리즈 재현 경로 1회 |
| **제외** | `src/store/` 통합 · arcCore/game "이중구현" 통합 | — | 보류 확정 (이중구현은 오판 정정 — 정상 계층) |
| **제외** | `PlanetEdenRaidTestLayer.tsx`(3,618줄) 분할 | — | **김팀장 추가 결정**: 전투 Skia 단일 정본 경로(v4.0 §9·§13) — 구조 리팩토링 대상에서 명시 제외. 필요 시 별도 P0 계약 검토로만 |

## 진행 규칙

1. 단계 순서 고정 0-A → 0-B → 1 → 2 → 3 (리스크 낮은 것부터).
2. 단계마다: `npx tsc --noEmit -p tsconfig.client.json` + `npm run audit:memory:all` + 해당 화면 수동 스모크 → handoff → 김팀장 검수 → (지시 시) 커밋.
3. 여러 단계 묶은 대형 diff 금지.
4. 동작을 바꾸는 결정(정본 선택 등)은 본 리팩토링 범위에서 전면 제외.
