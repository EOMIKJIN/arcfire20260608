# READY — 인게임 대사창(Narrative) 헤더·하단 크롬 정리

```text
status=READY
task_id=ingame-narrative-dialog-chrome-20260820
assignee=김클로드
kind=UI_FIX
commit=FORBIDDEN
post_review=김팀장 검수만 (대표님 지시 2026-08-20)
```

> **배정**: 김팀장 · 2026-08-20  
> **대표님**: 김팀장 세션의 대사 UI 수정은 중단. 김클로드가 정리 구현 → handoff **PENDING** → 김팀장 **검수만**.  
> **김클로드**: 김팀장 분석을 **받아쓰지 말 것**. 코드·실기로 재검수 후 AGREE/PARTIAL/DISAGREE + 근거. **git commit 금지**.

**흡수**: `narrative-dialog-position-tune-20260820` (−5px `EXTRA_TOP_OFFSET`) — 조각 패치. 본 task가 정본.

**축 분리**: 대상은 **인게임 NPC 대사** (`kind=narrative` · `NarrativeDialogRow`). **아크코어 채팅(`arcCoreChat`) 금지.**

---

## 0. 재현 화면 (정본)

**바** `app/(game)/bar.tsx` — 입장 시 호스트 대사가 자동으로 뜬다.

보이는 헤더(빗살무늬):

- `◀ 나가기`
- `바`
- `미아벨로 · 퇴역사령 …` (hostMeta 자막)

이 빗살무늬 블록이 **`PlanetFacilityTitleHeader`** + `TitleHeaderHatchPattern` 이다. 행성 허브 탑바가 아니다.

---

## 1. 대표님 확정 요구 (최종 우선)

| # | 요구 | 비고 |
|---|------|------|
| 1 | 초상은 **빗살무늬 헤더 바로 아래**부터. 헤더를 일부라도 가리면 실패 | 헤더 = 빗살 채워진 곳 |
| 2 | `[ 확인 ]`/`[ 다음 ]` **아래**는 **흰색** (`TACTICAL_OVERLAY.cardBg` `#DDE1E8`)으로 바 본문(작전·미션 리스트)이 비치면 실패 | 검은색 여백 금지 |
| 3 | Stage **하단 예약 공백**(`STAGE_BOTTOM_MIN_INSET_PX` · safe bottom)에는 **초상/대사를 넣지 말 것**. 그 구간은 **흰색만** | 「채우지 말고 흰색으로 그려라」 |
| 4 | **실측이 안 되면 실측이 안 된다고 할 것.** 추정치로 헤더를 맞추지 말 것 | 김팀장 실패 원인 |
| 5 | 실측 실패 시 **지금 크기(540)는 유지**하고 **전체만 +20px 하향** | `NARRATIVE_DIALOG_UNMEASURED_SHIFT_DOWN_PX` |
| 6 | intro 슬롯(`showActionButton=false`)·아크코어 채팅·`planetMainStageLayout` 상수 **금지** | |

초기 지시(허브): 헤더 아래 행성 피크 가림 · 하단 배경 숨김 · 버튼 Y 고정.  
이후 정정은 **바 빗살 헤더** + **하단 흰색**이 우선. 버튼 Y 고정은 실측 성공 시 유지, 미실측 +20 시 버튼도 같이 내려간다(대표님 승인).

---

## 2. 김팀장 실패 경위 (재검수 대상 — 맹신 금지)

김팀장이 **헤더 위치를 모르고** 상수를 바꿔 가며 맞췄다. 대표님 지적: 「실측이 안 되면 실측이 안 된다고 하라.」

| 시도 | 왜 틀렸는가 |
|------|-------------|
| 행성 탑바 `STAGE_TOP_INSET + topBar − lift` | 바 헤더가 아님. lift는 시각만 |
| 시설 헤더 **추정** px (`planetFacilityHeaderMetrics` — 삭제됨) | 실측 아님 |
| 하단 `flex:1` + 전술 `cardBg` | 예약 공백까지 흰색이 침범 → 대표님 항의 |
| 하단 예약 **투명** | 확인 아래 검정 다음 **미션 리스트가 다시 보임** |
| 하단 검정 `#05070d` | 대표님: 하단은 **흰색** |
| Host를 fill 컬럼으로 바꾼 뒤 수치를 여러 번 바꿈 | 작업이 누적되어 읽기 어려움 |

**김클로드 판단 필수**: 위 표 AGREE/PARTIAL/DISAGREE. 실측 모듈이 바 자동 대사보다 **늦게** 들어오면 `hatchBottomY=null` → 항상 +20만 타고, 헤더는 계속 가려질 수 있다.

---

## 3. 현재 코드 (정리 대상)

| 파일 | 역할 |
|------|------|
| `src/ui/overlay/narrativeDialogLayout.ts` | 핀 540 · `UNMEASURED_SHIFT_DOWN=20` · **`EXTRA_TOP_OFFSET=-5`(김클로드 조각)** |
| `src/ui/overlay/narrativeDialogLayout.test.ts` | 위 상수 단정 |
| `src/ui/overlay/NarrativeDialogRow.tsx` | `stageFill` 컬럼: spacer + 카드 + 흰색 bleed + 흰색 reserved |
| `src/ui/overlay/content/NarrativeOverlayContent.tsx` | `hatchBottomY` + safeBottom → stageFill |
| `src/ui/overlay/ArcOverlayHost.tsx` | narrative fill wrap (`narrativeFillWrap`/`Slot`) — 김팀장 uncommitted |
| `src/ui/planetFacility/facilityHatchHeaderMeasure.ts` | `measureInWindow` 하단 Y · 언마운트 시 null |
| `src/ui/planetFacility/PlanetFacilityTitleHeader.tsx` | onLayout + rAF + measureInWindow |
| `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc` | 계약 |
| `AGENTS.md` 인게임 대사 한 줄 | 계약 요약 |

intro: `app/(game)/intro.tsx` — `stageFill` 없음(540만). 깨지 말 것.

---

## 4. 한다 / 하지 않는다

### ✅ 한다

1. **바 실기 경로**에서 빗살 헤더 실측이 대사보다 먼저/같이 오는지 확인. 레이스면 **고친다**(추정 높이로 메우지 말 것).
2. 레이아웃을 **한 경로로 읽히게** 정리. `+20` / `−5` / hatch / reserved가 한 함수에 섞인 상태를  simplification. `EXTRA_TOP_OFFSET=-5`는 대표님 육안 조각 — **헤더 맞춤이 되면 제거하거나 근거를 남기고만 유지**.
3. 시각 합격:
   - 빗살 헤더 전부 보임
   - 헤더 바로 아래부터 초상
   - 확인 아래~예약 앞: 흰색, 미션 리스트 비침 없음
   - 예약 구간: 초상 없음, 흰색만
4. 미실측: 540 유지 + 전체 +20만. 「헤더를 상수로 맞춤」 회귀 금지.
5. `npx tsx --test src/ui/overlay/narrativeDialogLayout.test.ts` · `npx tsc --noEmit -p tsconfig.client.json`
6. handoff **PENDING** + 재검수 판정·파일:줄

### ❌ 하지 않는다

| 제외 | 이유 |
|------|------|
| `arcCoreChat` · `overlayPanelLayout` 채팅 오프셋 | 이미 대상 착오 후 REVERTED |
| `planetMainStageLayout` 상수 변경 | v4.0 확정 |
| intro 컷신 레이아웃 재설계 | stageFill 없는 540 유지 |
| Skia · STAGE dispose · 일일 배치 | 무관 |
| git commit | 김팀장만 |

---

## 5. 권장 1안 (재검수 후 채택)

1. 헤더 하단 Y = **`PlanetFacilityTitleHeader` `measureInWindow`만**. 상수 합산 금지.
2. 바 자동 `presentIngameDialogScene`과 실측 레이스면: 헤더 실측이 온 뒤 한 번 리레이아웃(이미 store 구독됨). **첫 프레임이 틀리면** present를 `onLayout` 이후로 미루는 편이 추정 폴백보다 낫다.
3. 하단: `pinBottom → (windowH − reserved)` 흰색 · `reserved` 높이 흰색. 투명/검정 금지.
4. Host는 fill 컬럼 유지(가운데 540만 띄우면 상하 갭이 다시 생김). 김팀장 `ArcOverlayHost` fill 변경과 **한 덩어리로** 맞출 것.

---

## 6. [pss-pre-dev]

```text
[pss-pre-dev] hot_path=헤더 onLayout 1회 + 오버레이 구독 alloc=스칼라 1 cache=모듈 실측
[pss-pre-dev] stage=오버레이 mount/unmount · persist/틱 없음 risk=P1
[pss-pre-dev] verdict=PASS — REDESIGN이면 추정 헤더 높이 재도입 금지
```

---

## 7. 완료 조건 (김클로드 self-check)

- [ ] 바: 빗살 헤더 미가림 · 하단 흰색 · 미션 리스트 비침 없음
- [ ] 미실측 경로: 크기 540 · +20만 (헤더 추정 없음)
- [ ] intro · arcCoreChat 무변경
- [ ] 테스트 + tsc
- [ ] handoff PENDING · **commit 금지**
- [ ] 김팀장 분석 AGREE/PARTIAL/DISAGREE + 근거
