# 김클로드 구현 검수 — 웨이브 패배 크림슨 점령 + 기함 귀환 (설계 v0.2 반영분)

```text
task_id=impl-review-wave-defeat-crimson-home-20261005
kind=IMPLEMENTATION_REVIEW (코드 변경 0)
대상=src/game/waveDefense/playerWaveDefeatDisposition.ts · app/(game)/planet.tsx(handleWaveDefenseRunEnded·onResultClosed)
판정=PARTIAL — 분쟁 차례 패배 경로는 AGREE · 대표님 결정 ③ 범위(다른 트리거 패배) 확인 필요 · 범위 밖 변경 동봉
self-check=client tsc 0 · playerWaveDefeatDisposition.test 4/4 · directWaveCombatPriority.test 1/1
참고=10-06 00:05 자동 데일리 커밋 성공(5b6b31a)
```

## 1. AGREE

| 항목 | 근거 |
|---|---|
| 처분 표 | `resolvePlayerWaveDefeatDisposition` — 패배+분쟁 차례+원래 비RED → `occupyCrimson` · 패배+(분쟁 차례 또는 이미 RED) → `sendHome` · 귀환+격침 → `destroyShip` |
| 순서(기함 먼저, 점유 나중) | `onResultClosed`: 격침이면 `applyCapitalShipDestruction`(생존포드·거점), 아니면 `landOnPlanet(resolvePlayerHomePlanetId)` → 그 다음 `applyArcCoreTerritorialHold(RED)` — 레드 퇴거와 겹침 없음(현재 행성이 이미 거점) · 파이프라인 `applyCapitalShipDestruction: sunk && !sendHome`로 이중 처리 방지 |
| 결정 ① 증서 삭제 | `applyArcCoreTerritorialHold`가 `deedOwnerClanId`·`homePlayerUid` null + `scheduleReleasePlanetUniqueDeedLocks([planetId])` 클라우드 잠금 해제 |
| 결정 ② 분쟁 재편입 | RED 기록 직후 `promoteDynamicContestedZone(source='player_wave_defense_loss')` — 편입 판정은 기존 함수 조건 그대로 |
| 결정 ③ 중립·블루 무관 RED | `occupyCrimson` 조건에 「블루였으면」 없음 — 분쟁 차례 패배면 블루·중립 모두 RED |
| 거점 함수 | `resolvePlayerHomePlanetId` 사용(하드코딩 없음) |
| 패스 기록 | 분쟁 패스 학습에 패배를 `battle`·`newSide=red`로 기록 |
| 승리 | 블루 유지·RED 승리 중립화 기존 그대로 |

## 2. 확인 필요 (PARTIAL)

### P1 결정 ③의 범위 — 분쟁 차례 외 트리거
- `territorialAttack`은 분쟁 패스 대기(`requestTerritorialPlayerWavePending`, `runTerritorialCombatPass.ts:358/1302`)일 때만 true.
- 웨이브는 다른 경로로도 시작된다(`evaluatePlanetWaveCombatTrigger`: `chat_armed` · 월드맵 [전투] 의도 · `endgame_boss`). 이 경로로 **블루·중립 행성에서** 크림슨 웨이브에 지면 → 지금 구현은 **점유 변경도 귀환도 없음**.
- 대표님 결정 원문: 「크림슨 레기온과 전투에서 진 성계는 레드가 되어야 한다」 — 트리거 구분 없이 읽힌다. **대표님 확인 필요**: 채팅 무장·[전투]로 시작한 크림슨 웨이브 패배도 RED+귀환인지.

### P2 범위 밖 변경 동봉
- 같은 `planet.tsx` diff에 튜토리얼 오프닝 습격 게이트(`tutorialOpeningRaid` 재무장·`useSyncExternalStore`)와 조선소 B1 튜토리얼 알림 이동이 섞여 있다 — 이 검수 범위가 아니므로 별도 검수 필요(TUT-L0 관련으로 보임).

### P2 남은 설계 보완
- A4 퀘스트 처리(기함 생존 패배 시 진행 퀘스트) 명시·구현 없음.
- A5 플레이봇 동일 규칙 — 김팀장 「이번 반영에 없음」 명시.

## 2-1. 대표님 결정 (10-06) · 김클로드 코드 확인

> 「[전투]·엔드게임 보스 등 어떤 경로로 시작했든 크림슨 전투는 동일 규칙. 승리 = (크림슨 성계면) 중립화 — 스텔리움 편입 블루화도 정상. 패배 = 귀환(파괴 안 돼도 귀환) · 이미 크림슨이면 점유 그대로.」

| 경로 (`evaluatePlanetWaveCombatTrigger`) | 발동 행성 | 승리 | 패배 (현재) | 패배 (대표님 규칙) |
|---|---|---|---|---|
| 분쟁 차례 `territorial_turn` | 체류 행성(블루·중립·레드) | 레드면 중립화 ✓ | RED+귀환 ✓ | 동일 ✓ |
| 월드맵 [전투] `planet_assault` | **레드 행성만**(`assaultActive && stayBlocked`) | 중립화 ✓ | 귀환 ✓ · 점유 레드 유지 ✓ | 동일 ✓ |
| 채팅 무장 `chat_armed` | 블루·중립·레드 | 레드면 중립화 ✓ | 블루·중립: **점유·귀환 없음** ✗ | RED+귀환 |
| 엔드게임 `csv_variant` `endgame_boss` | 어비스·코어 프라임·이터니티(중립화 뒤에도 발동) | 레드면 중립화 ✓ | 중립화된 뒤 지면: **점유·귀환 없음** ✗ | RED+귀환 |

- 승리 규칙 확인: `planet.tsx:1301` `wasRedOccupied && win` → NEUTRAL — **트리거와 무관하게 크림슨 성계 승리 = 중립화**. 블루·중립 승리는 점유 그대로(정상).
- **수정 요청(김팀장)**: `resolvePlayerWaveDefeatDisposition`의 `territorialAttack` 조건을 「플레이어 크림슨 웨이브 전체(분쟁 차례·[전투]·채팅 무장·엔드게임)」로 확장. 패배 → 비레드면 RED·증서 해제·분쟁 재편입 / 공통 귀환(격침=생존포드, 생존=거점 착륙).
- 예외 확인: 전투 시험장 규칙 `draco_combat_test`(타입에만 존재)·퀘스트 궤도 전투(웨이브 아님)는 이 처분 대상 아님 — 유지 권장.

## 2-2. 김클로드 구현 (대표님 「전투 관련은 오늘 처리」 10-06)

- 근거: 허브 웨이브 런 시작은 `useWaveDefenseController.ts:116` `startRun` **한 곳**뿐, 진입 조건 = `resolvePlanetWaveCombatTrigger(...).enabled` → 분쟁 차례·[전투]·채팅 무장·엔드게임 4경로뿐(튜토리얼 습격·퀘스트 궤도는 이 경로 아님). → 허브 웨이브 = 크림슨 웨이브로 일괄 처분.
- `playerWaveDefeatDisposition.ts`: 입력 `territorialAttack` → `crimsonWave`(경로 무관).
- `planet.tsx` 호출부: `crimsonWave: Boolean(endedPlanetId)` + 주석. 분쟁 패스 학습 기록(`territorialAttackLoss`)은 분쟁 차례 전용이라 그대로.
- 테스트 4건 갱신(이미 RED 패배에 `crimsonWave:true` 케이스로 교체).
- self-check: client tsc 0 · disposition 4/4 · directWaveCombatPriority 1/1.

### 리스크 (대표님 판단 필요)
- **시스템 실패 패배도 점령으로 이어짐**: 컨트롤러 failsafe가 `endRun('lose')`를 낸다 — 전투 화면이 45초 안에 안 뜨면(`WAVE_DEFENSE_COMBAT_NEVER_MOUNTED_MS`, :136) · 10분 무진행(:125). 이 패배도 이제 블루·중립 행성을 RED+귀환시킨다(분쟁 차례 경로엔 원래부터 있던 문제가 4경로로 확대). 권장: failsafe 패배는 점유·귀환 제외(결과에 사유 플래그) — 대표님 승인 시 별도 작업.

## 3. 결론

대표님 규칙(경로 무관 · 승리=크림슨 성계 중립화 · 패배=귀환 + 비레드면 RED)대로 맞췄다. failsafe 패배 처리만 대표님 결정 남음.
