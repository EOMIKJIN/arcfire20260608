# 파이어베이스 DB · 리얼타임데이터 · back단 구조 전수 정밀조사 (2026-09-23)

```text
status=PENDING
task_id=firebase-backend-structure-audit-20260923
kind=AUDIT (코드 변경 0)
범위=Firestore·RTDB 전체 구조·데이터 파일·효율성·back단 적합성·쓰레기/비정상 데이터
```

## 0. 결론 (한 줄씩)

1. **절대금지(onSnapshot·실시간 멀티플레이 동기화) 위반 0건.** Firestore `onSnapshot`, RTDB `.on()` 실사용 코드가 저장소 전체에 하나도 없다(문자열 매치 "Snapshot"은 전부 타입명·주석의 금지 경고였다).
2. **구조는 전반적으로 견고하다.** 보안 규칙(list 차단으로 uid 열거 원천 봉쇄) · 백업 파이프라인(청크 분할·TTL·슬림화·타임아웃 없는 await 無) 모두 잘 설계돼 있다.
3. **쓰레기 파일 1개 · 죽은 코드 2개**를 확정 증거(0 참조)로 찾았다(§5). 즉시 삭제해도 안전하다.
4. **실제 프로덕션에 쌓인 데이터(라이브 Firestore 문서)는 이 세션에서 조회할 수 없다.** 이 조사는 코드·스키마·쓰기 경로 레벨 감사이며, "비정상 데이터"는 코드가 만들 수 있는 잘못된 값의 가능성으로만 짚었다(§7).

---

## 1. 전체 구조 맵

### 1-1. Firestore — 컬렉션 7개 (`firestore.rules` 기준, 코드와 대조 완료)

| 컬렉션 | 문서 키 | 용도 | 쓰기 주체 |
|---|---|---|---|
| `users/{uid}` | 기기 스코프 uid | 플레이어 프로필 단발 sync(`userDataSync.ts`) | 클라이언트(merge) |
| `users/{uid}/game_save_backups/{backupId}` | `{ts}_{reason}` | 로컬 세이브 전체 스냅샷 백업 | 클라이언트 |
| `users/{uid}/game_save_backups/{id}/payload_chunks/{n}` | 순번 | 1MB 초과 백업 분할 | 클라이언트 |
| `nicknames/{nicknameKey}` | sha256(닉네임) | 닉네임 유일성 예약 | 클라이언트(생성 레이스 차단 규칙) |
| `arccore/{docId}` | `config`·`schedule`·`subcores` 고정 3개 | 아크코어 전역 제어(시드만) | 클라이언트 최초 1회 merge |
| `arc_core_shadow_pairs/{uid}` | uid | 섀도우 페어링 — 생성 후 불변 | 클라이언트(1회) |
| `arc_core_shadow_pool/{slotId}` | `waiting_0..7`+레거시 | 섀도우 매칭 대기열(샤딩) | 클라이언트 |
| `arc_core_shadow_profiles/{uid}` | uid | 섀도우 공개 미러(안전 필드만) | 클라이언트 |
| `planet_unique_deeds/{planetId}` | 행성id | 행성 유일 소유권 증서 | 클라이언트(트랜잭션) |

+ rules 파일 자체 주석에 **`battles` 등 폐기 컬렉션**이 언급돼 있다 — 코드에서는 완전히 제거됐고(전수 grep 0건) default-deny로만 막혀 있다. 과거 데이터가 라이브 DB에 남아있는지는 이 세션에서 확인 불가.

### 1-2. RTDB(Realtime Database) — `arccore/*` 전역 읽기 전용 미러

경로: `arccore/config`, `arccore/worldExpansion/master/state`, `arccore/policy_packs/{id}`, `arccore/learning/global`, `arccore/learning/devices/{uid}/dailyKpi`(쓰기만, 유저 본인).

`database.rules.json`으로 `.write:false`가 대부분이라 **클라이언트는 읽기 전용**, 쓰기는 관리자 도구(Admin SDK)만 가능한 구조다. 코드도 `readRtdbValueOnce`(단발 `get()` + 타임아웃) 하나로 전부 수렴돼 있고, 세션당 1회(`sessionBootSyncDone`)만 호출되도록 스로틀돼 있다 — **부트 시 월드 전역 정책 1회 미러**라는 명확한 목적에 맞는 구조다.

---

## 2. 절대금지 준수 확인 (CLAUDE.md #2)

- `\.onSnapshot\(` / `onSnapshot\(query|doc|collection` 정규식 전수 검색 — **0건**.
- 문자열 "onSnapshot" 6건은 전부 (a) 금지 경고 주석(`arcCoreShadowPairing.ts`·`planetUniqueDeedLock.ts`·`runArcCoreShadowPairingPass.ts`) (b) 무관한 타입명(`FactionPowerSnapshot`·`AccountProgressionSnapshot`)이었다.
- RTDB `.on('value'...)`/`onValue(` — **0건**. `rtdbRefs.ts` 자체 주석: "`.on()` 리스너 금지 — 모듈 `get()` 단발 read".

**결론: 실시간 리스너 기반 동기화는 코드 어디에도 없다.**

---

## 3. 보안 규칙 평가 — 양호

- 모든 컬렉션에 `allow list: if false`(또는 제한적 list) — **uid/문서 열거 공격 원천 차단**. 문서 경로(uid)를 아는 클라이언트만 `get` 가능.
- 쓰기 필드 화이트리스트(`hasOnly`) + 타입 검증이 `nicknames`·`planet_unique_deeds`·`arc_core_shadow_pairs`에 걸려 있어 임의 필드 주입 방어.
- `arc_core_shadow_pairs`는 생성 후 `update, delete: if false`로 불변 — 변조 공격 차단.
- `nicknames`는 delete 자체가 금지(`allow delete: if false`)라 임의 선점 해제 공격이 막혀 있고, "release → 재선점"만 update로 허용.
- 관리자 CLI는 Admin SDK로 rules 자체를 우회 — 별도 경로.

특별한 취약점은 찾지 못했다. RTDB도 대부분 `.write: false`로 클라이언트 쓰기를 차단하고, 유저별 쓰기(`learning/devices/{uid}/dailyKpi`)는 스키마 검증(`hasChildren`·타입 체크)까지 걸려 있다.

---

## 4. 데이터 파이프라인 — 2계층 구조

### 4-1. 프로필 단발 동기화 (`userDataSync.ts` → `users/{uid}`)

- 900ms 디바운스 + **최소 120초 간격**(`userCloudSyncSchedule.ts`) — 고빈도 persist가 나도 클라우드 쓰기는 억제됨.
- `clanWarFoundation.operations`(40)·`deployments`(60) 등 배열은 캡을 걸어 전송 — "로컬은 무손실, 클라우드 문서만 캡"이라는 원칙이 주석에 명시돼 있음.
- CLAUDE.md 규정대로 **유저 프로필 단발 read/write**만 수행 — ArcCore 월드 시뮬레이션은 로컬(ArcCore Hub)이 전담하고 Firestore에 안 실음.

### 4-2. 게임세이브 백업 (`gameSaveBackup/*` → `users/{uid}/game_save_backups/*`)

- 자동 주기: **6시간**(`GAME_SAVE_BACKUP_MIN_INTERVAL_MS`), 보관 **7일**(`GAME_SAVE_BACKUP_RETENTION_MS`), uid당 최대 **28개**(6h×28=7일과 정확히 정합) — 주석에 "정합되는 6h로 통일"이라 명시돼 있어 의도된 값.
  - 이 값은 2026-07-08에 한 차례 30분으로 단축됐다가, 유지 기간이 7일에서 실질 14시간(28건 캡에 바로 걸림)으로 줄고 쓰기·읽기량이 ~12배 늘어난다는 후속 감사로 **대표님이 직접 "6시간으로 통일하라"고 재지시**해 현재의 6시간으로 되돌아온 것 — 지금 값이 최종 확정값이다.
- 1MB 문서 한계 대응: `estimateGameSaveDocCharSize` > 900,000자면 `payload_chunks` 서브컬렉션(380,000자 단위)으로 자동 분할, 그래도 넘치면 업로드 스킵 + `__DEV__`에서 상위 5개 키 크기 로그.
- 키별 슬림화(`slimGameSaveSnapshotForUpload.ts`): `arcfire_planet_core_runtime_v1`(비활성 행성 제거)·`arcfire_world_object_runtime_v1`·`arcfire_item_ledger_v1`(txns 120건)·`arcfire_clan_war_foundation_v2`(40건)·`arcfire_bar_board_v1`·`arcfire_arc_core_chat_v1` 6개 키만 슬림 대상.
- 만료·개수초과 정리(`pruneExpiredGameSaveBackups`)가 업로드마다 백그라운드로 도는 self-healing 구조.
- 계정 초기화 시 `purgeAllGameSaveBackupsForAccountPurge`로 payload_chunks까지 캐스케이드 삭제(부모 `users` 문서 삭제가 서브컬렉션을 자동으로 못 지우는 Firestore 특성을 코드로 보완) — **정확한 이해로 짜여 있음.**

**미슬림 관찰**: `PLAYER_GAME_SAVE_BACKUP_KEYS`(24개 키) 중 `arcfire_missions_v1`(미션 진행)은 슬림 대상 6개에 없다 — 원본 그대로 백업된다. 다만 2026-09-22에 별도로 검수·적용된 퀘스트 리팩터(고아 `arc_inst_*` 완료 진행 정리)로 이 키의 무한 증가 원인이 이미 막혀 있어(재검토 완료), 지금 당장 위험하지는 않다. 향후 이 키가 다시 커지면(신규 퀘스트 계열 추가 등) 슬림 대상에 추가하는 걸 권장 — 급하지 않음.

---

## 5. 쓰레기 파일 · 죽은 코드 (확정 — 0 참조 증거)

| 대상 | 근거 | 조치 제안 |
|---|---|---|
| `src/firebase/config.ts` | **완전히 빈 파일**. 저장소 전체에 이 경로를 import하는 곳 0건. 실제 설정은 `firestoreClientConfig.ts`가 전담 | 삭제 |
| `loadPlayerFromFirestore()` (`firestore.ts:105`) | `@deprecated` 주석 있음 + 호출부 0건(자기 정의 외 매치 없음) | 삭제 |
| `estimateGameSaveSnapshotCharSize()` (`collectLocalGameSaveSnapshot.ts:105`) | `@deprecated` 주석 있음 + 호출부 0건 | 삭제 |

세 건 모두 제 메모리 규칙("증명된 0-호출 죽은 코드만 즉시 삭제")에 정확히 부합한다 — 이번엔 조사만 하고 코드는 건드리지 않았다.

---

## 6. 구조적 관찰 (결함은 아니나 일관성 메모)

Firestore 컬렉션·문서 경로 헬퍼가 **한 곳에 안 모여 있다.** `firestoreRefs.ts`는 `users`·`arccore`만 다루고, `arc_core_shadow_*` 3개 컬렉션은 `arcCoreShadowPairing.ts`가, `planet_unique_deeds`는 `planetUniqueDeedLock.ts`가 각자 `doc(getFirestore(), '컬렉션명', ...)`을 직접 호출한다. 기능적 결함은 아니고(각 모듈이 자기 도메인을 캡슐화하는 방식으로 봐도 무방), 다만 "이 프로젝트가 쓰는 Firestore 경로 전체"를 한 파일만 보고 파악할 수는 없다 — `firestore.rules`가 사실상 그 인벤토리 역할을 대신하고 있다. 정리가 필요하면 낮은 우선순위 리팩터로 남겨둘 것.

---

## 6-A. 이전 감사에서 이미 발견됐지만 아직 안 고쳐진 것 — payload_chunks 고아 문서

제 메모리(2026-07-08 게임세이브 하드닝 감사)에 기록된 미해결 항목을 이번 코드로 재확인했다 — **아직 그대로다.**

`uploadGameSaveBackup`(`gameSaveBackupService.ts:388-420`)의 청크 경로: 모든 청크(`payload_chunks/{i}`)를 먼저 성공적으로 다 쓴 뒤, **그 다음에** 메타 문서(`game_save_backups/{backupId}`)를 쓴다. 청크 쓰기 도중 실패하면 이미 쓴 청크를 롤백하는 코드는 있다(`writeSnapshotChunks` catch 블록). 하지만 **청크는 전부 성공했는데 메타 문서 쓰기 직전에 앱이 죽는 경우**는 방어가 없다 — 그 backupId의 청크들은 Firestore에 영구히 남고, `pruneExpiredGameSaveBackups`는 부모 메타 컬렉션(`game_save_backups`)만 순회하므로 메타 문서가 없는 그 backupId는 **영원히 발견되지 않는다.** 확률은 낮지만(청크 다 쓰고 메타 쓰기 직전이라는 좁은 타이밍) 한 번 발생하면 스스로는 절대 안 지워지는 고아 문서가 된다 — 이번 조사에서 요청하신 "비정상 데이터"에 정확히 해당하는 사례다.

**제안**: 메타 문서에 먼저 `payloadMode:'chunked', chunkCount` 를 "pending" 상태로 미리 써두고 청크를 그 다음에 쓰는 순서로 뒤집거나, 별도의 고아 스윕(청크 서브컬렉션을 훑어 대응하는 메타 문서가 없으면 삭제)을 관리자 도구에 추가하는 방향. 발생 빈도가 낮아 우선순위는 높지 않음 — 참고용으로만 남긴다.

## 7. "비정상 데이터" 가능성 — 코드 레벨 관찰만 (라이브 데이터 미조회)

라이브 Firestore/RTDB 문서를 이 세션에서 직접 쿼리할 수단이 없다(Admin SDK·콘솔 접근 없음). 대신 **코드가 비정상 값을 만들어낼 수 있는 경로**만 짚는다.

- `firestore.ts:parsePlayerFromSnap`이 `data.player`가 있으면 그걸, 없으면 `data` 전체를 `Player`로 캐스팅한다 — 과거 스키마(구버전에서 `player` 중첩 없이 저장)와 신버전(중첩)이 섞여 있었을 가능성을 암시하는 방어 코드다. 현재는 두 형태 다 읽어내므로 문제는 없으나, 라이브 DB에 두 형태가 혼재해 있을 수 있다는 신호다.
- `game_save_backups` 문서의 `schemaVersion`이 `1` 또는 현재 `2`만 통과(`normalizeBackupDoc`)한다 — v1 스키마로 저장된 오래된 백업 문서가 여전히 유효하게 읽히도록 하위호환을 유지하고 있다(정상 설계, 다만 v1 문서가 얼마나 남아있는지는 미확인).
- `battles`(§1-1) 등 규칙에서 언급된 폐기 컬렉션에 과거 문서가 남아있다면, 이제는 어떤 클라이언트 코드도 읽거나 쓰지 않으므로 **저장 공간만 차지하는 고아 데이터**일 수 있다 — 확인·정리는 콘솔/Admin SDK 접근 권한이 있는 쪽(김팀장 또는 대표님)에서 가능.

---

## 8. 효율성 총평

- 프로필 동기화(120초 최소 간격 + 900ms 디바운스)와 백업(6시간 최소 간격)이 **서로 다른 갱신 주기**로 명확히 분리돼 있어 중복 쓰기가 없다.
- RTDB는 세션당 1회로 강하게 스로틀돼 있어 상시 폴링 비용이 없다.
- 백업 슬림화·청킹·프루닝이 전부 "쓰기 실패·타임아웃해도 로컬 플레이는 계속된다"는 원칙으로 감싸여 있어(모든 Firestore 호출에 타임아웃 레이스 적용) back단 장애가 게임플레이를 막지 않는 구조 — 싱글플레이 게임의 "서버는 보조"라는 설계 원칙과 일치한다.

## 9. 정리 제안 (구현은 김팀장 판단)

1. §5 세 건(빈 파일 1 + 죽은 함수 2) 삭제 — 근거 확실, 리스크 없음.
2. `arcfire_missions_v1`을 슬림 대상 후보로 관찰 목록에 추가(즉시 조치 불필요).
3. 라이브 Firestore에 `battles` 등 폐기 컬렉션 잔존 문서가 있는지는 콘솔/Admin SDK 접근 권한자가 별도 확인.
4. Firestore 경로 헬퍼 분산(§6)은 급한 문제 아님 — 다음 대규모 Firebase 작업 때 참고.

**김팀장(Cursor 본창) 확인 요청** — 특히 1번(쓰레기 파일·죽은 코드 삭제)은 바로 처리해도 무방해 보입니다.
