# 함장 초상 할당표 템플릿 (원본 제작 전)

> 픽셀 작업 전에 **함장 id → 사용할 asset 키**만 확정.  
> 계약: `docs/NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md`

| captainId | 유형 | portraitImageAssetKey | 비고 |
|-----------|------|------------------------|------|
| npc_cpt_… | unique | assets/images/npc/…_char###.png | 스토리 주요 |
| npc_cpt_… | pool | assets/images/npc/noname_char003.png ~ 010 | 순환 공유 |

- CSV 일괄 채움은 할당표 승인 후 · `build:content-tables` · `npm run audit:npc-captain-portraits`
- 샘플 맵: char001–010 등록됨 (2026-07-24 기반)
