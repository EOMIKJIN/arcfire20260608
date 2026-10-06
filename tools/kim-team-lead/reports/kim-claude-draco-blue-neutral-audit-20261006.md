# 김클로드 분석 피드백 요청 — 드라코 성운 블루 → 중립

```text
task_id=draco-blue-neutral-audit-20261006
kind=ANALYSIS_FEEDBACK (코드 변경 0 · 판정만)
대상=runTerritorialCombatPass.ts · planet.tsx handleWaveDefenseRunEnded · clanWarFoundationStore.applyArcCoreTerritorialHold
기기=192.168.45.197:33639 · com.arcfire.online · RKStorage
시각=조사 시점 logcat 14:39~14:41 KST (2026-10-06)
금지=원인 추정. 저장 기록·코드에 없는 currentPlanetId를 채우지 말 것.
```

대표님 사실 (저장 기록과 별개로 유지):

1. 드라코 성운은 블루 점령지였다.
2. 분쟁링 이후 대표님이 착륙해 있었다.
3. 웨이브 전투가 진행되었다.
4. 승리했다.
5. 기대: 블루 유지. 관측: 중립.

## 1. 기기 저장 기록 (RKStorage, 읽기 전용 pull)

`arcfire_clan_war_foundation_v2` → `data.planetHolds.draco_haven`

| 필드 | 값 |
|---|---|
| occupierClanId | `neutral` |
| kind | `neutral` |
| capturedAt | `1791259072334` = `2026-10-06T03:57:52.334Z` = **12:57:52.334 KST** |
| neutralizedAt | `null` |
| systemId | `draco_nebula` |

같은 시각의 operation 1건. id `op_arc_1791259072334_890507515`. `startedAt`이 hold `capturedAt`과 동일 밀리초.

| ext 필드 | 값 |
|---|---|
| source | `arc_core_territorial` |
| decision | `neutral_declare` |
| previousSide | `blue` |
| newSide | `neutral` |
| attackerClanId | `neutral` |
| defenderClanId | `balance_seed_faction_blue` |

`ext`에 `combat`·`attackerSide`·`neutralizedByPlayer` 없음. operation 배열은 이 건과 titan_ruins `battle` 1건뿐. `ext`를 나중에 다시 쓰는 코드는 `src/`에서 찾지 못했다(읽기만).

`arcfire_territorial_pass_observation_v1` → `byPlanetId.draco_haven` (행성당 최신 1행, 이전 행은 덮임)

| 필드 | 값 |
|---|---|
| decision | `status_quo` |
| holdChanged | `false` |
| source | `player_wave` |
| atMs | `1791262993605` = `2026-10-06T05:03:13.605Z` = **14:03:13.605 KST** |
| garrisonAfter01 | `25` |
| spoilsCredits | `0` |

`arcfire_arc_core_territorial_combat_v1` → `byPlanetId.draco_haven.lastPassAtMs` 도 `1791262993605` (14:03:13 KST). 12:57 패스 시각은 이 키에 남아 있지 않다.

조사 시점 `arcfire_player_v1`: `currentPlanetId=draco_haven`, `currentSystemId=draco_nebula`, `lastHubPlanetId=draco_haven`. 이 값은 **pull 시각**의 값이다. 12:57:52의 `currentPlanetId`는 저장돼 있지 않다.

`arcfire_arc_core_learning_v1` tail 최신 이벤트는 `2026-10-06T03:00:31.107Z` (12:00:31 KST) `npc.co_presence`. operation id `1791259072334` 는 이 JSON에 0회. 오늘 12:57 사건의 학습 행은 없다.

logcat `ReactNativeJS` 버퍼는 14:39 KST부터다. `draco_haven` 은 `[MEM]`·`[stelliumColonize] skip draco_haven: contested` 만 있다. `[territorial]`·`neutral_declare`·`player_wave` 0건. 12:57과 14:03의 런타임 로그는 버퍼에 없다.

## 2. 코드와 기록의 대응 (파일:줄)

점유를 쓴 함수는 `applyArcCoreTerritorialHold` 한 곳이다. operation id 접두 `op_arc_` 도 여기만 만든다 (`clanWarFoundationStore.ts:682`).

- 중립 hold는 `occupierClanId='neutral'`, `kind='neutral'`, `capturedAt=now` (`:632-666`).
- `neutralizedAt` 은 `neutralizedByPlayer && factionSide==='NEUTRAL'` 일 때만 now (`:640`, `:666`). 아니면 `null`.
- `ext` 는 `{ ...operationMeta, previousSide, newSide }` (`:691`).
- `attackerSide` 가 없으면 `attackerClanId` 는 새 occupier (`:669-674`). 중립 선포면 `neutral`. `defenderClanId` 는 이전 occupier (`:675-680`).

`decision: 'neutral_declare'` 와 `source: 'arc_core_territorial'` 를 같이 넘기는 호출은 `runTerritorialCombatPass.ts:828-835` 뿐이다.

```828:835:src/arcCore/territorial/runTerritorialCombatPass.ts
  if (decision === 'neutral_declare') {
    if (holdSide !== 'NEUTRAL') {
      const applied = warStore.applyArcCoreTerritorialHold({
        planetId,
        systemId: policy.systemId,
        factionSide: 'NEUTRAL',
        operationMeta: { source: 'arc_core_territorial', decision },
      });
```

이 블록은 아래 분기 **다음**에 있다.

```642:650:src/arcCore/territorial/runTerritorialCombatPass.ts
  // 체류 중 due — NPC 자동전(블루 점령 포함) 금지. 웨이브 결과 후 커서 전진.
  if (usePlayerStore.getState().player?.currentPlanetId === planetId) {
    return deferTerritorialPassToPlayerWave({
      planetId,
      policy,
      nowMs,
      campaignMeta,
      previousSide: landedPreviousSide,
    });
  }
```

`deferTerritorialPassToPlayerWave` (`:350-377`) 는 pending 만 만들고 hold 를 쓰지 않는다. 반환 decision 은 `player_wave_pending`.

다른 `applyArcCoreTerritorialHold` 호출:

- 독립국 함락 `:548-559` — `decision: 'battle'`, `combatMode: 'independent_invasion'`, `combat` 포함. 저장 ext 와 불일치.
- 전투 결과 `:1015`, `:1124` — battle 메타. 저장 ext 에 `combat` 없음.
- 웨이브 승리 `planet.tsx:1305-1312` — `source: 'player_wave_defense_win'`, `neutralizedByPlayer: true`. 저장 source·`neutralizedAt: null` 과 불일치.

반란 `applyRebellionOverthrowHold.ts:84-88` 은 `source: 'rebellion_overthrow'`, id `op_rebellion`, `neutralizedAt: now`. 저장 기록과 불일치.

CSV `arc_core_territorial_combat_policy.csv` draco_haven: `neutralDeclareWeightPct=12`, `battle=58`, `status_quo=30`, `combatMode=blue_red`, `draco_front` order 1. `rollDecision` (`runTerritorialCombatPass.ts:116-124`) 이 `neutral_declare` 를 반환할 수 있다. 저장 `decision` 이 그 결과다. 난수 값은 저장되지 않았다.

승리 쪽 (`planet.tsx:1291-1341`):

- `wasRedOccupied` 는 `resolvePlayerPlanetStayBlock != null` (`:1292`). 이 함수는 side 가 red 일 때만 블록을 반환한다.
- red 이고 win 일 때만 `player_wave_defense_win` 으로 NEUTRAL 을 쓴다 (`:1305-1312`).
- 그 외 승리의 `passDecision` 은 `status_quo`, `holdChanged` false (`:1334-1335`). 주석 `:1329` 승리의 블루 유지는 점유를 쓰지 않는다.
- 그 값이 `applyTheaterNpcPassSideEffects` source `player_wave` 로 들어가고 (`:1337-1341`), `applyOnPlayerWave` 가 false 이면 관측만 기록한다 (`applyTheaterNpcPassSideEffects.ts:29-38`). hold 는 쓰지 않는다.

14:03 관측 행의 필드(`status_quo`, `holdChanged false`, `source player_wave`, spoils 0)는 이 분기의 기록 형식과 같다. 관측 행에는 승/패 필드가 없다.

## 3. 기록으로 말하는 순서

1. **12:57:52 KST** — 드라코 hold 가 블루에서 중립으로 기록됨. source `arc_core_territorial`, decision `neutral_declare`. `neutralizedAt` 없음. `capturedAt` = operation `startedAt`.
2. **14:03:13 KST** — 같은 행성의 `player_wave` 관측. `holdChanged false`. combat state `lastPassAtMs` 도 이 시각. hold `capturedAt` 은 12:57 그대로.
3. pull 시각 — hold 는 여전히 그 중립 행. `currentPlanetId` 는 `draco_haven`.

12:57 기록과 14:03 기록은 65분 20초 떨어져 있다. 14:03 행은 점유를 바꾸지 않았다고 적혀 있다.

## 4. 저장되지 않은 것

- 12:57:52 의 `player.currentPlanetId`
- 그 호출이 `deferTerritorialPassToPlayerWave` 를 타지 않았다는 런타임 로그 (logcat 버퍼가 14:39 부터)
- 14:03 웨이브의 outcome (win/lose). 관측 decision 은 `status_quo` 이다. 대표님 진술은 승리다.
- 학습 tail 의 오늘 12:57 행

`:643` 이 참이면 `:828` 에 도달하지 않는다. 이 operation 이 `:828` 의 메타와 같으므로, **그 호출 순간** `currentPlanetId === 'draco_haven'` 은 거짓이었다. 그 순간의 화면·착륙 여부는 이 저장소에 없다. 그 공백을 원인으로 채우지 말 것.

## 5. 김클로드에게 요청하는 판정

코드 변경 없이 AGREE / PARTIAL / DISAGREE. 각 항은 파일:줄 또는 위 저장 필드로만.

1. 이 operation ext 를 만들 수 있는 호출이 `:828-835` 뿐인가.
2. `player_wave_defense_win` 경로가 이 hold(`neutralizedAt: null`, source `arc_core_territorial`, decision `neutral_declare`)를 만들 수 있는가.
3. 14:03 관측 행이 hold 를 쓰지 않는 승리(또는 red 가 아닌 종료) 기록 형식과 일치하는가. 그 행이 블루를 중립으로 바꾸는가.
4. 허브가 `draco_haven` 을 그리는 동안 `:643` 비교가 거짓이 되는 **코드 경로 목록**만 적어라. `hubPlanetIdRef` / `resolvedPlanetId` (`planet.tsx:487-493`) 와 `moveToSystem` 의 `currentPlanetId: null` (`playerStore.ts:682-685`) 를 포함해 대조. 12:57 에 그 경로가 실행됐다는 결론은 로그가 없으면 내리지 말 것.
5. operation `ext` 가 insert 이후 다른 decision 으로 바뀌는 쓰기가 있는가.

판정 파일: `tools/kim-team-lead/reports/kim-claude-draco-blue-neutral-feedback-20261006.md`
커밋 금지. 구현 금지.
