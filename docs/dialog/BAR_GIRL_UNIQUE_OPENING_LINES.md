# 바걸 이름별 고유 첫 문장 — 녹음·인게임 정본

> 2026-09-16 · 20명 **전원 다른 한 줄**  
> 인게임은 `speechAct=attendant_hello` 1턴만 이 표로 덮어쓴다.

| 정본 | 경로 |
|------|------|
| 이름별 첫 문장 | `tables/content/bar_attendant_hello.csv` |
| 종업원·이름 | `tables/content/bar_attendants.csv` |
| 세트 폴백(이름 미매칭 시만) | `tables/content/bar_dialog_turns.csv` |
| 런타임 적용 | `resolveBarAttendantHelloOverlay` → `resolveBarDialogLine` |

활성 종업원 422명은 표시 이름 20종이 행성마다 반복된다. **같은 이름이면 어느 행성이든 아래 한 줄이 나온다.**

권장 파일명: `assets/audio/voice/bar_{영문소문자}_hello01.mp3`

---

## 녹음 시트 (20명 · 서로 다른 첫 문장)

| # | 이름 | EN | 첫 문장 (한 줄) | 권장 파일 |
|---|------|----|-----------------|-----------|
| 1 | 미라 | Mira | 오케스트라가 켜지기 전에 먼저 웃어 드릴게요. | `bar_mira_hello01.mp3` |
| 2 | 레나 | Lena | 서두르지 말아요. 재즈는 천천히 따라와요. | `bar_lena_hello01.mp3` |
| 3 | 소라 | Sora | 별빛 노래 오늘 첫 손님은 당신이에요. | `bar_sora_hello01.mp3` |
| 4 | 유나 | Yuna | 포스포 불빛 아래에서는 말수가 없어도 괜찮아요. | `bar_yuna_hello01.mp3` |
| 5 | 키라 | Kira | 스텝은 빠르게 인사는 짧게 할게요. | `bar_kira_hello01.mp3` |
| 6 | 노바 | Nova | 어느 항로로 오셨어요? 이야기부터 들을게요. | `bar_nova_hello01.mp3` |
| 7 | 아이리스 | Iris | 가까이 앉아요. 오늘은 소문 하나만 전할게요. | `bar_iris_hello01.mp3` |
| 8 | 베가 | Vega | 달빛 리듬이 맞으면 손부터 내밀어요. | `bar_vega_hello01.mp3` |
| 9 | 루나 | Luna | 고음은 제가 올릴게요. 당신은 숨만 맞춰 줘요. | `bar_luna_hello01.mp3` |
| 10 | 아리아 | Aria | 깃털처럼 가볍게 한 바퀴만 돌고 올까요? | `bar_aria_hello01.mp3` |
| 11 | 플룸 | Plume | 밤은 낮게 말해야 더 잘 들려요. | `bar_plume_hello01.mp3` |
| 12 | 세이블 | Sable | 들어올 때부터 박수가 먼저 나왔어요. | `bar_sable_hello01.mp3` |
| 13 | 신더 | Cinder | 눈인사만으로도 자리가 반짝여요. | `bar_cinder_hello01.mp3` |
| 14 | 오팔 | Opal | 한 소절이 메아리처럼 남을 때까지 기다릴게요. | `bar_opal_hello01.mp3` |
| 15 | 에코 | Echo | 새벽 항로를 여는 목소리 지금 켜둘게요. | `bar_echo_hello01.mp3` |
| 16 | 니온 | Neon | 네온 잔에 기대면 이야기는 천천히 흘러요. | `bar_neon_hello01.mp3` |
| 17 | 제이드 | Jade | 수도 살롱에선 상석부터 비워 둬요. | `bar_jade_hello01.mp3` |
| 18 | 루미 | Lumi | 오늘 리드 공연 첫 소절은 당신 자리로 보낼게요. | `bar_lumi_hello01.mp3` |
| 19 | 카일라 | Kayla | 교차점에 온 손님이면 제가 자리를 정해 드릴게요. | `bar_kayla_hello01.mp3` |
| 20 | 세레 | Sere | 코어 살롱의 시그니처 오늘 파트너는 저예요. | `bar_sere_hello01.mp3` |

문장은 홈 로스터 태그라인(성격)을 따른다. 이전 세트 공용 4종(별빛 노래 / 스텝 한 번 / 오늘 밤은 천천히 / 자리 비워 뒀어요)은 **첫 문장으로 쓰지 않는다.**

---

## 인게임 적용

- 바 공연 대화의 **첫 턴만** (`attendant_hello`) 이름 키로 교체한다.
- 감사·음주 감사·잡담·작별 등 이후 턴은 기존 `dialogSetId` 대사를 유지한다.
- 이름 미매칭 시에만 세트 `attendant_hello`가 폴백된다.

현재 테스트 음성 `voice/testbargirl_01` 캡션(「오빠 술사주세요…」)은 녹음 대체가 올 때까지 오디오 폴백으로 남는다. **화면 대사는 위 표가 정본이다.**
