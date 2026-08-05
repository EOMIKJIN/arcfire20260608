# Firebase · 플레이어 계정 데이터 전수 재조사 FINAL

> **김팀장** · 2026-08-05 · 대표님 지시: 연결·통신·DB·계정(생성/삭제/초기화/연동) 전수  
> **절차**: 1차 맵핑 → 2차 CRUD·효율·위험 재검수 → 본 FINAL  
> **범위**: `src/firebase/**` · `src/account/**` · 연동 store 스케줄 · 섀도우 §16-A  
> **코드 수정 없음** (본 보고는 관측·판정만)

```text
[pss-pre-dev] hot_path=클라우드 sync 디바운스·일1회 RTDB · alloc=페이로드 캡 · cache=Firestore 오프라인
[pss-pre-dev] stage=부트 restore·온보딩·purge · risk=P1(닉네임/백업 고아)
[pss-pre-dev] verdict=PASS(분석) — 구현 착수 없음
```

---

## 0. Executive Verdict (한 페이지)

| 축 | 1차 | 2차 | FINAL |
|----|-----|-----|-------|
| **연결·인증** | 이원화(게임 uid + Anonymous Auth) 명확 | 동일 | **OK** |
| **실시간 금지 계약** | `onSnapshot` / RTDB `.on()` **코드상 없음** | 재확인 | **PASS** |
| **플레이어 CRUD·동기** | 생성·merge sync·복구·purge 경로 존재 | 디바운스·캡·타임아웃 확인 | **대체로 OK** |
| **효율성** | 120s min sync · 페이로드 캡 · deleteField | 고빈도 tick 직접 write 없음 | **양호** |
| **삭제/초기화 완전성** | 로컬 purge 광범위 | 클라우드 **잔존 구멍 2건** | **PARTIAL** |
| **전체 판정** | — | — | **조건부 PASS** — P0 위반 없음 · **P1 2건** 고도화 권고 |

**한 줄**: 아키텍처·계약(단발 read/write · 일1회 RTDB · 로컬 우선)은 건전하다.  
다만 **계정 초기화 시 닉네임 예약 해제 없음** · **`users/{uid}` 삭제 후 `game_save_backups` 서브컬렉션 고아 가능**은 출시 전 손볼 가치가 있다.

---

## 1차 전수 — 인벤토리 맵

### 1-1. 모듈 역할

| 경로 | 역할 |
|------|------|
| `src/firebase/auth.ts` | **게임 uid** = 기기 스코프(Android ID / iOS IDFV). `local-guest` 금지·승격 |
| `src/firebase/firebaseAnonymousAuth.ts` | **rules용** Anonymous Auth · 타임아웃 6s · 세션 캐시 |
| `src/firebase/firestoreRefs.ts` | `users` · `arccore` · `game_save_backups` · chunks |
| `src/firebase/firestore.ts` | restore · nickname check 위임 · create/delete user doc |
| `src/firebase/userDataSync.ts` | `users/{uid}` **통합 merge sync** 정본 |
| `src/firebase/userCloudSyncSchedule.ts` | debounce 900ms + **min 120s** |
| `src/firebase/nicknameRegistry.ts` | `nicknames/{sha256}` create-only 예약 |
| `src/firebase/gameSaveBackup/*` | 백업 업로드·복구·prune · 청크 |
| `src/firebase/arcCoreShadowPairing.ts` | §16-A 1회 트랜잭션 페어 |
| `src/firebase/rtdbRefs.ts` | RTDB `arccore/*` · **once + timeout only** |
| `src/firebase/arccoreFirestoreBootstrap.ts` | `arccore/config|schedule|subcores` 시드 |
| `src/account/accountLifecycle.ts` | 로컬 bootstrap / purge ledger·profile·skill |
| `src/account/localAccountReset.ts` | 계정 초기화 오케스트레이션 |
| `src/game/onboardingPilotRegistration.ts` | 생성 파이프라인 |

### 1-2. Firestore / RTDB 경로

| 경로 | 용도 | 빈도 |
|------|------|------|
| `users/{uid}` | 플레이어 통합 세이브 | 온보딩 · sync(≥120s) · restore 단발 |
| `users/{uid}/game_save_backups/{id}` | 스냅샷 백업 | sync 후 6h · manual · pre_purge |
| `…/payload_chunks/*` | 대용량 분할 | 백업 시 |
| `nicknames/{sha256}` | 닉네임 유일 예약 | 온보딩 · retro 1회 |
| `arccore/config\|schedule\|subcores` | 제어 시드 | 부트 1회성 probe |
| `arc_core_shadow_pairs/{uid}` | 페어 확정 | 온보딩/소급 **1회** |
| `arc_core_shadow_pool/waiting_{0..7}` | 대기 샤드 | 페어 트랜잭션 |
| `arc_core_shadow_profiles/{uid}` | 공개 미러(함선·닉) | publish 단발 |
| RTDB `arccore/learning/devices/{authUid}/dailyKpi` | KPI | **일 1회** + write timeout |

### 1-3. 실시간 리스너

| 패턴 | 결과 |
|------|------|
| Firestore `onSnapshot` | **호출부 없음** (주석·금지 문구만) |
| RTDB `.on()` | **없음** — `once('value')` + timeout만 |
| §16-A `runTransaction` | 섀도우 페어 **예외 승인 범위만** |

→ v4.0 §14 멀티플레이/`hub_peers` 실시간 동기 **위반 없음**.

---

## 2차 전수 — 생명주기 · 효율 · 구멍

### 2-1. 생성 (Create)

```text
닉네임 가용 확인(nicknames get)
  → reserveNickname (create-only)
  → playerStore.createPlayer (로컬)
  → bootstrapAccountData (ledger/profile/skill)
  → ensureSoloClan · tutorial mission
  → createUserDocOnNicknameConfirm (users merge, 실패해도 로컬 유지)
  → persist 로컬
  → syncUserDataWithServer (실패 시 큐/재시도)
  → clearFreshStart
  → shadow pairing pass (void)
```

| 판정 | 근거 |
|------|------|
| **OK** | 오프라인에서도 로컬 계정 완성 · 클라우드 실패가 반쪽 등록 UI 회귀를 안 만듦(2026-07-19 교훈) |
| **OK** | Anonymous Auth 후 write |

### 2-2. 업데이트 / 연동 (Sync)

`buildUnifiedLocalUserObject` → `setDoc(merge)`:

- player · userProfile · userSession · inventory(txns 비움) · skillDb  
- npcCaptainProgress(참조 id) · stageProgress(missions) · world.visited  
- planetCoreRuntime = **방문 요약만** (`byPlanetId`는 `deleteField`로 클라우드에서 제거)  
- clanWarFoundation(operations≤40 · deployments≤60) · top-level `planet_holds`  
- `server_updatedAt` · app_version · region · user_type  

스케줄: 다수 store → `scheduleUserCloudSync` → **900ms debounce + 120s 최소 간격**.

| 판정 | 근거 |
|------|------|
| **OK** | tick/매 persist마다 클라우드 안 씀 — PSS·요금 친화 |
| **OK** | 1MB·인덱스 대비 캡 · 중복 `planetHolds` 제거 |
| **의도** | 행성 코어 전량 맵은 클라우드 비동기(로컬 `planetCoreRuntimeStore` 정본) |

### 2-3. 복구 (Restore)

`tryRestorePlayerFromCloud`: 캐시 즉시 → 힌트 없으면 서버 스킵 → 힌트 있으면 서버 **2s** 상한.  
`bootstrapPlayerAfterCloudRestore`로 로컬 계정 DB 정렬.  
`markFreshStartAfterReset`로 purge 후 자동 복원 차단.

| 판정 | **OK** |

### 2-4. 삭제 / 초기화 (Purge)

`purgeLocalAccountData`:

1. sync/backup 스케줄 취소 · **fresh-start 선기록**  
2. 클라우드: `deleteUserCloudSave`(+ local-guest) ∥ `uploadPrePurgeGameSaveBackup` · **15s** 상한  
3. 로컬: holds·ledger·missions·planetCore(BLUE)·world·telemetry·session·tavern·BM·드론·pantheon·independent vault 등  
4. **유지**: ArcCore 월드 경제(금고 1~4 등) · **shadow identity**(§16-A)  
5. RTDB KPI day 플래그 clear · Anonymous Auth sign-out  

| 판정 | 근거 |
|------|------|
| 로컬 | **OK** — 계정 귀속 범위가 넓고 회귀 대응(오버레이·리다이렉트 보류) 있음 |
| 클라우드 부모 문서 | **OK** — deleteDoc |
| 닉네임 예약 | **P1** — rules상 delete 금지 · purge 시 **해제 API 없음** → 폐기 닉이 해시로 영구 점유 |
| game_save_backups | **P1** — 부모 `users/{uid}` 삭제와 **서브컬렉션 비캐스케이드** → 고아 문서·청크 잔존 가능(pre_purge가 직전 추가 생성) |

### 2-5. 효율성 재검수

| 항목 | 판정 |
|------|------|
| 핫패스 Firebase | **없음** (전투/틱 직접 write 없음) |
| 동기 coalesce | **PASS** (120s floor) |
| 페이로드 | **PASS** (캡·txns 비움·코어 맵 삭제) |
| RTDB | **PASS** (일1 · timeout · session disable) |
| 백업 | 6h 간격 · max 28/uid · prune · 문자 상한·청크 |
| 데드코드 | **P2** — `incrementInventoryItemOnServer` 호출부 0 · 필드 경로도 현 sync 스키마와 불일치 |

### 2-6. 인증·관리자

| 이슈 | Sev |
|------|-----|
| 게임 uid ≠ Firebase Auth uid (의도적 이원화) | OK (문서화 유지) |
| admin: `EXPO_PUBLIC_ADMIN_UIDS`(firestoreClientConfig) vs `EXPO_PUBLIC_ADMIN_DEVICE_IDS`(firestore.ts) **이중 env** | **P2** 정합 확인 권고 |
| 닉네임 `Representative` → admin | OK(의도) · 보안은 rules·allowlist와 교차 |

---

## 종합 위험 표

| ID | Sev | 내용 | 권고 |
|----|-----|------|------|
| **FB-1** | **P1** | purge 후 `nicknames/{hash}` 잔존 · 타인 재사용 불가 | rules 예외 delete(본인 uidHash) 또는 tombstone/`released` 필드 + 클라이언트 해제 |
| **FB-2** | **P1** | `deleteUserCloudSave`가 백업 서브컬렉션·chunks 미삭제 | purge 시 backup prune/recursive delete(또는 Cloud Function) |
| **FB-3** | **P2** | `incrementInventoryItemOnServer` 사문·스키마 불일치 | 삭제 또는 sync 경로로 단일화 |
| **FB-4** | **P2** | Admin env 키 이중 | 단일 env로 통일 |
| **FB-5** | **P2** | Firestore `arccore/schedule` vs 로컬 CSV 일일배치 | 로컬 CSV 정본 명시 · 원격은 플래그 전용인지 문서화 |
| — | OK | onSnapshot 부재 · sync 쓰로틀 · restore/purge 타임아웃 · shadow 1회 | 유지 |

---

## 플레이어 Firestore 효율·연동 요약

| 질문 | 답 |
|------|----|
| 생성이 잘 되나? | **예** — 로컬 우선 · 클라우드 best-effort |
| 업데이트가 잘 되나? | **예** — merge sync · 120s 하한 · 오프라인 큐 |
| 삭제가 완전한가? | **부분** — `users` 문서·로컬은 OK · **닉네임·백업 서브트리 구멍** |
| 연동 효율? | **양호** — 단발·캡·디바운스 · 실시간 구독 없음 |
| 계정↔클라우드 정합? | 로컬 정본 + 클라우드 요약본 모델 — **의도적**. 코어 전량·금고 월드는 클라우드 비대상 |

---

## 향후 고도화 (우선순위)

1. **FB-1** 닉네임 해제/재할당 정책 (초기화·닉변경)  
2. **FB-2** purge 시 `game_save_backups`(+chunks) 정리  
3. FB-3 사문 API 제거  
4. FB-4 admin env 단일화  
5. (선택) sync 페이로드 바이트 실측 대시보드 · rules 감사 체크리스트 CI  

---

## 검사 루프 기록

| 루프 | 내용 | 산출 |
|------|------|------|
| **1차** | 모듈·경로·리스너·스케줄 맵핑 | §1 |
| **2차** | 생성/동기/복구/purge 코드 정독 · 효율·고아·데드코드 | §2 · 위험 표 |
| **FINAL** | 본 문서 | `docs/economy-evaluation/2026-08-05-firebase-account-lifecycle-full-audit-FINAL.md` |

---

**보고 END** · 2026-08-05 · 김팀장  
**판정**: 운영 계약·연동 효율 **조건부 PASS** · **P0 없음** · **P1(닉네임·백업 고아) 조치 권고**
