# 조선소 > 업그레이드 화면 UI 스펙 v1.0
> 작성: 2026-06-18 | 컴포넌트: ShipyardMineralUpgradeTab

---

## 1. 화면 진입 경로
```
행성 허브 → 조선소(Modal) → [업그레이드] 탭 탭
```

---

## 2. 화면 구성 (위→아래 순서)

### A. 탑바
- 뒤로가기(‹) → 조선소 메인 탭으로
- 제목: "전함 업그레이드"
- 우측 뱃지: "파일럿 Lv.N · 최대 M강" (`resolveMineralUpgradeMaxLevel` 반환값)

### B. 보유 전함 카드
- 전함 아이콘 + 이름 + 체급 표시
- 현재 스탯 3종 인라인 표시 (HP / 실드 / DPS)
- 데이터: `player.hangar.equippedShip` + CSV 스탯

### C. 강화 슬롯 선택 (수평 스크롤)
5개 슬롯 탭 — 선체 장갑 / 실드 셀 / 엔진 코어 / 무기 모드 / 에너지
- 각 슬롯: 아이콘 + 라벨 + 현재 강화 레벨 ("2강" / "미강화")
- 상태 색상:
  - 선택됨(active): Info 배경
  - 0강 이상 완료: Success 배경
  - 미강화: 기본

### D. 업그레이드 목표 카드
- 헤더: "{슬롯명} 강화" + "N강 → N+1강" 뱃지
- 스탯 미리보기: 현재값 → 업그레이드 후 값 + "+X%" 뱃지
- 공식: `newVal = round(base × (1 + bonusPct × nextLv / 100))`

### E. 필요 재료 목록
광물 2종 행(行) 표시:
- 광물 이름 + 색상 도트
- "필요 N개" 라벨
- 보유 N개 (충족: 초록 / 부족: 빨강)
- 체크(✓) / 엑스(✗) 아이콘
- 행 배경: 충족 시 Success / 부족 시 Danger

### F. 진행 단계 바
- "N / MAX강 완료" 텍스트
- 프로그레스 바 (currentLv / MAX_CAP)
- 단계 점(dots): MAX_CAP 개수 — 완료=초록, 미완=회색, 캡 경계(6~8강)=주황

### G. 업그레이드 버튼
| 상태 | 텍스트 | 스타일 |
|------|--------|--------|
| 재료 부족 | "재료 부족 — 업그레이드 불가" | 비활성(회색) |
| 재료 충족 | "업그레이드 실행 — N강 → N+1강" | 활성(파랑) |
| 캡 도달 | "최대 강화 완료 (캡 도달)" | 비활성 |

---

## 3. 진행 중 오버레이 (업그레이드 버튼 탭 후)

D~G 영역 숨김 → 진행 오버레이 표시:
- 원형 프로그레스 링 (0→100%, ~3초)
- 단계별 메시지 텍스트 (예: "나노 코팅 레이어 적용 중...")
- 완료 시 → 완료 오버레이로 전환

---

## 4. 완료 오버레이

- 체크 아이콘 (Success 색)
- 제목: "{슬롯명} {N}강 완료!"
- 스탯 비교: 구 값 → 신 값 + "+X%" 뱃지
- [다음 단계 강화하기 (N강 → N+1강)] 버튼
  - 캡 도달 시: "최대 강화 완료 — 다른 슬롯 강화하기"

---

## 5. 상태 전이

```
[input 상태]
  슬롯 선택 → 재료 확인 → 버튼 활성/비활성
  버튼 탭(재료 충족) ──→ [progressing 상태]
                              링 애니메이션 3초
                              ──→ [complete 상태]
                                    재료 차감 / 슬롯 레벨 +1
                                    "다음 강화" 탭 ──→ [input 상태]
```

---

## 6. 재료 수량 공식

```typescript
// N강에 필요한 총 수량 (5N-2)
function getRequiredQty(nextLevel: number): number {
  return 5 * nextLevel - 2;
}
// 광물 A (주재료): round(총수량 × 0.6)
// 광물 B (부재료): round(총수량 × 0.4)
```

| 강화 단계 | 총 필요 | 주재료(60%) | 부재료(40%) |
|---------|--------|-----------|-----------|
| 1강 | 3 | 2 | 1 |
| 3강 | 13 | 8 | 5 |
| 5강 | 23 | 14 | 9 |
| 8강 | 38 | 23 | 15 |

---

## 7. 구현 파일

| 역할 | 파일 경로 |
|------|---------|
| 탭 컴포넌트 | `src/components/shipyard/ShipyardMineralUpgradeTab.tsx` |
| 업그레이드 로직 | `src/game/shipyardMineralUpgrade/mineralUpgradeModel.ts` |
| 스탯 적용 | `src/combat/ShipPerformanceCalculator.ts` → `applyMineralUpgradeToShipPerformance` |
| 캡 테이블 | `tables/content/mineral_upgrade_level_caps.csv` |
| 슬롯 정책 | `tables/balance/mineral_upgrade_policy.csv` (신규) |
| 재료 매핑 | `tables/balance/mineral_ship_tier_access.csv` (신규) |

---

## 8. 주의사항

- `Modal.present()` 오버레이 — Hub rAF 루프 유지 (언마운트 금지)
- 완료 시 `player.mineralUpgrades` → `arcfire_player_v1` 단발 저장
- 캡 초과 강화 시도 → 서버/로컬 양쪽 차단 (UI 비활성만으로 부족)
- 스탯은 `ShipPerformanceCalculator` 경유로만 반영 (직접 수정 금지)
