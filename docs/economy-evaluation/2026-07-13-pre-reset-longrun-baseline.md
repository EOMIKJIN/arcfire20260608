# 2026-07-13 — 완전초기화 전 최장기 계정플레이 베이스라인 (비교 분석용)

> **목적**: 2026-06-14 ~ 2026-07-13 (약 29일) 최장기 계정 운용 사이클의 최종 상태를 기록한다.
> 완전초기화 후 재테스트 시 본 문서와 **동일 항목·동일 측정 방법**으로 비교 분석한다.
> **작성**: 김팀장 · 초기화 직전 스냅샷

---

## 1. 운용 기간·데이터 규모

| 항목 | 값 |
|---|---|
| 관측 기간 | 2026-06-14 14:11 ~ 2026-07-13 13:23 (KST) — 약 **29일** |
| mem-timeline 샘플 | **16,434행** (`tools/long-run-monitor/logs/mem-timeline.csv`) |
| balance-ops 학습 스냅샷 | 다수 누적 (`tools/balance-ops-audit/reports/learning-state.json`, 최종 2026-07-09) |
| retention audit close 이벤트 | 183건 감사 (2026-07-13 04:20 UTC 기준) |

## 2. 계정 진행 스냅샷 (Firestore 정본 · uid `519f756a7517ac11` 「엄스」)

> Firestore는 단발성 sync이므로 로컬 기기 상태가 더 최신일 수 있음. 초기화 직전 기준값으로 사용.

| 항목 | 값 |
|---|---|
| 레벨 / EXP | **Lv 11** / 95,101 |
| 크레딧 | 2,252 CR |
| 스킬 포인트 | 7 |
| 기함 | 기본전함 파이터 Mk.I |
| 직업 | `prof_striker` |
| 방문 행성 (planetCoreRuntime) | `arcadia_prime` · `minerva_deep` · `solar_station` · `synth_002_p` (4곳) |

**섀도우 페어링**: 본 계정은 ArcCore 섀도우 페어링 완료 상태(테스트 유저와 1:1). 설계상 **계정 초기화에도 페어링·`arcCoreShadowIdentityStore`는 유지**됨 (`arcfire-shadow-pairing-amendment.mdc`). 초기화 테스트에서 페어링 유지 여부를 검증 항목에 포함할 것.

## 3. 경제·밸런스 최종 상태 (balance-ops 2026-07-09)

| 지표 | 값 | 판정 |
|---|---|---|
| overall | **WARN** | fiscal warn 기인 |
| Whale/F2P power ratio | **3.12** | ok (기준 <5) |
| planet fiscal | max fee/upkeep **3×** · gini **0.288** | WARN — `monitor_fiscal_closed_loop` 권장 |
| price_elasticity | 0 (실시간 변동 없음) | 계약 준수 |
| 일일 배치 계약 (12:00 KST) | 위반 0 | PASS |
| SIM deltaId | `2026-07-02-1782976813591` | — |
| warnBandCount | 4 | 지속 관측 대상 |

**추이 메모**: whaleF2pRatio는 6월 중순 3.48 → 7월 초 3.12로 완만 개선. planet fiscal WARN(gini 0.288)은 6월 말부터 고정 관측 — 초기화 후 재축적 시 gini 추이가 핵심 비교점.

## 4. 메모리·안정성 최종 상태

### 4-1. mem-timeline 최근 200샘플 (2026-07-13 기준)

| 지표 | min / avg / max (MB) |
|---|---|
| PSS | 181.4 / **737.4** / 943.9 |
| GL mtrack | 5.9 / **45.8** / 147.9 |

### 4-2. retention audit (2026-07-13 04:20 UTC · verdict **FAIL**)

| status | 건수 |
|---|---|
| RETENTION_FAIL | **27** |
| PASS | 14 |
| INSUFFICIENT_SAMPLES | 142 |

- **대표 FAIL 패턴**: `NATIVE_FLOOR_UP +165.1MB` — 07-10 저녁 `galaxy_map`/`planet_hub` route_blur 이후 native_heap 392→557MB 미복구 (동일 세션 반복 관측).
- 장기 세션에서 **native_heap floor 누적 상승**이 최우선 잔존 이슈. 초기화 후 신규 사이클에서 같은 경로(worldmap 왕복)로 재현 여부 비교 필수.

## 5. 이번 사이클 중 주요 개발·변경 (비교 시 감안)

| 시기 | 변경 |
|---|---|
| 6월 중순 | Skia GL 헌법 도입 · STAGE dispose 계약 정착 · 일일 배치(12:00) 통합 |
| 7월 초 | 페라이트 10CR 앵커 3단계 분석(CONDITIONAL_KEEP) · 행성 소유권 item_defs 단일 정본 |
| 7월 중순 | 주점 인스턴스 미션 난이도(EASY~EXPERT)·보상 재조정 · trade_ 함선 이미지 규칙 · **ArcCore 섀도우 페어링 + 복제 플레이어 전함 보스** (`eternal_throne`) |

## 6. 다음 초기화 테스트 — 비교 체크리스트

1. **경제**: 신규 계정 Lv 11 도달 시점의 CR·whaleF2pRatio·planet fiscal gini를 본 문서 §3과 비교.
2. **메모리**: 동일 플레이 패턴(허브↔worldmap 왕복·전투) 후 PSS floor·native_heap floor를 §4-1과 비교 — `NATIVE_FLOOR_UP` 재현 여부가 핵심.
3. **섀도우 페어링**: 계정 초기화 후 페어링·닉네임 공개·복제 보스 스냅샷이 유지되는지 검증 (설계: 유지).
4. **일일 배치**: 12:00 KST 배치 1회 실행·globalEngageHpMul 보정폭(±0.025~0.05, 캡 0.7~1.3) 준수 재확인.
5. **측정 방법 고정**: `npm run monitor:ensure-always-on` + `audit:balance-ops` + `audit:memory:retention` — 본 문서와 동일 도구·동일 임계값 사용.

---
정본 데이터 위치: `tools/long-run-monitor/logs/mem-timeline.csv` · `tools/balance-ops-audit/reports/learning-state.json` · `tools/memory-profiler/reports/latest-retention-audit.md`
