# NPC 함장 포트레이트 에셋 계약 (기반 · 2026-07-24)

> **목적**: 원본 이미지 대량 제작 **전** Table-First·메모리 안전 연동 고정.  
> **정본 UI**: `resolveIngameDialogPortraitSource` → `NarrativeDialogRow`

---

## 1. 경로·키

| 항목 | 규칙 |
|------|------|
| 폴더 | `assets/images/npc/` |
| CSV / 맵 키 | `assets/images/npc/<file>.png` (저장소 루트 상대) |
| 풀 공유 예 | `noname_char003.png` … `noname_char010.png` |
| 고유 예 | `stella_aris_char001.png`, `mia_bello_char002.png` |

## 2. 추가 3단계 (필수 · 순서)

1. PNG를 `assets/images/npc/`에 저장  
2. `src/game/npcCaptainPortraitAssets.ts`에 **동일 문자열** `require(...)` 등록  
3. `tables/content/npc_ai_captains.csv` `portraitImageAssetKey` 기입 → `npm run build:content-tables`

CSV만 채우고 맵/파일이 없으면 **표시되지 않음** (Metro 정적 require).

## 3. 메모리·프리웜

| 허용 | 금지 |
|------|------|
| 대화·패널 마운트 시 온디맨드 `<Image>` | `listCriticalSessionImageSources`에 **함장 초상 전수** |
| `resizeMethod="resize"` (표시 크기 디코드) | 부트에서 247장 prefetch |
| 풀 공유로 고유 파일 수 최소화 | 4K 원본을 UI 145px에 그대로 |

## 4. 대화 resolve 우선순위

`speakerNpcCaptainId` → 함장 `portraitImageAssetKey` → `page.imageAssetKey`  
→ `resolveNpcCaptainPortraitSource` → 없으면 placeholder.

## 5. 감사

```bash
npm run audit:npc-captain-portraits
npm run audit:npc-capital-ship-portraits   # 전함 초상 동계열
```

CSV 키가 맵/파일에 없으면 **exit 1**.

## 6. 원본 제작 전 체크

- [ ] 함장 id → 사용할 키 **할당표** (고유 vs 풀)  
- [ ] 권장 원본: 대화 145px contain · 과도한 해상도 금지  
- [ ] 샘플 맵·감사·resize 기반 반영 후 픽셀 작업
