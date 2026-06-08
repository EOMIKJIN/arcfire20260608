# 행성 소유권 글로벌 선점 (Planet Shared Ownership) v1

## 범위 (되는 것)

- 무역소 **소유권 증서** 최초 구매 시 Firestore에 **선점(`preempted`)** 기록
- 동일 행성 메인스테이지·무역소에서 **타 유저 선점 표시** — 클랜 플레이트 `(선점)` / 본인 `(소유중)`
- 타 유저가 선점한 행성은 **소유권 구매 불가**(목록 비활성 + 구매 시도 차단)
- `onSnapshot` 실시간 동기화 + `planetSessionRegistry` 이탈 시 구독 해제

## 범위 밖 (향후)

- 선점 해제·양도·경매·클랜전으로 소유권 이전
- 월드맵 전역 선점 마커(현재는 행성 허브·무역소 게이트만)
- AI 클랜 거점과의 우선순위 정책(현재 로컬 `planetHolds` + 공유 선점 병행)

## 데이터

```
planets/{planetId}/ownership_claim/claim
  planetId, systemId, status: "preempted"
  ownerUid, ownerNickname, ownerClanId, ownerClanDisplayName
  claimedAt, updatedAt
```

최초 선점은 `runTransaction` — 이미 `preempted`이고 `ownerUid`가 다르면 실패.

## 코드

| 경로 | 역할 |
|------|------|
| `src/firebase/planetOwnershipFirestore.ts` | 구독·선점 트랜잭션 |
| `src/multiplayer/usePlanetSharedOwnership.ts` | 행성 세션 훅 |
| `src/store/planetSharedOwnershipStore.ts` | 공유 선점 상태 |
| `src/clanWar/planetOwnershipSharedPolicy.ts` | 플레이트·구매 게이트 |
| `src/store/clanWarFoundationStore.ts` | 구매 시 선점 후 로컬 점유 |
| `app/(game)/planet.tsx` | 클랜 플레이트 표시 |
| `app/(game)/trade.tsx` | 소유권 아이템 구매 차단 |

## 운영

- 비활성: `EXPO_PUBLIC_PLANET_OWNERSHIP_SHARED_ENABLED=0`
- Firestore Rules: `ownership_claim/claim` 읽기(인증 유저), 쓰기는 트랜잭션 선점 정책에 맞게 제한

## 검증

1. 기기 A가 행성 X 소유권 구매 → Firestore `claim` 생성
2. 기기 B 동일 행성 진입 → 플레이트 `(선점)` · 무역소 소유권 항목 비활성
3. 기기 A는 `(소유중)` · 재구매/동일 클랜 로컬 점유 유지
