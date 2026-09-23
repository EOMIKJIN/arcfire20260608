# 무기/전함 구매 광물 소모(mineral sink) — 존재 이유 재점검 + 제거 안정성 검토 + 경제 전수검사 (2026-09-23)

```text
status=PENDING
task_id=trade-mineral-sink-removal-review-20260923
kind=DESIGN_REVIEW + REMOVAL_STABILITY_AUDIT + ECONOMY_SCAN (코드 변경 0 — 검토·정리만)
대표님 지시=제거 대상 개념 재점검 → 제거 안정성 검토 → 정리 완료 후 김팀장이 구현 → 무기/아이템/전함 경제밸런스 전체 재검토 필요 여부까지 전수검사
```

## 0. 결론 (3줄)

1. **이 제거는 신용도(credits) 가격 체계와 완전히 분리돼 있어, 무기·전함·아이템의 경제밸런스(레벨·크레딧 가격)를 손볼 필요가 없다.** 크레딧 가격 산식은 애초에 이 광물 소모를 전혀 반영하지 않았다(할인도, 가산도 없음) — 순수하게 얹혀 있던 별도 관문이었다.
2. **제거는 코드가 아니라 CSV 데이터 한 줄만 비워도 끝나는 수준으로 안전하다.** 정책을 읽는 함수가 CSV 행 0개면 자동으로 전부 통과시키도록 이미 짜여 있다.
3. 대표님이 "광물은 업그레이드에 쓰이긴 한다"고 하신 부분은 **정정이 필요하다** — 구매에 쓰이는 광물(`ore_mineral_1`)과 함선 스탯 업그레이드에 쓰이는 광물(`ore_ferrite`·`ore_silicate`·`ore_crystal`)은 **서로 다른 아이템**이라 실제로는 겹치지 않는다(§2).

## 1. 왜 필요했는지 재점검 — 문서 근거 없음, 기능적으로는 "채굴 유도" 추정

- 경제 설계 문서(`docs/economy-evaluation/` 23건) · 김경제 감시 로그(`kim-economy-handoff.md`, 842KB) 어디에도 이 정책의 도입 배경·목적을 논의한 기록이 없다(2026-09-22 앞선 조사에서 확인).
- `ore_mineral_1`의 item_defs 정의(`csvItemDefs.ts:49-64`): `description: "궤도 채굴로 채취한 원석"`, `type: "orbital_mining"`. 이름·설명 전부 **궤도 채굴 미니게임의 산출물**로 못 박혀 있다.
- 실제 획득 경로: 궤도 채굴 세션(`src/systems/mining/service.ts` → `rollMiningDropGoodId`, 존 풀 확률 드랍) · 잔해 수색(판테온 5% 제외 시 광물 풀 5종 중 1) · 극소수 튜토리얼/메인스토리 보상(`csvMissions.ts` 2건, **보상**으로만 등장 — 요구 목표는 0건).
- 종합하면 이 정책의 실제 기능은 "경제 인플레 억제용 싱크"라기보다는 **"무기·전함을 사려면 궤도 채굴이나 수색을 한 번은 만져보게 하는" 콘텐츠 유도 장치**에 가깝다. 다만 이 의도가 문서화된 적은 없어 확정은 아니다.
- 추가로 확인한 사실: `ore_mineral_1`은 `tradeable: true · sellable: true`이고 무역소 매입가 산식(`resolveMineralListingBuyPrice`)도 존재한다 — 즉 그 행성 카탈로그에 리스팅만 돼 있으면 **크레딧으로 그 자리에서 바로 사서 요건을 채울 수 있다.** 이 경우 "채굴을 유도한다"는 기능조차도 사실상 무력화된다(크레딧만 있으면 광물도 크레딧으로 산다). 모든 행성에 실제로 리스팅돼 있는지까지는 카탈로그 시드 데이터 전수 확인은 못 했다.

## 2. "광물은 업그레이드에 쓰인다" — 사실관계 정정

| 용도 | 쓰이는 광물 | 겹침 |
|---|---|---|
| 무기/전함 **구매** 시 소모(이번 검토 대상) | `ore_mineral_1` 단일 | — |
| 함선 스탯 강화(조선소 광물 업그레이드, `mineralUpgradeModel.ts:55-75`) | `ore_ferrite` · `ore_silicate` · `ore_crystal` (스탯별 배합) | **`ore_mineral_1`은 여기 한 번도 안 나온다** |

즉 "구매 절차의 광물 요구를 없애도 업그레이드 시스템에 쓰는 광물과는 무관"하다 — 애초에 다른 자원이다. 이 부분은 대표님이 우려하신 것과 달리 **제거해도 업그레이드 시스템에 아무 영향이 없다.**

## 3. 제거 안정성 검토 — 매우 안전

### 3-1. 코드 의존 범위 (전수 확인)

`resolveTradeMineralSinkRequirement` / `resolveTradeMineralSinkTotalQty`를 참조하는 파일은 전체 저장소에 **3개뿐**이다.

| 파일 | 역할 |
|---|---|
| `src/arcCore/economy/tradeMineralSinkPolicy.ts` | 정의 — CSV 0행이면 모든 조회가 `null` |
| `src/game/tradeScreenPolicy.ts` | 구매 사전 차단(`resolveTradeBuyBlock`) · 환불(`refundTradeMineralSink`) |
| `app/(game)/trade.tsx` | 구매 실행 시 차감(`:425-445`) |
| `src/economy/waveDefenseTestTradeFlow.test.ts` | 테스트 |

이 네 곳 외에 **ArcCore(AI 팩션) 자동 경제 시뮬레이션, 일일 배치, 함대 투자 로직 어디에도 이 정책을 참조하는 코드가 없다** — 전수 grep 확인. 즉 이건 순수하게 "플레이어가 무역소에서 직접 살 때"만 걸리는 로직이고, AI 경제 밸런스와는 완전히 분리돼 있다.

### 3-2. 제거 방법 — 두 단계 중 택1

**A안(최소·즉시 가능·되돌리기 가장 쉬움)**: `tables/balance/economy_trade_mineral_sink_policy.csv`의 데이터 행 2개만 지우고 헤더만 남긴다.
```
itemType,mineralItemId,qtyPerUnit,notesKo
```
`sinkByItemType`(정책 맵)이 비어 있으면 `resolveTradeMineralSinkRequirement`가 모든 아이템에 대해 자동으로 `null`을 반환 — 위 3개 소스 파일의 코드는 **한 줄도 안 건드려도** 차단·차감·환불 로직이 전부 자연스럽게 no-op이 된다. `npm run build:content-tables`(또는 해당 밸런스 빌드 스크립트)로 generated TS만 재생성하면 끝.

**B안(정리형 — A안 적용 후 여유 있을 때)**: 코드까지 걷어낸다. `tradeMineralSinkPolicy.ts` 삭제, `tradeScreenPolicy.ts`·`trade.tsx`의 관련 import·호출 제거, `trade.block.mineral`/`trade.buy.mineralShort` i18n 키 정리, 테스트 파일 갱신. A안만으로 게임플레이상 완전히 죽는 코드라 B안은 "청소"일 뿐 기능적으로 급하지 않다.

**권장**: A안 먼저 적용해 실기로 확인 → 문제 없으면 다음 정기 정리 때 B안. 두 단계 다 tsc·기존 무역소 테스트로 게이트.

### 3-3. 회귀 위험 점검

- 환불 함수(`refundTradeMineralSink`)는 `resolveTradeMineralSinkTotalQty`가 `null`이면 `player`를 그대로 반환하는 가드가 이미 있다(`tradeScreenPolicy.ts:167`) — CSV를 비워도 이 함수가 에러를 내지 않는다.
- 웨이브 디펜스 테스트 3종은 애초에 이 정책에서 면제돼 있었으므로(`isWaveTestTradeItemDef`) 영향 없음.
- i18n 문자열(`trade.block.mineral`·`trade.buy.mineralShort`)은 CSV만 비우면 단순히 더 이상 안 뜨는 죽은 문자열이 될 뿐, 참조 깨짐은 없다.

## 4. 무기/아이템/전함 경제밸런스 전체 재검토 필요 여부 — 전수검사 결과: **불필요**

요청하신 대로 크레딧 가격 산식 전체를 점검했다.

| 가격 산식 | 파일 | 광물 싱크 참조 여부 |
|---|---|---|
| 무기 모듈 거래가 | `src/economy/integratedWeaponTradePricing.ts` (`resolveIntegratedWeaponTradePrice`) | **없음** — 구간예산×성능×수요만 |
| 전함 거래가 | `src/arcCore/balance/capitalShipPerformancePricing.ts` | **없음** — 헐티어×성능만 |

두 산식 모두 "이 아이템은 광물도 요구하니 크레딧을 깎아준다" 같은 보정이 **전혀 없다.** 즉 광물 요구는 크레딧 경제 모델에 처음부터 반영된 적이 없는 **완전히 별개의 추가 관문**이었다. 따라서:

- 제거해도 무기/전함의 **크레딧 가격·레벨 요구치·존별 스케일**은 지금 값 그대로 유지하면 된다 — 재산정 불필요.
- 유일한 부작용은 §1에서 짚은 `ore_mineral_1`의 존재 이유가 옅어진다는 것뿐이다. 이 아이템은 제거 후에도 판매(sellable)는 유지되므로 "그냥 팔아서 크레딧으로 바꾸는 채굴 부산물" 정도로 남는다 — 밸런스를 깨뜨리는 잉여 축적 문제는 아니다(플레이어가 팔면 크레딧으로 전환되며 순환에서 빠짐).
- 아이템 카탈로그(`item_defs.csv`)·CSV 레벨 요구치(`weaponRequiredLevel` 등) 어느 쪽도 이 정책과 연동돼 있지 않아 손댈 필요가 없다.

**결론: 무기·아이템·전함의 레벨/경제가치 전수 재조정은 필요 없다.** 이 제거는 국소적이고, 크레딧 경제에는 사실상 영향이 없는 변경이다.

## 5. 남는 절차적 확인 사항 (제거 전 참고)

- §1에서 언급한 "모든 행성 카탈로그에 `ore_mineral_1`이 실제로 리스팅돼 있는지"는 이번 조사에서 전수 확인 못 함 — 제거와는 무관하지만, 혹시 "채굴 유도" 의도를 살리고 싶다면(제거하지 않는 선택지) 참고할 사항으로 남겨둔다.
- CSV를 비우는 A안 적용 후 `npm run build:content-tables`(정확한 스크립트명은 `tools/content-tables/` 확인) 재실행 필요.

## 6. 다음 단계

이 문서로 검토를 완료했습니다. **김팀장(Cursor 본창)**이 A안(CSV 비우기)부터 적용해 실기 확인 후, 필요 시 B안(코드 정리)까지 진행해 주시기 바랍니다. 코드는 이번 조사에서 변경하지 않았습니다.
