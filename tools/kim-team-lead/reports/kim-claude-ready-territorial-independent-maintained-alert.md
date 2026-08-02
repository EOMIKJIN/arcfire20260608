# READY — 독립국 전투 유지 알림 「중립」 오표기 수정

```text
status=READY
task_id=territorial-independent-maintained-alert-20260802
assignee_priority=1) Opus(김팀장·claude-opus-4-8-thinking-high)  2) 김클로드(불가 시)
API_EXHAUST_FALLBACK_ACTIVE.flag=없음 → 유료 Opus 코드 작업 허용(2026-08-02 확인)
commit=Opus 직접 시 대표님 지시 후 · 김클로드 시 PENDING 후 김팀장 검수·커밋
```

## 담당 우선순위

| 순위 | 담당 | 조건 |
|------|------|------|
| **1** | **Opus(김팀장)** | Cursor에서 Opus 선택 가능 · API 소진 아님 |
| **2** | **김클로드** | Opus 세션/API 불가 시에만 · handoff PENDING · **commit 금지** |

## 증상
드라코 성운 등 **플레이어 독립국(INDEPENDENT)** 이 분쟁 침공 전투에서 **방어 유지**인데, 알림이 「중립 지역이 유지되었습니다」로 표시됨.  
**홀드/지도 상태는 독립국 유지(정상)** — UI 카피·sideKey 분기 버그만.

## 원인
`src/arcCore/territorial/showTerritorialOccupationChangeAlert.ts`  
`showTerritorialOccupationMaintainedAlert` 의

```ts
const sideKey = input.side === 'blue' ? 'blue' : input.side === 'red' ? 'red' : 'neutral';
```

→ `independent` 가 `neutral` 로 폴백 → `territorial.alert.maintained.neutralBody` 사용.

## 수정 범위 (최소)
1. `sideKey` 에 `independent` 분기 추가
2. i18n `ko.ts` / `en.ts` 에 `territorial.alert.maintained.independentBody` 추가 (blue/red 와 동일 패턴, `{planet}` `{side}` `{outcome}`)
3. battle 분기에서 `independent` → 해당 bodyKey
4. (선택) diplomatic 경로도 independent면 diplomaticBody 사용(neutralBody 금지)
5. self-check: `npx tsc --noEmit -p tsconfig.client.json`
6. 김클로드만: `kim-claude-handoff-pending.md` → **PENDING** · **commit 금지**  
   Opus 직접: 검수·완료 후 대표님 커밋 지시 대기

## 금지
- 판정 로직(`runIndependentHoldInvasionJudgment`)·홀드·CSV 변경
- Maginot / FrontPressure / 가중치 변경
- 김클로드 git commit
