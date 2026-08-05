# 메모리 효율 리팩터 후보 — 정밀 전수검사 (2026-08-05)

Generated: 2026-08-05 KST · 김팀장 세션 정적 전수 · 런타임은 당일 mem-timeline(pid 17821 PSS↑ / 25612 remedia­tion)과 교차.

> **범위**: `src/` · `app/` · STAGE/Skia/틱/persist/cache  
> **제외**: CSV Table-First 밸런스 변경 · “누수 없음” 완료 선언(런타임 retention NO_DATA)

---

## 0. 이미 양호한 축 (리팩터 불필요·유지)

| 축 | 근거 |
|----|------|
| STAGE 전환 | 허브↔지도↔전투 주경로 `router.replace` |
| Firestore `onSnapshot` | 게임 경로 미사용(주석 금지 유지) |
| Skia 전투 Path | `PlanetEdenRaidOrbitSkiaCombat` Paint 모듈 싱글톤 · Zero-Allocation 계약 |
| AiNpc publish | ship key dedup 후만 zustand set (이중적분 제거 주석 유지) |
| playerStore persist | `schedulePlayerPersist` 1.5s coalesce |
| factionVault persist | `VAULT_PERSIST_COALESCE_MS` |
| fee ledger | timer coalesce |
| native reclaim | soft/deep/Fresco/hub peak 패스 존재 · worldmap 주기 reclaim |
| hub setInterval | planet.tsx 다수 `registerPlanetSessionResource` 등록 |
| `audit:skia-memory` / worklet-contract | 당일 PASS |

---

## 1. P0 — 당일 실측과 직결 · 우선 리팩터

### P0-1. 장시간 허브 native_heap / PSS 계단 (관측 확정)
- **증거**: pid 17821 PSS 637→999 · native 349→526 · 15:52 remedia­tion
- **코드 축(후보)**: Fresco/Image 상주 · 시설 `router.push` 스택 · 허브 Skia(nebula/orbit/inbound) peak 후 floor 미복구
- **리팩터 방향**:
  1. 시설 진입을 **push 스택 최소화** 또는 blur 시 허브 트리 freeze/`replace` 검토 (`planet.tsx` `onFacilityNavigate` ~499)
  2. hub-hop / facility exit 시 `runPlanetChangeNativeReclaimLight` + backdrop remount 쿨다운 정책 재검증
  3. 30m idle floor Δ 실측 게이트 후 패치 (retention MEM_PROFILE 샘플 확보)

### P0-2. 시설 SUB-STAGE `router.push` → Views 잔류 위험
- **위치**: `app/(game)/planet.tsx:499` · `buildPlanetHubFeatureMenuItems` `push: router.push`
- **왜**: Views 369~463 관측과 정합 · 시설 왕복 시 View 트리 누적
- **리팩터**: 시설 루트를 `replace` 또는 단일 Modal 호스트로 수렴 · 이탈 시 hub-only 트리 강제

---

## 2. P1 — GC/리렌더/핫패스 압력 (누수보다 floor 악화)

### P1-1. AiNpc snapshot 복제 할당
- **위치**: `src/arcCore/subcores/AiNpcSubCore.ts:228-231`
- **패턴**: publish 시 `ships.map(s => ({ ...s }))` + `captains.slice()`
- **왜**: phase 변경마다 N척 객체 복제 → Hermes GC · 거대 planet 구독 리렌더
- **리팩터**: immutable 필드만 교체하거나 frozen 스냅샷 풀 / structural sharing

### P1-2. 행성개발 오버레이 500ms `setTick` 폴링 (×4)
- **위치**:
  - `PlanetDevelopmentListContent.tsx:57`
  - `PlanetDefenseSatelliteDevContent.tsx:59`
  - `PlanetOrbitShipyardDevContent.tsx:59`
  - `PlanetGenericFacilityDevContent.tsx:340`
- **패턴**: 500ms `setInterval` → `setTick` → 전체 오버레이 리렌더 · session registry 미사용
- **왜**: 시설 열린 동안 초당 2회 RN 리렌더 · Views/Hermes 압력
- **리팩터**: job 완료 이벤트/스토어 revision 구독 · 폴링 ≥2s · `registerPlanetSessionResource` 또는 오버레이 dispose에 묶기

### P1-3. 전투 HUD 120ms `setInterval` + `setState`
- **위치**: `PlanetEdenRaidTestLayer.tsx:3588` (`setLogHud` / FPS)
- **왜**: 전투 중 JS 스레드·Hermes 할당 (stride 있음·여전히 고빈도)
- **리팩터**: SharedValue/텍스트 worklet 표시 또는 DEV-only · release 기본 OFF 유지 확인

### P1-4. `planet.tsx` 거대 화면 구독 폭
- **위치**: `app/(game)/planet.tsx` (다수 store selector)
- **왜**: arc traffic / mission / clan / core 등 publish → 전 허브 리렌더
- **리팩터**: 하단 메뉴·파일럿·궤도 INFO를 memo 자식으로 분리 · selector 세분화 (이미 일부 존재, 확장)

### P1-5. 채굴 드라이버 500ms 틱
- **위치**: `src/systems/mining/useMiningDriver.ts:96`
- **상태**: UI 게이지 2s 스로틀은 있음
- **리팩터**: wall tick을 ArcCore/이벤트 기반으로 옮기거나 interval을 1s로 · grant persist coalesce 확인

### P1-6. worldmap 주기 reclaim interval
- **위치**: `app/(game)/worldmap.tsx:617`
- **상태**: soft/deep reclaim 목적 — **유지 권장**이나 이동 중 skip·비용 계측
- **리팩터**: reclaim 본문이 할당 폭주하지 않는지(keepIds 배열 등) 1회 프로파일

---

## 3. P2 — 구조 정리 · 중기

| ID | 위치 | 내용 |
|----|------|------|
| P2-1 | `PlanetEdenRaidTestLayer` initAgents | 매 스폰 `new Map(list…)` — 모듈 인덱스 재사용 |
| P2-2 | facility Dev overlays | `usePlanetHubInterval` 공통 훅으로 통일 |
| P2-3 | `arcCoreLearningStore` | JSON.stringify 전체 store — 일일 배치만인지 확인 · 고빈도면 bounded+coalesce |
| P2-4 | inbound drone `useImage` | 트레일 레이어 Image — STAGE dispose/trim 경로 문서화 |
| P2-5 | nebula dodge `setInterval` | 이미 session 등록됨 — tick 본문 zero-alloc 유지 감사만 |
| P2-6 | epoch poll 60s (`planet.tsx:1076`) | 유지 OK · locale/epoch와 memo 이중화 문서화 |
| P2-7 | `clanWarFoundation` → `playerStore.persist()` | 점유 이벤트 시 즉시 persist — schedulePersist 경유 여부 확인 |

---

## 4. 명시적 비이슈 / False positive

- `Skia.Paint()` in combat/hitFx/inbound — 모듈/마운트 1회 패턴 (audit PASS)
- `Animated.Value` in `useRef` — OK
- STAGE `replace` 주경로 — OK
- `onSnapshot` 런타임 사용 — 미발견

---

## 5. 권장 실행 순서 (1안)

1. **P0-2** 시설 네비게이션 스택 정책 설계(replace vs Modal) — Views/PSS 실측 A/B  
2. **P1-2** 개발 오버레이 500ms 폴링 → revision 구독  
3. **P1-1** AiNpc snapshot 복제 축소  
4. **P0-1** 허브 30m+ soak + MEM_PROFILE retention으로 패치 검증  
5. P1-3~P1-5는 전투/채굴 활성 시에만

---

## 6. 교차 증거 (당일)

- remedia­tion 15:52 `GL_HARD_CEILING` PSS 999 → VERIFY PASS pid 25612  
- post-remediation ~1h PSS floor Δ ≈ 0~+20MB (안정)  
- retention 재실행 **NO_DATA** (logcat MEM_PROFILE 0) — PASS 선언 금지  
- `audit:skia-memory` 20/20 · `audit:worklet-contract` PASS  

---

**다음**: 대표님 승인 시 P0-2 / P1-2부터 패치 착수 · 김경제 mem-post-dev-recheck 병행.
