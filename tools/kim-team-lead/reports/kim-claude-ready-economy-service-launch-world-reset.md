# 김클로드 착수 — 서비스 개시일 아크코어 전행성 경제 월드 리셋 API

> **배정**: 김팀장 FINAL 감사 2026-08-04 22:00 · 대표님 승인 후 착수  
> **task_id**: `economy-service-launch-world-reset-20260804`  
> **근거**: `docs/economy-evaluation/2026-08-04-economy-system-full-structure-audit-FINAL.md` §E1·§6  
> **김클로드**: 재검수 AGREE/PARTIAL → 구현 → handoff PENDING · **commit 금지**

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=개시일/운영 1회·부트 아님 · alloc=vault setState+persist 묶음 · cache=키 목록 clear
[pss-pre-dev] stage=월드 경제만 · 플레이어축 비대상 · risk=P6 persist·P5 착륙 무관
[pss-pre-dev] verdict=PASS — onBoot 자동 호출 금지 · 명시 API/운영 플래그만
```

---

## 목표

`resetArcCoreWorldEconomyForServiceLaunch(mode: 'full' | 'soft')` 단일 진입점:

| mode | 동작 |
|------|------|
| **full** | vault1~4(arccore/blue/neutral/transport) 시드·클리어 · fee ledger clear · overlay/ingest/central ledger clear · dailyOps state clear · convoy reseed 플래그 리셋 후 transport reseed · `rebuildAllPlanetTradeMarkets` · (선택) RED planetCore genesis 정책은 **별 파라미터·기본 false** |
| **soft** | fee+overlay+ingest+market rebuild만 · vault 잔액 유지 |

**절대 금지**: 플레이어 independent vault·credits·missions·계정 purge 호출 · 21코어 hold BLUE/RED 시드 파괴 · onBoot에서 자동 실행 · onSnapshot

synth 성계 hardReset은 **기존** `epochDayKey`/`resetGeneration` 경로 — 본 API와 **오케스트레이션만** 문서화(중복 구현 금지).

---

## DoD

- 단위 테스트: full 후 vault≈seed · fee empty · dailyOps completedDayKey null  
- independent vault / player credits **불변**  
- tsc PASS · handoff PENDING  

---

**끝.**
