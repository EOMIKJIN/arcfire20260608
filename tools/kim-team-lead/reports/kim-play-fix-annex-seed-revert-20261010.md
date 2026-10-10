# 긴급 수정 — 스텔리움 편입(블루)이 앱 재시작 시 원래 국가(레드)로 되돌려지던 버그 (김플레이 · 2026-10-10)

대표님 보고(13:0x): 페르세우스를 점유한 뒤 스텔리움 연합으로 편입하고 체류 중이었는데, 크림슨 레기온 점유로 바뀌었다. 체류 중에는 분쟁 판정이 실제 전투로 이어지고, 패배했을 때만 점유가 바뀌어야 한다.

## 1. 원인 (로그 + 코드로 확정)

| 시각 | 사건 | 근거 |
|---|---|---|
| 12:23:16 | 페르세우스 착륙 → 웨이브 방어전 | `[PLAY_VERB] land` · `동적 분쟁지역 편입 source=player_wave_defense` |
| 12:26:46 | 웨이브 승리 후 **편입 → 블루** | `[PLAY_VERB] annex perseus_memorial` |
| 12:27:08 | 페르세우스 동적 분쟁지역에서 강등 | `[territorial] 동적 분쟁지역 강등` |
| 12:27~12:53 | 블루로 체류 · 페르세우스 분쟁 판정(`pass`) **0건** | logcat |
| 12:54:16 | 앱 종료(최근 앱 스와이프) | exit-info `USER REQUESTED / REMOVE TASK` |
| 12:54:51 | 재시작 → 처음부터 **레드** | `[stelliumColonize] skip perseus_memorial: red_seed` |

- **분쟁 판정이 체류를 건너뛴 것이 아니다.** 체류 중 페르세우스를 다룬 영토 판정은 없었다.
- 편입은 즉시 AsyncStorage에 저장됐다(`clanWarFoundationStore.ts` `persistClanWarFoundation`). 하지만 부팅 hydrate의 CSV 시드 복구(`seedPlanetOccupationFromBalance.ts` `shouldRestoreNationSeedOccupier`)가 「분쟁지역이 아닌 행성 + 점유가 시드 국가와 다름 → 시드로 복구」 규칙으로 블루를 레드로 되돌렸다.
- 플레이어 전투 **중립화**는 `neutralizedAt` 마커로 보호되지만, 플레이어 **편입(블루)**은 보호 장치가 없었다. 편입한 다른 행성도 재시작할 때마다 같은 피해를 입는다.

## 2. 수정 (미커밋)
| 파일 | 내용 |
|---|---|
| `src/types/index.ts` | `occupationOrigin`에 `'player_annex'` 추가 |
| `src/store/clanWarFoundationStore.ts` | 편입(`source=player_stellium_annex` · BLUE) hold에 `occupationOrigin:'player_annex'` 표시 · 부팅 hydrate에 소급 수리 연결(dev 로그 `[territorial] 편입 hold 소급 복원`) |
| `src/arcCore/balance/seedPlanetOccupationFromBalance.ts` | `player_annex` hold는 시드 복구 대상에서 제외(`player_colonize`와 같은 방식) |
| `src/clanWar/planetOccupationSeedPipeline.ts` | `repairPlayerAnnexHoldsFromOperations` — 행성의 **가장 최근 작전**이 플레이어 편입(BLUE)인데 현재 국가 시드 hold로 돌아가 있으면 BLUE로 복원. 편입 뒤 실제 영토 작전(더 최신 기록)으로 바뀐 경우는 보존 |
| `src/arcCore/balance/seedPlanetOccupationFromBalance.test.ts` | 회귀 테스트 3건(마커 보호 · 소급 복원 + 재실행 불변 · 이후 함락은 보존) |

## 3. 검증
- 테스트: 시드 18건 PASS(신규 3건 포함) · planetHoldReleasePolicy PASS · stelliumAnnexEligibility PASS · tsc exit 0.
- 실기(개발 빌드 · Metro): 재시작 부팅 로그 `[territorial] 편입 hold 소급 복원: perseus_memorial` → 이후 `[stelliumColonize] skip perseus_memorial: already_blue`. **대표님의 페르세우스가 블루로 복원됐다.**

## 4. 원칙 확인(대표님 질의)
- 「체류 중 분쟁 → 실제 전투 → 패배 시에만 점유 변경」 원칙을 위반한 판정은 이번 로그에서 발견되지 않았다. 이번 건은 판정이 아니라 재시작 복원 경로의 버그다.
- 체류 보호 경로 자체의 전수 재검증은 별도 항목으로 남긴다(필요 시 다음 작업).
