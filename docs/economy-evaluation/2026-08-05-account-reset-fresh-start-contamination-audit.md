# 계정 초기화 → 처음부터 재시작 오염·오류 전수 조사

> **김팀장** · 2026-08-05 · 대표님 지시  
> **범위**: `purgeLocalAccountData` · fresh-start · 타이틀 클라우드 복원 · 잔존 AsyncStorage · Firestore  
> **성격**: 관측·판정 (본 턴 코드 수정 없음)

```text
[pss-pre-dev] hot_path=purge 1회·부트 restore · alloc=없음(분석) · cache=Firestore/AsyncStorage
[pss-pre-dev] stage=초기화→타이틀→신규 생성 · risk=P1(요약알림·닉·백업고아)
[pss-pre-dev] verdict=PASS(분석)
```

---

## 0. 한 줄 판정

| 축 | 판정 |
|----|------|
| **플레이어 진행 데이터 로컬 초기화** | **대체로 OK** — player·미션·인벤·스킬·방문·holds 등 purge에 포함 |
| **옛 계정 클라우드 자동 되살아남** | **차단 OK** — `fresh-start` 선기록 + 타이틀 restore 스킵 |
| **신규 시작 데이터 오염** | **부분 있음** — P0는 없으나 **P1 잔존 3건** + 의도적 월드축 잔존 |

**총평**: 「이어하기가 옛 계정으로 돌아온다」류의 **치명 회귀는 현재 코드상 막혀 있음**.  
다만 초기화 후 **첫 허브에서 옛 일일배치 요약 알림**, **닉네임 예약 잔존**, **백업 서브컬렉션 고아**는 신규 체감·클라우드를 오염시킬 수 있다.

---

## 1. 정상 동작하는 방어 (오염 차단)

| 메커니즘 | 동작 |
|----------|------|
| `markFreshStartAfterReset` **purge 시작 즉시** | 클라우드 자동 복원 차단 플래그 선기록 (강제종료 대비) |
| 타이틀 `consumeFreshStartForTitle` | restore **스킵** · 플래그는 **신규 계정 생성 완료** 시에만 삭제 |
| `deleteUserCloudSave` + `local-guest` | `users/{uid}` 삭제 시도 |
| `purgeAccountLedgerProfileSkillByUid` | 프로필 nicknameSnapshot 제거 → `hadLocalAccountMeta` 오판 완화 |
| `resetLocalPlayer` + finalize 재확인 | player 잔존 시 재삭제 · 실패 시 알림 |
| 계정 귀속 스토어 다수 reset | missions · instance board · npc · mineral · world · WO · telemetry · session · tavern · BM · drones · scan · spy · pantheon · independent vault · wave cooldown · contested |

→ **자동 클라우드 복원으로 옛 세이브가 신규를 덮는 경로**는 fresh-start로 **1차 봉쇄**.

---

## 2. 오염·오류 후보 (전수)

### 2-A. 플레이어 체감 오염 (조치 권고)

| ID | Sev | 잔존 | 신규 시작 영향 |
|----|-----|------|----------------|
| **RS-1** | **P1** | `arcfire_arc_core_daily_ops_summary_pending_v1` **purge 미포함** | 신규 캐릭 첫 허브에서 **이전 계정 일일배치 요약 알림**이 1회 뜰 수 있음 |
| **RS-2** | **P1** | Firestore `nicknames/{hash}` + 로컬 `arcfire_nickname_reserved_v1:{uid}` | 이전 닉 **영구 예약** · 타인이 못 씀 · 본인은 excludeUid로 재사용 가능하나 **다른 닉으로 바꿀 때 옛 닉 방치** |
| **RS-3** | **P1** | `users/{uid}/game_save_backups/*` (+chunks) 부모 삭제와 비캐스케이드 | 설정/수동·관리자 경로로 **옛 스냅 복구 가능** · 스토리지 고아 |
| **RS-4** | **P2** | `arcfire_game_save_backup_last_at_v1` | 신규 후 자동 백업 6h 지연 — 오염은 아님 |
| **RS-5** | **P2** | `arcfire_planet_nebula_profiles_v1` purge 없음 | 월드 연출 축 · 옛 일일 ecology shift 잔존 가능 (진행 스탯 오염은 약함) |
| **RS-6** | **P2** | Admin pending restore (`GameSaveRestorePendingConsumer`) | 문서 삭제되면 none · **오프라인 delete 미커밋 + pending 잔존** 시 이론상 복구 — 희귀 |

### 2-B. 의도적 유지 (오염으로 보지 않음 · 헌법)

| 잔존 | 이유 |
|------|------|
| 금고 1~4 · trade fee · price overlay · central bank · daily ops dayKey | ArcCore **월드/경제** 축 |
| RED planetCore 슬롯 보존 (`resetLocalPlanetCoreRuntimeForAccountPurge`) | ArcCore 월드 행성개발 |
| `arcCoreShadowIdentityStore` · shadow pairs | §16-A 기기 페어 유지 |
| governor / territorial combat / learning KPI 타임라인 | 월드·ArcCore 운영 |
| `arcfire_app_settings_v1` | 기기 설정 |

→ 「월드가 초기화 전 상태」는 **설계**. 「내 캐릭·미션·인벤이 남음」과는 구분.

### 2-C. 오류·UX 회귀 (이미 완화됨)

| 이슈 | 상태 |
|------|------|
| purge 중 타이틀 조기 이동 | `accountResetInProgress` + finalize 후 이동 |
| 버튼 영구 잠금 (IM 대기) | `runStageUiAfterIdle` 데드라인 |
| fresh-start 조기 소비 → 옛 계정 부활 | 플래그 **생성 완료 전 삭제 금지**로 수정됨 |
| 오프라인 purge 무응답 | 15s 클라우드 상한 + 오버레이 |

---

## 3. 생명주기 체크리스트 (신규 시작 시)

```text
[초기화]
  fresh-start=1
  users 삭제 큐 · (백업 고아는 남을 수 있음)
  로컬 플레이어 진행 삭제
  월드 경제·섀도우 유지

[타이틀]
  fresh-start → 클라우드 자동 restore SKIP ✅

[새 닉 등록]
  createPlayer · bootstrap · sync
  clearFreshStart ✅
  옛 nicknames 예약은 남을 수 있음 ⚠ RS-2

[첫 허브]
  dailyOps summary pending 있으면 옛 알림 ⚠ RS-1
  미션/인벤은 시드 상태여야 함 ✅
```

---

## 4. 권고 조치 → 적용 (2026-08-05 13:05+)

| ID | 조치 |
|----|------|
| **RS-1** | `clearArcCoreDailyOpsSummaryPending()` purge 호출 |
| **RS-2** | 로컬 플래그 삭제 + `released:true` tombstone · rules update 허용 · `firebase deploy --only firestore:rules` 필요 |
| **RS-3** | `purgeAllGameSaveBackupsForAccountPurge` · pre_purge 업로드 제거(초기화 전 수동 백업) |
| **RS-4/5** | LAST_BACKUP_AT clear · nebula `resetLocalProfilesForAccountPurge` |

---

## 5. 결론

| 질문 | 답 |
|------|-----|
| 초기화 후 **옛 계정으로 자동 재개**되나? | **아니오** (fresh-start 방어) |
| **최초 시작 오염** | **패치 후 핵심·알림·닉·백업·네뷸라 정리됨** |
| rules | 닉네임 해제 rules **배포 필수** (`firebase deploy --only firestore:rules`) |

---

**보고 END** · 2026-08-05 · 김팀장 · **코드 패치 반영**
