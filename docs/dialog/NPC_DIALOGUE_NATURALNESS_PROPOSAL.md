# NPC 대사 자연화 — 수정안 (기존 > 대체)

```text
status=APPLIED (김팀장 2026-10-01 · 대표님 「미완료 전수·목표분량 완수」)
작성=김클로드 수정안 · 김팀장 적용·검수
대표님 지시=모든 NPC 대사를 자연스러운 소설 문장·일상 대화로. 레퍼런스: 아서 C. 클라크 소설, SF 만화, 우주 전략 게임.
            특히 전투 패배 시 NPC 대사가 기계어처럼 어색함.
범위=전투 종료 55행 + 퀘스트 목표 187행 전량 적용
```

> 관련 문서: `docs/dialog/QUEST_DIALOGUE_REWRITE_PROPOSAL.md`(v2.0, 퀘스트 본문) · `docs/dialog/QUEST_DIALOGUE_AUTHORING_GUIDE.md`(작성 기준) — 본 문서는 두 문서가 다루지 않은 **전투 종료 대사**와 **목표 달성 대사**를 다룬다.

---

## 0. 결론

1. **대표님이 지목하신 전투 패배 대사가 저장소 전체에서 가장 기계적인 코퍼스다.** 55행 중 42%가 「~다. ~다. ~다.」 단문 3연속이다. **55행 전부 재작성했고, 길이·CSV 안전성을 기계로 검증했다**(§4).
2. **근본 원인은 문장력이 아니라 규칙 오독이다.** 대사창 제한 「3줄 × 21자」를 **「문장 3개」로 읽고** 한 줄에 단문 하나씩 끊어 썼다. 3줄은 줄바꿈이지 문장 수가 아니다(§2).
3. 같은 결함이 **퀘스트 목표 대사 187행**에도 남아 있었다. **김팀장 2026-10-01 전량 적용** — 문맥 확인 5행 포함. 허브 인사·early_route·바/스텔라는 본 문서 범위 밖.

---

## 1. 진단 — 코퍼스별 기계어 지표

`tables/` 전체 대사 코퍼스(약 2,500행)를 같은 기준으로 스캔했다.

| 코퍼스 | 대사 | 단문 3연속 | 명사 술어 | 회계어 |
|---|---|---|---|---|
| **`balance/transit_combat_end_dialog.csv`** | **55** | **42%** | **16%** | **16%** |
| `content/story_scene_pages.csv` | 558 | **34%** | 0% | 11% |
| `content/stella_quest_dossier.csv` | 43 | 0% | 0% | 19% |
| `content/stella_captain_note.csv` | 42 | 0% | 0% | 7% |
| `content/stella_quest_aside.csv` | 187 | 0% | 0% | 5% |
| `content/bar_dialog_turns.csv` | 47 | 0% | 0% | 0% |
| `content/bar_attendant_hello.csv` | 22 | 0% | 0% | 0% |

- **바·점원 대사는 깨끗하다.** 대표님 체감이 전투 쪽에 집중된 이유다.
- 스텔라 문서류의 회계어(5~19%)는 무역·장부 관련 서류 내용이라 **문맥상 정상**일 가능성이 높다. 이번 범위에서 제외.

### 전투 종료 대사 — 반복 템플릿

| 반복 틀 | 행수 |
|---|---|
| 「~다. ~다. ~다.」 단문 3연속 | 23행 (42%) |
| 「등을 보였군 / 숨겼군」 | 9행 (16%) |
| 「도망은 계산이다 · 손실이다 · 유예다」 | 9행 (16%) |
| 「오늘은 네가 맞았다」 | 6행 (11%) |
| 「함선은 잃었다. ~는 안 잃었다」 | 6행 (11%) |
| 「나는 산다 / 남는다」 | 4행 (7%) |

**11개 팩션이 전부 같은 틀·같은 어휘로 말한다.** 해적도, 고대종도, 에너지 기업도 「장부」와 「계산」을 입에 올린다.

---

## 2. 근본 원인 3가지

### 2-1. 「3줄」을 「문장 3개」로 오독

대사창은 **3줄 × 21자**(320dp 기준)다. 이것은 **표시 영역의 줄바꿈 한계**인데, 원문은 이를 **「한 줄에 한 문장」**으로 받아들였다.

```
기존 (문장 3개, 줄마다 마침표)        대체 (문장 1~2개, 자연 줄바꿈)
관문이 먼저 닫혔다.                   관문이 먼저 닫혀 버렸다…
나는 남는다.                          그래도 나는 사라지지 않는다.
심연은 기다린다.                      심연은 언제까지고 기다린다.
```

같은 3줄 안에서도 **연결어미로 이어 한 호흡**으로 만들면 기계 냄새가 사라진다.

### 2-2. 영어 직역 명사 술어

「도망은 계산이다」 「도망은 유예다」 「도망은 고립이다」 — 영어 `Flight is a count` / `Flight is a stay` 를 그대로 옮긴 형태다. **한국어 구어에는 「A는 B다」로 행위를 정의하는 말버릇이 거의 없다.** 사람은 「달아나 봐야 잠시뿐이오」처럼 말한다.

### 2-3. 모든 팩션이 한 사람처럼 말한다

높임법이 **전부 반말 평서형 하나**, 어휘장이 **전부 장부·정산·계산 하나**다. 팩션 설정(해적·고대종·기업)이 대사에서 드러나지 않는다.

---

## 3. 문체 기준 — 레퍼런스별로 가져올 것

| 레퍼런스 | 가져올 것 | 적용 팩션 |
|---|---|---|
| **아서 C. 클라크** — 『2001 스페이스 오디세이』 『라마와의 랑데부』 『유년기의 끝』 (한국어판) | 담담하고 정확한 문장. 감정을 부풀리지 않고 **사실 서술로 무게**를 준다. 우주적 시간 감각 | 고대종 · 미지 |
| **『은하영웅전설』** (한국어판 소설·애니) | 함대 지휘관다운 **온전한 문장**. 인물마다 뚜렷한 어조 — 귀족의 하오체, 참모의 건조한 합쇼체 | 나이트폴 군주 · 에너지 기업 · 무역 연합 |
| **우주 전략 게임 교신** — Homeworld · FTL · Stellaris · EVE (한국어판) | 짧지만 **쉼표로 이어지는** 구어. 「선체 뚫렸다, 빠진다!」 — 마침표로 뚝뚝 끊지 않는다 | 해적 · 잔해 수집단 · 암시장 · 성운 방랑자 |

### 하지 말 것 (기존 결함)

- 「~다. ~다. ~다.」 단문 3연속
- 「도망은 ○○이다」 — 행위를 명사로 정의하는 직역체
- 상인이 아닌 팩션의 회계 어휘(장부·정산·계산)
- 「나는 산다」 — 주어 + 동사 원형만으로 끝나는 선언
- 같은 틀 복붙(「오늘은 네가 맞았다」 6회)

### 할 것

- **한 호흡 = 한 문장.** 연결어미(~지만 · ~니 · ~고 · ~는데)로 잇는다.
- **종결어미에 감정을 싣는다** — ~군(깨달음) · ~지(여유) · ~거든(변명) · ~마(다짐) · ~리라(예언)
- **패배자는 패배자답게** — 분함 · 자존심 · 허세 · 체념 · 흥정이 팩션 성격대로 갈린다.

### 팩션별 말투 설계

| 팩션 | 높임법 | 어휘장 | 패배 태도 |
|---|---|---|---|
| 범용 | 반말 | 항로 · 교차점 · 연료 | 분하지만 담담 |
| 해적 | 거친 반말 | 빚 · 꽁무니 · 체면 | 앙심 · 허세 |
| 잔해 수집단 | 반말 | 고철 · 통행료 · 이자 · 구역 | 실리적 · 뻔뻔 |
| 성운 방랑자 | 낮은 반말 | 그늘 · 안개 · 신호 | 은밀 · 인내 |
| 에너지 기업 | **합쇼체** | 출력 · 분기 · 보고서 · 청구 | 사무적 · 냉정 |
| 유적 발굴단 | 반말 | 유물 · 관문 · 발굴 기록 | 집착 · 학자적 |
| 무역 연합 | **하오체** | 장부 · 정산 · 계약 · 통행세 | 장사꾼의 계산 |
| 암시장 | 속삭이는 반말 | 흔적 · 이름값 · 위장막 | 교활 |
| 미지 | 문어체 | 관문 · 심연 · 좌표 · 껍데기 | 섬뜩 |
| 나이트폴 군주 | **하오체 · 예스러움** | 성채 · 흑야 · 군주의 자리 | 오만 · 치욕 |
| 고대종 | **문어체 · ~리라** | 코어 · 왕좌 · 영원 · 그릇 | 초연 |

**회계 어휘는 무역 연합 · 에너지 기업 · 잔해 수집단(통행료)에만 남겼다** — 이들에게는 그게 캐릭터다.

---

## 4. 전투 종료 대사 55행 — 전면 재작성

`tables/balance/transit_combat_end_dialog.csv` · `lineKo` 열

### 4-0. 검증 결과

| 항목 | 결과 |
|---|---|
| 원본 id 대응 | **55 / 55** · 누락 0 · 초과 0 · 중복 0 |
| 3줄 × 21자 (단어 단위 줄바꿈 시뮬레이션) | **55행 전부 3줄 이내** |
| 한글 길이 | 최소 27 · 최대 49 · 평균 38.7 |
| CSV 안전 (큰따옴표 0) | **통과** |
| 첫 구절(8자) 중복 | **없음** |

**기계어 지표 전후**

| 지표 | 기존 | 대체 |
|---|---|---|
| 단문 3연속 | 23행 (42%) | **0행 (0%)** |
| 명사 술어(도망은 ~이다) | 9행 (16%) | **0행 (0%)** |
| «나는 산다/남는다» | 4행 (7%) | **0행 (0%)** |
| «오늘은 네가 맞았다» | 6행 (11%) | **0행 (0%)** |
| «등을 보였군/숨겼군» | 9행 (16%) | **0행 (0%)** |
| 회계어가 «상인 아닌» 팩션에 등장 | 2행 | **0행** |

> 검증 과정에서 `energy_corp_defeat_02` 1행이 단문 3연속으로 다시 걸려 한 번 더 고쳤다. 문서 표는 검증 통과본에서 **기계로 생성**했다(수기 전사 오류 방지).

### 4-1. 한국어 (`lineKo`)

#### 범용 (`*`)

| id | 기존 | 대체 |
|---|---|---|
| `default_defeat_01` | 함선이 먼저 꺾였다. 살아서 빠진다. 이건 끝이 아니다. | **배가 먼저 버티질 못했군. 오늘은 물러나지만, 이게 끝이라고 생각하진 마라.** |
| `default_defeat_02` | 계산이 틀렸다. 산 쪽이 다음 판을 연다. | **내가 너를 얕봤던 모양이군. 살아남았으니, 다음은 내 차례다.** |
| `default_defeat_03` | 오늘은 네가 맞았다. 항로는 넓다. 다음에 다시 본다. | **오늘은 네가 이겼다. 우주는 넓어도 항로는 몇 갈래 없지. 또 보게 될 거다.** |
| `default_flee_01` | 그래 등을 보여라. 다음 교차로에서 세운다. | **그래, 도망쳐 봐라. 다음 항로 교차점에서 기다리고 있을 테니.** |
| `default_flee_02` | 도망은 자유다. 연료가 바닥나면 그때 끝낸다. | **어디까지 달아날 수 있나 보자. 연료가 떨어지는 순간 끝이다.** |

#### 해적 (`pirates`)

| id | 기존 | 대체 |
|---|---|---|
| `pirates_defeat_01` | 선체가 먼저 죽었다. 나는 산다. 다음 습격에서 갚는다. | **젠장, 배가 먼저 나가떨어졌군. 목숨은 붙어 있으니, 이 빚은 꼭 갚아 주마.** |
| `pirates_defeat_02` | 화물도 명예도 오늘은 네 거다. 살아서 빠지는 게 우리 규칙이다. | **화물이든 체면이든 오늘은 네가 다 가져가라. 살아서 도망치는 게 우리 방식이거든.** |
| `pirates_defeat_03` | 관문 공백을 잘못 짚었다. 기록은 남긴다. 다음엔 더 짧게 친다. | **관문 경비의 빈틈을 잘못 봤어. 네 얼굴은 똑똑히 기억해 두지. 다음엔 금방 끝낸다.** |
| `pirates_flee_01` | 등을 보였군. 교차로에서 다시 세운다. 보급은 네가 끊긴다. | **꽁무니 빼는 거냐? 보급이 끊기면 네가 먼저 굶을 거다. 교차점에서 보자고.** |
| `pirates_flee_02` | 도망은 계산이다. 연료가 마르면 그때 끝내자. | **머리 좀 굴렸군. 좋아, 연료가 바닥날 때까지 쫓아가 주마.** |

#### 잔해 수집단 (`scavengers`)

| id | 기존 | 대체 |
|---|---|---|
| `scavengers_defeat_01` | 잔해는 남는다. 나는 남는다. 네 배도 곧 잔해가 된다. | **고철은 어디에나 굴러다니지. 나도 아직 살아 있고. 네 배도 곧 고철이 될 거다.** |
| `scavengers_defeat_02` | 오늘은 세를 못 받았다. 산 자가 장부를 고친다. | **오늘은 통행료를 못 걷었군. 괜찮아, 다음에 이자까지 쳐서 받으면 되니까.** |
| `scavengers_defeat_03` | 함선은 버렸다. 규칙은 안 버린다. 다음에 다시 막는다. | **배는 버려도 이 구역 규칙은 못 버리지. 다음에도 여기서 길을 막을 거다.** |
| `scavengers_flee_01` | 달아나라. 잔해권은 내 장부다. 통행은 나중에 받는다. | **달아나 봐야 이 잔해 지대는 내 구역이야. 통행료는 나중에 받으러 가지.** |
| `scavengers_flee_02` | 등을 보인 함선은 다음에 값으로 적는다. | **도망친 배는 전부 기억해 둔다. 다음엔 몸값을 두 배로 불러 주지.** |

#### 성운 방랑자 (`void_walkers`)

| id | 기존 | 대체 |
|---|---|---|
| `void_walkers_defeat_01` | 시야가 깨졌다. 나는 그늘로 빠진다. 신호는 다음에 끊는다. | **시야가 무너졌군. 난 성운 그늘로 물러나겠다. 다음엔 네 통신부터 끊어 주지.** |
| `void_walkers_defeat_02` | 추격이 끊겼다. 산다. 항로는 다시 흐려진다. | **놓쳤군. 그래도 살아는 있다. 항로는 곧 다시 안개에 잠길 거야.** |
| `void_walkers_defeat_03` | 오늘은 네가 관통했다. 성운은 남는다. 나도 남는다. | **이번엔 네가 성운을 뚫고 나갔군. 하지만 성운은 사라지지 않아. 나도 마찬가지고.** |
| `void_walkers_flee_01` | 등을 숨겼군. 신호를 끊고 기다린다. | **몸을 숨겼나. 좋아, 신호를 끄고 조용히 기다리지.** |
| `void_walkers_flee_02` | 도망은 고립이다. 그늘에서 다시 붙는다. | **혼자 달아나면 고립될 뿐이야. 그늘 속에서 다시 따라붙겠다.** |

#### 에너지 기업 (`energy_corp`)

| id | 기존 | 대체 |
|---|---|---|
| `energy_corp_defeat_01` | 코일이 먼저 죽었다. 나는 회수한다. 다음 교전에서 값을 받는다. | **출력 코일이 먼저 나갔군요. 일단 철수합니다. 이번 손실은 다음 교전에서 청구하겠습니다.** |
| `energy_corp_defeat_02` | 출력 계산이 틀렸다. 산 쪽이 장부를 고친다. | **출력 산정에 착오가 있었군요. 보고서를 고쳐 쓰고 나면, 결과도 달라질 겁니다.** |
| `energy_corp_defeat_03` | 오늘은 네가 맞았다. 광압은 다시 모은다. | **이번 분기는 귀하의 승리로 기록하죠. 광압 충전이야 다시 하면 그만입니다.** |
| `energy_corp_flee_01` | 등을 보였군. 전력선이 마르면 그때 세운다. | **철수하시는군요. 전력 공급이 끊기는 시점에 다시 찾아뵙겠습니다.** |
| `energy_corp_flee_02` | 도망은 손실이다. 다음 교차에서 회수한다. | **도주하신다면 손실만 커질 뿐입니다. 다음 교차 지점에서 정산하죠.** |

#### 유적 발굴단 (`archaeologists`)

| id | 기존 | 대체 |
|---|---|---|
| `archaeologists_defeat_01` | 유물은 못 가졌다. 목숨은 가졌다. 게이트는 다음에 연다. | **유물은 놓쳤지만 목숨은 건졌군. 그 관문은 언젠가 반드시 내 손으로 연다.** |
| `archaeologists_defeat_02` | 고대품보다 먼저 함선이 깨졌다. 기록은 남긴다. | **유물보다 내 배가 먼저 부서지다니. 그래도 발굴 기록은 전부 챙겨 간다.** |
| `archaeologists_defeat_03` | 오늘은 네가 맞았다. 유적은 기다린다. 나도 기다린다. | **오늘은 물러서지. 유적은 수천 년을 기다렸어. 나도 좀 더 기다릴 수 있지.** |
| `archaeologists_flee_01` | 등을 보였군. 게이트 앞에서 다시 세운다. | **도망치는 건가. 관문 앞에서 다시 만나게 될 거다.** |
| `archaeologists_flee_02` | 도망은 약탈을 미룰 뿐이다. 좌표는 남겼다. | **달아나 봐야 발굴이 조금 늦어질 뿐이야. 좌표는 이미 기록해 뒀다.** |

#### 무역 연합 (`trade_coalition`)

| id | 기존 | 대체 |
|---|---|---|
| `trade_coalition_defeat_01` | 이 판은 네가 가져갔다. 장부는 남는다. 다음 정산에서 받는다. | **이번 거래는 당신이 이겼소. 하지만 장부는 남으니, 다음 정산 때 받아 가겠소.** |
| `trade_coalition_defeat_02` | 함선은 잃었다. 권리는 안 잃었다. 항로세는 나중에 받는다. | **배는 잃었어도 이 항로의 권리까지 잃은 건 아니오. 통행세는 나중에 받겠소.** |
| `trade_coalition_defeat_03` | 오늘은 적자다. 산 쪽이 다음 계약을 연다. | **오늘 장사는 적자로군. 뭐, 살아 있으면 다음 계약은 또 맺으면 되오.** |
| `trade_coalition_flee_01` | 등을 보였군. 도주는 위약이다. 다음에 값으로 적는다. | **도주는 계약 위반이오. 위약금은 다음에 똑똑히 청구하겠소.** |
| `trade_coalition_flee_02` | 도망쳐라. 보급이 끊기면 그때 정산한다. | **가 보시오. 보급이 끊기는 날, 그때 정산하도록 하지.** |

#### 암시장 (`black_market`)

| id | 기존 | 대체 |
|---|---|---|
| `black_market_defeat_01` | 거래는 깨졌다. 나는 그림자만 남긴다. 다음 밀수에서 갚는다. | **거래는 틀어졌군. 난 흔적 없이 사라지지. 이 빚은 다음 밀수 때 갚아 주마.** |
| `black_market_defeat_02` | 함선은 버렸다. 이름은 안 버린다. 시장은 다시 열린다. | **배야 또 구하면 그만이지만, 내 이름값은 못 버려. 시장은 다시 열릴 거다.** |
| `black_market_defeat_03` | 오늘은 네가 맞았다. 은폐는 다시 깐다. | **이번엔 네가 한 수 위였군. 위장막은 다시 치면 그만이야.** |
| `black_market_flee_01` | 등을 숨겼군. 항로는 내가 지운다. 다음에 다시 붙는다. | **숨어 봤자야. 항로 기록은 내가 지워 버릴 테니, 다시 따라붙지.** |
| `black_market_flee_02` | 도망은 값이다. 그림자에서 다시 세운다. | **도망에도 대가는 따르는 법이지. 그림자 속에서 다시 길을 막아 주마.** |

#### 미지 (`unknown`)

| id | 기존 | 대체 |
|---|---|---|
| `unknown_defeat_01` | 관문이 먼저 닫혔다. 나는 남는다. 심연은 기다린다. | **관문이 먼저 닫혀 버렸다… 그래도 나는 사라지지 않는다. 심연은 언제까지고 기다린다.** |
| `unknown_defeat_02` | 오늘은 네가 관통했다. 좌표는 지워지지 않는다. | **이번엔 네가 꿰뚫고 지나갔군. 하지만 그 좌표는 결코 지워지지 않는다.** |
| `unknown_defeat_03` | 함선은 잃었다. 문은 안 잃었다. 다음에 다시 연다. | **껍데기는 잃었다. 하지만 문은 아직 내 곁에 있다. 다음에 다시 열리리라.** |
| `unknown_flee_01` | 등을 보였군. 심연은 뒤를 기억한다. | **돌아서는구나. 심연은 네 뒷모습을 기억할 것이다.** |
| `unknown_flee_02` | 도망은 잠깐이다. 관문 앞에서 다시 세운다. | **달아나 봐야 잠시뿐. 관문 앞에서 다시 만나게 되리라.** |

#### 나이트폴 군주 (`dark_lords`)

| id | 기존 | 대체 |
|---|---|---|
| `dark_lords_defeat_01` | 성채가 먼저 흔들렸다. 나는 남는다. 밤은 다시 깔린다. | **성채가 먼저 흔들리다니, 치욕이로군. 허나 나는 무너지지 않소. 밤은 다시 내린다.** |
| `dark_lords_defeat_02` | 오늘은 네가 맞았다. 흑야는 기다린다. 나도 기다린다. | **오늘은 그대에게 양보하지. 흑야는 서두르지 않소. 나 또한 그러하고.** |
| `dark_lords_defeat_03` | 함선은 잃었다. 군주는 안 잃었다. 다음에 포위한다. | **함선 한 척쯤이야. 군주의 자리는 그대로요. 다음엔 사방에서 에워싸 주지.** |
| `dark_lords_flee_01` | 등을 보였군. 밤은 길다. 성채 앞에서 다시 세운다. | **등을 보이는가. 밤은 길다오. 성채 앞에서 다시 발을 묶어 주겠소.** |
| `dark_lords_flee_02` | 도망은 유예다. 다음에 끝낸다. | **달아나 봐야 결말이 잠시 미뤄질 뿐이오. 끝은 다음에 짓지.** |

#### 고대종 (`ancients`)

| id | 기존 | 대체 |
|---|---|---|
| `ancients_defeat_01` | 코어가 먼저 식을 줄은 몰랐다. 감시는 계속된다. 왕좌는 남는다. | **코어가 먼저 식을 줄은 몰랐구나. 그래도 감시는 멈추지 않는다. 왕좌는 여전히 남는다.** |
| `ancients_defeat_02` | 오늘은 네가 맞았다. 영원은 한 판이 아니다. | **오늘은 너의 승리다. 허나 영원은 한 번의 싸움으로 끝나지 않는다.** |
| `ancients_defeat_03` | 함선은 잃었다. 문은 안 잃었다. 다음에 다시 닫는다. | **그릇은 잃었어도 문은 여전히 우리 것이다. 때가 되면 다시 닫으리라.** |
| `ancients_flee_01` | 등을 보였군. 왕좌는 기다린다. 항로는 다시 멈춘다. | **물러가는가. 왕좌는 기다릴 것이고, 항로는 다시 고요해지리라.** |
| `ancients_flee_02` | 도망은 잠깐이다. 코어 앞에서 다시 세운다. | **피할 수 있는 건 잠시뿐이다. 코어 앞에서 다시 마주하게 되리라.** |

### 4-2. 영어 (`lineEn`) — 같은 결함, 같이 교체

영어 원문도 「The hull died first. I live.」처럼 단문을 끊어 붙인 형태라 함께 고친다.

| id | before | after |
|---|---|---|
| `default_defeat_01` | The hull gave first. I pull out alive. This is not over. | My ship gave out before I did. I'm pulling back, but don't think this is over. |
| `default_defeat_02` | The count was wrong. The one who lives opens the next round. | Seems I underestimated you. I'm still breathing, so the next move is mine. |
| `default_defeat_03` | You had it today. The lanes are wide. We meet again. | You win this one. Space is big, but the lanes aren't. We'll run into each other again. |
| `default_flee_01` | Show me your back. I stop you at the next crossing. | Go on, run. I'll be waiting at the next junction. |
| `default_flee_02` | Running is free. When your fuel dies I finish it. | Let's see how far you get. The moment your fuel runs dry, it's over. |
| `pirates_defeat_01` | The hull died first. I live. I pay this back on the next raid. | Damn it, the ship went down before I did. I'm still alive, and I'll pay you back for this. |
| `pirates_defeat_02` | Cargo and pride are yours today. Living to leave is our rule. | Take the cargo, take the bragging rights. Living to run another day is our way. |
| `pirates_defeat_03` | I misread the gate gap. I keep the record. Next time I hit shorter. | I misjudged the gap in the gate patrol. But I've got your face memorized. Next time, it'll be quick. |
| `pirates_flee_01` | You showed your back. I stop you at the crossing. Your supply dies first. | Turning tail? Your supplies will run dry before mine. See you at the junction. |
| `pirates_flee_02` | Running is a count. When fuel dries we end it. | Smart move. Fine, I'll chase you till your tanks run dry. |
| `scavengers_defeat_01` | Wreckage stays. I stay. Your ship becomes wreckage soon. | There's always scrap floating around. I'm still here too. Your ship will be scrap soon enough. |
| `scavengers_defeat_02` | No toll today. The living rewrites the ledger. | Didn't get my toll today. That's fine. I'll collect it next time, with interest. |
| `scavengers_defeat_03` | I dumped the hull. Not the rule. I block you again. | I can ditch a ship, but not the rules of this field. I'll be blocking your way again. |
| `scavengers_flee_01` | Run. The wreck field is my book. Toll comes later. | Run all you like, this wreck field is my turf. I'll come for the toll later. |
| `scavengers_flee_02` | A ship that shows its back goes on the next bill. | I remember every ship that runs. Next time, the price doubles. |
| `void_walkers_defeat_01` | Sight broke. I slip into shade. Next time I cut the signal. | My sight's gone. I'll fade back into the nebula's shadow. Next time, your comms go dark first. |
| `void_walkers_defeat_02` | The chase broke. I live. The lane goes dark again. | Lost you. But I'm alive. The lanes will sink back into the haze soon enough. |
| `void_walkers_defeat_03` | You punched through today. The nebula stays. So do I. | You broke through the nebula this time. But the nebula isn't going anywhere. Neither am I. |
| `void_walkers_flee_01` | You hid your back. I cut signal and wait. | Gone to ground, have you? Fine. I'll go silent and wait. |
| `void_walkers_flee_02` | Flight is isolation. I latch on again from the shade. | Run off alone and you're just isolated. I'll pick up your trail again from the shadows. |
| `energy_corp_defeat_01` | The coil died first. I recover. I collect on the next fight. | Our output coils failed first. We are withdrawing. This loss will be billed to you next engagement. |
| `energy_corp_defeat_02` | The output count was wrong. The living fixes the book. | There was an error in our output estimates. Once the report is revised, so will the outcome be. |
| `energy_corp_defeat_03` | You had it today. I gather the pressure again. | We'll log this quarter as your win. Recharging the photon arrays is simply a matter of time. |
| `energy_corp_flee_01` | You showed your back. When the line dries I stop you. | Withdrawing, I see. We'll call on you again the moment your power supply fails. |
| `energy_corp_flee_02` | Flight is loss. I recover at the next crossing. | Running only increases your losses. We'll settle accounts at the next junction. |
| `archaeologists_defeat_01` | No relic today. I kept my life. I open the gate next time. | I lost the relic but kept my life. That gate, I will open it myself, someday. |
| `archaeologists_defeat_02` | The hull broke before the relic. I keep the record. | My ship shattered before the artifact did. Still, I'm taking every excavation record with me. |
| `archaeologists_defeat_03` | You had it today. The ruin waits. So do I. | I'll step back today. These ruins have waited thousands of years. I can wait a little longer. |
| `archaeologists_flee_01` | You showed your back. I stop you at the gate. | Running, are you? We'll meet again at the gate. |
| `archaeologists_flee_02` | Flight only delays the take. I kept the coordinates. | Running only delays the dig. I've already logged the coordinates. |
| `trade_coalition_defeat_01` | You took this round. The ledger stays. I collect at the next settle. | You won this deal. But the ledger stays open. I'll collect at the next settlement. |
| `trade_coalition_defeat_02` | I lost the hull. Not the claim. Lane tax comes later. | I may have lost my ship, but not my rights to this lane. The toll will be paid later. |
| `trade_coalition_defeat_03` | Today is red. The living opens the next contract. | Today's a loss on the books. Well, if I'm alive, there's always the next contract. |
| `trade_coalition_flee_01` | You showed your back. Flight is breach. It goes on the next bill. | Fleeing is a breach of contract. You'll be billed the penalty in full. |
| `trade_coalition_flee_02` | Run. When supply dies we settle. | Go on, then. The day your supplies run out, we'll settle up. |
| `black_market_defeat_01` | The deal broke. I leave only shade. I pay this back on the next run. | Deal's off. I'll vanish without a trace. I'll square this debt on the next run. |
| `black_market_defeat_02` | I dumped the hull. Not the name. The market opens again. | Ships can be replaced. My reputation can't. The market will open again. |
| `black_market_defeat_03` | You had it today. I lay the cloak again. | You were a step ahead this time. I'll just put the cloak back up. |
| `black_market_flee_01` | You hid your back. I erase the lane. I latch on again. | Hiding won't help. I'll wipe the lane logs myself and pick you up again. |
| `black_market_flee_02` | Flight has a price. I stop you from the shade. | Running has its price. I'll cut you off again from the shadows. |
| `unknown_defeat_01` | The gate shut first. I remain. The abyss waits. | The gate closed first... but I do not vanish. The abyss waits. It always waits. |
| `unknown_defeat_02` | You punched through today. The coordinates do not erase. | You pierced through this time. But those coordinates can never be erased. |
| `unknown_defeat_03` | I lost the hull. Not the door. I open it again. | I have lost the shell. But the door remains with me. It will open again. |
| `unknown_flee_01` | You showed your back. The abyss remembers the rear. | You turn away. The abyss will remember the sight of your back. |
| `unknown_flee_02` | Flight is brief. I stop you at the gate. | Your flight is only for a moment. We will meet again before the gate. |
| `dark_lords_defeat_01` | The keep shook first. I remain. Night falls again. | My citadel faltered first, a disgrace. But I do not fall. Night will descend again. |
| `dark_lords_defeat_02` | You had it today. The black night waits. So do I. | I yield to you today. The long night is in no hurry. Nor am I. |
| `dark_lords_defeat_03` | I lost the hull. Not the throne. I encircle you next. | One ship is nothing. The throne remains mine. Next time, I will surround you on all sides. |
| `dark_lords_flee_01` | You showed your back. Night is long. I stop you at the keep. | You turn your back? The night is long. I will hold you fast before my citadel. |
| `dark_lords_flee_02` | Flight is a stay. I end it next. | Fleeing merely postpones the end. We will finish this another time. |
| `ancients_defeat_01` | I did not think the core would cool first. Watch continues. The throne remains. | I did not foresee the core cooling first. Yet the watch does not end. The throne endures. |
| `ancients_defeat_02` | You had it today. Eternity is not one round. | Today is yours. But eternity is not decided by a single battle. |
| `ancients_defeat_03` | I lost the hull. Not the door. I shut it again. | The vessel is lost, but the door is still ours. When the time comes, it will close again. |
| `ancients_flee_01` | You showed your back. The throne waits. The lane stops again. | You withdraw. The throne will wait, and the lanes will fall silent once more. |
| `ancients_flee_02` | Flight is brief. I stop you at the core. | You can evade us only for a while. We will face each other again before the core. |

---

## 5. 퀘스트 목표 대사 — 187행 (2차 작업)

`tables/content/story_scene_pages.csv` 에서 같은 「단문 3연속」 틀이 **187행** 걸린다. v2.0 재작성 이후 추가됐거나 범위 밖이었던 **목표 달성 대사**(`story_dialog_obj_*`)가 대부분이다.

| 계열 | 행수 |
|---|---|
| 메인 목표 대사 `story_dialog_obj_story_*` | 95 |
| 서브 목표 대사 `story_dialog_obj_s*` | 38 |
| 서브퀘 NPC `npc_dialog_sq_*` | 33 |
| 메인 장면 `story_dialog_story_*` | 16 |
| 기타 · 일반 NPC | 5 |

**김팀장 적용 (2026-10-01)**: §5-3 187행 `text`/`text_en` 전량 교체. §5-2 5행은 미션 정본으로 뜻을 확정한 뒤 넣었다.

### 5-1. 표본 재작성 — 뜻이 분명한 6행

| scene | 화자 | 기존 | 대체 |
|---|---|---|---|
| `npc_dialog_vega_blue_10` | 베가 블루 10 | 정찰 증원이다. / 위치는 길게 알리지 않는다. / 잠시면 사라질 거다. | **정찰 지원 왔다. 위치가 오래 드러나면 곤란하니, 잠깐 있다가 빠지겠다.** |
| `story_dialog_obj_story_012_d` | 엘렌 드 코르 | 넷이 정식으로 한 편이다. / 관문 순찰대는 여기서 빠진다. / 기록은 남기지 않는다. | **이제 넷이 정식으로 한편이야. 관문 순찰대는 여기서 빠지고, 이 일은 기록에 남기지 않는다.** |
| `story_dialog_obj_story_014_e` | 닉스 홀름 | 다음 초대가 온다. / 세렌 쪽 채널이다. / 함정인지 기회인지는 너희가 가린다. | **세렌 쪽 채널로 또 초대가 올 거다. 함정인지 기회인지는 너희가 판단해.** |
| `story_dialog_obj_story_023_c` | 가온 텔라 | 에덴은 치지 않는다. / 아직이다. / 지도는 유지한다. | **에덴은 아직 치지 않는다. 지금은 전선 지도를 그대로 지키는 게 먼저다.** |
| `story_dialog_obj_s063_d` | 토마 케일 | 봉투는 받았다. / 속은 열지 않았다. / 봉인이 인수의 전부다. | **봉투는 받았지만 열어 보진 않았어. 확인한 건 봉인이 멀쩡하다는 것뿐이야.** |
| `npc_dialog_sq_peck_sorin` | 펙 소린 | 페가수스에서 훔친 통신 대역을 기록한다. / 나는 그 칸만 지킨다. / 이름은 올리지 않는다. | **페가수스에서 빼돌린 통신 대역을 기록하는 게 내 일이야. 그 칸만 지킬 뿐, 누구 이름도 올리지 않아.** |

### 5-2. 문맥 확인이 필요한 5행 — 추측으로 고치지 않음

| scene | 화자 | 기존 | 막히는 지점 |
|---|---|---|---|
| `story_dialog_obj_story_008_c` | 다렐 소사 | **확정** — `story_008` 합류 순서 = 카일·미라·가온, 아이언부터. EN의 fire/ledger는 폐기 |
| `story_dialog_obj_story_017_e` | 미라 솅크 | **확정** — 「세 줄」= 거점 자금 정산 3건 |
| `story_dialog_obj_story_020_c` | 가온 텔라 | **확정** — 배신 소문 자체가 이간책 |
| `story_dialog_obj_story_029_b` | 미라 솅크 | **확정** — 「산다」= 서명 없는 선서문이 살아남음 (구매 아님) |
| `story_dialog_obj_s059_e` | 펙 소린 | **확정** — 복사된 통신 주파수는 주인 목소리가 아님. 「대역」→「주파수」 |

### 5-3. 2차 작업 대상 전체 목록 (187행 · `sceneId#page`)

**메인 목표 대사 — 95행**
`story_dialog_obj_story_002_d#1` · `003_a#0` · `003_b#0` · `004_b#0` · `006_c#0` · `007_a#0` · `007_a#1` · `007_b#0` · `007_e#0` · `008_a#0` · `008_c#0` · `008_d#0` · `009_b#0` · `009_b#1` · `009_d#0` · `009_d#1` · `010_b#0` · `010_d#1` · `010_e#0` · `011_a#0` · `011_a#1` · `011_e#0` · `012_a#0` · `012_b#0` · `012_d#1` · `012_e#0` · `013_b#0` · `013_c#1` · `013_d#0` · `013_e#0` · `013_e#1` · `014_a#0` · `014_b#0` · `014_b#1` · `014_c#0` · `014_c#1` · `014_e#0` · `014_e#1` · `015_b#0` · `015_b#1` · `015_e#0` · `015_e#1` · `016_c#0` · `016_e#0` · `016_e#1` · `017_a#0` · `017_a#1` · `017_b#1` · `017_d#0` · `017_d#1` · `017_e#0` · `018_a#0` · `018_b#0` · `018_c#0` · `018_d#1` · `018_e#0` · `019_a#0` · `019_b#0` · `019_c#0` · `019_c#1` · `019_d#0` · `019_d#1` · `020_a#0` · `020_c#0` · `020_c#1` · `020_d#0` · `021_a#0` · `021_c#0` · `021_d#0` · `021_e#0` · `022_a#0` · `022_b#0` · `022_c#0` · `022_c#1` · `022_d#0` · `022_e#0` · `023_b#1` · `023_c#0` · `024_b#0` · `024_c#0` · `025_b#0` · `025_b#1` · `025_c#0` · `026_a#0` · `026_b#0` · `026_c#0` · `027_a#0` · `027_b#0` · `029_a#0` · `029_b#0` · `029_c#0` · `030_a#0` · `030_b#0` · `030_c#0` · `030_c#1`
(접두 `story_dialog_obj_story_` 생략)

**서브 목표 대사 — 38행**
`s034_c#0` · `s034_e#0` · `s034_e#1` · `s035_a#1` · `s035_c#1` · `s036_d#1` · `s056_a#0` · `s056_c#0` · `s056_c#1` · `s056_e#0` · `s057_a#1` · `s057_c#0` · `s057_e#0` · `s058_a#0` · `s058_a#1` · `s058_c#0` · `s058_e#0` · `s059_a#0` · `s059_a#1` · `s059_c#0` · `s059_e#0` · `s060_c#0` · `s060_d#0` · `s060_d#1` · `s060_e#0` · `s061_c#0` · `s061_d#0` · `s061_d#1` · `s061_e#0` · `s062_c#0` · `s062_d#0` · `s062_d#1` · `s062_e#0` · `s063_a#1` · `s063_c#0` · `s063_d#0` · `s063_d#1` · `s063_e#0`
(접두 `story_dialog_obj_` 생략)

**서브퀘 NPC — 33행**
`kett_mion#0` · `ren_coil#0` · `ren_coil#2` · `maya_belt#0` · `maya_belt#2` · `jor_finn#0` · `jor_finn#2` · `sel_vane#0` · `sel_vane#2` · `has_quinn#0` · `has_quinn#2` · `iva_wren#0` · `iva_wren#2` · `peck_sorin#0` · `peck_sorin#2` · `dain_rho#0` · `dain_rho#2` · `mir_kell#0` · `mir_kell#2` · `osa_pell#0` · `osa_pell#2` · `brin_tack#0` · `brin_tack#2` · `nell_kay#0` · `nell_kay#2` · `kael_vonn#0` · `kael_vonn#2` · `sira_mek#0` · `sira_mek#2` · `ev_holt#0` · `ev_holt#2` · `toma_kale#0` · `toma_kale#2`
(접두 `npc_dialog_sq_` 생략)

**메인 장면 — 16행**
`story_dialog_story_003#0` · `004#0` · `007#0` · `012#0` · `013#0` · `014#0` · `015#0` · `017#0` · `019#0` · `021#0` · `022#0` · `024#0` · `026#0` · `029#0` · `030#0` · `030#1`

**기타 — 5행**
`mission_clear_mission_002#0` · `story_chapter_end_01#1` · `story_chapter_end_01#3` · `npc_dialog_vega_blue_10#0` · `npc_dialog_story_gaon_tela#0`

---

## 6. 적용 절차 (김팀장)

1. `tables/balance/transit_combat_end_dialog.csv` 의 `lineKo` · `lineEn` 55행을 §4 대체문으로 교체
   - 모든 행이 **이미 큰따옴표로 감싸져 있다** — 쉼표가 들어가도 안전. 대체문에 **큰따옴표 0개** 확인 완료
   - `id` · `kind` · `factionId` · `captainId` · `notesKo` 열은 **그대로**
2. 생성물 `src/data/balance/generated/csvTransitCombatEndDialog.ts` 갱신 — 해당 테이블만
3. `src/game/transitCombat/resolveTransitCombatEndDialog.test.ts` 실행 — id·팩션 매칭 계약이 깨지지 않는지
4. 실기: 드라코 이동 중 해적 격파 → 대사창 3줄 안에 들어오는지 · 줄바꿈 위치가 어색하지 않은지

**§5 적용 완료 (2026-10-01).** `story_scene_pages.csv` 187행 + `csvStoryScenes.ts` 재생성. 패치 정본=`tools/content-tables/_naturalness-patch-b1.json`~`b4.json`.

---

## 7. 한계

- **줄바꿈은 단어 단위 시뮬레이션**이다(21자 · 공백 기준). 실제 렌더러는 글리프 폭(`charWidthPx 12.7`)으로 자르므로, 영문·숫자가 섞인 행은 실기 확인이 필요하다. 이번 55행은 전부 한글 위주라 오차가 작다.
- 전투 종료 대사는 **`captainId` 가 비어 있는 팩션 기본값**이라 성별 중립으로 썼다. 특정 함장 전용 대사가 추가되면 앞선 성별 말투 기준(`QUEST_DIALOGUE_REWRITE_PROPOSAL.md` §13)을 따른다.
- 바·스텔라 대사는 기계 지표가 낮아 이번에 **보지 않았다.** 지표에 안 걸리는 다른 어색함(허공 지시대명사 등)이 있을 수는 있다.
- 레퍼런스 작품의 **문장을 가져오지 않았다** — 어조와 호흡만 참고했다.

---

**김클로드는 대사만 썼다** — CSV·코드 변경 0 · 커밋 0.
