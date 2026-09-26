# NPC 정본 포트레이트 단계별 생성 계획 (2026-09-26)

> **지시**: 임시 풀 공유를 폐기하고, `npc_ai_captains.csv` **고유 함장 1행 = 고유 PNG 1장**으로 생성·관리·연동한다.  
> **그림체**: `docs/NPC_PORTRAIT_PRODUCTION_CANON.md` — 선더라이즈 / 섬광의 하사웨이 셀 · 240×240.  
> **배선**: `docs/NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md` · `src/game/npcCaptainPortraitAssets.ts`

```text
[pss-pre-dev] hot_path=없음 alloc=없음 cache=정적 require 맵만
[pss-pre-dev] stage=PNG 추가·맵 1행·CSV 키 교체 risk=P6 없음(부트 prefetch 금지)
[pss-pre-dev] verdict=PASS
```

---

## 0. 보존(정본 고정) · 샘플 · 신규

### 0-1. 기존 파일을 **덮어쓰지 않는** 정본

| 구분 | 파일 | 이유 |
|------|------|------|
| 오퍼레이터 · 스텔라 아리스 | `assets/images/npc/stella_aris_char001.png` | 대표님 확정 정본. `npc_cpt_operator_stella`만 이 키를 쓴다. |
| 플레이어 생성 3명 | `noname_char007`(렌 카제) · `noname_char008`(미아 벨로 프로페션) · `noname_char010`(카일 드레이크) | `player_professions.csv` 정본. NPC 고유 키로 재사용하지 않는다. |
| 바걸 11명 | `bar_att_char006`–`016` | 현재 정본. `barAttendantPortraitAssets.ts` 1:1. NPC 테이블 미관리 → **추후 재검토**. |

### 0-2. 샘플 보관 (원본 위치 유지 + 사본)

임시 풀·톤 레퍼런스는 **삭제하지 않는다**. 사본만 `assets/images/npc/sample/`에 둔다.

| 샘플 | 이후 역할 |
|------|-----------|
| `noname_char003`–`010` | 규격(007)·군복(005/010)·톤 레퍼런스. 플레이어 3종은 위와 겸용. |
| `mia_bello_char002.png` | 구 임시 고유. 신규 `npc_cpt_bar_ret_02.png`(미아 벨로 바 주임)와 분리. |
| `bar_att_char016.png` | 톤 정본(바걸 플룸과 겸용). |

### 0-3. 신규 정본 키 규칙 (Table-First)

```text
함장 id          npc_cpt_mireille
파일             assets/images/npc/npc_cpt_mireille.png
CSV 키           assets/images/npc/npc_cpt_mireille.png
require 맵       동일 문자열
```

- 순환·돌려쓰기 금지. 풀 공유는 **미생성 단계의 임시 잔존**으로만 허용한다.  
- `stella_aris_char001` / `mia_bello_char002` / `noname_char00N`을 **다른 함장에 할당하지 않는다.**  
- 부트 `listCriticalSessionImageSources`에 함장 초상 전수 편입 **금지**.

---

## 1. 현재 상태 (2026-09-26 전수 완료)

| 항목 | 값 |
|------|----|
| 함장 행 | 262 |
| 고유 `portraitImageAssetKey` | **262** (1행 1키) |
| 스텔라 | `stella_aris_char001.png` **단독** 유지 |
| 신규 고유 PNG | 261 (`<captainId>.png` · `Player_pilot.png`) |
| `stella_aris` / `mia_bello` / `noname_char` 함장 오배정 | **0** |
| 바걸 11 | NPC 테이블 밖 · 파일 유지 · require 맵 미편입 (재검토 대기) |
| `audit:npc-captain-portraits` | **PASS** |

### 1-B. 인간형 전수 수정 (2026-09-26)

생성 초상을 전수 검수해 **과도한 로봇·기계·외계인**을 자연 인간형으로 교체했다. 설정이 기계/로봇/고대/창조자면 **하이브리드(인간 얼굴 + 최소 기계 암시)**만 허용.

| 구분 | id |
|------|----|
| 하이브리드 | `npc_cpt_vector` · `npc_cpt_ai_robot_default` · `npc_cpt_gov_genesis` · `npc_cpt_enemy_core_01` · `npc_cpt_enemy_eternity_01` · `npc_cpt_gov_reserve_red_06/08/18` |
| 인간형 재생성 | `npc_cpt_enemy_core_02/03` · `eternity_02/03` · `abyss_01–03` · `gov_reserve_red_19/20` · `gov_reserve_neutral_04/05` · `arc_seed_arcfire_core` · `arc_seed_genesis` |
| KEEP 미변경 | 스텔라 · 플레이어 3 · 바걸 11 |

이후 생성 규칙은 `_PORTRAIT_GEN_AGENT.md` · 제작 정본 §3-4.

---

## 1-A. 착수 스냅샷 (기록)

| 항목 | 값 |
|------|----|
| 함장 행 | 262 |
| 고유 파일로 매핑된 함장 | 사실상 2키(`stella_aris` · `mia_bello`) + `noname` 8장 순환 |
| `stella_aris`를 쓰는 비-스텔라 행 | 다수(미레유·하르만·베가 레드 08 등) — **오배정 P0** |
| `mia_bello`를 쓰는 비-미아 행 | 다수(오린·세린 등) — **오배정 P0** |
| 바걸 | NPC 테이블 밖 · 정본 유지 |

---

## 2. 단계 (생성 순서 = 플레이 노출 우선)

한 단계가 **파일 + require 맵 + CSV 키 + `build:content-tables` + `audit:npc-captain-portraits` PASS**까지 끝나야 다음 단계로 간다.

### Phase 0 — 계약·샘플 격리 (본 문서)

- 보존 목록 잠금  
- `sample/` 사본  
- 키 규칙·프롬프트 골격 고정

### Phase 1 — P0 본편·오배정 해제 (이번 스프린트)

플레이 시나리오에 **얼굴이 바로 나오는** 고유 네임드. 스텔라/미아 얼굴을 훔친 행을 먼저 끊는다.

| id | 이름 | 의상 축 | 근거 |
|----|------|---------|------|
| `npc_cpt_operator_stella` | 스텔라 아리스 | **기존 유지** | 오퍼레이터 정본 |
| `npc_cpt_mireille` | 미레유 보스 | 010 화이트 정복 · 얼굴만 | 본편 함대 / 현 스텔라 오배정 |
| `npc_cpt_orin` | 오린 케이드 | 005 네이비 · 얼굴만 | 본편 순찰 / 현 미아 오배정 |
| `npc_cpt_sela` | 셀라 모른 | 고유(광부 작업복+견장) | 본편 호송 |
| `npc_cpt_jex` | 젝스 타르 | 고유(변경 방한복) | 본편 변경 |
| `npc_cpt_vega_watch_01` | 하르만 돌 | 고유(야전 근무복) | E4 / 현 스텔라 오배정 |
| `npc_cpt_solar_guard_01` | 이사 벤트 | 005 네이비 · 얼굴만 | E5 항만 |
| `npc_cpt_arcadia_lane_01` | 엘렌 드 코르 | 005 네이비 · 얼굴만 | E5 관문순찰 |
| `npc_cpt_bar_ret_01` | 한로 크레인 | 정장 바텐더 · 솔라 항구 라운지 | E5 바 |
| `npc_cpt_bar_ret_02` | 미아 벨로 | 정장 바텐더 · 미네르바 갱도 선술집 | E5 바 · 플레이어 미아와 타인 |
| `npc_cpt_gov_minerva` | 니카 스톤 | 고유(광산 감독 작업복) | E5 미네르바 |
| `npc_cpt_story_noah_frick` | 노아 프릭 | 고유(기름때 작업복) | 본편 심문 |
| `npc_cpt_story_ian_koval` | 이안 코발 | 010 화이트 정복 · 얼굴만 | 본편 사령 |
| `npc_cpt_story_darel_sosa` | 다렐 소사 | 고유(검은 함장복) | 본편 대면 |

### Phase 2~5 — 잔여 전수 생성 · **완료 (2026-09-26)**

대화 가능 네임드 · 서브퀘스트 · 행성 거점/적 · 풀 캐릭터(arc_pf / faction / mock_pvp / arc_seed / 예비 사령관) · `Player_pilot` 포함 **261장 입고**.  
마지막 2장: `npc_cpt_gov_reserve_red_09` · `npc_cpt_gov_reserve_red_10`.

### Phase 6 — 잔여 오배정 소거 · **함장 축 완료** · 바걸 재검토 대기

- CSV에 `stella_aris` / `mia_bello` / `noname_char`가 **함장 고유 키로 남은 행 0**.  
- 플레이어 3 · 스텔라 · 바걸만 레거시 파일명을 유지.  
- 바걸을 NPC 테이블에 올릴지 **대표님 재확인 후** 결정.

---

## 3. 생성 프롬프트 계약

공통(전원):

```text
Square 1:1. Sunrise / Hathaway's Flash cel — match bar_att_char016.png
line weight, flat cel shadows, even lighting, waist-up 3/4, full-bleed interior.
No letterbox, no vignette, no text, no nameplate, no photorealism, no 3D.
```

| 축 | 규칙 |
|----|------|
| 스텔리움 근무 | 군복은 `noname_char005` **복제** · 얼굴·나이·머리만 변경 |
| 스텔리움 정복 | 군복은 `noname_char010` **복제** · 얼굴만 변경 |
| 고유 네임드 | profileKo 의상(작업복·외투·야전복·검은 함장복). 005/010 색을 임의 창작하지 말 것 |
| 참조 | 016 + (005 또는 010) + 필요 시 기존 샘플 |

참조 이미지: `NPC_PORTRAIT_PRODUCTION_CANON.md` §5.

---

## 4. 연동 체크리스트 (단계마다)

1. PNG를 `assets/images/npc/<captainId>.png`에 **240×240** 저장 (`square-npc-portraits` 또는 sharp 리사이즈)  
2. `npcCaptainPortraitAssets.ts`에 **동일 키** `require`  
3. `npc_ai_captains.csv` `portraitImageAssetKey` 교체  
4. `npm run build:content-tables`  
5. `npm run audit:npc-captain-portraits` PASS  
6. 보존 파일(스텔라·플레이어 3·바걸) **픽셀 불변** 확인

---

## 5. 전수 완료 범위 (2026-09-26)

- Phase 0 문서·`assets/images/npc/sample/` 사본  
- Phase 1~5 **함장 262행 고유 키** · 신규 PNG 261 + 스텔라 정본 1  
- require 맵 `legacy=10 unique=261` (`src/game/npcCaptainPortraitAssets.ts`)  
- `build:content-tables` · `audit:npc-captain-portraits` **PASS** (`remaining=0`)  
- 입고: `tools/content-tables/ingest-unique-npc-portraits.mjs` · 맵: `write-npc-portrait-require-map.mjs`  
- 바걸 11장은 KEEP · 맵 미편입 (audit `file_not_in_map=11` 정상)
