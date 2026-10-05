# 김클로드 → 김팀장 정밀 협의 답변 — 플레이봇 실기 연결 설계

```text
task_id=playbot-live-phone-design-20261004
kind=CONSULT 답변 (코드 변경 0 · 커밋 금지 · 설계만)
작성=김클로드 · 2026-10-04 KST
대상 설계=docs/playbot/PLAYBOT_LIVE_PHONE_DESIGN.md
검수 브리프=kim-team-lead-playbot-live-phone-brief-20261004.md
재검수 방식=인용 소스를 직접 읽고 파일:줄로 판정. 받아쓰기 금지.
```

김팀장 브리프의 코드 충돌 지적은 **대부분 맞다.** 아래에 직접 읽은 근거와 함께 섹션별 판정을 적고, 틀린 한 곳(섀도우 차단 방식)은 정정한다. 마지막에 최종 설계 초안 8절을 김클로드 문장으로 둔다.

---

## A. 김팀장 "코드 충돌" 재검증 (브리프 §28~46)

### A-1. 클라우드 정본은 `users/{uid}`, `arcfire_player_v1`은 로컬 키 — **AGREE**

- `src/store/playerStore.ts:97` `const STORAGE_KEY = 'arcfire_player_v1'` → AsyncStorage **로컬** 키다. 클라우드 문서명이 아니다.
- 클라우드 정본은 `users/{uid}`. `src/firebase/firestoreRefs.ts:17,26-28` `USERS_COLLECTION='users'` · `userDocRef(uid)=doc(db,'users',uid)`. 쓰기는 `src/firebase/userDataSync.ts:240` `setDoc(userDocRef(uid), payload, {merge:true})`.
- 그래서 설계 §4 line 56 «파이어스토어 `arcfire_player_v1` 문서»는 **사실 오류**. 올릴 문장은 «봇 uid 클라우드 문서는 `users/{botUid}`이며, 본문 형태는 `buildUnifiedLocalUserObject`(`userDataSync.ts:135`)가 만드는 통합 객체와 같다»로 교체.

### A-2. 같은 익명 Auth로 `users/{botUid}`를 쓴다 (Auth 사용자 교체 금지) — **AGREE**

- `firestore.rules:25-28` `match /users/{uid}` → `allow create, update, delete: if authed()`. `authed()`는 `request.auth != null`(`:20-22`)뿐. **`request.auth.uid == uid` 검사가 없다.** 따라서 대표님 세션의 익명 Auth 하나로 `users/{botUid}`(botUid≠대표님 게임 uid)를 합법적으로 쓸 수 있다.
- 게임 uid ≠ Auth uid는 규칙 주석이 명시(`firestore.rules:7-8`, `:101-102`).
- `getCurrentUser()`(`src/firebase/auth.ts:174-182`)가 돌려주는 건 **기기 스코프 게임 uid**이고 Firebase Auth 사용자가 아니다. Auth 사용자는 `ensureFirebaseAnonymousAuth`(`userDataSync.ts:234-235`)가 따로 잡는다. **폰에서 익명 Auth를 갈아탈 이유가 없고, 갈아타면 안 된다** — 대표님 기기 uid는 그대로 두고 봇은 **게임 식별자(`player.uid`)만** botUid로 둔다.
- 핵심 메커니즘: `syncUserDataWithServer`는 문서 id를 `player.uid`(`userDataSync.ts:188`)로 쓴다. 즉 **봇 데이터를 활성 스토어에 올려 `player.uid=botUid`로 만들면** 쓰기 대상이 `users/{botUid}`로 자연히 분리된다. 익명 Auth·기기 uid는 건드리지 않는다. 이 구분을 설계에 명시해야 한다(브리프가 요구한 "활성 슬롯 스왑"의 실체).

### A-3. 봇 표시 닉은 대표님 닉과 **달라야 한다** — **AGREE (한 줄 확정)**

- 동기화 직후 `ensureNicknameReservedRetro(uid, nickname)`가 돈다(`userDataSync.ts:245-247`). 봇 player에 대표님 닉이 그대로 있으면 `nicknames/{sha(대표님닉)}`를 botUid 해시로 재예약 시도.
- 규칙(`firestore.rules:53-61`): update는 `uidHash` 동일이거나 `released==true`일 때만. 대표님이 이미 선점(`released=false`, 다른 uidHash)했으면 봇 쓰기는 **거부**된다 → `reserveNickname` false. 게임을 막진 않지만(`nicknameRegistry.ts:184-191` taken 처리) **의미 없는 거부 트래픽**이고, 무엇보다 봇이 대표님과 같은 닉으로 월드에 보이면 안 된다.
- **확정 문장**: 봇 표시 닉은 복제본과 반드시 다르게 둔다(예: 대표님 닉 + 결정적 봇 접미사). 봇 세션에서는 `ensureNicknameReservedRetro`/`reserveNickname`을 **호출하지 않는다**(예약 레지스트리는 대표님 전용).

### A-4. `planet_unique_deeds` 복제·재기록 금지 — **AGREE, 단 더 강하게**

- 복제 측면: 증서는 애초에 `PLAYER_GAME_SAVE_BACKUP_KEYS`(`gameSaveBackupKeys.ts:5-30`)에 **없다**. 클라우드 전용 컬렉션이다. 그래서 백업키 스냅샷 복제만으로는 증서가 복제되지 않는다 → 설계 §4 "복제 제외"는 자동 충족. OK.
- 그러나 브리프가 놓친 더 큰 구멍: 증서 쓰기 권한은 **Auth uid** 기준이다. `firestore.rules:118` `authUid == request.auth.uid`, `:128-132` update/delete도 `resource.data.authUid == request.auth.uid`. 봇은 **대표님과 같은 익명 Auth**(A-2)를 쓰므로, 봇이 실기 중 행성을 점령해 증서 쓰기를 트리거하면 **대표님 증서 문서를 합법적으로 덮어쓸 수 있다**(authUid 통과). ownerUid는 바꿀 수 없으나(`:131`) 신규 증서 생성·재확보는 가능.
- **확정 문장**: 봇 세션에서는 `planet_unique_deeds` **쓰기 경로(구매 트랜잭션·함락·초기화 해제) 전체를 비활성**한다. 복제 제외만으로 부족하고, 라이브 플레이의 증서 write를 봇 플래그로 막아야 한다.

### A-5. 섀도우 — 브리프 "플래그 켜지면 패스 return"에 **AGREE**, 단 "봇 uid가 풀에 들어간다"는 전제는 **PARTIAL(정정)**

- 사실 확인: `scheduleArcCoreShadowPairingPassAfterBoot`(`runArcCoreShadowPairingPass.ts:95-101`)는 부트 후 `setTimeout` ~12s. 발화 시점에 `runArcCoreShadowPairingPass`가 **그때의** `getCurrentUser().uid`(`:58`)를 읽는다.
- 정정 지점: `getCurrentUser()`는 **기기 게임 uid**이지 `player.uid`가 아니다(A-2). 봇 세션이 Auth·기기 uid를 안 갈아탄다면, 지연 패스가 읽는 uid는 **여전히 대표님 uid**다. 즉 "봇 uid가 풀에 들어간다"는 브리프 표현은 메커니즘상 부정확하다.
- 그럼에도 **차단은 반드시 필요하다** — 이유가 다르다. 이 패스는 `usePlayerStore.getState().player?.nickname`(`:62-63`)과 `buildLocalArcCoreShadowShipSnapshot()`(`:33-36`)을 **활성 스토어에서** 읽는다. 봇 데이터가 스토어에 올라간 상태면, 패스가 **대표님 uid 아래에 봇 기함 스냅샷을** `publishArcCoreShadowShipProfile(대표님uid, 봇기함)`(`:36-38`)으로 올린다. 즉 **봇 함선이 대표님 섀도우로 유출**된다. 짝 유저의 최종보스가 봇 기함이 되는 사고는 이 경로로 난다.
- **확정 문장**: 봇 세션 플래그가 켜져 있으면 `runArcCoreShadowPairingPass`가 **맨 앞에서 return**(지연 패스가 봇 창에서 발화해도 no-op, 다음 부트 소급 패스에서 재시도). 대표님의 기존 페어/스냅샷은 그대로 둔다. 이유를 "봇 uid를 풀에 안 넣음"이 아니라 "**봇 스토어 상태에서 대표님 uid 스냅샷 publish 차단**"으로 적는다.

### A-6. 월드 축 vs 백업키 표 충돌 — **AGREE (표를 다시 씀, planet_core_runtime 재분류)**

- 설계 §4 line 62는 `행성 코어 런타임`을 "월드 축 → 봇 오버레이 → 종료 시 폐기"로 적었다. **그러나** `arcfire_planet_core_runtime_v1`은 `PLAYER_GAME_SAVE_BACKUP_KEYS`에 **들어 있다**(`gameSaveBackupKeys.ts:11`). 즉 계정 진행 축이고, 복제·활성 스왑 대상이다. **설계와 코드가 직접 충돌.**
- `gameSaveBackupKeys.ts:1-4` 주석이 말하는 "제외 월드 축"은 **ArcCore 환경·faction vault·trade fee ledger**다 — 이들은 목록에 **없다**. 실제 키(직접 확인):
  - 제외(월드 축) = `arcfire_planet_trade_fee_ledger_v1`(`src/store/planetTradeFeeLedgerStore.ts:14`), `arcfire_faction_vault_daily_summary_v1`(`src/arcCore/economy/factionVaultDailySummary.ts:14`), `arcfire_arc_core_territorial_combat_v1`·`arcfire_theater_garrison_v1`·`arcfire_dynamic_contested_zones_v1`(territorial), `arcfire_arc_core_daily_ops_v1`·`arcfire_arc_core_learning_v1`, 경제 오버레이들. 모두 백업키 목록 밖.
  - 포함(계정 진행) = 목록의 24키. 여기 `planet_core_runtime`·`planet_mineral_ledger`·`clan_war_foundation_v2`·`bm_exchange_ledger`·`item_ledger` 등 포함.
- **표 재작성(§4 대체):**

| 버킷 | 대상 | 봇 세션 취급 |
|---|---|---|
| **활성 슬롯 스왑 (복제·botUid 귀속)** | `PLAYER_GAME_SAVE_BACKUP_KEYS` 24키 전체 (`planet_core_runtime` 포함) | 최초 1회 대표님 스냅샷 복제 → botUid 로컬 칸. 이후 봇 칸 이어감. 쓰기 대상=`users/{botUid}` |
| **월드 축 (오버레이·종료 폐기)** | 백업키 **밖**의 공유 월드 스토어: trade fee ledger, faction vault, territorial combat/garrison/contested, 경제 오버레이, daily-ops/learning | 봇 변경은 **세계 파일에 커밋 금지**. 라이브 중 쓰기를 봇 로컬 오버레이로만 두거나, 세션 전후 스냅샷-복원으로 봇 변경 폐기 |
| **클라우드 월드 축 (쓰기 차단)** | `planet_unique_deeds`, `arc_core_shadow_pool`/`pairs`/`profiles` | 봇 세션에서 쓰기 경로 자체를 비활성(A-4·A-5) |

- 핵심 교정: AsyncStorage는 키당 슬롯이 **하나**다. "대표님 칸을 디스크에 둔 채 활성만 바뀐다"(§4 line 60)는 그대로는 불가능 — 실제로는 **대표님 스냅샷을 별도 접두사로 대피 → 봇 스냅샷을 라이브 키에 적용(`applyLocalGameSaveSnapshot`은 스냅샷에 없는 키를 제거함, `applyLocalGameSaveSnapshot.ts:39`) → 종료 시 대표님 스냅샷 복원**의 스왑이 필요하다. 설계에 이 메커니즘을 한 줄로 못박아야 "안 덮는다"가 성립한다.

### A-7. 수집기 단일 판정점 플래그 = 학습 규칙 불변 최소 — **AGREE (단, 플래그 전달 채널 명시 필요)**

- 수집기는 **PC 데몬**이다(`watch-owner-playlog-auto.ts`). adb logcat을 읽어 `[MEM_PROFILE] ... event=(route_focus|transit_hop_start|system_change|planet_change)`를 사람 조작으로 센다(`ownerPlaylogAuto.ts:14`, `absorbNewLog`→`countUserActionMarkers` `watch-owner-playlog-auto.ts:111-135`).
- 봇이 같은 폰에서 플레이하면 **동일 마커를 logcat에 찍는다** → 지금 수집기는 사람으로 집계 → `classifyAutoSession(≥3)`=human(`ownerPlaylogAuto.ts:25-27`) → `shouldImportAutoSession`(`:30-38`) 통과 → 사람 시드 유입. 설계 §2 line 40의 우려는 **정확**하다.
- 판정: **단일 판정점 억제가 최소이고 학습 규칙을 바꾸지 않는다.** 임계(AUTO_MIN_USER_ACTIONS=3, AUTO_IDLE_MS=20분, classify/import 게이트)는 **그대로 둔다.** 봇 창 동안 **`absorbNewLog`가 `countUserActionMarkers` 결과를 userActions에 누적하지 않게만** 막으면, 봇 구간은 자연히 profiler로 분류→미임포트. 봇 종료 후 대표님 조작은 지금 규칙 그대로(3회·20분·델타) 적용된다.
- 유의(무해): 봇 창 동안 `lastActionAt`이 안 밀리므로 20분 유휴 회전이 봇 세션 중 세션을 닫을 수 있으나, 집계=0이라 미임포트 → 무해. 대표님 복귀 시 새 세션으로 시작.
- **단서(설계에 추가)**: 플래그가 **PC 데몬에 닿아야** 한다. 데몬은 logcat만 본다 → 봇 시작/종료 시 **전용 logcat 1줄**(예: `[BOT_SESSION] on|off`)을 앱이 찍고, 데몬이 `absorbNewLog` 한 곳에서 그 창 동안 카운트를 건너뛴다. 이 앱측 마커 방출(src)과 데몬 판정(tool)은 **이번 설계 단계에서 구현하지 않는다** — 설계에 "단일 지점·전용 마커 채널"로만 못박는다. 델타 게이트(`human-delta`·`adaptPolicy`)는 입력이 봇 구간만큼 비는 것 외엔 불변.

### A-8. 정책 1회 읽기 vs 트윈 실행기 — **AGREE (실기 실행기가 트윈 `WorldState`/`fightHere`를 쓰면 위반)**

- `playbot-policy.json`을 시작 때 1회 읽어 가중만 쓰는 것은 PC 트윈 세계를 안 바꾼다 — 맞다.
- 그러나 트윈 결정기는 **트윈 상태 전용**이다. `decideIntentKind(world: WorldState, …)`(`src/.../tools/play-bot-console/src/intent.ts:25`)는 통째로 `WorldState`(트윈 객체)를 읽는다. 액션도 트윈 월드 변이(`actions.ts:47` `moveTo/toHolds/paintOf …`, `fightHere` 포함)다.
- 판정: **실기 실행기가 트윈 `decideIntentKind`/트윈 `fightHere`/`WorldState`를 호출하면 설계 위반**이다. 폰은 트윈 `WorldState`를 만들지 말고, **실기 스토어를 읽어 가중(정책)만 실기 입구 선택에 반영하는 별도 실기 의도 레이어**가 있어야 한다. 그 레이어는 이번 설계 단계에서 **열지 않는다**(구현 금지). 정책 파일은 **읽기 전용 1회**, 폰은 파일을 수정하지 않는다 — 이 두 문장은 유지.

---

## B. 설계 문서 §0~§7 섹션 판정

### §0 판정 — **AGREE**
- «학습 파이프와 봇 실기 세션을 저장·수집에서 분리»(line 9)가 정확한 전제. 대표님 잠금 1·6과 일치.
- 남길 문장: line 9, 13 그대로.
- 열지 말 것: 없음(판정만).

### §1 목표 — **AGREE**
- 표의 모든 행이 대표님 잠금 2~6과 1:1 대응. 사실 오류 없음.
- 남길 문장: 표 전체. 단 "시작 값=대표님 데이터 복제"는 §4 A-6 표로 범위를 한정한다(계정 진행 24키만, 월드 축 제외).

### §2 분리 구조 — **AGREE (A-7 단서 반영)**
- line 40 «봇 세션 동안 사람 시드에 넣지 않고 원본만 남긴다»는 A-7로 **구현 가능·규칙 불변** 확인.
- 남길 문장: line 36-42 전체. 추가: «수집 억제는 PC 데몬 `absorbNewLog` 단일 지점 + 전용 logcat 마커 창으로 하고, 임계·게이트 상수는 불변».
- 열지 말 것: 데몬 코드·앱측 마커 방출(이번 단계 금지).

### §3 타이틀 버튼 — **PARTIAL (경미한 사실 교정)**
- 사실 확인: `TITLE_UI_H_INSET=SPACING.xl`(`app/index.tsx:74`), `TITLE_SLOT_FOOTER_BOTTOM_PX=SPACING.xs`(`:82`), `titleInteractive=bootReady&&postBootSettled&&hydrated&&!cloudRestorePending`(`:124`) — 모두 **정확**.
- 교정 1: 설계 line 46 «높이 47»은 정확히는 `btnStart.minHeight:47`(`:531`). "최소 높이 47"로 표기.
- 교정 2: 설정 버튼은 `btnStart` + `absSettingsBtn` override로 **아이콘 전용 정사각**(`:499-506` width=`TITLE_SETTINGS_BTN_SIZE_PX`, `right:TITLE_UI_H_INSET`, `bottom:TITLE_SLOT_FOOTER_BOTTOM_PX`, Ionicons `settings-outline`, `:438-442`). 봇 버튼을 "같은 크롬·왼쪽 미러"로 두려면 동일 스타일에 `left:TITLE_UI_H_INSET`만 바꾼 **아이콘 전용 정사각**이어야 한다(§3 "높이 47"보다 이게 정확한 미러 기준).
- 대표님 잠금 2와 일치(왼쪽·설정은 오른쪽·임시·출시 숨김).
- 남길 문장: line 48(슬롯·푸터 불변), 50(활성 조건=`titleInteractive`, 활성 전 복제·프리웜·배치 금지), 52(빌드 플래그 숨김).
- 열지 말 것: 버튼 컴포넌트·빌드 플래그 구현(이번 단계 금지).

### §4 가상 계정 — **DISAGREE (3곳 수정 필수)**
- 수정 1(A-1): line 56 «파이어스토어 `arcfire_player_v1` 문서» → «`users/{botUid}` 문서, 본문=`buildUnifiedLocalUserObject`».
- 수정 2(A-6): line 62 `행성 코어 런타임`을 월드 축에서 빼 **활성 스왑(복제)** 버킷으로. 월드 축 오버레이 버킷은 trade fee ledger·faction vault·territorial·경제 오버레이로 한정. A-6 표로 §4 교체.
- 수정 3(A-2): line 60 «활성만 바뀐다»에 스왑 메커니즘(대피→적용→복원) 명시. AsyncStorage는 키당 단일 슬롯이라 "그냥 활성만 전환"은 성립 안 함.
- 유지: line 64(섀도우 풀에 봇 안 넣음) — 단 **이유를 A-5로 교정**(패스 early-return). line 66(클라우드 복원은 대표님 uid만) 유지.
- 추가(A-3): 봇 닉은 복제본과 다름 + 봇 세션 닉 예약 호출 금지.
- 추가(A-4): 봇 세션 `planet_unique_deeds` 쓰기 경로 비활성.
- 열지 말 것: 스왑·복제 코드, botUid 발급 규칙 구현(이번 단계 금지).

### §5 실시간 플레이 — **PARTIAL (A-8 못박기)**
- line 70(서브코어·화면 `setInterval`·트윈 주사위 금지), line 81(정책 1회 읽기·폴링/파이어스토어 중계 없음·파일 미수정), line 83(실기 1배·가상일 없음) — **AGREE**, 대표님 잠금 4와 일치.
- 보강 필요(A-8): line 72-80 입구 표는 유지하되 «실기 실행기는 트윈 `WorldState`/`decideIntentKind`/`fightHere`를 호출하지 않는다. 정책 가중은 실기 스토어 기반 별도 의도 레이어에만 반영»를 추가. 이게 없으면 "기존 입구만 누른다"가 트윈 호출로 샐 수 있다.
- 입구 사실성: `runContinueSessionPrewarm`·`beginPlanetHubSuspendingNavigation`·`replace` 네이밍은 이어하기/허브 경로 명칭으로 타당(설계 의도 수준). 실제 바인딩은 실기 의도 레이어 구현 시 재확인 — 이번 단계 아님.
- 열지 말 것: 실기 의도 레이어·입구 바인딩 구현(이번 단계 금지).

### §6 종료 — **AGREE**
- line 87-94 두 조건 독립(강제 종료 **또는** 나가기)이 대표님 잠금 5와 일치.
- 강제 종료 후 다음 부트: line 91 «봇 플래그 남아 있으면 대표님 칸 복구·플래그 삭제·자동 재개 없음»은 A-6 스왑(복원)·A-7(플래그) 및 브리프 PSS와 일치. `consumeFreshStartForTitle`류 "읽되 섣불리 안 지움" 패턴(`auth.ts:120-141`)과 같은 **복구 확정 후 플래그 삭제** 순서를 따르도록 한 줄 추가 권장(복구 커밋 전 강제 종료 재발 대비).
- line 94 전투 중 나가기=시뮬 정지→캔버스 dispose→전환: 대표님 잠금(전투 dispose 전 다음 행동 금지)과 일치.
- 열지 말 것: 복구 로직 구현(이번 단계 금지).

### §7 하지 않는 것 — **AGREE**
- line 98-103 전 항목 유지. 추가 2줄: «봇 세션 중 `planet_unique_deeds`·섀도우 쓰기 비활성»(A-4·A-5), «실기 실행기의 트윈 `WorldState`/`fightHere` 호출»(A-8).

---

## C. 최종 설계 초안 (김클로드 문장 · 8절)

> 김팀장 검수 후 정본(`docs/playbot/PLAYBOT_LIVE_PHONE_DESIGN.md`) 반영용. 코드 착수 금지.

**1. 판정.** 가능하다. 조건은 하나 — 학습 파이프(대표님 실기→owner-auto→human-delta→adaptPolicy→learn-cycle, PC 트윈)와 봇 실기 세션을 **저장·수집에서 분리**한다. 머리는 PC 트윈에 두고, 폰은 읽기 전용 정책 가중으로 기존 게임 입구만 누른다. 대표님 플레이의 수집·시드·델타·학습 주기는 불변.

**2. 정체성 분리.** 봇은 대표님 **익명 Auth·기기 게임 uid를 갈아타지 않는다**. 봇은 **게임 식별자 `player.uid`만 botUid**로 둔다. 그러면 `syncUserDataWithServer`가 문서 id를 `player.uid`로 쓰므로 쓰기 대상이 `users/{botUid}`로 자연 분리된다(규칙 `users/{uid}`는 `authed()`만 보므로 같은 Auth로 합법). 봇 표시 닉은 복제본과 **다르게** 두고(결정적 봇 접미사), 봇 세션에서 닉 예약(`reserveNickname`/`ensureNicknameReservedRetro`)은 호출하지 않는다.

**3. 타이틀 버튼.** 설정 버튼(`app/index.tsx` `btnStart`+`absSettingsBtn`, 아이콘 전용 정사각, `right:TITLE_UI_H_INSET`, `bottom:TITLE_SLOT_FOOTER_BOTTOM_PX`, 최소 높이 47)을 **왼쪽으로 미러**한 봇 버튼(`left:TITLE_UI_H_INSET`, 아이콘만 설정 기어와 구분). 시작/이어하기 슬롯·푸터는 불변. 활성 조건은 기존 `titleInteractive`(bootReady&&postBootSettled&&hydrated&&!cloudRestorePending). 활성 전 복제·프리웜·일일 배치 금지. 출시 숨김은 빌드 플래그 하나.

**4. 가상 계정 & 데이터 경계.** 최초 1회 대표님 로컬 진행을 복제한다. 복제 범위는 **계정 진행 24키**(`PLAYER_GAME_SAVE_BACKUP_KEYS`, `planet_core_runtime` 포함) — botUid 로컬 칸으로. 클라우드 본문은 `users/{botUid}`. 이후 봇 로그인은 봇 칸을 이어간다. 스왑은 **대표님 스냅샷 대피 → 봇 스냅샷을 라이브 키에 적용 → 종료 시 대표님 스냅샷 복원**으로 한다(AsyncStorage는 키당 단일 슬롯). 백업키 **밖의 월드 축**(trade fee ledger, faction vault, territorial, 경제 오버레이, daily-ops/learning)은 봇 로컬 오버레이로만 두고 **세계에 커밋하지 않는다**. `planet_unique_deeds`·섀도우(`arc_core_shadow_pool`/`pairs`/`profiles`) **쓰기 경로는 봇 세션 동안 비활성**(둘 다 대표님과 공유 Auth라 안 막으면 대표님 문서를 덮는다). 클라우드 복원 판정은 대표님 uid만 본다.

**5. 섀도우 차단.** 봇 세션 플래그가 켜져 있으면 `runArcCoreShadowPairingPass`는 **맨 앞에서 return**한다. 이유는 "봇 uid를 풀에 안 넣음"이 아니라, 부트 후 ~12s 지연 패스가 봇 창에서 발화하면 **활성(봇) 스토어의 기함 스냅샷을 대표님 uid 아래로 publish**하는 유출 때문이다(`runArcCoreShadowPairingPass.ts:33-38,58,62`). 대표님 기존 페어·스냅샷은 유지, 다음 부트 소급 패스에서 재개.

**6. 실시간 플레이.** 허브 안정 후 한 걸음씩, 기존 게임 입구(이어하기 프리웜→`replace` 행성 / 허브 서스펜딩 내비→세계지도 / 기존 전투 / 미션 수락)만 쓴다. 새 서브코어·화면 `setInterval`·트윈 주사위 금지, 전투 캔버스 dispose 전 다음 행동 금지, 실기 1배(가상일 없음). **실기 실행기는 트윈 `WorldState`/`decideIntentKind`/`fightHere`를 호출하지 않는다** — `playbot-policy.json` 가중은 시작 때 1회 읽어 **실기 스토어 기반 별도 의도 레이어**에만 반영한다(폴링·파이어스토어 중계·파일 수정 없음, 없으면 페르소나 기본값).

**7. 수집 억제.** 봇 창 동안 PC 데몬(`watch-owner-playlog-auto.ts`)의 `absorbNewLog` **단일 지점**에서 사용자 조작 카운트를 건너뛴다. 신호 채널은 봇 시작/종료 시 앱이 찍는 **전용 logcat 마커 1줄**. 임계·게이트(AUTO_MIN_USER_ACTIONS=3, AUTO_IDLE_MS=20분, classify/import, human-delta, adaptPolicy) 상수는 **전부 불변** — 봇 구간 입력만 비고, 봇 종료 후 대표님 조작은 지금 규칙 그대로.

**8. 종료.** 강제 종료 **또는** 나가기 — 둘 중 하나로 봇 프로세스 종료(독립 조건). 강제 종료 후 다음 부트: 봇 플래그가 남아 있으면 **대표님 칸 복구를 확정한 뒤** 플래그를 지우고(복구 커밋 전 재종료 대비, `consumeFreshStart` 패턴), 봇 자동 재개 없음. 나가기: 전투 중이면 시뮬 정지→캔버스 dispose→봇 칸 저장→대표님 칸 재활성화→타이틀 `replace`.

**이번 설계에서 열지 않는 구현(공통):** botUid 발급·스냅샷 스왑/복원 코드, 타이틀 봇 버튼·빌드 플래그, 실기 의도 레이어·입구 바인딩, 앱측 봇 세션 logcat 마커, PC 데몬 억제 로직, 섀도우/증서 쓰기 가드. 전부 다음 지시 후.

---

## D. 자가 점검

- 인용 소스 직접 재검증: `firestore.rules`, `firestoreRefs.ts`, `userDataSync.ts`, `auth.ts`, `nicknameRegistry.ts`, `runArcCoreShadowPairingPass.ts`, `gameSaveBackupKeys.ts`, `watch-owner-playlog-auto.ts`, `ownerPlaylogAuto.ts`, `intent.ts`/`actions.ts`, `app/index.tsx`. 각 판정에 파일:줄 인용.
- 브리프 대비: A-1~A-8 중 7개 AGREE, 1개(A-5 섀도우) 메커니즘 정정(봇 uid 풀 유입이 아니라 대표님 uid 스냅샷 유출). A-6 표 재작성으로 §4↔백업키 충돌 해소.
- 금지 준수: `src/`·`app/`·`tables/`·`firestore.rules`·`kim-claude-handoff-pending.md` **미수정**. 이 답변 파일만 작성. 커밋 안 함.
- 리스크: 봇 세션 플래그의 **전달 채널 2곳**(앱→logcat 마커, 인게임 가드)이 아직 코드에 없음 — 설계 단계라 의도적 미구현. 구현 시 §5(섀도우)·§7(수집) 가드가 같은 플래그를 보는지 재확인 필요.
- 다음: 김팀장 검수 → 정본 반영 판단.
