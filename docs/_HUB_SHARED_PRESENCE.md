# 메인스테이지 공유 프레즌스 (Hub Shared Presence) v1

## 범위 (되는 것)

- 동일 행성(`planetId`) 메인스테이지에 있는 **다른 플레이어** 접속 표시
- 궤도 체류 마크(녹색 ◇, 본인 파란 ◇과 구분)
- info 패널 `‹P› 닉네임` 줄
- Firestore 실시간 `onSnapshot` + 4초 하트비트
- 행성 이탈/전투 진입 시 `hubStatus: away` 및 구독 해제 (`planetSessionRegistry`)

## 범위 밖 (안 되는 것)

- 실시간 전투 공유·상호 교전 (`PlanetEdenRaidOrbitSkiaCombat` / seamless PVP 미연동)
- 채팅·이동 명령·스킬 동기화
- 채널 100명 자동 분할 (v1은 `channelId === planetId` 단일 채널)

## 데이터

```
planets/{planetId}/hub_peers/{uid}
  uid, nickname, planetId, systemId, channelId, hubStatus, updatedAt
```

## 코드

| 경로 | 역할 |
|------|------|
| `src/firebase/hubPresenceFirestore.ts` | 쓰기·구독 |
| `src/multiplayer/usePlanetHubSharedPresence.ts` | 행성 세션 훅 |
| `src/store/hubSharedPresenceStore.ts` | 원격 피어 목록 |
| `src/components/planet/PlanetRemotePlayerOrbitMarks.tsx` | 궤도 마크 |
| `src/arcCore/subcores/AiHubPresenceSubCore.ts` | 아크코어 정책 축(확장용) |

## 운영

- **v2.0 싱글플레이(기본)**: 실유저 프레즌스 OFF — `docs/Arcfire_RN_Architecture_Master_Spec_v2.0.md` · `singlePlayerModePolicy.ts`
- 레거시 멀티 테스트: `EXPO_PUBLIC_REAL_USER_HUB_SYNC=1` 후 `EXPO_PUBLIC_HUB_PRESENCE_ENABLED=0` 으로만 끄기
- Firestore Security Rules에 `planets/{planetId}/hub_peers/{uid}` 읽기/쓰기(본인 uid) 필요

## 드라코 가상 유저(목업 전함) — 단일 기기 테스트

- **전함 정본**: `tables/content/npc_ai_ships.csv` 의 `npc_mock_pvp_ship_*` (모의전함 01…19)
- **닉네임**: `npc_ai_captains.csv` 의 `npc_cpt_mock_pvp_*` (`assignedShipId` 매칭)
- uid `vmock_user_01` … — **적 레드 웨이브 스폰과 무관**한 플레이어형 난입·이탈(동시 최대 5명)
- **웨이브 교전 시작**: 1~2명 시드 → **웨이브 중** ~5.5초마다 난입(50%)·이탈(30%) — 레드 스태거 배치와 별도
- **전투 중 난입**: `hub_combat/participants` + `injectHubCombatPeerAgents` / **이탈**: participants 삭제 + `ejectHubCombatPeers`
- **격침(파괴)**: 약 4초 후 동일 uid 리스폰·재교전 (`tickVirtualHubCombatPeerRespawn`) — 이탈과 구분
- 기본: `__DEV__` 에서 on. 끄기: `EXPO_PUBLIC_DRACO_HUB_VIRTUAL_MOCK_USERS=0`
- 강제 on(릴리즈 빌드): `EXPO_PUBLIC_DRACO_HUB_VIRTUAL_MOCK_USERS=1`

## 검증

1. 기기 2대, 동일 행성 진입 → 서로 녹색 마크·info `‹P›` 확인
2. 한쪽 전투 진입 → 양쪽 away/마크 숨김
3. 행성 이탈 → 15초 내 상대 목록에서 제거

## 관련

- 행성 **소유권 선점** 공유: `docs/PLANET_SHARED_OWNERSHIP.md`
- 메인스테이지 **공유 전투**: `docs/HUB_SHARED_COMBAT.md`
