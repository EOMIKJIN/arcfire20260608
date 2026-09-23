# NPC 함장·바 초상 에셋 계약 (기반 · 2026-09-07 규격 통일)

> **목적**: Table-First·메모리 안전 연동 + **픽셀 규격 단일화**.  
> **정본 UI**: `resolveIngameDialogPortraitSource` → `NarrativeDialogRow`  
> **코드 상수**: `src/game/npcPortraitPixelContract.ts`  
> **톤·군복 제작 정본**: `docs/NPC_PORTRAIT_PRODUCTION_CANON.md` (스텔리움 005/010 · 셀 016)

---

## 0. 범용 픽셀 규격 (무조건 · 향후 생성 전부)

| 항목 | 값 |
|------|-----|
| **정본 샘플** | `assets/images/npc/noname_char007.png` |
| **해상도** | **240 × 240** (가로 × 세로) |
| **비율** | 1:1 |
| **포맷** | PNG |
| **적용** | 함장·바 종업원·인게임 대사 초상 **전부** — AI/수작업 신규·교체 시 동일 |

레거시 `bargirl_char001`–`005`는 **삭제**됨. 바는 `bar_att_char006`–`015` 샘플만 사용.

---

## 1. 경로·키

| 항목 | 규칙 |
|------|------|
| 폴더 | `assets/images/npc/` |
| CSV / 맵 키 | `assets/images/npc/<file>.png` (저장소 루트 상대) |
| 풀 공유 예 | `noname_char003.png` … `noname_char010.png` |
| 고유 예 | `stella_aris_char001.png`, `mia_bello_char002.png` |
| 바 샘플 | `bar_att_char006.png` … `bar_att_char015.png` |

## 2. 추가 3단계 (필수 · 순서)

1. PNG를 **240×240**으로 `assets/images/npc/`에 저장  
2. `src/game/npcCaptainPortraitAssets.ts`(함장) 또는 `barAttendantPortraitAssets.ts`(바)에 **동일 문자열** `require(...)` 등록  
3. 함장은 `tables/content/npc_ai_captains.csv` `portraitImageAssetKey` 기입 → `npm run build:content-tables`

CSV만 채우고 맵/파일이 없으면 **표시되지 않음** (Metro 정적 require).

## 3. 메모리·프리웜

| 허용 | 금지 |
|------|------|
| 대화·패널 마운트 시 온디맨드 `<Image>` | `listCriticalSessionImageSources`에 **함장 초상 전수** |
| `resizeMethod="resize"` (표시 크기 디코드) | 부트에서 전수 prefetch |
| 풀 공유로 고유 파일 수 최소화 | 4K·비규격 원본을 대화 얼굴 프레임에 그대로 |

## 4. 대화 resolve 우선순위

`speakerNpcCaptainId` → 함장 `portraitImageAssetKey` → `page.imageAssetKey`  
→ `resolveNpcCaptainPortraitSource` → 없으면 placeholder.

## 5. 감사

```bash
npm run audit:npc-captain-portraits
npm run audit:npc-capital-ship-portraits   # 전함 초상 동계열
```

CSV 키가 맵/파일에 없으면 **exit 1**. 디스크 PNG는 **240×240**인지 픽셀 검수에 포함한다.

## 6. 원본 제작 체크

- [ ] 함장 id → 사용할 키 **할당표** (고유 vs 풀)  
- [ ] **240×240 PNG** (`noname_char007`과 동일 규격)  
- [ ] 스텔리움 함장: 군복은 `005`(네이비) 또는 `010`(화이트) 복제 · **얼굴만** 변경 — `NPC_PORTRAIT_PRODUCTION_CANON.md`  
- [ ] 인게임 대화 얼굴 레이어는 UI상 높이 300 · `contain` (표시 스케일; 원본 픽셀은 위 규격)
