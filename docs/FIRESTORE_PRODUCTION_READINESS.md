# Firestore 정식 출시 준비 — 배포 절차·운영 정본 (2026-07-18)

> 10만 유저 대비 전수검사(2026-07-18) 후속 조치의 정본 문서.
> 코드 변경 요약과 **콘솔·CLI에서 대표님이 직접 실행해야 하는 배포 절차**를 기록한다.

## 1. 적용된 코드 변경 (클라이언트)

| 축 | 내용 | 파일 |
|---|---|---|
| 인증 게이팅 | 모든 Firestore read/write 전 Anonymous Auth 확보(세션 영속·최초 1회만 sign-in) | `userDataSync` · `gameSaveBackupService` · `arcCoreShadowPairing` · `firestore.ts` · `arccoreFirestoreBootstrap` |
| iOS 기기 uid | `getIosIdForVendorAsync()` 지원 — 종전 iOS 전 기기 `local-guest` 수렴 결함 제거 | `src/firebase/auth.ts` |
| local-guest 폐기 | 공유 폴백 uid 영속 금지 → 기기 로컬 랜덤 uid 1회 생성 · `local-guest` 자동 admin 판정 제거 | `auth.ts` · `firestoreClientConfig.ts` · `firestore.ts` |
| 닉네임 예약 | `nicknames/{sha256(닉네임)}` create-only 예약 — 동시 가입 중복 원천 차단 · 기존 계정은 동기화 시 1회 소급 예약 | `nicknameRegistry.ts`(신규) · `onboardingPilotRegistration.ts` |
| users 문서 슬림 | `clanWarFoundation.planetHolds` 중복 사본 제거(FieldValue.delete 정리 포함) · `operations` 40개(최신순)·`deployments` 60개 캡 — 로컬 정본은 무손실 | `userDataSync.ts` |
| 대기열 샤딩 | 섀도우 페어링 대기열 `waiting_0..7` 8슬롯 분산(단일 문서 초당 1회 쓰기 한계 해소) · 레거시 `waiting`은 소진 전용 | `arcCoreShadowPairing.ts` |
| 백업 TTL 필드 | 백업 문서에 `expiresAt`(Timestamp) 추가 — 콘솔 TTL 정책으로 이탈 유저 백업 자동 삭제 | `gameSaveBackupService.ts` |
| 데드 코드 제거 | `battles` 컬렉션 체인(`createBattleResultLogToFirestore`·`upsertUserProfileToFirestore`·`incrementInventoryItemOnServer`) 삭제 | `firestore.ts` · `firestoreRefs.ts` · `utils/logger.ts` |
| rules 전면 교체 | default deny · 미인증 거부 · **list(열거) 전면 차단** · 페어 문서 불변 · 닉네임 delete 금지 | `firestore.rules` |

## 2. 보안 모델 (서버리스 헌법 내 최대치)

- **uid = 기기 스코프 64bit 식별자(비공개)**. rules가 컬렉션 `list`를 전면 차단하므로 uid를 모르면 문서 경로에 도달할 수 없다(bearer 모델).
- Anonymous Auth 필수 → 미인증 REST/봇 접근 전면 거부.
- 한계(문서화된 잔여 리스크): 인증된 클라이언트가 **타인의 uid를 알아내면** 해당 문서에 접근 가능하다. uid는 어떤 공개 문서에도 평문 노출되지 않는다(닉네임 예약 문서도 sha256 해시만 저장). Cloud Functions 없는 구조에서 per-uid 소유권 검증은 불가능하며, 필요 시 향후 App Check + custom token 단계에서 보강한다.

## 3. 🚨 배포 절차 (순서 엄수)

**⚠️ 중요 — rules는 신규 클라이언트 빌드 배포 후에만 적용할 것.**
구버전 클라이언트(Anonymous Auth 게이팅 없음)는 새 rules에서 전면 거부된다.

```powershell
# 1) 신규 APK/AAB 빌드·배포 (Anonymous Auth 게이팅 포함 빌드)
npx expo run:android   # 검증용 로컬 빌드

# 2) Firebase 콘솔에서 Anonymous Auth 활성화 확인
#    Authentication → Sign-in method → Anonymous → Enable

# 3) rules 배포
firebase deploy --only firestore:rules

# 4) TTL 정책 활성화 (콘솔 · 1회)
#    Firestore → TTL(수명) → 정책 추가:
#      컬렉션 그룹: game_save_backups  · 필드: expiresAt
#    (payload_chunks는 부모 삭제 시 클라이언트 prune이 처리 — 잔존분은 무해·소량)
```

## 4. 관리자 도구 주의

- rules 배포 후 `tools/debug/*.cjs` REST 스크립트(무인증)는 **거부된다**. 관리자 작업은 Admin SDK(서비스 계정, rules 우회) 또는 콘솔에서 수행.
- `tools/debug/audit-firestore-player-db-size.cjs` — DB 크기 전수검사(읽기 전용). rules 배포 전까지만 무인증 동작.

## 5. 잔여 로드맵 (차기)

| 우선 | 항목 |
|---|---|
| 중 | App Check(Play Integrity) — 변조 클라이언트 차단 |
| 중 | 기기 분실 대비 계정 연동(Google Play Games / Apple) — uid 이관 파이프라인 |
| 하 | `arc_core_shadow_profiles` 닉네임 미러 통합(`users` 직접 read 제거) |
| 하 | 레거시 서버 문서의 `clanWarFoundation.planetHolds` 잔존 필드는 각 유저 다음 동기화에서 자동 정리됨 |
