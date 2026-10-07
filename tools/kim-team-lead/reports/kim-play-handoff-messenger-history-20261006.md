# 김플레이 handoff — 메신저 재접속 시 이전 대화 표시 (2026-10-06)

status: **REVIEWED** (2026-10-07 전수 재검토 포함 · 앞 절도 REVIEWED)

## 전수 재검토 (2026-10-07 · 대표님 지시)

수정 4건:

| # | 문제 | 수정 |
|---|---|---|
| R1 | 메신저 기록에서 안 읽은 `stella_reach`를 **전부** 뺐는데, 새 줄로 붙는 건 최신 4건뿐이었다. 5건 이상이면 오래된 것이 보이지 않은 채 읽음 처리됐다(내 회귀). | `presentArcCoreBackchannel`에서 새 줄로 붙을 4건(`stellaReachSessionLines`)만 기록에서 뺀다(`isQueuedReach`). |
| R2 | `walkStellaReachAway`가 말한 칸마다 `unread`와 noteShown을 올리면서, 줄은 최신 4개만 남기고 버렸다. 받지도 않은 연락이 「안 읽음」으로 잡혀 이후 연락을 더 줄였다. | 버리지 않는다. 한 번 소급의 상한은 `STELLA_UNREAD_STOP`(8, export). 테스트: 전달 줄 수 = unread. |
| R3 | `lastHubAtMs`를 허브 **진입** 때만 찍었다. 허브에서 몇 시간 플레이한 시간도 「접속 안 한 동안」으로 소급돼 부재 중 연락이 과다했다(리플레이 모델과 불일치). 앱이 백그라운드에서 돌아와도 소급·알림이 없었다. | `bindStellaLifeAskToPlanetSession`: 허브 dispose와 AppState `background` 때 `stampStellaPresence`, `active`에서 hydrated면 `runStellaHubTurn`을 부른다. AppState 구독 1개는 dispose에서 remove한다. |
| R4 | 소급 루프(최대 672칸)가 칸마다 판단 문맥 객체를 새로 만들었다. | ctx·hits를 1회 할당하고 재사용한다(`decideStellaObserve`는 ctx를 보관하지 않음 확인). |

플레이봇: `stellaReplay.reachWhileAway`에 앱과 같은 `STELLA_UNREAD_STOP`과 14일 상한을 넣었다. 재측정 `reports/stella-proactive/stella-o4d-20261007.md`: 결정안 B 스텔라 하루 3.45 PASS(이전 3.57), C 3.16 PASS.

```text
[pss-pre-dev] hot_path=허브 진입·앱 복귀 1회 alloc=소급 루프 ctx 1회(이전 칸당 1) cache=없음
[pss-pre-dev] stage=AppState 구독은 행성 세션 dispose에서 remove · 새 persist 없음(기존 코얼레싱) risk=P1 구독(세션 귀속으로 해소)
[pss-pre-dev] verdict=PASS
```

게이트: tsc PASS · 채팅·스텔라 테스트 56/56 · `audit:memory:all` PASS.

김팀장 몫(수정 안 함, 보고만):
- `ArcCoreChatOverlayContent`는 이제 최대 40줄을 그린다. 타이핑 효과의 tick마다 `chatMessages.map` 전체가 다시 렌더된다. 줄 컴포넌트 `memo` 분리를 권장한다(닫으면 언마운트라 View 잔류는 없음).
- `tryNotifyStellaMessage`의 가이드 보류 분기는 20초 재시도에 횟수 상한이 없다. 세션 dispose에서 끊기니 누수는 아니지만, 가이드 동안 계속 깨어난다. 상한이나 가이드 종료 이벤트 구독을 권장한다.
- 앱과 리플레이의 차이는 남아 있다: 앱은 `objectiveStallCount`·`sessionGap`이 0이라 quest_stall·welcome_back이 앱에서는 발동하지 않는다.
- 기존 문제: `arcCoreChatGmBeat.test.ts`는 Node에서 `react-native` 변환이 실패한다(이번 변경과 무관).

## verdict (김팀장 · 전수 재검토 2026-10-07)

- **REVIEWED** — R1~R4 수용. 안 읽은 연락은 새 줄로 붙는 4건만 기록에서 빼고, 소급은 버린 줄을 unread로 세지 않으며 상한은 8이다. 허브에 머문 시간은 떠날 때·앱이 화면 뒤로 갈 때 찍어서 부재로 소급하지 않는다. 소급 판단 문맥은 루프 밖에서 한 번만 만든다.
- 반영: 메신저 타이핑 tick은 말하는 줄만 다시 그린다. 가이드 중 알림은 20초마다 깨우지 않고, 본 장면이 끝나거나 오퍼레이터 첫 입장이 찍히면 한 번 다시 본다. 잠깐 화면을 내리는 `inactive`도 접속 시각으로 찍는다.
- 남김: quest_stall·welcome_back의 앱 입력(의뢰 정체·세션 간격)은 상황 행이 꺼져 있어 이번에 넣지 않았다. `arcCoreChatGmBeat.test.ts`의 Node 변환 실패도 이번 경로가 아니다. 말풍선 표면은 만들지 않았다. 상황 행은 enabled=0 유지.
- 게이트: 채팅·스텔라 테스트 21/21 PASS · `tsc -p tsconfig.client.json` PASS · `audit:memory:all` 구성 PASS(native-reclaim 리포트 파일 잠금 1회 후 재실행 PASS). 커밋은 대표님 요청 후.

## 대표님 지시

「스텔라와의 대화메신저창에 이전 대화의 기록이 항상 재접속해보면 사라져 있다. 일정(허용량) 대화는 기록이 남아있어야 메신저 기능이라고 본다.」

## 원인

- 기록은 디스크에 남아 있었다. `arcCoreChatStore.messages`, 최근 40건 FIFO, 1.5초 묶음 저장. 불러오기 전 저장 차단도 정상이다.
- 화면(`ArcCoreChatOverlayContent`)은 `sessionMessages`만 그린다. `beginFreshSession`이 창을 열 때마다 이 목록을 인사 1줄로 덮어썼다. 그래서 보관 기록이 화면에 한 번도 올라가지 않았다(설계 주석: 「오픈 시 화면에 올리지 않음」).
- 스텔라가 먼저 건 첫마디(오프너)는 화면 전용이라 보관되지 않았다. 기록을 살려도 플레이어 답장만 남는다.

## 수정 (화면 파일 · planet.tsx 미수정)

| 파일 | 내용 |
|---|---|
| `src/store/arcCoreChatStore.ts` | `pickArcCoreChatSessionHistory`: 인사 줄을 뺀 보관 기록, 최대 39건. `beginFreshSession({history})`는 기록을 깐 뒤 인사를 붙인다. 기록이 있으면 인사 reason을 `session_resume`으로 바꿔 대화 줄로 표시한다(히어로 대신). 인사가 아닌 첫마디는 보관에도 넣는다. `liveArcCoreChatSession`은 깔린 기록을 뺀 이번 세션 줄이다(모듈 Set, 리셋 시 비움). |
| `src/arcCore/chat/presentArcCoreBackchannel.ts` | 열 때 기록을 전달한다. 안 읽은 `stella_reach`는 기록에서 빼고 기존대로 새 줄로 붙인다(중복 방지). 열린 창에 오는 오프너도 보관한다(`appendSessionOnly` → `appendMessage`). 회신 문맥과 첫 스캔 판정은 `liveArcCoreChatSession`만 본다. 지난 대화가 LLM 문맥이나 「이미 인사함」 판정에 섞이지 않게 하고, 첫 스캔 오프너가 기록에 남아 튜토리얼이 영구히 켜지는 것도 막는다. |
| `src/store/arcCoreChatStore.test.ts` | 테스트 3건 추가: 기록 선택·상한, 기록 깔기와 회신 문맥 제외, 오프너 보관·인사 미보관. |

## 허용량

기존 `ARC_CORE_CHAT_MAX_MESSAGES = 40`(저장 상한)을 그대로 쓴다. 화면에는 기록 39건과 인사 1줄이 올라간다. 늘리려면 기존값 변경이라 대표님 확인이 필요하다.

## 남은 점

- 타이틀 첫 부팅 대화(`immediate`)는 저장소를 기다리지 않는다(타이틀 버튼 규칙). 그래서 그 순간에는 기록이 비어 있을 수 있다. 첫 실행 전용 흐름이라 그대로 둔다.
- 화면에 「이전 대화」 구분선은 없다. 넣으려면 `ArcCoreChatOverlayContent.tsx`를 고쳐야 하므로 김팀장 몫이다.

## 게이트

```text
[pss-pre-dev] hot_path=메신저 열 때 1회 alloc=최대 40행 배열 1 + id Set 1 cache=없음(기존 보관 목록 재사용)
[pss-pre-dev] stage=STAGE 무관 · 새 persist 경로 없음(기존 1.5s 코얼레싱) risk=없음
[pss-pre-dev] verdict=PASS
```

- `tsc -p tsconfig.client.json` PASS
- `arcCoreChatStore.test` 14/14 · `arcCoreChatPersistGuard.test` PASS
- `src/arcCore/chat/*.test.ts`: `arcCoreChatGmBeat.test.ts` 1건만 FAIL. 원인은 Node에서 `react-native/index.js` 변환 실패이고, 이번 변경 파일은 그 import 경로에 없다(기존 문제).
- `audit:memory:all` PASS

## 추가 (같은 날) — 선제 대화는 전부 메신저 + 「메시지가 있습니다」 팝업

대표님: 「모든 선제 대화(요청이라는 단계는 통신무전 개념이라 맞지 않다)는 메신저에 남기는 게 맞다. … 스텔라 아리스의 최초(확인 안 한) 메시지는 팝업으로 연결해 표시. 『스텔라 아리스의 메시지가 있습니다』 식으로.」

| 파일 | 내용 |
|---|---|
| `src/arcCore/chat/bindStellaLifeAskToPlanetSession.ts` | 질문형(ask)도 수락/거절 통신(`presentStellaLifeAskComm`) 대신 보관함에 넣는다. 말풍선(remark)도 표면이 없어 버려졌는데, 이제 보관함에 넣는다(리플레이와 같은 계산). 허브 턴 끝에 `tryNotifyStellaMessage`를 부른다. 안전하지 않으면 20초 간격으로 최대 6번 재시도하고, 타이머는 세션 dispose에서 해제한다. 튜토리얼 강제·DND·인게임 대사 중에는 대사가 끝난 뒤로 미룬다. |
| `src/arcCore/chat/stellaMessageNotice.ts` (신규) | 선제 reason은 `stella_reach`·`operator_life`·`sit_*`. 안 읽은 수는 `lastReadAtMs` 이후 보관 줄이다. `notifiedAtMs <= lastReadAtMs`일 때만 팝업을 띄워, 안 읽은 묶음당 한 번만 알린다. 팝업은 `showArcAlert`(40초 자동 닫힘)이며 [나중에]/[확인]이고, [확인]을 누르면 스텔라 메신저가 열린다(열면 읽음 처리). |
| `stellaObserveGate.ts` · `stellaObserveGateMemory.ts` | 상태에 `notifiedAtMs` 추가(기존 대화 키, 묶음 저장). `markStellaMessageNotified`. |
| `src/i18n/locales/ko.ts` · `en.ts` | 신규 키 3개 `arcCoreChat.stellaMessage.body/later/open`(기존 문구는 바꾸지 않음). |
| `stellaMessageNotice.test.ts` (신규) | 테스트 4건. |

```text
[pss-pre-dev] hot_path=허브 진입 1회 + 재시도 타이머 최대 6회(20s) alloc=보관 40줄 역순 스캔(할당 없음) cache=없음
[pss-pre-dev] stage=타이머는 registerPlanetSessionResource dispose에서 해제 · persist는 기존 코얼레싱 risk=P1 타이머(세션 귀속으로 해소)
[pss-pre-dev] verdict=PASS
```

김팀장 참고:
- `planetHubTalkRoster.presentHubNlMouthThenMessenger`는 아직 `peekStellaLifeAskPending`이 있으면 `presentStellaLifeAskComm`(1차 통신)을 연다. 지금 pending을 채우는 곳이 없어 실제로는 타지 않는 것으로 보인다. 정리할지는 김팀장 판단에 맡긴다(게임 본체 파일이라 손대지 않았다).
- 게이트: tsc PASS · 채팅·스텔라 테스트 53/53 · `audit:memory:all` PASS · `audit:ui-overlay` PASS.

## 실기 확인

메신저에서 스텔라와 2~3턴 대화 → 앱 완전 종료 → 재실행 → 허브에서 메신저 열기 → 이전 대화 아래에 「다시 왔네」 줄이 보이는지 확인한다.

팝업 확인: 허브를 떠나 30분 이상 지난 뒤(스텔라가 쉬는 시간대) 허브에 돌아오면 「스텔라 아리스의 메시지가 있습니다」가 1회 뜬다 → [확인]을 누르면 메신저에 새 메시지가 보인다. [나중에]를 누르면 메신저를 열 때까지 다시 뜨지 않는다.

## verdict (김팀장)

- **REVIEWED (2026-10-07, 알림 팝업)** — 선제 줄은 메신저 보관이 맞다. 「메시지가 있습니다」는 그 보관의 알림이다. 다만 [확인]이 메신저로 바로 들어가는 것은, 수락/거절 통신이 아직 메신저 문일 때는 쓰지 않는다.
- 허브 가이드(착륙 안내~출발 안내)와 오퍼레이터 첫 입장 전에는 팝업을 띄우지 않고 기다린다. 가이드의 [대화]는 기존 수락/거절 통신을 타고 메신저로 간다. 팝업이 이미 떠 있는 뒤 그 단계가 되면 [확인]도 그 통신으로 넘긴다.
- 인앱 대사가 열려 있으면 대사가 끝난 뒤에만 알림을 본다. 본편 임무가 켜져 있다는 이유만으로 알림을 지우지는 않는다. 그 플래그는 메인 임무 전반이라, 켜 두면 메시지 알림이 거의 나오지 않았다.
- **REVIEWED (2026-10-07)** — 수용. 보관 40건은 원래 디스크에 있었고, 창을 열 때 인사 1줄로 덮이던 것이 원인이다. 이제 기록 최대 39건을 깔고 그 아래에 이어하기 인사를 붙인다. 커밋은 대표님 요청 후.
- 확인: 이어하기 인사는 큰 첫 화면이 아니라 대화 줄이다. 회신에 넣는 문맥은 이번 창의 새 줄만이다. 안 읽은 메신저 연락은 기록과 겹쳐 두 번 나오지 않는다. 저장 상한 40은 그대로다.
- 잔여: 「다시 왔네」는 플레이어가 한 번이라도 답을 남긴 뒤에만 붙는다. 스텔라 말만 있으면 첫 인사 문구가 기록 아래에 붙는다. 이전/이번 구분선은 없다.
- 게이트: `arcCoreChatStore.test` 12/12 PASS.
