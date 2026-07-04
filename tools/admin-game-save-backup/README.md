# Firestore 게임 저장 백업 · 관리자 복구

플레이어 **계정 진행 데이터**(world unlock·행성개발·미션·인벤토리 등)를 Firestore에 스냅샷으로 보관합니다. **7일** 보관 후 자동 삭제.

## 저장 위치

```text
users/{uid}/game_save_backups/{createdAtMs}_{reason}
```

## 자동 백업 트리거

| 트리거 | reason | 간격 |
|--------|--------|------|
| 클라우드 동기화 성공 후 | `scheduled` | 6시간 |
| 계정 초기화(purge) 직전 | `pre_purge` | 매번 |
| 설정(관리자) 수동 | `manual` | 즉시 |

## 관리자 CLI

`GOOGLE_APPLICATION_CREDENTIALS` — Firebase Admin 서비스 계정 JSON.

```powershell
npm run admin:game-save:list -- --uid <firebase_uid>
npm run admin:game-save:restore -- --uid <firebase_uid> --backup-id <backupId>
```

복구 CLI는 `users/{uid}.adminGameSaveRestorePending` 필드를 설정합니다. **앱 bootReady 이후** `GameSaveRestorePendingConsumer`가 백그라운드 1회 소비(부트·타이틀 게이트와 분리).

## 인앱 (설정 · 모든 유저)

설정 오버레이 → **게임 저장 백업 · 복구 (7일)** (계정 섹션)

- 지금 백업하기
- 백업 목록 · **이 백업으로 복구** / **다음 실행 시 복구**

본인 uid 백업만 Firestore Rules로 접근 가능.

## Firestore Rules (운영)

정본: repo 루트 `firestore.rules` · `firebase.json` → `firestore.rules`

배포:

```powershell
npm run deploy:firestore-rules
```

백업 subcollection 쓰기는 **본인 uid**만. 청크 분할(`payload_chunks`) 동일. 관리자 cross-uid 복구는 **Admin SDK CLI** 사용.

```text
match /users/{uid}/game_save_backups/{backupId} { ... }
match /users/{uid}/game_save_backups/{backupId}/payload_chunks/{chunkId} { ... }
```

`adminGameSaveRestorePending` 쓰기는 Admin SDK 전용(클라이언트는 consume 후 delete만).

RTDB `database.rules.json`은 변경 없음.
