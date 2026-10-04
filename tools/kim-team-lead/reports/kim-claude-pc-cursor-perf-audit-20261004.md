# PC·Cursor 작동 효율 점검 — 2026-10-04 00:10~00:25

```text
task_id=pc-cursor-perf-audit-20261004
kind=AUDIT → APPLY (§4: 위험 없는 1·2·3·4·6 실행 · 5·7 다음 단계)
요청=대표님 「커서 리오픈·메시지창 반복·렉 — 최적화 가능 여부, 메모리·TEMP 쓰레기 점검」
```

## 1. 실측

| 항목 | 값 | 판정 |
|------|-----|------|
| RAM | 15.9GB 중 69% 사용(여유 4.9GB) · 커밋 16.2/26.9GB | 여유 있음, 피크 시 빠듯 |
| Cursor | **24 프로세스 · 4.95GB** · tsserver 1개 **855MB**(00:06 신규) | **최대 점유** |
| Edge | 14 프로세스 · 2.07GB | 탭 정리 시 회수 |
| node | 12 · 1.49GB — 플레이봇 하니스(3)·수집 데몬(3)·스케줄러(2)·Cursor tsserver(2)·대기(1) | 정상 상주 |
| PowerShell | 7 · 607MB — **장기 모니터 `run-monitor.ps1` 260MB(09-29부터 5일)** | 재시작 시 회수 |
| **Metro(8081)** | **미실행** | 앱 재로드·재시작 시 「Unable to load script」 재발 |
| TEMP | 1.12GB(metro-cache 0.2 · VS Code 잔여 3×0.2 · 플레이봇 테스트 임시폴더 **177개**) | 성능 영향 거의 없음, 정리 가능 |
| C: / D: | 여유 31GB / 309GB · Gradle 캐시 13.3GB(C) · `android/app/build` 3.5GB(D) | C 여유 확보 여지 |

## 2. 원인 추정 — 「메시지창 반복」·렉

1. **18:00 플레이봇 리포트 훅이 매 프롬프트에 「응답 최상단 게시 필수(P0)」를 주입** — `on-before-submit-prompt-daily-report-chat.cjs`. 10/03 18:00 보고가 ack 안 돼 **모든 질문마다 같은 보고를 띄우게 함** → 메시지 반복의 직접 원인으로 판단.
2. **모델 게이트 안내문(~1.4KB)이 훅 2개에서 중복 주입** — `paid-model-gate`·`agent-routing`이 동일 문구(8/04 기준·구독 7/10~8/10로 낡음)를 매 프롬프트 2회.
3. **훅 실행 시간**: 프롬프트당 Node 6개 순차 ≈ **1.4초**(+ stop 0.2초) · 새 대화 시 8개(제한 합계 98초, monitor-autostart가 백그라운드 프로세스 기동).
4. **Cursor 감시·색인 제외 설정 없음**(`files.watcherExclude`·`.cursorignore` 없음) — 계속 쓰이는 `tools/play-bot-console/runs`(1,537파일·488MB)·`logs`(222MB)·`tools/long-run-monitor/logs`(342MB)·`android/app/build`(4,460파일·3.5GB)를 감시. 10분간 변경 38파일(로그 append는 지속 이벤트).
5. Cursor 「리오픈」은 프로세스 신규 시각(tsserver 00:06)으로 보아 창/확장 재시작이 있었던 것으로 보이나, Cursor 자체 로그는 비어 있어 원인 단정 불가.

## 3. 개선안 (위험도 낮은 순 · 승인 후 실행)

| # | 조치 | 효과 | 위험 |
|---|------|------|------|
| 1 | 플레이봇 18:00 보고 ack(`node tools/play-bot-console/ack-playbot-daily-report-chat.cjs`) | 매 응답 보고 반복 중단 | 없음 |
| 2 | `.vscode/settings.json`에 `files.watcherExclude`·`search.exclude`(runs·logs·human-raw·android/build·.expo) + `.cursorignore` | Cursor 감시/색인 부하↓ | 없음(검색에서 해당 폴더 제외) |
| 3 | 모델 게이트 문구 1개 훅으로 통합·날짜 갱신 | 프롬프트당 주입 1.4KB↓ | 훅 담당(김팀장) 확인 |
| 4 | Metro 재기동(`npx expo start --dev-client`) | 앱 재로드 오류 예방 | 없음 |
| 5 | 장기 모니터 PowerShell 재시작 | 260MB 회수 | 모니터 1회 공백 |
| 6 | TEMP 정리: 플레이봇 테스트 임시폴더 177개·VS Code 잔여 폴더 | 0.6GB↑ | 없음 |
| 7 | (선택) Gradle 캐시 정리 · Edge 탭 정리 | C: 여유↑ · RAM 2GB↑ | 다음 빌드 느려짐 |

## 4. 실행 결과 (00:30~ · 대표님 「위험 없는 것부터 순차 진행 · 설정 문제는 수정」)

| # | 조치 | 결과 |
|---|------|------|
| 1 | 플레이봇 18:00 보고 ack | ✅ `playbot_chat_ack=ok` |
| 1-b | **추가 발견**: 훅이 「데일리 커밋 실패(10/04 00:01)」 P0 주입 → 원인 `audit:daily` client tsc 실패 `src/combat/capitalCraftPool.test.ts:581` TS2367(assert 좁힘 후 리터럴 비교) — 오늘 커밋은 김팀장/대표님 **수동 커밋 9421bfc로 push 완료** | ✅ 테스트 비교식 `as string` 1줄 · 테스트 ALL PASS · client tsc 0 → 자정 자동 커밋 복구 · 실패 보고 ack |
| 2 | `.vscode/settings.json` `files.watcherExclude`·`search.exclude` 추가(기존 키 유지) · `.cursorignore` 신규 | ✅ JSON 검증 OK (Cursor 창 새로고침 시 완전 반영) |
| 3 | 모델 게이트 문구 중복 — `on-before-submit-prompt-agent-routing.cjs`가 게이트 문맥+user_message를 재출력 | ✅ 라우팅 훅에서 게이트 부분 제거(게이트 훅 단독) · 매 프롬프트 사용자 메시지 2→1 · 문구 내용(날짜)은 정책이라 미변경 |
| 4 | Metro 재기동 `npx expo start --dev-client --port 8081`(숨김, 로그 `tools/long-run-monitor/logs/metro-*.log`) | ✅ `packager-status:running` · adb reverse 정상 |
| 6 | TEMP 플레이봇 테스트 잔여 177개 삭제 · 김클로드 스크래치 힙스냅샷/DB 사본 238MB 삭제 | ✅ |
| 5 | 장기 모니터 PowerShell 재시작(260MB) | ⏸ 다음 단계(모니터 공백 위험 검토 후) |
| 7 | Gradle 캐시·Edge 탭 | ⏸ 다음 단계(대표님 선택) |

## 5. 재부팅 후 「Reopen / Keep Waiting」 팝업 — 01:15~01:40

- **원인 1 — Cursor 전역 DB `%APPDATA%\Cursor\User\globalStorage\state.vscdb` = 40,055MB(40GB)** (C: 여유 34.7GB). ItemTable은 수 MB뿐 → 나머지는 `cursorDiskKV`(채팅 기록 저장소)로 추정.
- **원인 2 — 김팀장 채팅 세션 1개가 6/27~10/04 연속**: 사용자 턴 2,219 · 기록 30MB. 01:14·01:15 창 멈춤 스택 = 채팅 패널 `buildStructureSnapshot/getHeaderEntries`. → 대표님이 01:37 새 세션 개설.
- **김클로드 실수**: 용량 분포 확인용 읽기 전용 전수 스캔(01:2x~01:38)이 40GB 디스크 I/O + 긴 읽기 트랜잭션으로 **WAL 체크포인트를 막아 WAL 35MB→2.3GB 증가**, 01:21~01:33 확장 호스트 무응답 다수 동반. 01:38 즉시 중지. 중지 후 01:40까지 무응답 0건. WAL 파일은 Cursor 정상 종료 시 정리됨.
- **다음 단계(위험 · 대표님 승인 후 · Cursor 완전 종료 상태에서만)**: ① DB 백업(D:) ② Cursor 채팅 기록에서 오래된 세션 삭제 ③ `VACUUM INTO` D: 경유(C: 여유 < DB 크기라 제자리 VACUUM 불가) 후 교체. 실행 중 Cursor에서 DB 직접 조회·수정 **금지**.

## 6. Cursor globalStorage → D:\커서채팅기록 이동 (01:48 · 대표님 지시)

- 대상 `%APPDATA%\Cursor\User\globalStorage`(1,439파일 · 41.9GB). 채팅 기록 삭제 **없음**.
- 방식: Cursor 종료 대기 → robocopy 복사 → 파일 수·바이트 일치 검증 → 원본 이름 변경 → junction(`mklink /J`) → junction 너머 `state.vscdb` 확인 → C 원본 삭제 → Cursor 재실행. 실패 시 원본 복구.
- 스크립트/로그: `D:\커서채팅기록\move-cursor-globalstorage.ps1` · `move.log` · `robocopy.log` (WMI 분리 실행 pid 18908, 90분 대기).
- 1차(01:55) 실패: 종료 직후 사라지는 `-shm` 1개로 수 불일치 → 원본 무변경. 수정: `-shm` 제외 · 30초 대기 · `/MIR`.
- 2차(02:05) 실패: junction까지 성공했으나 옛 폴더명 `globalStorage.old-move`에서 경로 260자 초과로 삭제 중단 → 스크립트가 되돌리며 **C 원본에서 agent-cli 설치 파일 181개(13.8MB)가 이미 삭제된 상태로 복구됨**. 02:10 D 사본에서 누락분 재복사 → C/D 파일 일치 확인(누락 0). state.vscdb는 무손상.
- 3차 대기(02:11, pid 16360): 옛 폴더 짧은 이름 `gs-old` · `\\?\` 경로 삭제 · **전환 성공 후에는 되돌리지 않음**(삭제 실패 시 찌꺼기만 기록).

판정: **PC 자체 쓰레기 파일은 원인이 아님.** 렉·메시지 반복은 **Cursor(5GB)+훅 주입+감시 제외 부재**가 주원인.
