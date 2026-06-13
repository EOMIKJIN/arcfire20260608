# 행성 로컬 점유 시스템 (Planet Local Ownership) v3.1

> **문서 상태**: 🚀 v3.1 Master Spec 호환 업데이트 완료
> **변경 요약**: 타 실제 유저와의 소유권 분쟁 및 DB 트랜잭션 전면 폐기. **AI 팩션이 선점한 행성을 플레이어가 로컬에서 점유(Claim)하는 싱글 샌드박스 시스템**으로 재설계.

## 범위 (되는 것)
- 플레이어가 무역소 **소유권 증서**를 구매하여 특정 행성을 로컬에서 **자신의 영토로 편입**.
- 플레이어가 아직 구매하지 않은 행성은 **AI 팩션(무역 연합, 제국, 해적 등)**이 선점하고 있는 것으로 표시.
- 소유권 획득 시 해당 행성 무역소 수수료 인하 등 로컬 혜택 적용.
- 행성 허브 및 무역소 진입 시 클랜 플레이트에 `(팩션 점유)` 또는 본인/로컬 클랜명 `(소유중)` 표시.

## 범위 밖 (절대 금지: Master Spec 14항 위반)
- 타 실제 유저와의 행성 소유권 입찰 경쟁, 경매, 실시간 분쟁.
- `ownership_claim/claim` Firestore `runTransaction` 및 실시간 `onSnapshot` 동기화 전면 금지.

## 데이터 (Local Store / Firestore Profile)
```text
// Firestore: arcfire_player_v1 프로필 문서 내에만 단발성 병합 업데이트됨. (실시간 구독 없음)
arcfire_player_v1/{uid}/planet_holds:
  planetId: "arcadia_prime"
  claimedAt: Timestamp
```

## 운영
- AI 팩션 초기 선점 정보는 `planets.csv` 또는 `planet_trade_route_profile.csv`의 기본 팩션 설정을 따른다.
- Firestore Security Rules: 트랜잭션 충돌 관리가 불필요해졌으며, 단순 본인 프로필 업데이트 권한만 요구됨.
