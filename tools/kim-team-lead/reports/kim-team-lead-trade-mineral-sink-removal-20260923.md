# 무역소 구매 광물 싱크 제거 — 김팀장 전수 검수 · 2026-09-23

```text
status=REVIEWED APPLY
task_id=trade-mineral-sink-removal-review-20260923
kind=A안 적용 + 가격·매매 전수
[pss-pre-dev] hot_path=구매 탭(클릭) alloc=0(CSV Map 빈 채 모듈 1회) cache=sinkByItemType 부트 1회
[pss-pre-dev] stage=무역소 모달 only · persist/틱/Skia 없음
[pss-pre-dev] verdict=PASS risk=해당없음(P1~P7)
```

## 대표님 의도

무기/전함 **구매 시 `ore_mineral_1` 소모 관문**은 의도한 경제가 아님 → **제거**.  
크레딧 가격·레벨 게이트·수수료·판매식은 **기존값 유지**.

## 김클로드 검토 재검수

| 항목 | 김클로드 | 김팀장 |
|---|---|---|
| 도입 문서 없음 | 동의 | AGREE |
| 싱크 광물 ≠ 조선소 업그레이드 광물 | 동의 | AGREE (`ore_mineral_1` vs `ore_ferrite`/`ore_silicate`/`ore_crystal`) |
| 가격 산식에 싱크 미반영 | 동의 | AGREE — 별개 관문 |
| 제거 후 재가격 불필요 | 동의 | AGREE |
| A안(CSV 데이터 행 비움) | 권고 | **적용** |
| B안(모듈 삭제) | 후속 | **미적용** (롤백 훅 유지) |

## 적용 (A안)

| 파일 | 내용 |
|---|---|
| `tables/balance/economy_trade_mineral_sink_policy.csv` | 헤더만 |
| `src/data/balance/generated/csvEconomyTradeMineralSinkPolicy.ts` | `[]` |
| `src/arcCore/economy/tradeMineralSinkPolicy.ts` | 주석만 (코드 경로 동일, Map 비면 null) |
| `src/economy/waveDefenseTestTradeFlow.test.ts` | 운영 무기/전함도 null |

`build-balance-from-csv` 전체 재생성은 **싱크 파일만** 반영. 다른 generated 127테이블은 되돌림(기존값 보호).

## 가격·매매 전수 (안정화)

싱크를 읽는 런타임은 3곳뿐: `tradeMineralSinkPolicy` → `tradeScreenPolicy.resolveTradeBuyBlock` / `refundTradeMineralSink` → `app/(game)/trade.tsx` 구매 차감.  
판매·수수료·진열은 싱크를 **읽지 않음**.

| 축 | 정본 | 싱크 결합 | 조치 |
|---|---|---|---|
| 운영 무기 구매가 | `resolveIntegratedWeaponTradePrice` — zone 예산 × 성능 × 레벨 × 누적크레딧 × 일1회 demandMul · CSV `purchasePrice`는 floor | 없음 | 유지 |
| 웨이브 무기/전함 | `WAVE_TEST_TRADE_PRICE_CREDITS = 1` | 이미 면제, 이제 운영과 동일 null | 유지 |
| 운영 전함 구매가 | `resolveCapitalShipPerformanceBasePrice` — hull `purchaseCredits` × perf ratio(0.88~1.14) | 없음 | 유지 |
| 일반 교역품 | `good.basePrice` × variance × categoryMul | 없음 | 유지 |
| 광물 시세 | `resolveMineralListingBuyPrice` / `resolveMineralSellPriceCredits` (카탈로그 10종) | `ore_mineral_1`은 카탈로그 아님 | 유지 |
| 소유권 증서 | `resolvePlanetOwnershipDeedTradePriceCredits` | 없음 | 유지 |
| 구매 화면가 | `getBuyPrice` = listing × 수요(0.8/1.0/1.2) + 스킬(`applyPlayerTradeBuyUnitPrice`) | 없음 | 유지 |
| 판매가 | listing 있으면 `getBuyPrice * 0.9` · 광물 정책가 · 교역로 전용 · 폴백 `base*0.7` + 스킬 | 광물 환급 없음(원래 없음) | 유지 |
| 수수료 | `computeTradeFeeForPlanetGross` — 시설 `tradeFeeRatePct`(L1=10) + 스킬 | 없음 | 유지 |
| 조선소 스탯 업 | `mineralUpgradeModel` ferrite/silicate/crystal | **다른 아이템** | 유지 |
| 궤도 채굴 보상 | `ORBIT_MINING_REWARD_GOOD_ID = ore_ferrite` | 무관 | 유지 |
| Macro SIM `mineralSinkPerPowerUnit` | `macroCohortSim` 헤드리스 KPI | 무역소 구매 경로 아님 | 유지(기존값) |
| 일일 배치 가격 | `price_elasticity=0` · `runMarketPricePass` / overlay ±캡 | 싱크 미참조 | 유지 |

**결론**: 크레딧 곡선·레벨 게이트·수수료·판매 마진은 틀어지지 않음. 바뀌는 것은 **구매 시 `ore_mineral_1` ×8(무기)/×120(전함) 인벤 차감이 사라지는 것**뿐.

## 게이트

- wave + 스킬 가격 테스트 11 PASS
- `tsc --noEmit -p tsconfig.client.json` PASS (빈 CSV `never[]` 캐스트 후)

## 실기

무역소에서 운영 무기·전함 구매 시 광물 부족 블록이 없어야 함. 크레딧·수수료·재고·레벨은 기존과 동일.

⚠️ 앱 리로드(`r`)면 충분 (CSV generated TS).
