# 잔해 수색 — 크레딧 확보·일일 한도 전수조사 (2026-09-22)

status: 조사 전용 (코드 변경 없음) · commit 금지 · 김팀장 검수 대상

## 결론
- 크레딧 확보·일일 한도 **핵심 경로는 정상 동작**. 단위테스트 4/4 PASS · `tsc --noEmit -p tsconfig.client.json` 무오류.
- 다만 **정책/계약 불일치 3건 + 결정성 이슈 1건**은 김팀장 판단 필요.

## 실제 흐름 (검증한 경로)
1. `PlanetMainScanActionRow.tsx:195` `onSearchBegin` → `isSalvageSearchDailyCapped()` 로 사전 차단 + 알림 (`planet.tsx:1521`)
2. 게이지 완료 → `planet.tsx:1536` `tryConsumeSalvageSearchDailyAttempt()` 가 **여기서 실제 소진** (한도면 재차단)
3. `resolvePlanetSalvageSearchOutcome` → relic / cash / item
4. cash → `refundCredits(credits)` (`planet.tsx:1568`), 그 외 인벤토리 지급
5. 소진은 `schedulePersist()` 1.5s coalesce (`playerStore.ts:488-497,727-741`). persist 는 fire 시점의 state 를 저장하므로 뒤따르는 크레딧 지급도 함께 저장됨(레이스 없음).

## 한도 (PASS)
- 정책: `tables/balance/planet_salvage_search_policy.csv` → generated TS → `resolvePlanetSalvageSearchPolicy()`. 빌더는 `tables/balance/*.csv` 범용 스캔이라 신규 CSV 자동 생성 확인. cap=100.
- 키: `planetAttackKstDayKey` = `Intl … Asia/Seoul` (`planetAttackKstDayKey.ts:2`). 다음날 리셋은 테스트로 확인.
- 카운트는 **시도 횟수**(성공 아님) — 타입 주석·구현 일치.
- 로드 시 sanitize (`playerStore.ts:337-342`), 상한 10,000 클램프.
- 이중 게이트(시작 시 + 완료 시)로 게이지 진행 중 한도 도달해도 초과 지급 없음. 게이지는 `gaugeActive` 로 동시 1개.

## 크레딧 경제 (Monte Carlo 40행성 × 100회 = 4,000회, 실제 코드 호출)
| 항목 | 결과 |
|---|---|
| cash | 47.05% (이론 50%×광물 95% = 47.5%) |
| item | 47.95% |
| relic | 5.00% |
| 평균 CR/회 | 6.47 |
| 100회 CR (행성별) | min 560 · avg 647 · max 714 |
→ 계정 일 최대 약 650 CR. 한도·확률 모두 CSV 의도대로 나옴. 시세: ferrite 10 · silicate 12 · carbon 16 · nickel 21 · mineral_1 10.

## 이슈
**A. [확인 필요] `refundCredits` 를 보상 지급에 사용 — 계약 이탈** (`planet.tsx:1568`)
`playerStore.ts:515-518` 주석: refundCredits 는 "지출 롤백·환불, AABS `creditReward` 미적용, lifetime 미누적 … 보상 지급에는 `addCredits`". 수색 CR 은 보상인데 refund 경로 → AABS 배율 미적용 + `lifetimeCreditsEarned` 미누적. 의도(배율 1 고정·lifetime 오염 방지)라면 문서화·전용 함수(`grantSalvageCredits` 등) 필요, 아니면 `addCredits` 로 교체. 어느 쪽인지 김팀장 확인 요청.

**B. `enabled=false` 가 한도를 끄지 않음**
CSV 노트 "시세 CR·일일 한도 활성" 인데 `planetSalvageSearchDaily.ts` 는 `enabled` 를 보지 않음(현금 롤만 영향, `planetSalvageSearch.ts:97`). 노트가 틀렸거나 코드가 빠짐. (한도 유지가 의도면 노트 수정.)

**C. attempt 시드가 일일 카운트와 무관 — 재현·반복 가능** (`planet.tsx:1086-1089, 1543`)
`salvageAttemptRef` 는 행성 변경/재마운트/앱 재시작 시 0 으로 리셋, 결과는 `hash(planet:wreck:attempt)` 결정적. → 같은 행성에서 재진입/재시작하면 **같은 결과열 반복**(예: 50회 후 재시작 → 다음 50회는 앞 50회와 동일 결과). 유물 5% 지점도 고정. 총량은 cap 100 으로 묶여 경제 폭주는 아니나 결과 예측·행성 선택 최적화(560~714)가 가능. 시드에 `salvageSearchDayKey`+`salvageSearchCountToday` 를 쓰면 해소(소진 후 count 기준으로 결정).

**D. 한도 기준 시계 = 기기 시계** (`planetAttackKstDayKey(Date.now())`)
싱글플레이·로컬 상태라 기기 시간 조작 시 한도 우회 가능. 다른 일일 한도(일일 배치 등)와 동일 수준인지 정책 판단 필요. 서버 검증 여부는 **미확인**(Firestore 프로필 동기화에 두 필드가 포함되는지 확인 못 함).

## 테스트 공백 (개선 제안)
- `resolvePlanetSalvageSearchOutcome` 자체(relic/cash/item 분기) 미테스트
- `tryConsumeSalvageSearchDailyAttempt` 스토어 통합(소진·persist 예약) 미테스트
- KST 경계 15:00Z(자정) 직전/직후 미테스트 (현재는 12:00 KST 만)
- `enabled=false` · `cash_price_mul=0` 분기 미테스트

## 미확인
- 게이지 진행 중 화면 이탈 시 완료 콜백 동작(unmount 후 호출 여부)
- Firestore 프로필 write 에 salvageSearch* 필드 포함 여부
- `wreck.state.depleted/cooldown` 은 항상 미사용(잔해 무한) — 한도가 유일한 제한임을 확인

## 미커밋 파일 (김팀장 커밋 대상)
`src/game/planetSalvageSearch.ts`(MM) · `planetSalvageSearchDaily.ts` · `planetSalvageSearchPolicy.ts` · `planetSalvageSearch.test.ts` · `csvPlanetSalvageSearchPolicy.ts` · `tables/balance/planet_salvage_search_policy.csv` (모두 untracked)

김팀장(Cursor 본창) 검수 요청.
