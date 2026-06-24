# Tactical Archive UI — 기준 확정 · 전면 교체 준비

> **기준 확정일**: 2026-06-18  
> **현재 적용 범위**: `planetEconomyInfo` (행성정보) **만** tactical  
> **다른 UI**: 이번 작업에서 **수정하지 않음** — 별도 지시 후 kind 플래그 전환  
> **감사**: `npm run audit:ui-overlay:tactical-readiness`

---

## 1. 확정된 범용 UI (Baseline)

행성정보 모달에서 검증된 **G-ARCHIVE / Tactical** 셸:

| 레이어 | 정본 |
|--------|------|
| 호스트 | `ArcOverlayHost` (단일 루트, RN Modal 없음) |
| 카드 | `ArcOverlayCard` — `panel` + `panelBleedPrefix` + `footerDock` |
| 헤더 | `ArcOverlayTitleHeader` — dark gray `#252930` + hatch |
| 본문 | light gray `#DDE1E8` · `ArcOverlayInfoRow` |
| 버튼 | `ArcOverlayFooterActions` → `tacticalPrimary` / `tacticalSecondary` |
| 토큰 | `tacticalOverlayStyles.ts` · `TACTICAL_OVERLAY` |
| 롤아웃 | `tacticalOverlayRollout.ts` — kind별 플래그 |

**즉시 롤백**: `TACTICAL_OVERLAY_KIND_FLAGS.planetEconomyInfo = false` (또는 레거시 alias `TACTICAL_OVERLAY_PREVIEW_PLANET_ECONOMY`)

---

## 2. 전면 교체 시 리스크 레지스터

### P0 — 중복 그리기 / 이중 UI

| 리스크 | 설명 | 대응 |
|--------|------|------|
| **Loading + Ready 동시 마운트** | `HeavyUiOverlayShell` loading/error vs ready 가 동시에 뜨면 카드 2장 | phase 분기 유지 · `PlanetDevDetailHydrateGate` 패턴 준수 |
| **Host + Legacy Modal** | `LevelUpModal` 등 Host 우회 | 전면 교체 전 `LevelUpModal`/`RewardModal` **삭제** + import 0 grep |
| **Alert z-index 스택** | alert(9999)가 panel 위에 겹침 | 의도된 동작 — tactical 전환과 무관, QA 시 alert 동시 오픈 케이스 확인 |
| **ArcOverlayCard 중첩** | Content 내 `<ArcOverlayCard>` 2회+ (loading/ready) | kind 전환 시 **한 phase = 한 카드** 계약 재검증 |

### P1 — 이전 UI 삭제 안 됨 / 혼합 테마

| 리스크 | 설명 | 대응 |
|--------|------|------|
| **Phosphor base + tactical override** | `ArcOverlayCard`가 phosphor 스타일 위에 tactical merge | kind 확대 시 `exclusive style set` 리팩터(Phase T2) |
| **phosphorOverlayStyles.card\*** | deprecated 카드 셸 잔존 | Phase A4 — import 0 후 파일 정리 |
| **로컬 row 스타일** | `planetDevelopmentOverlayStyles` 등 InfoRow 복제 | `ArcOverlayInfoRow` + `visualTheme` 로 통합 |
| **PlanetInfoPortraitSlot** | bleed 슬롯에 phosphor border/bg | kind 전환 시 `visualTheme` prop 추가 |
| **HeavyUi loading/error** | cyan `phosphorAccent` on tactical card | shell에 `visualTheme` 기반 spinner/text 색 |

### P2 — 레이아웃·회귀

| 리스크 | 설명 | 대응 |
|--------|------|------|
| **cardMaxWidth 변경** | 330px — 기종별 가로 | `OVERLAY_TOKENS.cardMaxWidth` 단일 소스 |
| **panelBleedPrefix** | 전폭 이미지 — 다른 kind에 불필요 | kind별 bleed 필요 여부 표에 기록 |
| **퍼센트 minHeight** | 85~96% — 세이프에리어 | `overlayPanelLayout.ts` 상수만 조정 |

---

## 3. kind별 마이그레이션 상태 (2026-06-18)

| kind | Shell | visualTheme | tactical 플래그 | 비고 |
|------|-------|-------------|-----------------|------|
| `planetEconomyInfo` | HeavyUi + Card | ✅ | **ON** | baseline |
| `planetDevelopment` | HeavyUi + Card | ❌ | OFF | dev row 로컬 스타일 |
| `settings` | Card panel | ❌ | OFF | |
| `bmShop` | Card panel | ❌ | OFF | bmShopOverlayStyles |
| `tradeQuantity` | Card panel | ❌ | OFF | |
| `alert` | Card compact | ❌ | OFF | 버튼 in body |
| `levelUp` | Card compact | ❌ | OFF | |
| `reward` | Card compact | ❌ | OFF | |
| `waveResult` | Card compact | ❌ | OFF | |
| `narrative` | NarrativeDialogRow | ❌ | OFF | **별도 축** — Card 통합 보류 |
| `blocking` | 텍스트 only | ❌ | OFF | |

---

## 4. 전면 교체 작업 순서 (별도 지시 후)

```text
Phase T0 — 준비 (현재)
  ├─ baseline 확정 + kind 레지스트리 (tacticalOverlayRollout.ts)
  ├─ audit:ui-overlay:tactical-readiness
  └─ 리스크 레지스트리 (본 문서)

Phase T1 — kind 1개씩 (지시마다)
  ├─ TACTICAL_OVERLAY_KIND_FLAGS.<kind> = true
  ├─ Content: resolveArcOverlayVisualTheme(kind) + shell visualTheme
  ├─ 로컬 phosphor inline 색 제거
  └─ 실기 QA + audit PASS

Phase T2 — 셸 정리
  ├─ ArcOverlayCard exclusive styles
  ├─ phosphorOverlayStyles deprecated card* 삭제
  └─ LevelUpModal / RewardModal 삭제

Phase T3 — narrative/blocking (선택)
  └─ 토큰만 공유 또는 유지
```

---

## 5. 전면 교체 체크리스트 (kind 1개당)

- [ ] `resolveArcOverlayVisualTheme(kind)` 연결
- [ ] `ArcOverlayCard` / `HeavyUiOverlayShell`에 `visualTheme` 전달
- [ ] `ArcOverlayFooterActions` footer 통일 (로컬 `ArcButton primary` 제거)
- [ ] 로컬 `phosphorOverlay` card shell 없음
- [ ] loading/error phase tactical 색
- [ ] `npm run audit:ui-overlay` PASS
- [ ] `npm run audit:ui-overlay:tactical-readiness` PASS (해당 kind WARN 해소)
- [ ] `tsc` PASS
- [ ] 실기: 중복 카드·footer 가림·스크roll 없음

---

## 6. 관련 파일

| 경로 | 역할 |
|------|------|
| `src/ui/overlay/tacticalOverlayRollout.ts` | **kind 플래그 정본** |
| `src/ui/overlay/tacticalOverlayPreview.ts` | 타입 re-export · 레거시 alias |
| `src/ui/overlay/tacticalOverlayStyles.ts` | G-ARCHIVE 토큰 |
| `docs/OVERLAY_UI_UNIVERSAL_SPEC.md` | phosphor 조립 스펙 |
| `tools/ui-overlay-audit/run-tactical-ui-rollout-readiness.cjs` | 준비 감사 |

---

**다음 액션**: 사용자 별도 지시 — `Phase T1` kind 선택 후 플래그 ON + Content 패치.
