# 플레이봇 데일리 루프 (18:00 KST)

학습 체계 정본 v1.1: [`docs/PLAYBOT_HUMAN_PATTERN_AND_ARCCORE_LEARNING_v1.md`](../../docs/PLAYBOT_HUMAN_PATTERN_AND_ARCCORE_LEARNING_v1.md)  
**성공 = 가치 게이트를 통과한 인간형 PlaySession 수.** 가상일 campaign은 감시. 본 파일은 18:00 운영만.

매일 반복. 콘솔은 끄지 않고 학습을 이어 간다.

```
18:00 리포트 생성
 → 시급 선별 (PLAYBOT_DAILY_TRIAGE_LATEST.md)
 → 보고이슈면 대화창 게시 + 대표님 승인
 → 아니면 자체 1안 적용 (트윈·정책. 기존 CSV는 승인된 것만)
 → 플레이봇 계속 플레이 · policy/learning-state 유지
```

## 학습 목표

- 기반: 기존 ANALYZE 코드 → `adaptPolicy` 가중 · 바닥값 유지
- 사람 체감: 격납고 비면 전투 대신 보충, 밴드를 크게 넘는 수련 회피, 배달은 출발 성계가 아닌 착륙
- 그 이상: 정체·반복·이상 패턴을 같은 학습으로 줄이며 퀘/전투 지능을 올린다
- **초반 3분(180초 유저체감)**: Clock S. 가상일 저널 absorb 금지(설계). 오프닝 A0–D2·채굴·2게이트. `EARLY_*`는 **feel 전용 슬롯**만. campaign 가중과 분리
- **캠페인 가상일**: Clock C. 경제·전선·HOLD. 초반 코드를 여기 adapt에 넣지 않음
- **학습 데이터 관리 (2026-10-02)**: `logs/learned` 만 정본. tmp→rename + `.bak` 복구. 기록은 벽시계 학습 5분·정책 10분(가상일 강제 없음). 코드 카운트는 창 90일. 가상 120일 이후·포화는 범프 금지. 같은 메모는 generation 고정. 롤백은 창 점수 −10%. housekeep는 pid/플래그/18:00 원장 유지. 18:00 생존은 프로세스만.
- **실기 수집 (자동)**: 기기(adb)만 연결되어 있으면 `watch-owner-playlog-auto`가 logcat을 받고, 유휴 20분·날짜 변경·앱 재시작·3시간에 세션을 닫아 `human-seed`로 넣는다. 대표님 start/stop 불필요. `npm run playbot:ensure-owner-auto` 멱등. 앱 무변경. A-2 허브 동사 로그는 승인 후.
- **시드 혼합**: 관측된 행동끼리만 비율을 나눔. QA·프로파일러 세션은 섞지 않음. 18:00에 시드 날짜 표시.
- **캠페인**: until-close는 가상 120일마다 새 시드로 재시작(학습이 5분에 멈추지 않음).

## 보고이슈 (대표님)

- 18:00 FAIL · 봇 정지 · 녹화 OFF
- 본편 게이트가 다시 Lv44로 돌아감 등 **기존값** 재발
- 신규 게임 밸런스 숫자 변경이 필요할 때

## 자체 1안 (승인 없이)

- 플레이봇 트윈 버그 (토큰·격납고·이미착륙 접힘)
- **퀘 플레이스홀더 HOLD** (`__discovery_planet__` · `__neighbor_system__` · 이후 `__*__`) — 해석기 등록분은 이동, 미해석 토큰 퀘는 스킵. 인게임 CSV 불변. ANALYZE `PLACEHOLDER_HOLD`/`PLACEHOLDER_UNRESOLVED` 는 escalate 아님
- 정책 가중 adapt
- 이미 승인된 곡선 유지 확인

스케줄: `schedule-6pm-playbot-learning-report.cjs` → `write-daily-learning-report.ts`
