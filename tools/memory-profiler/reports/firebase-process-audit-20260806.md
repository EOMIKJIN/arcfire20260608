# Firebase 정상 프로세스 정밀 검수 (2026-08-06)

## 판정

**Firebase 전체 장애가 아님.**  
**Anonymous Auth · Identity Toolkit · Asia RTDB(실데이터)는 정상.**  
앱이 **존재하지 않는 RTDB URL(`.firebaseio.com`)** 로 붙어, boot sync가 4초 타임아웃 후 `offline`으로 오인한다.  
그 여파로 닉네임/Firestore 경로도 soft-timeout 연쇄가 관측된다.

---

## 정상 프로세스(설계) vs 실측

| 단계 | 설계 | 실측 (2026-08-06) |
|------|------|-------------------|
| 기기 Wi‑Fi | INTERNET | VALIDATED · SSID 연결 OK |
| Local guest uid | `auth.ts` 기기 스코프 | 정상 (Firestore 문서 키) |
| Anonymous Auth | `ensureFirebaseAnonymousAuth` | **성공** (`62lJSrVj…`) |
| Firestore rules | `request.auth != null` | rules 파일 정합 |
| RTDB boot read | `arccore/config` 1회 | **skip (offline)** — 원인: **잘못된 URL** |
| 닉네임 get/reserve | Auth 후 Firestore | **5s soft-offline** (Auth는 이미 있음 → Firestore/대기) |
| 로컬 계정 생성 | offline 실패해도 진행 | soft-offline 후 로컬 진행(의도) |

---

## P0 근본 원인 — RTDB URL 불일치

### 앱·저장소가 가리키는 URL (잘못됨)

```text
https://arcfire-49d69-default-rtdb.firebaseio.com
```

| 위치 | 값 |
|------|-----|
| `google-services.json` → `project_info.firebase_url` | 위 URL |
| `src/firebase/arccoreRtdbConfig.ts` → `ARCORE_RTDB_DATABASE_URL` | 위 URL |

PC 프로브: **HTTP 404** (인스턴스 없음 / 미생성).

### 실제 데이터가 있는 URL (정상)

```text
https://arcfire-49d69-default-rtdb.asia-southeast1.firebasedatabase.app
```

PC 프로브:

```text
GET .../arccore/config.json → 200
{"activePolicyPackId":"2026-06-26-…","learningSyncEnabled":true,"safeMode":false,"schemaVersion":1,…}
```

루트 `.json`은 401(rules) — DB는 **살아 있음**. US 기본 `.firebaseio.com`만 404.

### 앱 동작 연쇄

1. `_layout` → `fetchArcCoreRtdbBootSyncOnce` → `readRtdbValueOnce('config')`
2. Native SDK는 `google-services.json`의 `firebase_url`(404 엔드포인트) 사용
3. `ARCORE_RTDB_BOOT_READ_TIMEOUT_MS = 4000` → `rtdb_read_timeout`
4. `classifyRtdbBootError`가 **전부 `offline`으로 뭉갬** (실제는 wrong-host/404)
5. log: `[ArcCore/RTDB] boot sync skip (offline)` — Auth 성공 직후 ~4초 (실측 08:44:24→28, 08:53:39→43)

---

## P1 코드 결함 — URL 상수가 미연결

`ARCORE_RTDB_DATABASE_URL`은 **정의만 있고 `getRtdb()`에서 사용되지 않음**.

```ts
// rtdbRefs.ts — 실제
return database(); // google-services 기본 URL만
```

→ TS 상수만 asia로 고쳐도 **네이티브 기본 URL이 바뀌지 않으면 동일 증상**.

권장:

1. `google-services.json` `firebase_url` → asia URL (**네이티브 재빌드**)
2. `getRtdb()`가 `ARCORE_RTDB_DATABASE_URL`을 명시 전달 (상수·네이티브 이중 정합)
3. boot skip 로그에 **원문 error** (`rtdb_read_timeout` vs permission vs 404) 분리

---

## P1 부트 레이스 (Auth vs RTDB)

`app/_layout.tsx`:

- `scheduleFirebaseAnonymousAuthWarmup()` — `InteractionManager` **지연**
- `fetchArcCoreRtdbBootSyncOnce` — bootReady 직후 **즉시** void

RTDB `config`/`learning/global` rules는 **`.read: true`**라 Auth 없이도 읽혀야 한다.  
이번 P0는 URL 오지정이며, Auth 레이스는 부차. 다만 Firestore(닉네임)는 Auth 필수라 warm-up을 RTDB/Firestore보다 **선행 await**하는 편이 안전.

---

## Firestore / 닉네임 경로

| 항목 | 내용 |
|------|------|
| rules | `nicknames` get/create 모두 `authed()` |
| 클라이언트 | `ensureFirebaseAnonymousAuth` 후 `getDoc`/`setDoc` |
| 이중 uid | 게임 uid(기기) ≠ Auth uid — **의도 설계**. rules는 Auth 존재만 검사 |
| 실측 | Auth OK인데 check/reserve가 5초 soft-offline → **서버 왕복 미완료** (RTDB wrong-host와 동시간대; Firestore 자체 지연·콜드·오프라인 큐 가능) |

Identity Toolkit key 프로브: **200** (프로젝트 Auth 정상).

---

## 계정 purge와의 관계

`resetFirebaseAnonymousAuthForAccountPurge` → signOut → 다음 부트/warm-up에서 재 sign-in.  
Auth 재발급은 성공. **purge가 RTDB URL을 깨뜨린 것은 아님.**  
offline 오인은 **상시 잘못된 firebase_url** + 짧은 read timeout.

---

## 조치 반영 (2026-08-06 · 대표님 승인)

```text
[existing-value-change] google-services.json firebase_url
  .firebaseio.com → asia-southeast1.firebasedatabase.app · 사용자 승인
[existing-value-change] ARCORE_RTDB_DATABASE_URL 동일 · getRtdb() 명시 연결
```

| # | 반영 |
|---|------|
| 1 | `google-services.json` asia URL |
| 2 | `getRtdb()` = `database(ARCORE_RTDB_DATABASE_URL)` |
| 3 | boot skip: `timeout`/`wrong_host` 분리 + detail 로그 |
| 4 | `_layout` Auth await → Firestore 시드/RTDB (타이틀 bootReady 비차단) |

⚠️ **네이티브 재빌드** 권장(`expo run:android`) — `google-services.json` 번들 반영. JS만으로는 `getRtdb()` 명시 URL로 Metro 리로드만으로도 RTDB는 개선됨.

---

## 검증 체크리스트 (수정 후)

- [ ] `[ArcCore/RTDB] boot sync ok pack=…`
- [ ] 닉네임 등록 시 soft-offline 연쇄 없음(온라인)
- [ ] PC: asia `arccore/config.json` 200 유지
- [ ] US `.firebaseio.com`는 계속 404여도 앱 미사용이면 무관
