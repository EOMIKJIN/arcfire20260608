# NPC 초상 제작 정본 (톤·군복 · 2026-09-14)

> **상태**: 대표님 확정 · 이후 함장 초상은 본 문서만 따른다  
> **배선·메모리 계약**(파일 등록·CSV·240 검수): `docs/NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md`  
> **코드 상수**: `src/game/npcPortraitPixelContract.ts`

대표님 지시: `noname_char005` · `noname_char010` = **스텔리움 연합 기본군복·정복**.  
추가 함장은 **이 군복 스타일을 유지하고 얼굴만** 바꾼다.

---

## 0. 한 줄

픽셀은 **240×240 PNG**. 그림체는 **`bar_att_char016` 하사웨이 셀**.  
스텔리움 함장은 **네이비 근무정복(005) / 화이트 예복정복(010)** 두 형만.

```text
[pss-pre-dev] hot_path=없음 alloc=없음 cache=정적 require 맵만
[pss-pre-dev] stage=PNG 교체·맵 1행 추가 risk=없음
[pss-pre-dev] verdict=PASS
```

---

## 1. 정본 파일

| 역할 | 파일 | 쓰는 때 |
|------|------|---------|
| **픽셀 규격** | `assets/images/npc/noname_char007.png` | 해상도·정사각만 |
| **톤·셀·구도** | `assets/images/npc/bar_att_char016.png` | 선 굵기·셀 그림자·허리업 3/4·풀블리드 배경 |
| **스텔리움 기본군복(여)** | `assets/images/npc/noname_char005.png` | 네이비 근무정복 · 은장 |
| **스텔리움 정복(남)** | `assets/images/npc/noname_char010.png` | 화이트 예복정복 · 금장·훈장 |
| **고유 네임드(톤 참고)** | `stella_aris_char001.png` | 오퍼레이터 · 군복 아님 |

바 1등급 고유 11명: `bar_att_char006`–`016` 이름 1:1. **016은 톤 정본이면서 플룸 고유 초상.** 순환·돌려쓰기 금지.

---

## 2. 그림체 (전원 공통)

`bar_att_char016`과 같은 **선더라이즈 / 섬광의 하사웨이** 셀.

| 해야 함 | 금지 |
|---------|------|
| 또렷한 잉크 외곽선 | 웹툰·아이돌 뷰티 조명 |
| 평면 셀 그림자 | 실사·3D·모공 묘사 |
| 허리업 3/4, 카메라 정면 쪽 | 강한 측면 프로필만 |
| 배경을 사각형 **끝까지** 그림 | 검정 레터박스 · 원형 비네트 · 단색만 |
| 완성된 실내(함교·복도·라운지) | 잘린 사진 · 빈 그라데이션 |
| 글자 없음 | 이름 캡션(`STELLA ARIS` 등) 베이크 |

---

## 3. 스텔리움 연합 군복 — 함장 추가 규칙

**얼굴·나이·머리·피부·눈만 바꾼다. 군복 커트·색·장식 체계는 005/010을 복제한다.**

### 3-1. 기본군복 · 근무정복 — `noname_char005`

- 네이비 더블브레스트 재킷, 은색 단추·견장
- 은색 에기예트(오른쪽 어깨→가슴)
- 검정 벨트 · 은색 버클
- 배경: 밝은 그레이 함선 복도(완성된 실내)

신규 **여성·중견 근무** 함장은 이 형.

### 3-2. 정복 · 예복 — `noname_char010`

- 화이트 스탠드칼라 재킷, 금장 단추·견장· Cord
- 금색 에기예트 · 가슴 훈장 줄
- 배경: 올리브/다크 그린 함교(완성된 실내)

신규 **남성·지휘관급 정복** 함장은 이 형.  
기존 `noname_char008`(화이트 여)은 **같은 화이트 정복 계열** — 신규 여 정복은 010의 금장 체계 + 008의 여컷을 섞지 말고, **005 네이비 또는 010 화이트 중 하나만** 고른 뒤 얼굴만 교체.

### 3-3. 금지 (함장)

- 새 색 군복(빨강·흑·위장 등)을 임의 창작
- 기갑·망토·민간 드레스를 스텔리움 함장 기본으로 사용
- 바 `016` 네온 라운지를 함장 배경으로 사용
- 군복은 두고 장비·훈장만 폭주시키는 것

고유 네임드(스텔라 가운, 미아 앞치마 등)는 **군복 풀이 아니다**. 함장 증설과 섞지 않는다.

---

## 4. 바 종업원

- 톤·구도 = `bar_att_char016`
- 얼굴·머리·의상은 인물마다 달라도 됨
- 배경은 완성된 라운지/바(카운터·잔 가능)
- 스텔리움 군복을 바에 입히지 않음

---

## 5. 이후 작업 순서

1. 본 문서 §2–§3을 생성 프롬프트에 그대로 넣는다. 참조 이미지 = **016 + (005 또는 010) + (필요 시 얼굴 레퍼런스)**  
2. PNG를 **240×240**으로 `assets/images/npc/` 저장  
3. `npcCaptainPortraitAssets.ts`에 **동일 키** `require`  
4. `tables/content/npc_ai_captains.csv` `portraitImageAssetKey` → `npm run build:content-tables`  
5. `npm run audit:npc-captain-portraits`

---

## 6. 생성 프롬프트 골격 (함장)

```text
Square 1:1, 240 look. Hathaway's Flash / Sunrise cel — match bar_att_char016.png
line weight, flat cel shadows, even lighting, full-bleed painted interior.
NEW FACE only. UNIFORM must clone noname_char005.png (navy duty) OR
noname_char010.png (white dress). Do not redesign the uniform.
No letterbox, no vignette, no text.
```
