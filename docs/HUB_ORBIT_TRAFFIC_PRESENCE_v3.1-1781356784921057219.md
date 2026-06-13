# 메인스테이지 궤도 트래픽 프레즌스 (Hub Orbit Traffic Presence) v3.1

> **문서 상태**: 🚀 v3.1 Master Spec 호환 업데이트 완료
> **변경 요약**: 타 유저 접속 상태를 표시하던 `onSnapshot` 기반 Shared Presence 시스템 전면 폐기. **AiNpcSubCore 기반의 오프라인 AI 궤도 트래픽 연출**로 아키텍처 완전 치환.

## 범위 (되는 것)
- 동일 행성 메인스테이지 주변을 배회하는 **NPC 트래픽(가상 전함)** 표시.
- 궤도 체류 마크(녹색 ◇ 등, 세력별 구분).
- info 패널 `‹AI› 닉네임` (또는 세계관 몰입을 위해 ‹P›로 마스킹 적용).
- 행성 이탈/전투 진입 시 궤도 트래픽 STAGE 메모리 해제(`planetSessionRegistry` dispose).

## 절대 금지 사항 (Master Spec 14항 위반)
- **Firestore `hub_peers` 실시간 구독 (`onSnapshot`) 및 4초 하트비트 전면 폐기.**
- 실시간 전투 공유·상호 교전 (`PlanetEdenRaidOrbitSkiaCombat` / seamless PVP 연동).
- 실시간 채팅·명령·스킬 동기화 통신.

## 데이터 (Local AI Generation)
```text
// Firestore 연결 없음. CSV 테이블 기반 로컬 생성.
planetMemoCache/hub_traffic/{npcUid}
  npcUid, nickname, planetId, systemId, faction, hubStatus, despawnAt
```

## 드라코 가상 유저(목업 전함) 트래픽 생성 규칙
- **전함 정본**: `tables/content/npc_ai_ships.csv`
- **닉네임**: `npc_ai_captains.csv`
- 동시 생성 개수: STAGE 1 메모리 예산(200MB)에 맞춰 최대 5대 제한.
- **이동 패턴**: `AiNpcSubCore`가 부여한 가상의 목적지(무역소, 궤도 외곽 등)로 자율 기동.
- 15초 내외 주기(행성 설정 기반)로 난입(Spawn) 및 이탈(Despawn) 로직 수행.
