# 은하 지도 분쟁 링 · 엔드 루프(1안) 구현 정밀조사 — 2026-10-02

```text
task_id=contested-ring-endgame-audit-20261002
kind=AUDIT (코드 변경 없음 · commit 없음)
요청=대표님 「김팀장이 최근 작업한 엔드게임 콘텐츠 은하계지도 분쟁링 구현에 대해 정밀조사하여 문제를 파악하라」
범위=9e60dcb(10-01) · 8d6f415(10-02) · b0dcc3c(09-29) 의 territorial/annex/waveDefense/worldmap diff + 링 오버레이·예고 훅
```

## 0. 결론 요약

| # | 등급 | 문제 | 근거 |
|---|------|------|------|
| F1 | **P1** | 중립화 전선 징수 2000cr **코드 하드코딩** (Table-First 위반) | `src/arcCore/annex/grantPlayerNeutralizeFrontLevy.ts:7` · `tables/balance`에 키 없음 |
| F2 | **P1** | 「플레이어 중립화 보호창」이 **플레이어 승리 외 중립화(반란 전복·계정 purge)** 에도 걸림 | 판정은 `neutralizedAt`만 봄 `stelliumAnnexEligibility.ts:105` ↔ 마커 설정처 `applyRebellionOverthrowHold.ts:73` · `planetHoldReleasePolicy.ts:89` |
| F3 | **P2** | `protectNeutralizedMs=0`의 의미가 「끄기」가 아니라 **「영구 보류」** — CSV 한 칸으로 보드 동결 가능 | `stelliumAnnexEligibility.ts:108-109` |
| F4 | **P2** | 보호창 중인 행성이 **분쟁 링 예고지로 그대로 표시**되고, 그 차례는 전투 없이 소진됨 | 보호 분기가 `markTerritorialCombatPassCompleted` 호출 `runTerritorialCombatPass.ts:658-682` · 예고 resolver는 보호 미고려 `resolveContestedZonePreviewSystemIds.ts` |
| F5 | P3 | [전투] 어썰트가 30분 승리 쿨다운을 통과 — 쿨다운이 막던 「결과창 중 재기동」 회귀의 안전망이 assault 경로에서 사라짐 | `evaluatePlanetWaveCombatTrigger.ts` 순서 변경 · intent 해제는 `endedSystemId` 있을 때만 `planet.tsx:1220-1228` |
| F6 | P3 | 징수·편입이 금고 `ensureHydrated` 없이 기록 — 기존 NPC 전리품 경로와 같은 패턴 | `grantPlayerNeutralizeFrontLevy.ts:12` · `applyStelliumAnnex.ts:85` |
| F7 | 정보 | 1안 3축 중 **「AI 반격 번짐」「스텔리움 재생성·크림슨 번짐」「이긴 날이 지도에 남게」는 이번 diff에 구현 없음** | 아래 §3 |
| M1 | **메모리 무혐의** | 분쟁 링은 **최대 2개 View**(분쟁 1 + 이상현상 1) — 지도 native_heap 상승의 원인 아님 | §4 |

## 1. 이번에 들어간 것 (diff 실측)

| 커밋 | 내용 |
|------|------|
| 9e60dcb | 군사령부 영토 교리(`applyMilitaryCommandTerritorialAdjustments.ts` 신규, 최대 +6% · CSV `planet_military_command_policy.csv`) · **중립화 보호창**(`runTerritorialCombatPass.ts` 656-682) · 웨이브 트리거 우선순위(어썰트 > 쿨다운) · `RESIDENT_HUB_MAIN_STAGE_AUTO_COMBAT=false` |
| 8d6f415 | 편입 인접 조건에 `player_home` 추가 · **중립화 시 블루 금고 +2000**(`clanWarFoundationStore.ts:714`) · 주석 정리 |
| 09-30 (annex 신규) | 스텔리움 편입(`applyStelliumAnnex.ts`) — 코어 중립 · 착륙 · 위성 L1 · 1홉 아군 · 블루 금고 8000 |
| b0dcc3c | 밀린 점령 팝업 flush 제거(판정 시점에만 표시) |

링 자체(`GalaxyMapContestedZoneRingOverlay.tsx`, `useContestedZonePreviewSystemIds.ts`)는 09-25 이후 **변경 없음**.

## 2. 문제 상세

### F1 (P1) 징수액 하드코딩
`PLAYER_NEUTRALIZE_FRONT_LEVY_CREDITS = 2000` 이 TS 상수. 같은 기능 묶음의 편입 비용(8000)·보호창(30분)은 `stellium_annex_policy` CSV에 있는데 징수액만 빠짐. CLAUDE.md 「CSV Table-First · 코드 하드코딩 금지」 위반.
- 제안: `stellium_annex_policy.csv`에 `frontLevyCredits` 열 추가 → `resolveStelliumAnnexPolicy()`로 읽기.

### F2 (P1) 보호창이 플레이어 승리 외 중립화에도 적용
주석·테스트는 「플레이어 웨이브 중립화 보호」인데, 판정 함수는 `neutralizedAt` 존재 + NEUTRAL만 확인한다. `neutralizedAt`을 세우는 곳:

| 설정처 | 시각 | 보호창 영향 |
|--------|------|-------------|
| `clanWarFoundationStore.ts:668` 플레이어 웨이브 승리 | now | 의도대로 |
| `applyRebellionOverthrowHold.ts:73` 반란 전복 | now | **반란 직후 30분 NPC 점유 동결 — 의도 밖** |
| `planetHoldReleasePolicy.ts:89` 계정 purge 중립 | now | purge 직후 30분 동결 — 의도 밖 |
| `planetOccupationSeedPipeline.ts:85` 소급 수리 | 과거 시각 | 30분이면 이미 만료 · F3과 결합 시 영구 동결 |

- 제안: 플레이어 승리 전용 마커(예: `playerNeutralizedAt`)를 분리하거나, 판정 시 `operations` 마지막 source가 `player_wave_defense_win`인지 확인. 반란·purge도 보호하려는 의도라면 주석·테스트 이름을 그 의도로 고칠 것 — **김팀장 의도 확인 필요**.

### F3 (P2) `protectMs=0` = 영구 보류
```ts
if (windowMs <= 0) return true;   // stelliumAnnexEligibility.ts:109
```
`neutralizedAt`은 NPC 점령·편입·증서로만 지워지는데 NPC 점령 자체가 막히므로, 0으로 두면 F2 표의 행성 전부가 **영구 중립 고정**. 1안의 「보드가 되살아나게」와 정반대 결과를 CSV 한 칸이 만든다. 다른 정책들처럼 0=끄기로 바꾸는 편이 안전.

### F4 (P2) 링이 보호 중 행성을 예고하고 차례를 헛소진
- 링 = draco_front 캠페인의 `nextPreviewOrderIndex` 1곳(정적 5 + 동적 편입이 같은 그룹 뒤에 합류).
- 보호 분기는 `status_quo`로 **패스 완료 처리**하므로 다음 예고지로 넘어간다. 즉 링이 20분 동안 붉게 돌던 행성에서 아무 일도 안 일어나고 링만 옮겨감.
- 플레이어가 여러 곳을 연달아 중립화하면 순차 로테이션 차례가 보호 행성에서 연속 소진 → 전선이 멈춘 것처럼 보임.
- 제안(택1): 예고 resolver가 보호 중 행성을 건너뛰기 / 보호 분기에서는 패스 완료 대신 같은 그룹 다음 행성으로 즉시 넘기기.

### F5 (P3) 어썰트의 쿨다운 통과
쿨다운 스토어 주석상 쿨다운은 「승리 결과창 표시 중 즉시 재기동(중복 처리) 회귀의 구조적 차단 축」이었다. 이제 assault 경로는 이를 거치지 않으며, 재기동을 막는 것은 ① 승리 후 중립화로 RED stay block 해제 ② `clearPlanetAssaultIntent()` 두 가지뿐이다. ②는 `wasRedOccupied && win && endedSystemId` 안에서만 호출(`planet.tsx:1220-1228`) — `endedSystemId`가 빈 값이면 intent(TTL 5분)와 RED가 남아 결과창 중 재발화 가능. 발생 확률은 낮으나 안전망 하나가 빠진 상태.
- 제안: 승리 시 `clearPlanetAssaultIntent()`를 조건 밖(승리 공통)으로 이동.

### F6 (P3) 금고 hydrate 가드 없음
`appendInflow`/`trySpend`가 `ensureHydrated()` 없이 호출됨. 미 hydrate 상태에서 쓰면 잔액 0 기준으로 기록되고, 1.5초 뒤 coalesced persist가 **디스크의 실제 금고를 덮어쓸 수 있다**(`createFactionVaultStore.ts:173-198`). 블루 금고는 `AiEconomySubCore` 부트에서 hydrate되므로 실제 발생은 서브코어 초기화 실패/지연 시에 한정. 기존 `applyTheaterNpcPassSideEffects.ts:73`도 같은 패턴이라 이번 변경만의 문제는 아님 — 금고 공통 가드로 한 번에 처리 권장.

## 3. 1안 대비 구현 범위 (F7)

| 1안 항목 | 이번 diff | 판정 |
|----------|-----------|------|
| 인접 편입 열림 | 스텔리움 편입(1홉 아군·착륙·위성 L1·8000cr) | **구현** |
| AI 반격 번짐 | 보호창은 오히려 **반격을 30분 막는** 쪽 | 미구현 |
| 이긴 날이 지도에 남게 | `neutralizedAt`은 데이터에만 있음 · 지도 표기 없음 · 점령 팝업 flush 제거로 놓친 승리 알림은 사라짐(b0dcc3c) | 미구현 |
| 캡 이후 싱크 → 금고 | 블루 금고 +2000(F1) · 편입 −8000 | 부분(금고만) |
| 캡 이후 싱크 → 전함·총사령관·개발 | 군사령부 교리 +6%는 **방어 보정**이지 점령 성과 싱크가 아님 | 미구현 |
| 블루 0 문제 · 스텔리움 재생성 · 크림슨 번짐 | 없음 | 미구현 |

※ 이번 4개 커밋 diff 범위 기준. 다른 경로에 선행 구현이 있는지는 전 repo 스캔 금지 규칙상 확인하지 않음.

## 4. 메모리·성능 (M1) — 링은 지도 메모리 상승 원인 아님

- 분쟁 정책 CSV: 정적 5행 모두 `draco_front` 그룹 + `__dynamic_default__`도 `draco_front` → 예고 링은 **그룹당 1곳 = 1개**. 동적 편입이 늘어도 링 수는 안 늘어난다.
- 이상현상 링 ≤1. 합계 **최대 2개의 회전 View** (Reanimated UI 스레드 transform, 재그리기 없음).
- 예고 훅은 5~60초마다 `setTick(revision)` — 같은 숫자면 React가 리렌더를 건너뜀. 값이 바뀔 때만 `new Set` 1개 생성 → 무시 가능.
- 이동(`isMoving`) 때마다 링 트리 언마운트/재마운트 — View 2개라 비용 미미.
- 따라서 PID 24434의 지도 native_heap 상승(307→490MB)은 **링이 아닌 다른 지도 경로**(SVG 계층·지도 재렌더 등)에서 찾아야 한다. 기존 메모리 조사(지도 재현 대기)는 그대로 유효.

## 4-1. 추가 재검수 — 「최근 구현이 분쟁 점유 전투 전체를 꼬이게 했나?」 (대표님 질의)

**판정: 전체 붕괴 아님 — 접합부 4곳만 꼬임 (PARTIAL).**

- NPC 영토 판정 본체(가중 롤·마지노선·보급·수도방어·독립국 침공)는 9e60dcb에서 **두 군데만 추가**: 보호창 분기(`runTerritorialCombatPass.ts:656-682`, 조건=중립+`neutralizedAt` 30분 이내+미체류) · 방어 보정 최대 +6%. 나머지 분기 diff 없음.
- 테스트 실측: territorial·annex·waveDefense·galaxyMap·4축 시뮬 **42개 중 40 PASS**. 실패 2건은 이번 작업과 무관:
  - `resolveMaginotExternalSupply.test.ts` #11 — 소스 정규식 검사. 강제 battle 로직은 `runTerritorialCombatPass.ts:815-826`에 **그대로 있음**. 09-24(ddf2fa5)에 여러 줄로 재포맷돼 정규식만 낡음.
  - `planetWaveDefensePolicy.test.ts` 「아르카디아 후반 웨이브는 다음 존 헐」 — 웨이브 함선 구성(09-30 신규 정책) 문제. 영토 판정과 별개.
- 실제로 꼬인 접합부:
  1. F2 보호창이 반란·purge 중립화까지 잡음
  2. F4 보호 행성에 링 예고 + 순차 차례 헛소진 → 로테이션이 멈춘 것처럼 보임
  3. F5 어썰트 쿨다운 통과
  4. **(신규) `RESIDENT_HUB_MAIN_STAGE_AUTO_COMBAT=false`** — 허브 상주 교전 전면 OFF. CSV `mainStageCombatEnabled=true` 행 중 `arcadia_prime(tutorial_escape)`가 이 경로를 잃음(엔드보스 3곳은 웨이브 `csv_variant` 경로라 무영향). draco_haven은 CSV에서도 false로 바뀜. 아르카디아 튜토리얼 탈출 교전이 다른 경로(퀘스트 hub_orbit)로 대체됐는지 **실기 확인 필요**.
- 실기 증상(로그) 없이 코드만 본 판정임. 증상이 있다면 adb logcat `[territorial]` 태그로 재확인 필요.

## 4-2. 김팀장 복구 상태 재검수 (작업 트리 · 미커밋)

기준선 = **96d79b2 (09-30 00:01 스냅샷)** — 엔드게임 작업(annex 파일 생성 09-30 00:37) 직전 마지막 커밋.

| 영역 | 작업 트리 상태 | 판정 |
|------|----------------|------|
| `runTerritorialCombatPass.ts` (보호창·군사령부 보정) | 96d79b2와 **바이트 동일** | 복구 |
| `evaluateHubMainStageCombatGate.ts` (상주 허브 교전) | 96d79b2와 동일 — 상주 교전 게이트 다시 ON | 복구 |
| `resolvePlanetWaveCombatTrigger.ts` ([전투] 쿨다운) | 96d79b2와 동일 — 쿨다운이 다시 버튼 차단 | 복구 |
| `evaluatePlanetWaveCombatTrigger.ts` | 차이 = 주석 1줄 삭제뿐 | 복구 |
| `clanWarFoundationStore.ts` (징수) | 차이 = 빈 줄 1줄뿐 · `grantPlayerNeutralizeFrontLevy*` 삭제 | 복구 |
| 스텔리움 편입 | 코드·UI는 남음, CSV `enabled=false` · `protectNeutralizedMs=0` → 버튼 숨김(`policy_off`) | 비활성 |
| 보호창 함수 `shouldHoldNpcOccupyAfterPlayerNeutralize` | 호출처 0 | 무해 (재배선 시 0=영구보류 주의) |
| 군사령부 교리 파일 2개 | 호출처 0 (파일만 잔존) | 무해 |
| `useContestedZonePreviewSystemIds.ts` | Set 재사용 캐시 추가(+12) | 개선 · 무해 |
| draco_haven 상주 허브 교전 | CSV `mainStageCombatEnabled=false` + draco 함장 `combat→general` **유지** | **미복구** (의도 확인) |
| arcadia 함장 02/03 | vega/solar로 이전된 상태 유지 | 미복구 (콘텐츠 작업분 추정) |

self-check: `tsc -p tsconfig.client.json` **exit 0**. 테스트 41개 중 38 PASS · 3 FAIL:
- 기존 2건(마지노선 정규식 · 아르카디아 웨이브 헐) — 복구와 무관
- **신규 1건 `combatFourAxisPlaySim.test.ts`** — 8d6f415에서 「상주 허브 교전 OFF」로 고친 테스트가 그대로라 게이트 복구와 충돌(`arcadia_prime 유휴 상주 허브 교전 OFF`). 테스트도 96d79b2로 되돌려야 복구 일관성 맞음.

## 5. 권장 처리 순서

1. F2 의도 확인(김팀장) → 마커 분리 또는 주석 정정
2. F1 CSV 이관 · F3 0=끄기로 변경 (작은 diff)
3. F4 예고 링 보호 행성 건너뛰기
4. F5 intent 해제 위치 이동
5. F6 금고 공통 hydrate 가드 (경제 READY와 묶어서)
6. F7 미구현 축은 별도 기획 READY 필요
