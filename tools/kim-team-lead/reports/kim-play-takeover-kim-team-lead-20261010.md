# 김팀장 업무 인수·재배정 (김플레이 · 2026-10-10)

대표님 지시: 「김팀장 작업 모두 김플레이가 인수인계 받거나 김클로드에게 인수인계하라. 김플레이가 판단한다」

판단 기준: 검수·커밋·실기 확인은 김플레이 · 다파일 분석·수치 초안은 김클로드 · 기존값 변경은 대표님 승인 · UI 표면 작업만 필요할 때 김플레이가 김팀장에게 배정.

## 1. 항목별 배정

| 항목 | 이전 | 현재 담당 | 상태 · 근거 |
|---|---|---|---|
| PB-P0a 릴리즈 SIGSEGV(Worklet executeSync) | 김팀장 | 김플레이 | **DONE** — 10-07 PARTIAL 조건(시설 10분 소크)을 10-09~10 릴리즈 압박 플레이에서 충족, 크래시 종료 0 |
| PB-P0b 드록 퀘스트 전투 무한 반복 | 김팀장 | 김플레이 | **DONE** — 10-07 PASS |
| PB-G6 격침 시 장착 복원 · 내구도 0 소멸 차단 | 김팀장 | 김플레이 | **DONE** — `preservedEquipSlots.test.ts` 전부 PASS(10-10 재실행) |
| PB-G7 가격 0 해소 | 김팀장 | 김플레이 | **DONE** (10-07 커밋) |
| PB-G4 `w_laser_arc_029` 진열·적 무장 제외 | 김팀장 | **김클로드** | 진열 제외 확인. 적 로드아웃 경로 제외는 김팀장 기록만 있음 → 재검수 규칙에 따라 김클로드가 코드로 확인 중(`kim-claude-pbg4-pbg5-20261010.md`) |
| PB-G5 함선 등급 성능 곡선 | 김팀장 | **김클로드** | 수치안(제안서)만 작성 중 · 기존값 변경 → **대표님 승인 전 CSV 적용 금지** |
| PB-S0 김플레이 설계안 일괄 검수(스텔라 0단계 · O1 · O2) | 김팀장 | 김플레이 | **REVIEWED** — 코드는 10-07 스냅샷에 반영됨 · 테스트 58/58 PASS · verdict 기입(`kim-play-review-request-all-designs-20261006.md`) |
| 함장정보(파일럿 탭) UI 변경 `PlanetMainPilotInfoPanel.tsx` | 김팀장 | 김플레이 | 코드 검수 PASS(10-10) · **실기 터치 확인 남음** — 다음 개발 빌드 플레이 때 |
| 차기 K2 · K4 · O3 · O5 · O6 (스텔라 K/O 트랙) | 김팀장 | 김플레이 (+Fable CSV) | 전부 보류/대표님결정대기 그대로 · UI 표면이 필요해지면 김팀장 배정 |
| 인게임 대사창 헤더·하단 크롬(DLG-CHROME) READY | 김팀장 영역 | 김플레이 → 필요 시 김팀장 UI 배정 | 메모리 마감 이후 순서로 착수 |

`process-items.json` 담당 갱신 완료 · 감시판 재생성(HOLD 4: 카드 동결 · PB-G5 · A-10 · A-7c — 모두 의도된 대기).

## 2. 프로세스 보완 — Cursor 묵은 버퍼 덮어쓰기 방지

10-10 10:48 김팀장 Cursor 세션이 열어 둔 옛 버퍼를 저장해 김플레이 변경 4건(`modules/arcfire-native-memory/src/index.ts` · `planetHubSubcomponents.tsx` B1 · `PlanetEdenRaidTestLayer.tsx` A1 · 차기 ETC 행)을 되돌렸다(김플레이가 복구).

규칙: 김팀장(Cursor) 세션은 **배정받은 파일만** 열고, 착수 전 해당 파일을 디스크에서 다시 불러온다(「Revert File」/재열기). 배정 밖 파일 저장 금지. 김플레이는 배정 시 파일 목록을 명시한다.

## 2-1. 김클로드 결과 재검수 (`kim-claude-pbg4-pbg5-20261010.md`)

| 항목 | 김클로드 판정 | 김플레이 재검수 |
|---|---|---|
| PB-G4 | 이미 제외 · 수정 없음 | **AGREE** — `hostileEnemyWeaponLoadoutFromBalance.ts:31-32` `isCurveEligibleWeaponId` 가 id 제외 · 10-07 `0ea9a58` 커밋 · 진열은 `tradePortListed=FALSE`. **DONE** |
| PB-G4 단서 | 제외가 코드 id 하드코딩(Table-First 위반) | AGREE · 동작 영향 없음 → 차기 「기타」 `ETC-ARC029-TABLEFIRST` |
| PB-G5 | 수치안(전투력 = 1.30×(가격/25만)^0.255 · 아펙스 6.0배) · 벤치: 함선 구매 0→45 · 잃음 45 | 수치안은 대표님 결정용으로 수용. **핵심은 D6** — 곡선만 올리면 「사고 잃고 다시 사기」로 크레딧이 빠진다(벤치 재현). D6(유료 함선 격침 손실 규칙 또는 봇 교전 기준)을 함께 정해야 효과가 남는다 |
| 작업 공간 | worktree에 메인 미커밋 사본 · `npc_ai_ships.csv` 원복 | 메인 `npc_ai_ships.csv` HEAD 동일 확인 · 리포트만 메인으로 복사 |

## 2-2. 사고 기록 — worktree 정리 중 메인 node_modules 일부 삭제 (16:02 · 김플레이 복구 완료)

- 원인: 김클로드 worktree의 `node_modules`가 메인을 가리키는 junction이었는데, `git worktree remove --force`가 junction을 따라 들어가 메인 `node_modules` 패키지 281개(알파벳순 `@0no-co` ~ `@react-native/community-cli-plugin`)를 지웠다. 중간에 중단.
- 복구: junction만 `cmd /c rmdir`로 끊음 → `npm install --ignore-scripts`(lock 기준 299개 재설치 · package.json/lock 무변경) → `npx patch-package`(5개 패치 재적용 — 재설치로 날아갔던 RN Skia 캐시 상한·deferred cleanup 패치 포함, 재확인) → `tsc` exit 0. 남은 미설치 60개는 전부 타 OS·optional.
- 실행 중 프로세스(하네스·FQA·수집기) 영향 없음. **Metro(14:58 기동)는 다음 개발 빌드 작업 전 `--clear` 재시작 권장.**
- 규칙: junction이 있는 worktree는 **먼저 `cmd /c rmdir <worktree>\node_modules`로 링크만 끊고** 지운다. 남은 `agent-a9ddbc8a59f1d188d` worktree도 같은 순서로.

## 3. 남은 일 (김플레이)
- 김클로드 PB-G4/G5 결과 재검수 → PB-G4 반영 여부 판정 · PB-G5 수치안은 대표님 결정 요청.
- 파일럿 탭 실기 터치 확인.
- 커밋은 대표님 요청 시(또는 자정 데일리 스냅샷).
