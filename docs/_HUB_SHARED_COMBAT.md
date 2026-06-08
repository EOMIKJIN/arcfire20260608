# 메인스테이지 공유 전투 (Hub Shared Combat) v1

## 이탈 정책 (`hubCombatDepartPolicy.ts`)

- **vmock** = participant 파이프라인은 실유저와 동일, **「다른 유저」 집계에는 미포함**
- 활성 웨이브 중 로컬 이탈 + **다른 실유저 없음** → 웨이브 종료·`hub_combat` 정리(게임오버 룰)
- **다른 실유저 있음** → 웨이브·세션 유지, 호스트 이탈 시 `transferHubCombatHost`

## 범위 (되는 것)

1. 전투 중 다른 유저 합류 — **전함·닉네임**이 궤도 전투 레이어에 표시(블루팀 자동전투)
2. **연출은 클라이언트 독립** — 궤적·이동·FX는 기기마다 달라도 됨
3. **2초 주기** 전투 상태 동기화 — HP/실드/생존/경과시간/웨이브(호스트 → Firestore → 합류 클라)
4. **전투 종료 정산 공유** — 호스트가 정산 문서 게시, 모든 참가자 동일 결과 팝업
5. 합류 시 **현재 elapsed·HP 스냅샷** 적용(초기화 어색함 완화)

## 범위 밖 (향후)

- PvP·적대 팀 교전
- 실시간 궤적/미사일 좌표 동기화
- 서버 권위 전투 서버

## 데이터 (Firestore)

```
planets/{planetId}/hub_combat/active
  hostUid, phase, elapsedMs, wave, encounterCycleId, agents[], settlement?

planets/{planetId}/hub_combat/active/participants/{uid}
  nickname, npcShipId, laserWeaponId, missileWeaponId, battleStance
```

## 코드

| 경로 | 역할 |
|------|------|
| `src/firebase/hubCombatFirestore.ts` | 세션·상태·정산 |
| `src/multiplayer/usePlanetHubSharedCombat.ts` | 행성 세션 오케스트레이션 |
| `src/multiplayer/hubCombatRemoteAgents.ts` | 스냅샷·키 |
| `src/components/planet/PlanetEdenRaidTestLayer.tsx` | `injectHubCombatPeerAgents` |
| `src/store/hubSharedCombatStore.ts` | 런타임 상태 |

## 운영

- **v2.0 싱글플레이(기본)**: 공유 전투 OFF — 로컬 sim + 드라코 vmock(로컬)만
- 레거시 멀티 테스트: `EXPO_PUBLIC_REAL_USER_HUB_SYNC=1` 후 `EXPO_PUBLIC_HUB_COMBAT_SHARED_ENABLED=0` 으로만 끄기
- 프레즌스(`hub_peers`)는 비전투 전용 유지 — 전투 중 표시는 **전함 에이전트**가 담당

## 드라코 가상 유저(모의전함)

- `vmock_user_*` 참가 문서의 `npcShipId`는 **`npc_ai_ships.csv` 모의전함** (`npc_mock_pvp_ship_*`)
- 렌더: `NPC_CAPITAL_SHIP_BY_ID` → `topViewImageAssetKey`·`combatVisualSize`·런타임 무기 FK
- 단일 기기: `useDracoHubVirtualMockIngress` + 본 문서 파이프라인으로 동일 화면에 합류 전함 표시

## 검증

1. A 전투 시작 → B 같은 행성 전투 진입 → B 화면에 A 닉네임 전함 + 교전
2. B 합류 시 HP/시간이 A와 대략 일치(2초 이내 갱신)
3. 종료 시 A·B 동일 결과 팝업
4. 드라코 + DEV: 가상 유저 3~5척이 블루 궤도에 **모의전함 스프라이트**로 보이는지 확인
