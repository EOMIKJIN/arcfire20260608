# 김팀장 → 김클로드 — 전투 끊김 검수에서 넘기는 리스크 2건

- **작성**: 김팀장 · 2026-10-07
- **검수 대상**: `tools/kim-team-lead/reports/kim-play-report-combat-hitch-20261007.md` §6~§11
- **판정**: 반영분 대부분은 유지. 아래 2건만 수정. 그 외 리팩터 금지.

```text
task_id=combat-hitch-review-risks-20261007
status=PENDING
kind=BUGFIX
```

## 유지 (건드리지 말 것)

- 궤적 scratch · `_recordRect.setXYWH` · SkPicture 수동 dispose 금지
- 격추 저장 1.5초 묶음 · 전투 시작·종료 flush
- 웨이브 중 NPC publish skip · `syncLivePhaseElapsedToPublishedShips`의 phase·planetId 가드
- `markCombatOrbitPresenting`으로 교전 중 `runCombatSkiaPresentationReclaim` 건너뛰기
- VFX 진입 임계(미사일 28/40, fps 30/25)와 복귀 임계(24/34, 34/28). 예산 객체 3개 고정
- `planetAttackKstDayKey`의 `Intl.DateTimeFormat` 1회 생성
- 구름 주기 `resolveTransitCloudTravelPeriod` · 장수 2. 대표님 지시분
- 시뮬 `dt = Math.min(33, rawDt)` 
- 순이익 식. `applyTradeRouteNetProfitPerUnit`를 계획·하역에서 다시 호출하면 운송비가 두 번 계산된다. 지금 인라인 식 `max(minNet, floor(gross) - cost)` 가 그 함수와 같다
- `__DEV__` 가드 `ARC_HITCH_DEV`. node 감사에서 `__DEV__` 가 없으면 계측을 끄기 위한 것이다

## R-A. 날짜가 바뀌는 순간 수요 잔여가 어제로 고정됨

`resolveConvoyDemandGrossRoomCredits` (`src/arcCore/economy/convoyDemandGrossRoom.ts`)

```text
const ledger = usePlanetTradeFeeLedgerStore.getState();
ledger.ensureDay(planetAttackKstDayKey());
const prior = ledger.byPlanetId[demandPlanetId]?.convoyGrossCredits ?? 0;
```

`ensureDay`는 날짜가 다르면 `set({ kstDayKey, byPlanetId: {} })` 로 장부를 비운다. 호출부가 잡은 `ledger`는 set 이전 객체라, 비운 뒤에도 어제 `convoyGrossCredits`를 읽는다.

계획 함수는 이 값을 `destDemandRoomScratch`에 넣고 같은 계획 안의 다른 교역품이 다시 쓴다 (`arcConvoyTradePlanner.ts`). 캐시가 없으면 같은 수요지의 두 번째 교역품은 `getState()`를 다시 읽어 잔여가 가득 찬다. 캐시가 있으면 어제 잔여가 그 계획 내내 유지된다. 자정 이후 첫 호송 계획이 수요지 하나를 거절하거나 수량을 줄일 수 있다.

**수정**: `ensureDay` 다음에 `getState()`로 장부를 다시 읽는다. 캐시 키·순이익 식·캡 숫자는 그대로. 테스트는 날짜 전환 뒤 같은 수요지를 두 번 물었을 때 잔여가 당일 캡과 같아야 한다.

## R-B. 스파이가 없을 때 조회가 매 프레임이다

`ArcCoreSpySubCore.ts` 88행 근처:

```text
if (this.lookupAccSec >= LOOKUP_INTERVAL_SEC || this.cachedSpyIds.length === 0) {
  this.cachedSpyIds = listActiveArcCoreSpyCaptainIdsAtPlanet(...)
}
```

결과가 빈 배열이면 `length === 0` 이라 1초 간격이 풀리고 **매 프레임** `getCaptainPresenceWorldIndex`를 탄다. 그 인덱스 서명 `arcTrafficSig`는 `id:captainId:planetId:phase`라 수송선 phase가 바뀔 때마다 캐시가 깨지고, 전 함장 `off_world` 채우기부터 다시 만든다 (`buildCaptainPresenceWorldIndex.ts` 109~159행). 김플레이 실측은 허브에서 `arc_core_spy_subcore` 틱이 0.4~1초마다 150~260ms였다. 이동중 전투 구간에는 없었다(행성 체류가 아니면 앞에서 return).

**수정 범위**

1. 빈 결과와 미조회를 구분한다. 한 번 조회한 빈 목록은 `LOOKUP_INTERVAL_SEC`(1초) 전에는 다시 만들지 않는다.
2. phase만 바뀐 서명 때문에 전 함장 인덱스를 다시 만드는 비용을 줄이되, 스파이 명단·펄스 피해·`applyPlanetAttackCoreDamage` 인자 값은 같아야 한다.
3. 2번이 명단을 바꿀 수 있으면 코드를 멈추고 handoff에 이유만 적는다.

## 완료 조건

- `npx tsc --noEmit -p tsconfig.client.json`
- 수요 잔여 날짜 전환 테스트
- 스파이 조회가 빈 결과에서 매 프레임이 아닌 근거 (테스트 또는 호출 횟수)
- handoff에 변경 파일 · self-check · R-A/R-B 결과를 적고 **커밋하지 않는다**
