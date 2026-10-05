# READY — 크림슨 공격 웨이브 패배 점유·귀환 설계 검수 (코드 금지)

```text
status=READY
task_id=player-wave-defeat-crimson-home-20261005
assignee=김클로드
kind=DESIGN_REVIEW
code=FORBIDDEN
commit=FORBIDDEN
post_review=설계 AGREE 수용 · 게임 경로 구현됨 · 구현 검수는 impl-review-wave-defeat-crimson-home-20261005
```

대표님 확정(2026-10-05): 크림슨 레기온이 공격한 웨이브에서 **패배하면 블루 점유를 유지하지 않는다.** 그 순간 점유는 **크림슨 레기온**이고, 기함은 파괴 여부와 상관없이 **아르카디아 프라임**으로 간다.

김팀장 문장을 받아쓰지 말 것. 아래 파일을 직접 읽고 판정한다.

**정본**: `docs/combat/PLAYER_WAVE_DEFEAT_CRIMSON_AND_HOME_DESIGN.md`

---

## 0. 범위

| 할 일 | 하지 말 일 |
|--------|------------|
| 패배 분기가 블루를 크림슨으로 바꿀 자리가 있는지 대조 | `src/` · `app/` · `tables/` diff |
| 기함 생존 패배에도 거점으로 보내는 출구가 없는지 대조 | 점유 CSV·시드 소유 변경 |
| 결과 창 전에 점유만 바꾸면 레드 퇴거와 겹치는 지점 | 웨이브 틱·Skia 수정 |
| 승리 분기가 블루 유지를 패배에 섞을 수 있는지 | git commit · 구현 착수 |

대조 위치:

- `app/(game)/planet.tsx` `handleWaveDefenseRunEnded` — 지금 패배는 점유를 쓰지 않음. 레드+승리만 중립.
- `src/arcCore/territorial/runTerritorialCombatPass.ts` — 체류 중이면 자동전 점유 쓰기 없이 웨이브로 이관.
- `src/game/playerSurvivalPod.ts` — 파괴 시에만 `arcadia_prime`.
- `src/clanWar/planetTerritoryPlayerAccess.ts` — 레드 체류 금지.
- `app/(game)/planet.tsx` 레드 퇴거 effect — 웨이브 종료 후 다시 도는지, `currentPlanetId`를 지우는지.

---

## 1. 김팀장 전제 (맹신 금지)

1. 체류 중에도 분쟁 차례의 전투 트리거는 켜진다. 꺼지면 오독이다. 플레이어 우선은 전투 결과이지, 전투 시작을 막는 조건이 아니다.
2. 패배의 점유 결과는 블루 유지가 아니다. 크림슨 레기온이다.
3. 승리이고 점유가 블루면 블루 유지. 이 문장을 패배에 적용하면 오독이다.
4. 기함이 남은 패배도 전함을 파괴하지 않고 거점으로 옮긴다.
5. 이동과 점유 쓰기는 결과 창 다음 한 단계다.
6. 이미 들어간 「승리 잠금 뒤 격침 무시」는 이 점유 규칙을 구현한 것이 아니다.
