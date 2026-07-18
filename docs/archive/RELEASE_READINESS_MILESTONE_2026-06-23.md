# 출시 준비도 마일스톤 보고서 — Arcfire Online (2026-06-23)

> **문서 유형**: 릴리스 준비도 평가 · 마일스톤 로드맵  
> **작성일**: 2026-06-23  
> **상태**: 🟡 **개발 진행 중** — 플레이 가능 알파, 상용 출시 미충족  
> **기준 문서**: `Arcfire_Master_Spec_v4.0` · `AGENTS.md` · `docs/_000_ARCFIRE_BM_REPORT_v2.0.md` · `docs/DEVELOPMENT_CHECKPOINT_2026-06-22.md` · `docs/I18N_MIGRATION_ROADMAP.md` · `docs/MISSION_SYSTEM_HANDOFF.md`  
> **목적**: 기획 대비 현재 완성도를 정량·정성 평가하고, **출시까지 남은 작업을 P0/P1/P2 마일스톤으로 고정**하여 이후 세션·검수·릴리스 판단의 기준 문서로 사용한다.

---

## 0. Executive Summary (한 줄 판정)

| 질문 | 판정 |
|------|------|
| **지금 플레이 가능한가?** | ✅ 예 — 허브↔은하↔전투↔시설 루프 동작 |
| **지금 스토어 출시 가능한가?** | ❌ 아니오 — 크래시·메모리·IAP·QA·i18n 미충족 |
| **종합 완성도 (기획 대비)** | **~55~60%** |
| **플레이 가능 알파** | **~70%** |
| **상용 출시 준비** | **~35~40%** |

**한 줄 요약:** 「돌아가는 싱글 샌드박스 알파」는 이미 존재하나, 「스토어에 올릴 수 있는 상용 릴리스」까지는 **P0 안정화 + P1 BM/i18n/QA**가 필수이며, 기획서 전체(함선 업그레이드·이벤트 미션·경제 fabric 후반·콘텐츠 EN)까지 포함한 **풀 출시**는 P2까지 상당한 개발량이 남아 있다.

---

## 1. 평가 방법론

| 항목 | 내용 |
|------|------|
| **기획 기준** | v4.0 Master Spec · BM v2.1 · 행성/경제/조선소 기획서 · 미션 handoff |
| **구현 근거** | `app/(game)/` 12 라우트 · `src/` 주요 시스템 · `tables/` CSV 커버리지 |
| **운영 게이트** | `tsc` · `audit:skia-memory` · `audit:balance-ops` · long-run monitor · i18n audit |
| **실기 근거** | `DEVELOPMENT_CHECKPOINT_2026-06-22` (8h soak PASS) · `PLAYTEST_WATCH` (5h+ SIGSEGV·PSS ceiling) · 6/16 stabilization checkpoint |

---

## 2. 영역별 완성도 (출시 기준)

```
아키텍처·STAGE·메모리 계약     ████████░░  80%
Table-First·ArcCore 경제      ███████░░░  70%
전투·Skia                     ███████░░░  70%
행성 허브·개발·무역           ██████░░░░  65%
미션·스토리                   █████░░░░░  55%
BM·상용화                     ██░░░░░░░░  25%
i18n (UI)                     ████░░░░░░  40%
QA·장기 soak·릴리스           ███░░░░░░░  30%
─────────────────────────────────────────
출시 준비 종합                █████░░░░░  ~55%
```

| 영역 | % | 근거 요약 |
|------|---|-----------|
| 아키텍처·STAGE | 80 | `replace()` · `useStageMemory` · session dispose · Skia 단일 경로 · v4.0 멀티 잔재 제거 |
| Table-First·경제 | 70 | ~80 balance + ~27 content CSV · 일 1회 `runArcCoreDailyOpsBatch` · 무역 17/21 |
| 전투·Skia | 70 | transit + 허브 궤도 · `PlanetEdenRaidOrbitSkiaCombat` · 메모리 계약·감사 PASS |
| 행성 허브·개발 | 65 | 5개발 모듈 1차 · Heavy UI 파이프라인 · 궤도 채굴 · AI 트래픽 |
| 미션·스토리 | 55 | 스토리 001~005 · sandbox · objective 4종 · 이벤트/E2E 미완 |
| BM·상용화 | 25 | 💎→Cr 교환만 · IAP·VIP·스타터팩·gem_spend 미착수 |
| i18n | 40 | 스토리 67p EN · UI ~200+ 라인 잔여 |
| QA·릴리스 | 30 | 8h PASS 기록 vs 5h+ crash·PSS incident 미해결 |

---

## 3. 기획 대비 구현 현황

### 3-1. ✅ 잘 갖춰진 축 (70~85%)

| 영역 | 구현 상태 | 주요 경로 |
|------|-----------|-----------|
| **핵심 루프** | E2E 플레이 가능 | intro → character-select → nickname → planet → worldmap → combat → trade/shipyard/tavern/skilltree |
| **아키텍처** | v4.0 헌법 준수 | STAGE replace · dispose · Table-First · Local-AI-First |
| **ArcCore** | 일 1회 배치 | `runArcCoreDailyOpsBatch` · planetEconomyFabric 1차 |
| **전투** | Skia 단일 경로 | `combat.tsx` · transit combat post-flow |
| **미션** | 코어 연동 | CSV 정본 · tavern 3탭 · objective 4종 |
| **행성 개발** | 5모듈 enabled | 방위위성·궤도조선소·무역소·연구소·인구 |
| **계정** | persist + reset | Firebase guest · `purgeLocalAccountData` |
| **스토리 i18n** | EN 67페이지 | `resolveStoryPage*` · `story_scene_pages.csv` |
| **Heavy UI** | 코드 완료 | 8진입점 preflight→hydrate→build |

### 3-2. 🟡 반만 된 축 (40~60%)

| 영역 | 완료 | 미완 |
|------|------|------|
| **BM v2.1** | CSV·catalog·💎→Cr·cap ledger | IAP mock · 스타터팩 · VIP · gem_spend · premium=comingSoon |
| **i18n** | ko/en 인프라·스토리 EN | UI ~200+ 라인/60+ 파일 (shipyard·trade·planet dev 등) |
| **조선소** | 구매·장착·hangar | 함선 업그레이드·실드충전 · `ShipGridPlaceholder` |
| **미션** | 스토리·sandbox | talk_npc 이벤트 · 허브 궤도승→objective · E2E 30건 미검 |
| **채굴** | 허브 궤도 채굴 | 월드오브젝트 mining/salvage/dock = Placeholder |
| **경제 fabric** | window·daily reconcile | 스탯↔재고 순환·TDI/R&D 15단계 |
| **transit 후처리** | combat 화면 내 flow 코드 | 실기 E2E 재검증 필요 |
| **안정화** | 6/22 8h soak PASS | 5h+ worldmap SIGSEGV · PSS ~1GB · idle floor drift |

### 3-3. ❌ 미착수 / 스텁 (0~20%)

| 항목 | 비고 |
|------|------|
| IAP·시즌패스·VIP 구독 런타임 | Firestore BM 스키마는 spec만 |
| 보석 직구 (부활·이동·함선 gem spend) | BM 리포트 §4 스테이지 매핑 미연동 |
| 행성 공성 | `planetary_bombardment_stub`, enabled=0 |
| 무기 catalog 197종 | `weaponCatalogSeed.ts` stub |
| WEAPON_4 / drone·carrier | combat family 일부 미구현 |
| 오디오 CSV | `audio_tracks` 등 런타임 미참조 |
| 부트 lazy 워밍 | `BOOT_INIT_OPTIMIZATION_ROADMAP` — 보류 |
| 콘텐츠명 EN | 함선/무기/아이템 `*_en` 대량 미착수 |

---

## 4. 플레이 가능 E2E 루프 매트릭스

| STAGE | 경로 | 상태 | 비고 |
|-------|------|------|------|
| 0 | Splash / Auth | ✅ | Firebase guest · ArcCore boot |
| 온보딩 | intro → character-select → nickname → continue-warp | ✅ | 캐릭터 선택 재도입 |
| 1 | `planet.tsx` | ✅ | Skia 궤도·AI 트래픽·QuestHUD·스캔·채굴·허브 전투 |
| 2 | `worldmap.tsx` | 🟡 | 이동·미션 reach_system — **장기 soak 후 SIGSEGV** |
| 3 | `combat.tsx` | 🟡 | transit/허브 Skia 전투 — post-flow 재검 필요 |
| SUB | trade / shipyard / tavern / skilltree | 🟡 | Heavy UI 연동 — **실기 탭 QA 미완** |
| 경제 | 무역 buy/sell · 17무역소 | ✅ | tg 교역 · 일 1회 배치 |
| BM | 💎→Cr 교환 | 🟡 | IAP·획득 경로 없음 |
| 계정 | persist · reset · Firestore 단발 | ✅ | v4.0 onSnapshot 금지 준수 |

---

## 5. 운영·감사 게이트 스냅샷 (2026-06-23)

| 게이트 | 결과 | 비고 |
|--------|------|------|
| `npx tsc --noEmit` | ✅ PASS | — |
| `audit:skia-memory` | ✅ 12/12 | — |
| `audit:worklet-contract` | ✅ PASS | — |
| `audit:memory` | ✅ 20/20 | — |
| `audit:bm-value` | ✅ PASS | — |
| `audit:ui-overlay` | ✅ PASS | — |
| `audit:balance-ops` | ❌ FAIL | planet-economy-3h esbuild 오류 |
| `audit:i18n` | 🟡 218 lines | shipyard/trade 상위 |
| Long-run / playtest | ❌ P0 | worldmap SIGSEGV · MEM_HARD_CEILING PSS ~1GB |
| Incident handoff | 🟡 미 ack | `tools/long-run-monitor/outbox/` |

---

## 6. 출시 마일스톤 로드맵

### Milestone M0 — 현재 위치 (2026-06-23)

**달성:** 플레이 가능 싱글 샌드박스 알파 · v4.0 아키텍처 정리 · ArcCore 일일배치 · Skia 전투 · Heavy UI 파이프라인 코드 · BM 교환 1단계  
**미달:** 상용 출시 게이트 전부 · 5h+ soak 안정 · IAP · i18n UI · E2E QA

---

### Milestone M1 — P0 출시 블로커 해소

**목표:** 크래시·메모리·핵심 루프 E2E 통과 → **내부 QA 빌드 배포 가능**

| # | 작업 | 완료 기준 | 우선순위 |
|---|------|-----------|----------|
| M1-1 | **장기 soak 안정화** | 5h+ worldmap/transit-combat 복귀 SIGSEGV 0 · PSS ceiling 미발생 · idle 2h floor drift ±50MB 이내 | P0 |
| M1-2 | **Heavy UI 8화면 실기 QA** | trade/shipyard/tavern/skilltree/worldmap/행성개발 오버레이 탭·로딩·크래시 0 | P0 |
| M1-3 | **핵심 루프 E2E** | 신규/기존 부트 · 이동→조우→전투→승리/도주→목적지 · 미션 완료 1사이클 | P0 |
| M1-4 | **transit post-flow 검증** | combat 화면: dialog→결과→레벨업→미션→worldmap 순서 실기 확인 | P0 |
| M1-5 | **릴리스 빌드 품질** | debug→release 교차 · incident handoff ack · 미커밋 정리·브랜치 고정 | P0 |
| M1-6 | **감사 게이트 재실행** | `tsc` + skia-memory + memory + transit-combat-flow contract PASS | P0 |

**M1 Exit Criteria (출시 블로커 해소):**
- [ ] 5h+ playtest watch PASS (SIGSEGV 0, PSS < 950MB sustained)
- [ ] Heavy UI 8화면 체크리스트 전항 PASS
- [ ] E2E 시나리오 4종(신규/기존/전투/미션) PASS
- [ ] Release 빌드 1회 전체 루프 PASS

---

### Milestone M2 — P1 소프트 런치 최소선

**목표:** 한국 시장 제한 QA · BM mock · 핵심 i18n → **소프트 런치(Closed/Open Beta) 가능**

| # | 작업 | 완료 기준 | 우선순위 |
|---|------|-----------|----------|
| M2-1 | **BM IAP mock** | 보석 획득 mock → 스타터팩 1회 → VIP 일일 → gem_spend(부활·빠른이동) | P1 |
| M2-2 | **i18n P1~P5** | shipyard/trade/worldmap/combat/planet HUD · `audit:i18n` < 50 lines | P1 |
| M2-3 | **미션 E2E** | transit/허브 전투 objective 연동 · 스토리 001~005 회귀 15건+ | P1 |
| M2-4 | **경제 감사** | `audit:balance-ops` · planet-economy-3h FAIL 수정 | P1 |
| M2-5 | **조선소 2차** | 함선 업그레이드·실드충전 (`_000_ARCFIRE_SHIPYARD_UPGRADE_UI_SPEC`) | P1 |
| M2-6 | **Release playtest watch** | milestone 태깅 + analyze 리포트 · 24h soak 1회 | P1 |

**M2 Exit Criteria (소프트 런치):**
- [ ] BM mock으로 💎 획득→교환→spend E2E PASS
- [ ] EN locale 전환 시 P1~P5 화면 육안 PASS
- [ ] `audit:balance-ops` PASS
- [ ] 24h soak 1회 PASS

---

### Milestone M3 — P2 풀 출시 / 1.x 확장

**목표:** 기획서 전체 범위 · 글로벌 EN · 콘텐츠 깊이 → **정식 출시(1.0) 또는 1.x 로드맵**

| # | 작업 | 완료 기준 | 우선순위 |
|---|------|-----------|----------|
| M3-1 | **이벤트 미션 DSL** | talk_npc · story trigger · tavern 인스턴스 수락 | P2 |
| M3-2 | **월드오브젝트 상호작용** | mining/salvage/dock Placeholder → 실구현 | P2 |
| M3-3 | **Economy fabric P2~4** | 스탯↔재고 순환 · TDI/R&D 15단계 | P2 |
| M3-4 | **부트 lazy 워밍** | `BOOT_INIT_OPTIMIZATION_ROADMAP` — 시작 화면 응답·OOM 방지 | P2 |
| M3-5 | **콘텐츠명 EN** | CSV `*_en` 파이프라인 · weapon stub 정리 | P2 |
| M3-6 | **오디오·공성·드론/캐리어** | audio CSV 런타임 · planetary_bombardment · WEAPON_4 | P2 |
| M3-7 | **문서 복구** | README_ARCHITECTURE · risk register 등 AGENTS 인용 문서 | P2 |

**M3 Exit Criteria (풀 출시):**
- [ ] i18n P6 (콘텐츠명 EN) 핵심 카탈로그 PASS
- [ ] Economy fabric P2~4 KPI (F2P/Dolphin/Whale) audit PASS
- [ ] 스토어 IAP 실결제 연동 (mock → production)
- [ ] 72h soak + store review checklist PASS

---

## 7. 출시 시나리오 (추정)

| 시나리오 | 선행 마일스톤 | 포함 범위 | 추정 |
|----------|---------------|-----------|------|
| **내부 QA 빌드** | M1 완료 | 크래시·메모리·E2E만 | M1 작업량 |
| **소프트 런치 (KR)** | M1 + M2 | BM mock · i18n 핵심 · 제한 QA | M1+M2 |
| **정식 출시 1.0** | M1 + M2 + M3 | 기획서 전체 · 실 IAP · EN 글로벌 | M1~M3 전체 |

> 일정 수치(주·월)는 팀 velocity 미확정으로 **본 문서에 기입하지 않음**. M1 Exit Criteria 달성 여부로 Go/No-Go 판단.

---

## 8. 강점 · 리스크

### 8-1. 가장 강한 자산 (Top 3)

1. **Table-First + ArcCore 일일배치** — ~100 CSV · generated TS · 12:00 KST 배치 · 경제 엔진 광범위 구현
2. **Skia 전투 + STAGE 세션 아키텍처** — 단일 렌더 경로 · dispose 계약 · v4.0 헌법 정착
3. **싱글 샌드박스 정리** — 멀티/onSnapshot/가상유저 스토어 제거 · Local-AI-First 일관

### 8-2. 가장 큰 Gap (Top 3)

1. **장기 soak 안정성** — 5h+ worldmap SIGSEGV · PSS ~1GB · idle native heap drift
2. **BM/IAP 상용화** — 교환만 있고 획득·spend·VIP·시즌패스 미착수
3. **i18n + E2E QA** — UI 200+ 라인 · Heavy UI 실기 미검 · 미션 회귀 미완

### 8-3. 알려진 회귀 리스크

| 리스크 | 근거 | 완화 |
|--------|------|------|
| 6/16 정상 → 6/22+ crash 회귀 | stabilization vs playtest watch | M1 soak + incident auto-fix pipeline |
| 경제 부트경로 OOM | 6/16 onBoot sync 회귀 사례 | 김팀장 econ-boot-audit 게이트 |
| 대량 미커밋 | DEVELOPMENT_CHECKPOINT 2026-06-22 | M1-5 브랜치 고정 |

---

## 9. 다음 액션 (권장 순서)

1. **M1-1** — Arcadia idle 2h soak 재개 (PID change 후 clean baseline) + 5h playtest watch
2. **M1-2** — Heavy UI 8화면 실기 체크리스트 (`DEVELOPMENT_CHECKPOINT_2026-06-22` §1 미검증 항목)
3. **M1-3** — transit combat post-flow E2E (Metro `r` 후 combat→worldmap 전체)
4. **M1-5** — 미커밋 변경 분류·커밋·`audit:transit-combat-flow` 추가 실행
5. **M2 착수 조건** — M1 Exit Criteria 4항 전부 PASS 후

---

## 10. 참고 문서

| 문서 | 용도 |
|------|------|
| `.cursor/rules/Arcfire_Master_Spec_v4.0-*.mdc` | v4.0 헌법 |
| `AGENTS.md` | STAGE·Skia·경제·감시 인덱스 |
| `docs/DEVELOPMENT_CHECKPOINT_2026-06-22.md` | Heavy UI·BM 1단계 스냅샷 |
| `docs/STABILIZATION_CHECKPOINT_2026-06-16.md` | 6/16 정상 판정 기준 |
| `docs/I18N_MIGRATION_ROADMAP.md` | i18n P1~P6 |
| `docs/MISSION_SYSTEM_HANDOFF.md` | 미션 완료/미완 |
| `docs/_000_ARCFIRE_BM_REPORT_v2.0.md` | BM 설계 정본 |
| `docs/ARC_CORE_ECONOMY_FABRIC.md` | 경제 fabric 로드맵 |
| `tools/long-run-monitor/PLAYTEST_WATCH.md` | P0 crash 집중 검증 |

---

## 11. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-06-23 | 초판 작성 — 출시 준비도 평가·M0~M3 마일스톤 고정 |

---

**문서 종료 — Arcfire Release Readiness Milestone Report v1.0**
