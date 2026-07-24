# 아크코어 본체·세계 서브코어 거점 · 전점령 최종 시스템 — 실현 가능성 검토 (v0.1)

> **상태**: **검토·기획 기반** · 최종 시스템 UI/스토리/리셋 **미구현**  
> **지시**: 2026-07-24 대표님 — 본체=이터니티, 서브코어=미개발 외곽(미발견) 배치, 전점령 시 숨겨진 최종 시스템(스토리모드·전체 리셋 등 후보)은 기반만  
> **관련**: `eternal_throne` / `eternity` · 미발견 synth · `planet_holds` · `WorldExpansionSubCore`

---

## 0. 용어 구분 (필수)

| 용어 | 의미 | 비고 |
|------|------|------|
| **아크코어 핵심 본체** | 세계관상 서버·근원이 있는 **행성 거점** | 성계 `eternity` · 행성 `eternal_throne` (현 설정 확정) |
| **세계 서브코어 거점** | 본체 외, **물리적으로 외곽에 숨긴 아크코어 노드 행성** | **신규 기획 축** — 테이블로 배치 |
| **코드 SubCore** | `AiNpcSubCore` · `AiEconomySubCore` 등 **허브 소프트웨어 모듈** | 행성 배치와 **다른 층** — 본 기획의 “서브코어 거점”과 혼동 금지 |

이후 본 문서의 「서브코어」는 특별히 막지 않는 한 **세계 서브코어 거점(행성)** 을 뜻한다.

---

## 1. 의도 요약

1. **본체**는 이터니티(`eternal_throne`)에 유지.  
2. **그 외 서브코어 거점**을 지금 은하 지도에 **거의/전혀 안 보이는 미개발·미발견 외곽 행성**에만 배치.  
3. 향후: 본체 + 모든 서브코어 거점이 **플레이어에게 점유**되면 → **전 우주에 숨겨진 최종 시스템**이 등장.  
4. **지금**: (2) 배치·식별 기반 + (3)의 **조건 판정·훅 자리만**. 최종 시스템 본편(스토리 모드 발동·전체 리셋 등)은 **미구현**, 후보만 열어 둔다.

---

## 2. 실현 가능성 판정

| # | 요구 | 판정 | 근거 |
|---|------|------|------|
| A | 본체 = 이터니티 | **가능 · 이미 정본** | `ARC_CORE_SHADOW_HOME_BASE_PLANET_ID` · `endgame_boss` · `eternity`/`eternal_throne` |
| B | 서브코어를 미발견 외곽에 배치 | **가능** | 확장 `synth_*` / `미발견-*` 가 `visibleSystemsList`에서 제외·암흑 처리됨. 특정 `planetId`/`systemId`를 테이블에 「서브코어 거점」으로 표시하면 됨 |
| C | 지도에서 당분간 안 보임 | **가능** | 해금·게이트웨이 전엔 노드 미표시(별빛 레이어만). 서브코어 행성을 **의도적으로 legacy/gateway/unlocked에 안 넣으면** “완전 암흑 외곽” 유지 |
| D | 플레이어 점유 판정 | **가능** | `planet_holds` · `player_independent` / 증서(`ownership_*`) · 기존 점유 파이프라인 |
| E | 전점령 시 최종 시스템 등장 | **가능 (기반만)** | `unlockedSystemIds` / world expansion unlock / 신규 `systemId` 시드와 동일 계열. **지금은 플래그·이벤트 훅만** |
| F | 스토리모드 / 전체 리셋 등 복수 후보 | **가능 (분기 예약)** | 조건 충족 시 `ArcCoreCommand` 또는 observation kind 1개 → 핸들러는 stub · 정책 CSV로 `outcomeKind` 선택 |

**총평: 의도대로 구현 가능.**  
소프트웨어 SubCore를 행성으로 “이사”할 필요는 없고, **세계 거점 테이블 + 점유 게이트 + 언락 훅**으로 충분하다.

---

## 3. 권장 아키텍처 (향후 구현용 · 지금 코딩 아님)

### 3-1. Table-First (가칭)

`tables/content/arc_core_world_nodes.csv` (또는 balance)

| 컬럼 (가칭) | 예 |
|-------------|-----|
| `nodeId` | `arc_core_prime` / `arc_subcore_01` … |
| `role` | `prime` \| `subcore` |
| `planetId` | `eternal_throne` / `synth_1xx_p` … |
| `systemId` | `eternity` / `synth_…` |
| `mapVisibleWhileLocked` | `false` (서브코어 기본) |
| `notesKo` | |

- **prime 1행** = 이터니티 스론 (이미 존재 행성 참조).  
- **subcore N행** = 미발견 외곽에서 고른 행성(대표님·Fable이 좌표/성계 확정).  
- 코드 SubCore 목록과 **1:1 강제 매핑하지 않음** (개수·이름은 세계관용).

### 3-2. 점유 조건 (가칭)

```text
ALL_OWNED =
  every node.planetId where role in {prime, subcore}
  is held by player (player_independent / deedOwner = player clan)
```

- 판정 시점: **점유 변경 시 1회**(구매·점령 성공 콜백) + (선택) 일일 배치 재검증.  
- **틱마다 전 행성 스캔 금지**.

### 3-3. 최종 시스템 — 기반만

| 레이어 | 지금 | 이후 |
|--------|------|------|
| `arcfire_arc_core_final_gate_v1` (가칭) 플래그 | `pending` / `armed` / `triggered` | |
| `onArcCoreWorldNodesAllPlayerOwned()` | stub: 플래그+로그+observation | |
| `outcomeKind` 정책 | CSV enum: `story_mode` \| `soft_reset` \| `hard_reset` \| `reveal_system` \| `noop` | 핸들러 구현 |
| 신규 성계/행성 시드 | ID만 예약 (`genesis`-인접 또는 별도 `final_*`) | 맵 노출·스토리 |

**전체 리셋**은 계정 purge / generation bump / world expansion `resetGeneration` 과 맞물릴 수 있으므로, 기반 단계에서는 **호출 자리만** 두고 실제 wipe는 별도 승인 후.

### 3-4. 맵·점유 UX

- 서브코어 성계: 해금 전 **숨김** 유지(현재 미발견 정책과 동일).  
- 해금·점유 가능 시점: 세계 확장·미션·아크코어 캠페인 등 **별도 게이트**(추후).  
- 증서: 기존 `ownership_{planetId}` Table-First 경로 재사용.

---

## 4. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 코드 SubCore와 이름 충돌 | 문서·CSV에 `world_node` / `arc_core_site` 등 용어 고정 |
| 미발견 행성 점유 UI 없음 | 점유 전제 = 먼저 성계 해금·착륙 가능해야 함 → 해금 스토리 별도 |
| 전점령 조건이 너무 멂 | N개 서브코어 수·배치를 밸런스 CSV로 조절 |
| 리셋이 경제·월드 축과 충돌 | outcome을 정책으로 분리 · 기본 `noop`/`reveal_system` |
| PSS | 거점 목록 소수 Map · 점유 이벤트 시에만 평가 |

### 4-A. 정보 공개 (2026-07-24 대표님)

신명·거점 위치·역할은 **잔해 수색 → 유물**로만 확인. 맵/HUD 기본 비공개.  
정본: `docs/ARC_CORE_SUBCORE_PANTHEON_OPTIMIZATION_PLAN.md` **§3-A**.

---

## 5. 단계 제안

| Phase | 내용 | 코드 |
|-------|------|------|
| **0 (본 문서)** | 검토·용어·기반 설계 | 없음(또는 문서만) |
| **1** | CSV 세계 노드 + **판테온 유물** · 미발견 외곽 배정 | Table-First |
| **1b** | salvage 드롭 · 도감 store · 유물 열람 | 김팀장 · 기존 wreck 경로 |
| **2** | 점유 시 `ALL_OWNED` 판정 + 플래그/observation stub | 런타임 얇게 |
| **3** | 최종 시스템 등장 / 스토리모드 / 리셋 중 **1안** 구현 | 별도 지시 |

---

## 6. 결론

| 질문 | 답 |
|------|-----|
| 의도대로 가능한가? | **가능** |
| 본체 이터니티 유지? | **현 설정과 일치** |
| 서브코어만 미발견 외곽 배치? | **가능** (테이블 마킹 + 맵 비가시 유지) |
| 전점령 → 최종 시스템? | **가능** · 지금은 **조건·훅·outcome 예약**만 |
| 스토리모드·전체 리셋? | **후보로 기반에 열어 둠** · 본편 미구현 |

**다음(지시 시)**: Phase 1 — 서브코어 거점 후보 성계/행성 수·선정 규칙 확정 후 CSV 초안.
