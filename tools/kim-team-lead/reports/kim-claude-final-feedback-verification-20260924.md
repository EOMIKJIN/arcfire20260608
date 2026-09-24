# 김팀장 피드백 반영 최종 전수 검증

```text
status=REVIEWED
verdict=PASS (반영 14 · 의도적 보류 1 · 미반영 3)
date=2026-09-24
reviewer=김클로드
대상=이상현상 15건(F-1~F-15) · 최근작업 스윕 S-1 · Voronoi 국경선 · 대사 집필 가이드 진입점
방법=주장이 아닌 실제 코드·CSV 대조
```

---

## 0. 결론

**차단 사유 없음.** 지적 18건 중 **14건 반영 · 1건 의도적 보류(문서화) · 3건 미반영(전부 P3·문서)**.

| 검증 | 결과 |
|---|---|
| 관련 테스트 8종 | ✅ **전부 PASS** |
| `tsc --noEmit -p tsconfig.client.json` | ✅ **EXIT=0** |

---

## 1. 이상현상 15건

| # | 지적 | 상태 | 확인 근거 |
|---|---|---|---|
| **F-1** | payloadKind `'relic'` 하드코딩 | 🟡 **의도적 보류·문서화** | `watch:104` 유지. 단 `unidentifiedAnomalyTestPolicy.ts:4`에 **「본선 스폰(일 2회·TTL 12h·50:50)은 아직 미승격」** 명시 |
| **F-2** | 정책 CSV 스폰 계열 미적용 | ✅ **반영** | `notesKo`에 **「(미적용 · 본선 스폰 승격 시 사용)」** 전건 명시. `history_cap`은 「코드 상수와 동기 · CSV 직접 소비 아님」으로 별도 정확히 기술 |
| **F-3** | 「본선 미착수」 주석 불일치 | ✅ **반영** | 「연구원·수색·유물 본선은 적용. 스폰은 30분/10분 로테이션」으로 정정 |
| **F-4** | 목표 설명문 하드코딩 | ✅ **반영** | `unidentifiedAnomalyResolver.ts`에서 `description` 리터럴 **0건** |
| **F-5** | `isAnomalyResearcherVisibleOnPlanet` 죽은 export | ❌ **미반영** | 여전히 호출처 0건(정의 1건뿐) |
| **F-6** | 유물 효과 해제 경로 없음 | ✅ **반영** | `onQuestRelicLost` 신설 + **`settleAnomalyEvent.ts:39`에서 실제 호출** |
| **F-7** | abandon이 'expired'로 기록 | ✅ **자연 소멸** | F-14가 행을 삭제하게 바뀌어 status 기록 자체가 사라짐 |
| **F-8** | 콜백이 present 실패 시 잔존 | ✅ **반영** | `if (presented) { registerIngameDialogCallback(...) }`로 이동 |
| **F-9** | 연구원 첫 대사 화자 소개 없음 | ✅ **반영** | 「잔해 신호는 읽힌다」 → **「이상현상 조사반이다.」** |
| **F-10** | 「슬롯」 개발 용어 | ✅ **반영** | 「슬롯은 즉시 비운다」 → **「이 건은 즉시 닫힌다」** |
| **F-11** | 「조사권」 초출 미설명 | ✅ **반영** | 「조사권을 넘긴다」 → **「조사를 맡기겠다」** |
| **F-12** | 캐릭터 목소리 축 부재 | 🟡 **미반영(타당)** | 성별 로스터 확정 전이라 보류가 맞다 |
| **F-13** | `arc_anom_*` progress 영구 누적 | ✅ **완전 반영** | `pruneSettledUnidentifiedAnomalyProgresses.ts` **신규 모듈 + 전용 테스트** + `missionStore.ts:600`(로드) · `:726`(런타임) **2곳 배선** |
| **F-14** | `closeAnomalyMission` status 인자 무시 | ✅ **근본 해결** | 행을 `failed` 표시가 아니라 **`delete nextProgresses[missionId]`로 삭제**. 파라미터는 `_status`로 **명시적 미사용 표기** |
| **F-15** | `recentResolved` write-only | ✅ **반영** | `cooldown_days` notes에 「(미적용 · 본선 스폰 승격 시 사용)」 명시 |

### F-1 판정 보충

내 권고는 「한 줄 빼면 50:50이 산다」였으나, 김팀장은 **「스폰 계층 승격 때 함께」**로 판단하고 주석에 명시했다. **이 판단이 더 맞다** — payloadKind만 먼저 풀면 TTL·일 2회·쿨다운이 빠진 채 threat가 나와 반쪽 상태가 된다. **F-2·F-3와 한 덩어리로 묶은 처리가 일관적이다.**

---

## 2. 최근작업 스윕 S-1

| 지적 | 상태 | 근거 |
|---|---|---|
| `arcCorePlanetAttackLevelPolicy` 전체 미배선 | ✅ **반영(명시)** | 파일 헤더에 **「기반작업 · inert」** + **「아직 어떤 런타임 경로도 본 모듈을 호출하지 않는다(동작 변화 없음)」** 추가. `ARC_ATTACK_SAFETY` 클램프 근거도 기술 |

`void getArcCorePlanetAttackLevelPolicy(BASELINE)` 자체는 유지됐으나, **왜 버리는지 헤더가 답한다.** 내가 제시한 두 선택지 중 「명시」를 택한 것으로 타당하다.

---

## 3. Voronoi 국경선 — 완전 반영

| 설계(§8-4) | 반영 |
|---|---|
| 좌표 기반 `edgeKey` 짝짓기 폐기 | ✅ `buildGalaxyBlueRedVoronoiBorders.ts`에서 **`edgeKey` 0건** |
| Delaunay 이웃 쌍으로 짝짓기 | ✅ **`:114 for (const j of delaunay.neighbors(i))`** |
| 구간 ∩ 원(i) ∩ 원(j) 대칭 절단 | ✅ **`clipGalaxyVoronoiBisectorToInfluenceDisks.ts` 신규 + 전용 테스트** |

**대표님이 지적하신 「성계가 확실히 있는 쪽은 그려야 한다」가 구조적으로 해결됐다.** 좌표 비교가 사라져 비대칭 절단이 원천적으로 불가능해졌다.

---

## 4. ❌ 미반영 3건

| # | 내용 | 등급 | 판단 |
|---|---|---|---|
| **F-5** | `isAnomalyResearcherVisibleOnPlanet` 호출처 0 | P3 | 쓰거나 지울 것. 기능 영향 없음 |
| **F-12** | 연구원 캐릭터 목소리 축 | P3 | **성별 로스터 확정 후가 맞다.** 지금 보류가 타당 |
| **가이드 진입점** | `CLAUDE.md`에 `QUEST_DIALOGUE_AUTHORING_GUIDE.md` 한 줄 | — | **가이드가 진입점에서 안 보이면 지켜지지 않는다.** 재요청 |

---

## 5. 신규 관찰 1건 (P3)

`closeAnomalyMission(missionId: string, status: 'failed' | 'expired')` — 구현부가 `_status`로 미사용을 명시했으므로 **타입 시그니처의 `status`도 정리 대상**이다. 호출측(`settleAnomalyEvent.ts:51`)은 여전히 `reason === 'failed' ? 'failed' : 'expired'`를 계산해 넘긴다. **계산해서 버리는 값**이라 지금은 무해하나, 다음 정리 때 시그니처와 함께 제거하면 깔끔하다.

---

## 6. 총평

**품질이 높다.** 특히 세 가지가 좋았다.

1. **F-13을 표면 처방이 아니라 구조로 풀었다** — 상한을 거는 대신 **행 자체를 삭제**하고, 별도 모듈 + 전용 테스트 + **로드·런타임 2곳 배선**까지 했다. F-14가 덤으로 해결됐다.
2. **F-1·F-2·F-3을 한 덩어리로 묶었다** — 개별 대응하지 않고 **「스폰 계층은 미승격」이라는 하나의 결정**으로 정리해 CSV·주석·코드가 같은 이야기를 한다. 내 원권고보다 낫다.
3. **Voronoi를 설계대로 구조 교체했다** — 좌표 짝짓기를 패치하지 않고 **폐기**한 뒤 이웃 쌍 + 대칭 절단으로 갈아탔다.

미반영 3건은 전부 P3·문서라 **차단 사유 없음.**

---

**김클로드는 읽기만 했다** — 코드·CSV 변경 0 · 커밋 0. 테스트·빌드는 검증 목적 실행.
