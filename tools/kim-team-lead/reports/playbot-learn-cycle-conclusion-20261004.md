# 최종 개선안 — 학습 프로세스 6단계

```text
task_id=playbot-learn-cycle-20261004
일시=2026-10-04
브리프=kim-team-lead-playbot-learn-cycle-brief-20261004.md
김클로드=kim-claude-playbot-learn-cycle-consult-20261004.md
선행=playbot-human-learn-consult-conclusion-20261004.md (델타 게이트 유지)
```

## 합의

여섯 단계의 반복이 학습 전체다. 김클로드 판정: 1 AGREE, 2 AGREE, 3 AGREE, 4 PARTIAL, 5 AGREE.

| 단계 | 이번 반영 |
|---|---|
| 1–2 원시·행동 기반 | 기존 수집·델타 게이트 유지. 가중치는 새 실기가 있을 때만 |
| 3 설계·실행 | 레벨 밴드 P0–P5를 설계 문장으로 남긴다. 실행의 빈칸(고정 분기·주사위·웨이브 9 없음)은 항상 gap |
| 4–5 분석·분류 | `learnCycle.ts`. 학습대기 중에도 판정. 봇 기능 / 게임 기능 / 보류 / 트윈 보류 |
| 6 보고·반영 | `logs/learned/learn-cycle-latest.json` 한 파일. 서명 변경 또는 벽시계 10분. 게임 코드는 이번엔 없음 |

`readOffset` 구멍은 게임 기능이 아니다. 트윈 보류(`twin_hold`)로 둔다. 선행 합의대로 이번엔 고치지 않는다.

완료 선언은 하지 않는다. 전투 방식 기록과 독립국이 없으면 인간 수준·시나리오 완료가 아니다.

## 코드

- `tools/play-bot-console/src/learnCycle.ts` — 판정·기록
- `run-harness.ts` — 가상일마다 판정, 디스크는 위 조건일 때만
- `actions.ts` `fightHere` — RED 승리만 중립. BLUE 승리는 영토 유지
- 편입·개척 가중은 올리지 않음
- 하니스 재시작 없음. 켜 둔 세계는 이전 코드로 계속 돈다. 블루 유지와 주기 로그는 다음 기동부터

```text
[pss-pre-dev] hot_path=가상일 1회 판정 · 디스크는 서명 또는 벽시계 10분
[pss-pre-dev] alloc=판정 1회 · 파일 1개 교체 · cache=서명·시각
[pss-pre-dev] stage=Node 트윈만 · risk=P6 · verdict=PASS
```

테스트: `npx tsx tools/play-bot-console/play-bot-console.test.ts` PASS.
