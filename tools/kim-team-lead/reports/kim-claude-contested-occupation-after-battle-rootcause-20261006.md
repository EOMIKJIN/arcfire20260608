# 김클로드 원인 조사 — 분쟁 링 전투 후 점유가 대표님 지시대로 안 되는 이유

```text
task_id=contested-occupation-after-battle-rootcause-20261006
kind=ROOT_CAUSE (코드 변경 0 · 병렬 조사 3갈래 + 실기 저장소·logcat 직접 대조)
증거=폰 AsyncStorage(14:38 추출본 사본) · adb logcat (pid 30969 → 7965)
판정=원인 확정 1건(P0) · 규칙 빈칸 1건(대표님 결정) · 잠재 위험 2건
```

## ⚠️ 정정 (대표님 2026-10-06) — P0 철회

대표님: 「이동중 전투는 전혀 관계없다. 착륙 전이니까.」 + 체류 성계 승리 규칙:
1. 중립 → 전투 승 → 중립
2. 레드 → 전투 승 → 중립 → (전투 없이 편입) → 블루
3. 블루 → 전투 승(방어 성공) → 블루

- 착륙 전은 체류가 아니다 → 12:57:52 NPC `neutral_declare`는 **정상**. 아래 §1 「체류 판정 확장」 제안은 **철회**.
- 3개 규칙 모두 코드와 일치(`planet.tsx:1304` 레드 승리만 NEUTRAL 기록 · 블루/중립 승리 쓰기 없음 · 편입 `stelliumAnnexEligibility.ts:36-60` 중립·착륙·위성 L1·1홉 블루·금고).
- 드라코 헤이븐 사례(착륙 전 블루→중립, 체류 후 중립 승리 → 중립)는 **규칙대로 동작**.
- 남는 실제 문제는 §3 패배 쪽 위험(R1~R3)과, 승리 중립화 후 이탈 시 NPC 재판정.

## 0. 실기 타임라인 (드라코 헤이븐, 10-06 KST)

| 시각 | 로그 / 저장 | 의미 |
|---|---|---|
| 12:56:45 · 12:57:43 | `verb=combat detail=transit:win` | 드라코 헤이븐으로 가는 이동 중 전투 2회 승리 |
| **12:57:52** | `[territorial] pass draco_haven decision=neutral_declare holdChanged=true blue->neutral` | **도착 9초 뒤 NPC 자동 판정이 블루 → 중립** |
| 13:58:02 | `draco_haven 체류 중 분쟁 차례 → 플레이어 웨이브 이관` | 다음 차례는 정상 이관 |
| 14:03:56 | `verb=combat detail=wave:win` | 대표님 승리 |
| 저장 | `{decision:"status_quo", holdChanged:false, source:"player_wave"}` · hold `neutral, neutralizedAt:null` | 승리 후 점유 변화 없음(중립 유지) |

→ 대표님이 직접 싸우기 **전에** NPC가 이미 점유를 바꿨고, 대표님 승리는 그걸 되돌리지 못했다.

## 1. 원인 P0 — 도착 직후 「체류」로 안 보는 구멍 (확정)

- 체류 판정은 단 하나: `runTerritorialCombatPass.ts:643` `player.currentPlanetId === planetId`. 거짓이면 `:654` pending 해제 후 NPC 자동전.
- 이동 중 전투 승리 → 도착 확정 `transitCombatSession.ts:74` `commitArrival` → `playerStore.ts:685` `moveToSystem` = **`currentPlanetId: null`**. 착륙 버튼(`worldmap.tsx` `landOnPlanet`)을 누르기 전까지 비어 있음.
- 영토 서브코어 probe(`ArcCoreTerritorialCombatSubCore.ts:28-34`)는 60초마다 화면·이동·도착 상태와 무관하게 돎 → 12:57:52 draco_front 차례가 드라코 헤이븐에 걸렸고, `currentPlanetId=null`이라 NPC 롤 → `neutral_declare`(`:828-851`, 전투 없이 중립 덮어쓰기).
- 대표님 규칙 「내가 직접 체류해서 싸운 결과가 우선」을 **도착~착륙 사이 몇 초~수 분** 동안 우회한다.
- 수정 방향(코드 없음): 체류 판정을 「착륙」 → 「현장 도착」으로 확장 — `currentPlanetId === planetId` **또는** (`currentSystemId === 그 행성 성계` && 착륙 전 도착 상태/이동 전투 목적지). `neutral_declare`·`battle` 모두 같은 가드 뒤로.

## 2. 규칙 빈칸 — 중립 행성에서 이겼을 때 (대표님 결정)

- 문서(`PLAYER_WAVE_DEFEAT_CRIMSON_AND_HOME_DESIGN.md`)·코드: 블루 승리 = 유지 · 크림슨 승리 = 중립화 · 패배 = 크림슨. **중립 승리는 정의 없음** → 아무것도 안 씀(`planet.tsx:1305` `wasRedOccupied`만).
- `territorialPlayerWavePending.ts:4-8` 계약(2026-08-18): 「블루 점령은 플레이어가 **없는** 행성의 NPC 자동전에서만」 → 체류 승리로 중립이 블루가 되지 않는 것이 현 설계. 블루화는 스텔리움 편입만.
- P0을 고치면 이번 사례(블루였는데 도착 중 뺏김)는 애초에 안 생긴다 — 블루 상태에서 대표님이 싸우고 이기면 블루 유지.

## 3. 잠재 위험 (이번 사례에선 미발생 — 로그상 증거 없음)

| # | 위험 | 근거 |
|---|---|---|
| R1 | **부팅 시 시드 복구가 패배 RED를 원래 블루로 되돌림** — 분쟁 풀·영토 패스 대상이 아닌 행성(채팅 무장·엔드게임 패배 등)이면 재시작 때 CSV 소유로 복구. 패배 RED엔 보호 마커가 없음 | `seedPlanetOccupationFromBalance.ts:136, 152-153` · `clanWarFoundationStore.ts:666`(마커는 NEUTRAL만) · 패배 복원 대상 아님 `planetOccupationSeedPipeline.ts:41-44` |
| R2 | 패배 RED 기록은 결과창을 닫아야만 실행 — 그 전에 앱 종료·리로드면 영구 유실(웨이브 상태는 메모리만) | `planet.tsx:1380-1417` `onResultClosed` |
| R3 | 패배 후 귀환하면 체류가 풀려 다음 60초 probe에서 NPC가 RED를 다시 바꿀 수 있음(분쟁 차례가 아닌 웨이브는 패스 커서 미전진) | `runTerritorialCombatPass.ts:643/1010/1119` |

- 저장 타이밍 자체는 즉시 저장(디바운스 없음, `clanWarFoundationDb.ts:66`) — 유실 경로는 R2뿐.
- 승리 학습 기록 `previousSide:'unknown'`(`planet.tsx:1351`) — 사소(ETC).

## 4. 권장 순서

1. **P0 체류 판정 확장**(도착~착륙 구간 NPC 판정 차단) — 대표님 지시 위반의 직접 원인.
2. 대표님 결정: 중립 승리 규칙(현행 유지 vs 블루 복구).
3. R1 패배 RED 보호 마커(시드 복구 제외) · R2 결과창 전 기록 — 실기 재현 후.
