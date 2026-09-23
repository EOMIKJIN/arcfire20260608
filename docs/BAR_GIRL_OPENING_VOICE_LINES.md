# 바걸 초기 대화 첫 문장 — 세트 폴백 참고

> **녹음·인게임 정본은 `docs/BAR_GIRL_UNIQUE_OPENING_LINES.md`**  
> 이 문서는 세트 공용 폴백(이름 미매칭 시)만 남긴다.

| 정본 | 경로 |
|------|------|
| 종업원·이름 | `tables/content/bar_attendants.csv` |
| 대사 | `tables/content/bar_dialog_turns.csv` |
| 현재 테스트 음성(전원 폴백) | `tables/content/bar_voice_clips.csv` · `voice/testbargirl_01` |

현재 번들 대사는 **「오빠 술사주세요, 오빠 이름이 뭐에요?」** 한 줄 폴백이다. 아래 표가 인게임 스크립트 첫 문장 정본이다.

---

## 0. 녹음 전에 알 것

- 활성 종업원 **422명**, 표시 이름은 **20종**이 행성마다 반복된다.
- 같은 이름이 행성마다 `dialogSetId`가 달라질 수 있다. 인게임 첫 문장 종류는 **8개**뿐이다.
- **이름별 녹음 정본**은 아카디아 프라임 홈 로스터 20명(`ta_att_001`~`020`)의 첫 문장이다. 그 이름이 다른 행성에서 다른 세트를 쓰면, 아래 §2의 해당 세트 문장이 나온다.

권장 파일명: `assets/audio/voice/bar_{영문소문자}_hello01.mp3`  
예: 미라 → `bar_mira_hello01.mp3`

---

## 1. 이름별 첫 문장 (홈 로스터 · 녹음 시트)

| # | 이름 | EN | 첫 문장 (한 줄) | dialogSet | 권장 파일 |
|---|------|----|-----------------|-----------|-----------|
| 1 | 미라 | Mira | 별빛 노래 한 소절 들을래요? | dset_star | `bar_mira_hello01.mp3` |
| 2 | 레나 | Lena | 스텝 한 번만 따라와요. | dset_ballroom | `bar_lena_hello01.mp3` |
| 3 | 소라 | Sora | 안녕하세요. 오늘 밤은 천천히 가볼까요? | dset_cheerful | `bar_sora_hello01.mp3` |
| 4 | 유나 | Yuna | 자리 비워 뒀어요. | dset_jazz | `bar_yuna_hello01.mp3` |
| 5 | 키라 | Kira | 별빛 노래 한 소절 들을래요? | dset_star | `bar_kira_hello01.mp3` |
| 6 | 노바 | Nova | 스텝 한 번만 따라와요. | dset_ballroom | `bar_nova_hello01.mp3` |
| 7 | 아이리스 | Iris | 안녕하세요. 오늘 밤은 천천히 가볼까요? | dset_cheerful | `bar_iris_hello01.mp3` |
| 8 | 베가 | Vega | 자리 비워 뒀어요. | dset_jazz | `bar_vega_hello01.mp3` |
| 9 | 루나 | Luna | 별빛 노래 한 소절 들을래요? | dset_star | `bar_luna_hello01.mp3` |
| 10 | 아리아 | Aria | 스텝 한 번만 따라와요. | dset_ballroom | `bar_aria_hello01.mp3` |
| 11 | 플룸 | Plume | 안녕하세요. 오늘 밤은 천천히 가볼까요? | dset_cheerful | `bar_plume_hello01.mp3` |
| 12 | 세이블 | Sable | 자리 비워 뒀어요. | dset_jazz | `bar_sable_hello01.mp3` |
| 13 | 신더 | Cinder | 별빛 노래 한 소절 들을래요? | dset_star | `bar_cinder_hello01.mp3` |
| 14 | 오팔 | Opal | 스텝 한 번만 따라와요. | dset_ballroom | `bar_opal_hello01.mp3` |
| 15 | 에코 | Echo | 안녕하세요. 오늘 밤은 천천히 가볼까요? | dset_cheerful | `bar_echo_hello01.mp3` |
| 16 | 니온 | Neon | 자리 비워 뒀어요. | dset_jazz | `bar_neon_hello01.mp3` |
| 17 | 제이드 | Jade | 별빛 노래 한 소절 들을래요? | dset_star | `bar_jade_hello01.mp3` |
| 18 | 루미 | Lumi | 스텝 한 번만 따라와요. | dset_ballroom | `bar_lumi_hello01.mp3` |
| 19 | 카일라 | Kayla | 안녕하세요. 오늘 밤은 천천히 가볼까요? | dset_cheerful | `bar_kayla_hello01.mp3` |
| 20 | 세레 | Sere | 자리 비워 뒀어요. | dset_jazz | `bar_sere_hello01.mp3` |

홈 로스터 기준 문장은 **4종**이 반복된다. 이름마다 톤만 달리 녹음하면 된다.

| 문장 | 해당 이름 |
|------|-----------|
| 별빛 노래 한 소절 들을래요? | 미라 · 키라 · 루나 · 신더 · 제이드 |
| 스텝 한 번만 따라와요. | 레나 · 노바 · 아리아 · 오팔 · 루미 |
| 안녕하세요. 오늘 밤은 천천히 가볼까요? | 소라 · 아이리스 · 플룸 · 에코 · 카일라 |
| 자리 비워 뒀어요. | 유나 · 베가 · 세이블 · 니온 · 세레 |

---

## 2. 인게임 고유 첫 문장 8종 (세트 단위)

다른 행성에서 세트가 바뀌면 아래가 나온다. 세트별 공용 음성을 만들 때 사용.

| dialogSet | 첫 문장 (한 줄) |
|-----------|-----------------|
| dset_star | 별빛 노래 한 소절 들을래요? |
| dset_ballroom | 스텝 한 번만 따라와요. |
| dset_cheerful | 안녕하세요. 오늘 밤은 천천히 가볼까요? |
| dset_jazz | 자리 비워 뒀어요. |
| dset_calm | 포스포 불빛 아래에서 쉬어 가세요. |
| dset_whisper | 오늘은 소문 대신 조용한 이야기만. |
| dset_ember | 박수 한 번으로 시작해요. |
| dset_echo | 제 화음에 맞춰 숨을 내쉬어 봐요. |

권장 파일명(세트 공용): `bar_set_{star\|ballroom\|cheerful\|jazz\|calm\|whisper\|ember\|echo}_hello01.mp3`

---

## 3. 녹음 메모

- 한 줄만. 이어서 나오는 감사·잡담 턴은 이 시트에 넣지 않는다.
- 호스트(바 주인) 첫 줄 `어서 오게. 먼 항로를 달려왔군.` 은 바걸이 아니다.
- 여관 함장 `npc_dialog_*` 씬과 별개다.
