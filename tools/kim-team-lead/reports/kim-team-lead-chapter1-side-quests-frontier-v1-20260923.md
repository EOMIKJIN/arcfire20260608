# 챕터1 서브퀘스트 프론티어 재개발 v1.1

```text
status=APPLIED
date=2026-09-23
task_id=chapter1-side-quests-frontier-route-20260923
verdict=PARTIAL
```

## 대표님 의도

서브퀘스트 수락·스토리는 **코어 21 밖**. 예시 지명 = `synth_system_colonization.csv` 실명.

| 지시 | 성계 | 행성 | TCL |
|---|---|---|---|
| 아우라 국경 | `synth_052` | `synth_052_p` | 1 |
| 요새 베이스 | `synth_078` | `synth_078_p` | 5 |
| 코어 항로 | `synth_070` | `synth_070_p` | 9 |
| 캠프 베이스 | `synth_075` | `synth_075_p` | 28 |

김클로드 §10(시리우스/베가/오메가/크림슨 + Vega 다리)은 **DISAGREE · 기각**. 설계안은 참고만.

## 적용

- `sandbox_034`–`055` 22행 · A안 DSL · 팩 첫 행만 offer · `nextMissionId` 체인 · `timeLimitHours=0`
- `reach_planet`만 사용(`reach_system`은 21성계 정합 실패)
- questOnly 11: 기존 9 재배치 + 켓 미온 + 칼 릿지
- 세라/한로/스텔라/엘렌/젝스 의뢰·탐문 제외
- 세계관 훅은 대사만
- 바가 닫혀도 수락: `listAvailableQuestOfferCaptainIds` → 허브 INFO 핀 + 대화 후보 `quest_offer`
- questOnly 활동 행성 체류: `activityPlanetIds` 힌트

## 게이트

```text
[pss-pre-dev] hot_path=planet useMemo(진입·미션rev) alloc=offer id 0~4 cache=없음
[pss-pre-dev] stage=허브 INFO/대화 주입 · dispose=없음 risk=P1
[pss-pre-dev] verdict=PASS
```

- `node tools/content-tables/build-content-from-csv.mjs` OK
- `npx tsx --test src/missions/missionTableIntegrity.test.ts` + hub pin PASS
- `npx tsc --noEmit -p tsconfig.client.json` PASS
- 4성계 강제 unlock / 개척 phase / R1 HOLD **미변경**

## 잔여

착륙은 기존 월드맵 해금 규칙. 해당 synth가 아직 미해금이면 이동 불가 — 이번 패치는 강제 개방하지 않음. 실기에서 해금된 프론티어 허브 수락 확인 필요.
