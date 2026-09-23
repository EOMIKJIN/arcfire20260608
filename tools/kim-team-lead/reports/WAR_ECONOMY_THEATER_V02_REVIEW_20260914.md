# 전쟁·경제 연동 설계 v0.2 — 김클로드 독립 재검수

```text
status=REPORT
task_id=war-economy-theater-v02-review-20260914
kind=DESIGN_REVIEW
code_changes=NO
commit=FORBIDDEN
target=docs/strategy/WAR_ECONOMY_THEATER_AUDIT_AND_UPGRADE_DESIGN.md (v0.2, 2026-09-14)
[pss-pre-dev] hot_path=검토 대상 문서 자체가 설계안 — 코드 미작성 alloc=없음 cache=없음
[pss-pre-dev] stage=N/A(문서 검수) risk=N/A
[pss-pre-dev] verdict=PASS — 본 리포트는 분석·재검수만, src/tables 미변경
```

> **대표님 지시**: "김팀장이 수립한 전체 전쟁·경제 연동설계 v0.2를 분석 검수하고 업데이트 요소나 리스크요소를 정리해 김팀장에게 보고하라."
> **재검수 원칙(CLAUDE.md)**: 김팀장 분석·수치를 받아쓰지 않고 코드·CSV 직접 대조. AGREE/PARTIAL/DISAGREE + 파일:줄.

---

## 0. 결론 요약

문서의 핵심 뼈대(분쟁 삼중 정의, 연결 맵, 헌법 8원칙, `resolveWarTheaterState` 아키텍처, 전선 주둔 프록시)는 **코드 대조 검증 결과 정확**하다. 스팟체크 6건 중 5건 AGREE, 1건은 **문서 자체의 계산 오류**(쿨다운 예시)를 발견했다. 설계 방향(신규 서브코어 없음 · 순수 함수 · PSS bounded · 일 1회 경제)은 CLAUDE.md 1순위 원칙과 부합하며 **착수 승인 시 리스크는 낮다.** 단, 아래 3개 업데이트 요소와 2개 리스크 요소는 §8 승인 전 확인이 필요하다.

---

## 1. 재검수 결과 (AGREE/PARTIAL/DISAGREE)

| # | 문서 claim | 위치 | 판정 | 근거 |
|---|---|---|---|---|
| V1 | 정의 A: `isPlanetContestedZone` = 시드 CSV `contestedZone`, 3행성만 | §2 | **AGREE** | `src/arcCore/balance/balanceTableRegistry.ts:414-418` — `getPlanetOccupationSeedRow` 없으면 false, 있으면 `parseBool(row.contestedZone)`. 정확히 일치 |
| V2 | 정의 C: `isDynamicContestedZonePlanet`, 시드 중복 배제 | §2 | **AGREE** | `src/arcCore/territorial/dynamicContestedZoneStore.ts:156-171` — `Boolean(mem.byPlanetId[planetId])`, 인접 주석이 "이중 판정 방지" 명시 |
| V3 | 정의 B: 캠페인 정책 = 시드3 + 헬리오스·타이탄 + 동적, 전 5행 `contestedZone=true` | §2 | **AGREE** | `tables/balance/arc_core_territorial_combat_policy.csv` 실측 — draco_haven/omega_hub/shadow_market/helios_core/titan_ruins 5행 전부 `enabled=true,contestedZone=true,campaignGroup=draco_front` + `__dynamic_default__`(enabled=false, 템플릿) 1행. 문서 서술과 정확히 일치 |
| V4 | 여파 CSV 수치(E2) — 드라코 -2/-5/+8/+6/-6, 오메가 +3/-4/+5/+4/-3, 섀도우 +5/-3/+4/+3/-4 | §4-D | **AGREE** | `tables/balance/contested_zone_stat_aftermath.csv` 3행 전수 대조, 오차 없음 |
| V5 | NO-LINK: `allySupplyEnabled` 전 행 `false` | §3-3, M9 | **AGREE** | `tables/balance/faction_political_relations.csv` 3행(BLUE-RED/INDEPENDENT-RED/INDEPENDENT-BLUE) 전부 `false` 확인 |
| V6 | 쿨다운 실측식과 "풀 8이면 약 10.7시간" 예시 | §1 | **DISAGREE (문서 자체 계산 오류)** | 아래 §2 상세 |

---

## 2. 발견한 결함 — 쿨다운 예시 수치 오류 (신규 발견, 문서 미기재)

문서 §1: `쿨다운 실측식: cooldownLaps × 활성풀 수 × 1200s. 풀 8이면 약 10.7시간.`

코드 실측 (`src/arcCore/territorial/contestedPoolGovernorSync.ts:96-100`):

```ts
const activePolicies = listTerritorialCombatPolicies().filter(
  (p) => p.enabled && p.contestedZone && p.campaignGroup === campaignGroup,
);
const cooldownMs =
  poolPolicy.cooldownLaps * Math.max(1, activePolicies.length) * TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC * 1000;
```

- `cooldownLaps=2` (`tables/balance/arc_core_contested_pool_policy.csv:2`)
- `TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC=1200` (`territorialCombatCampaign.ts:6`)
- `listTerritorialCombatPolicies()`는 정적 CSV + `listDynamicContestedPolicies()`를 합치므로(`arcCoreTerritorialCombatPolicy.ts:192`) 풀이 8까지 차면 `activePolicies.length`는 실제로 8에 도달 가능 — 이 부분은 문서 서술이 맞음.

**그러나 공식을 그대로 계산하면**: `2 × 8 × 1200s = 19,200s = 5.33시간`이지, 문서가 적은 **10.7시간이 아니다** (정확히 2배 차이). 즉 문서가 인용한 공식과 문서가 제시한 결론값이 서로 안 맞는다 — 둘 중 하나가 틀렸다는 뜻이며, 코드를 그대로 따르면 정답은 **약 5.3시간**이다.

**왜 중요한가**: 이 수치는 Phase 3(§7)에서 "풀 재조정을 캠페인 1랩 완료에도 dirty" 제안의 체감 주기 산정 근거이자, 향후 플레이어向 「전선 재편성까지 약 N시간」 안내 문구에 쓰일 소지가 있는 숫자다. 착수 전에 정정하지 않으면 잘못된 기준으로 후속 설계(§7 Phase 3, §8 질문 3번 "로테이션 20분/min8·max12 유지 여부")가 진행될 위험이 있다.

---

## 3. 업데이트 요소 (착수 전 보완 권장)

1. **§1 쿨다운 예시 수치 정정** — 위 §2. `10.7시간` → `약 5.3시간`(풀8 기준) 또는 공식 자체를 재확인. Phase 3 dirty 트리거 설계와 §8 질문 3번 판단에 영향.
2. **§10-4 함수명 정밀화** — "입금: `resolveFactionVault(승자 홀드)`"는 실제 export명과 다르다. 코드에는 `resolveFactionVaultForPlanetId(planetId)` / `resolveFactionVaultForOccupierClanId(occupierClanId)` (`src/arcCore/economy/resolveFactionVault.ts:71,88`)만 존재하고 바로 이 두 함수가 훌드→금고키 해석을 정확히 수행하므로 **기능적으로는 설계가 맞다**. 단, Phase 1.5 착수 시 실제 삽입점 코드에서 함수명 혼동을 막기 위해 착수 문서(§10-6)에 정확한 함수명을 박아둘 것을 권장.
3. **`listTerritorialCombatPolicies()`의 캐시 무효화 의존성 확인** — 이 함수는 `getActiveContestedPoolRevision()` 기반 캐시(`arcCoreTerritorialCombatPolicy.ts:187-188`)를 쓴다. §6 `resolveWarTheaterState`가 "신규 스토어 없이 순수 함수"를 표방하지만 내부적으로 이 캐시 함수를 호출한다면 **엄밀한 순수 함수는 아니고 캐시-의존 함수**다. 실사용상 문제는 없으나(캐시 무효화는 기존에 이미 검증된 메커니즘), §6 문서의 "순수 함수" 표현은 "부작용 없는 조회 함수" 정도로 다듬는 게 정확하다 — 이후 감사(`audit:war-theater`) 작성 시 이 캐시 리비전 의존을 놓치지 않도록 명시 권장.

---

## 4. 리스크 요소

1. **[낮음] `theaterGarrisonByPlanetId` 및 `territorialPassObservation`의 실제 구현 시 caps 강제 여부** — 설계상 "키 상한 = 활성 풀(≤12)"로 명시되어 있고 CSV(`arc_core_contested_pool_policy.csv`)의 `poolMax=12`와 정합하지만, 이 문서 자체는 코드가 아니므로 실제 구현 PR에서 **정말로 활성 풀 밖의 planetId가 유입되지 않는지**(예: 후방 행성이 실수로 관측 버퍼에 append되는 경로) 별도 가드가 필요하다. CLAUDE.md 1순위(PSS/메모리) 기준으로 Phase 1 착수 시 김클로드가 재검수해야 할 지점.
2. **[낮음~중간] Phase 1.5 "NPC 퀵컴뱃에만 주둔 배율"의 실제 삽입점이 기존 롤 가중 파이프라인과 중복 계산될 가능성** — §10-4는 "롤 가중 CSV 불변, `lerp(min,max,pct/100)`만 곱함"이라 명시하지만, 실제 삽입 지점(`runTerritorialCombatPass.ts` 내부)에서 이미 `defenderAdvantagePct`·`combatNoisePct` 등 여러 가중치가 곱해지는 체인 어디에 끼워 넣는지에 따라 **승률 분포가 의도보다 크게 흔들릴 수 있다.** 이는 문서가 이미 "확인 필요"로 표시한 S5/S6(여파·마스터밸런스 상호작용)과 같은 계열의 리스크이며, Phase 1.5 착수 전 실제 삽입점 코드 재검수를 김클로드가 별도로 요청받아야 할 항목으로 남긴다.
3. **[정보] 문서 §4의 GAP 판정 항목(P2/P7/P10/E1/E5/E8/E9/E13/E15/E17/G1/G2/G3 등)은 이번 라운드에서 전수 재검증하지 않았다** — 대표님 지시가 "업데이트/리스크 요소 정리" 보고였고, 문서 스스로도 "구현 전 · 착수 준비만" 상태이므로 ~60개 체크리스트 전항목 실기 검증은 착수 직전(Phase 0 완료 조건 테스트 고정 시점)에 하는 것이 합리적이라 판단해 이번엔 구조적 뼈대(정의 3종·연결맵·헌법 8원칙·아키텍처)만 정밀 검증했다. 전항목 실기 검증이 필요하면 별도 지시 바람.

---

## 5. 종합 판정

- **분쟁 삼중 정의(§2), 연결 맵(§3), 고도화 원칙(§5), War Theater 아키텍처(§6)**: **AGREE** — 코드 대조 결과 정확.
- **§1 쿨다운 예시 수치**: **DISAGREE** — 계산 오류 발견, 정정 필요(§8 승인 전).
- **§10 군비 의도 채택/제외 분류**: 구조적으로 **AGREE** — 신규 스토어 미생성, 기존 5축 재사용, 플레이어 웨이브 불가침 원칙이 코드 현황과 상충하지 않음. 함수명만 §3-2에서 정밀화 권장.
- **전체 착수 가부**: 리스크 요소는 모두 "낮음~중간" 등급이며 §8의 9개 승인 질문 답변 후 Phase 0(정의·관측, 기존값 0변경)부터 순차 착수하는 현재 계획 그대로 진행 가능. 단 §8 질문 3번(로테이션 20분/min8·max12 유지 여부) 답변 전 위 §2 쿨다운 수치 정정을 먼저 반영할 것을 권장.

---

*작성: 김클로드 · 2026-09-14 · 독립 재검수(코드/CSV 직접 대조), 김팀장 원 설계문서 미변경.*
