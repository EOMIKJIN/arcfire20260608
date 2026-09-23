# 구글 플레이 인앱상점(현금구매) — 관련실 연동 준비 설계 v1.0

```text
status=DESIGN_READY
version=1.0
date=2026-09-23
owner=김팀장
선행=김클로드 v0.1 초안 · 김팀장 PARTIAL 검수
code=미착수 (대표님 승인 + §10 결정 후)
[pss-pre-dev] hot_path=구매 탭 1회 (틱/루프 없음)
[pss-pre-dev] stage=오버레이만 · persist 코얼레스 · Stage3 상점 금지
[pss-pre-dev] verdict=PASS (설계) · 더미 지급 잔존은 실연동 전 제거
```

> **이 문서가 정본이다.** 경제 수치·금지의 상위 정본은 `docs/_000_ARCFIRE_BM_REPORT_v2.0.md`.  
> **관련실** = Play 콘솔·가맹·상품등록·라이선스 테스터·Data safety.  
> **김팀장** = 클라 배관·지급·멱등. **대표님** = 검증 방식·가격·1차 SKU 범위.  
> 코드·CSV 기존값(보석 수량·목업가)은 **재확인 없이 바꾸지 않는다.**

---

## 0. 한 줄

상점 UI·CSV 카탈로그는 이미 돈다. **현금이 오가는 배관은 0%**다. 관련실은 지금 **패키지명·SKU 표대로 콘솔 상품을 올릴 수 있다.** 클라 결제 SDK는 대표님 §10 결정 뒤에 붙인다. 스토어에 앱을 못 내면 결제는 무의미하다(§9).

---

## 1. 김클로드 v0.1 검수

| # | 초안 | 판정 | 조치 |
|---|---|---|---|
| 1 | 결제 라이브러리 0 · coming soon · 더미 증서만 | **AGREE** | 유지. `package.json` Expo 51 / RN 0.74.5 재확인 |
| 2 | 카탈로그·지갑·교환 UI 실동작 | **AGREE** | 유지. 교환(`exchange`)은 **현금 아님** — 관련실 상품 아님 |
| 3 | BM §9 영수증 없이 지급 금지 | **AGREE** | 옵션 C 폐기 |
| 4 | 권장 B(RevenueCat)만 | **PARTIAL** | B 유지 후보. **A2=기존 AWS Lambda 검증**도 헌법(Cloud Functions 없음)과 양립. 대표님 선택 |
| 5 | webhook 없으면 서버 0 | **PARTIAL** | B의 SDK `CustomerInfo`만으로도 검증 가능. webhook은 HTTPS 수신처가 필요(없으면 관련실이 열지 않음) |
| 6 | `addGems`에 바로 붙이면 됨 | **DISAGREE** | `addGems`는 persist/Firestore 없음. **검증된 토큰 전용 grant**를 새로 둔다 |
| 7 | `purchaseHistory` 재사용 | **DISAGREE** | 리포트 스키마만 있음. **플레이어 타입·스토어·동기화에 필드 없음** |
| 8 | 보석=`gems.balance` | **DISAGREE** | 실코드 `player.gems?: number` |
| 9 | VIP를 gem_pack과 한 표로 | **PARTIAL** | VIP는 `vip_tier_policy.csv`. 콘솔 타입=구독 |
| 10 | targetSdk 34 · API 36 기한 경과 | **AGREE** | Expo 51 미변경. 제출 게이트는 IAP와 **별축·선행** |

---

## 2. 현재 코드 실측 (연동 전제)

| 항목 | 사실 |
|---|---|
| 패키지 | `com.arcfire.online` · version `0.1.1` / versionCode 101 |
| IAP SDK | **없음** |
| premium 탭 | `handlePremiumAction` — 증서 외 **coming soon** |
| 증서 | `grantPlanetDeedPurchaseDummy()` — **결제 없이 1회 지급**. 실연동·라이선스 테스트 전 **제거/가드** |
| 보석 | 로컬 `player.gems` 숫자. `addGems`/`spendGems`는 **set만, persist 없음** |
| 교환 | `gemExchangeService` + 원장 — **관련실 IAP 아님** |
| Firestore | `users/{uid}` 단발. **gems·purchaseHistory 동기화 코드 없음** |
| 계정 초기화 | `purgeLocalAccountData` — 진행 리셋. **Play 구매는 환불되지 않음** → 복원(Restore) 필수 |
| Stage 3 | 전투 중 상점 Modal **금지** (v4.0 §14-11 · BM §9) |
| 헌법 | Cloud Functions 없음. NL용 **AWS Lambda는 이미 존재**(A2 근거) |

---

## 3. SKU 정본 — 관련실 콘솔 등록표

정본 CSV: `tables/balance/gem_pack_catalog.csv` · `vip_tier_policy.csv` · `bm_product_contents.csv`.  
**Play 상품 ID = CSV `productId` 그대로.** 새로 짓지 않는다.  
가격 열 `iapPriceKey=mock_*`는 **UI 목업**. 콘솔 가격은 아래 「의도 KRW」를 초안으로 올리되, **출시가는 대표님 확정 전 초안**으로 표시한다. CSV 보석 수량·보너스는 **기존값 — 수정 금지**.

### 3-1. 소비성 (Consumable · 반복 구매 · 지급 후 consume)

| productId | 의도 KRW | 지급(클라) | 비고 |
|---|---|---|---|
| `gem_pack_small` | 1,100 (`mock_099`) | 100💎 | |
| `gem_pack_medium` | 5,500 (`mock_499`) | 605💎 (550+10%) | |
| `gem_pack_large` | 11,000 (`mock_999`) | 1440💎 (1200+20%) | |
| `gem_pack_xlarge` | 55,000 (`mock_4999`) | 2600💎 (2000+30%) | 증서와 **동일 목업가** — 콘솔에서 이름 혼동 금지 |

### 3-2. 비소비성 (Non-consumable · 계정당 1회 · acknowledge)

| productId | 의도 KRW | 지급 | 클라 가드 |
|---|---|---|---|
| `starter_pack` | 5,500 | 250💎 + 25,000Cr + 장비(`bm_product_contents`) | 재구매 차단 |
| `season_pass_premium` | 16,500 | 시즌 유료 트랙만. **보석 0** | 시즌 만료 정책은 별도(트랙 코드) |
| `planet_deed_grant` | 55,000 | 개방 행성 1곳 소유권 | `planetDeedCashGrant` 1회. **더미 함수 제거 후** |

### 3-3. 구독 (Subscription · 30일 · 1차에서 빼도 콘솔에 초안만 올려도 됨)

| productId | 의도 KRW/30일 | dailyGemGrant | 비고 |
|---|---|---|---|
| `vip_basic` | 11,000 (`mock_999`) | 15 | 월 ≈450💎 |
| `vip_plus` | 22,000 (`mock_1999`) | 35 | |
| `vip_max` | 33,000 (`mock_2999`) | 60 | |

구독은 Play **구독 상품 + base plan(P1M)**. 인앱 일회성과 ID를 섞지 않는다.

### 3-4. 관련실이 등록하지 않는 것

`ex_gems_*` (보석→크레딧), 무역소 크레딧 상품, 웨이브 테스트 SKU. **현금 IAP 아님.**

---

## 4. 관련실 작업 패키지 (콘솔 · 코드 아님)

관련실은 아래를 **SDK 선택과 무관하게** 착수할 수 있다.

### 4-1. 계정·앱

| # | 작업 | 산출 |
|---|---|---|
| R1 | Play 콘솔 앱 `com.arcfire.online` 존재·권한 확인 | 앱 대시보드 URL |
| R2 | 가맹(판매자) 계정 연결 | 유료 상품 생성 가능 |
| R3 | Play 앱 서명 사용 여부 확인 | 업로드 키 ≠ 디버그 키 |
| R4 | 내부/비공개 테스트 트랙 1개 | 라이선스 테스터 APK/AAB 올릴 곳 |
| R5 | 라이선스 테스터 Gmail 목록 | 실금 없이 구매 테스트 |

### 4-2. 상품

| # | 작업 | 산출 |
|---|---|---|
| R6 | §3 표 전 SKU 등록 (활성, 가격 초안) | 콘솔 상품 목록 스크린샷 |
| R7 | 소비성 4종 = Consumable | 타입 오등록 시 복구 불가에 가깝 → 검수 |
| R8 | 스타터·시즌·증서 = Non-consumable | |
| R9 | VIP 3종 = Subscription P1M (1차에서 비활성이면 **초안 저장만**) | 대표님 §10-4 |
| R10 | 상품 이름/설명 한국어. 가격은 지역 자동 | CSV `notesKo` 참고. **원화 고정 문구를 앱 CSV에 넣지 않음** |

### 4-3. 정책·권한

| # | 작업 | 산출 |
|---|---|---|
| R11 | Data safety: 구매·금융 | 스토어 제출 폼 |
| R12 | `com.android.vending.BILLING` — SDK 추가 시 병합. 관련실은 콘솔에서 인앱상품 사용 선언 | |
| R13 | 실시간 개발자 알림(RTDN) — **검증이 B+webhook 또는 A2일 때만** Pub/Sub 주제 | 미정 시 보류 |
| R14 | 스토어 제출 게이트(`BUILD_PACKAGING_ANDROID_PLAY_RESCAN_2026-08-03.md`) — targetSdk 34 vs API 36 | **IAP와 별도 P0.** 콘솔 경고 캡처를 김팀장/대표님에 전달 |

### 4-4. 관련실 → 김팀장 핸드오프 형식

상품 등록이 끝나면 한 장만 넘긴다.

```text
package=com.arcfire.online
track=<internal|closed>
testers=<n>
products=gem_pack_small|medium|large|xlarge|starter_pack|season_pass_premium|planet_deed_grant
vip=<draft|active|deferred>
rtdn=<none|topic>
signing=<play_app_signing|upload_only>
```

---

## 5. 검증 배관 — 대표님 결정 (관련실은 상품만 선행)

영수증을 클라만 믿고 지급하면 BM §9 위반. Cloud Functions는 헌법 위반.

| 옵션 | 누가 구글을 조회하나 | 헌법 | 관련실 추가 | 권고 |
|---|---|---|---|---|
| **A2** | 기존과 같은 **AWS Lambda**가 Android Publisher API 호출. 클라에 키 없음 | Cloud Functions 아님. NL Lambda와 동일 패턴 | 서비스 계정 JSON을 Lambda에만. RTDN 선택 | 자체 통제·수수료 0 |
| **B** | RevenueCat(또는 동급) 서버 | Arcfire 서버 0 | RC 프로젝트·Play 연동. webhook은 선택 | 구현 빠름·구독 편함 |
| **A1** | Firebase Cloud Functions | **위반** | — | 기각 |
| **C** | 검증 없음 | BM §9 위반 | — | **기각** |

**관련실 선행(R1–R12)은 A2/B 공통.** SDK·Lambda는 결정 후 김팀장.

A2 계약(결정 시): 클라 → Lambda `POST {uid, productId, purchaseToken}` → Google `purchases.products.get` / `subscriptionsv2.get` → 서명된 grant 티켓 → 클라 `applyVerifiedIapGrant`. 키·서비스계정은 클라에 두지 않음.

B 계약(결정 시): `react-native-purchases` · offering SKU=§3 ID · `CustomerInfo` 검증 후에만 grant. webhook 없으면 관련실 RTDN 생략.

---

## 6. 클라 연동 계약 (김팀장 · 승인 후 · 값 디프 최소)

### 6-1. 모듈 (신설 예정)

```text
src/bm/iap/
  iapProductMap.ts      // CSV productId → Play type (consumable|non_consumable|subs)
  iapPurchaseGate.ts    // Stage3/전투 중 false · overlay만
  applyVerifiedIapGrant.ts
    // 입력: purchaseToken + productId + 검증 출처(A2|B)
    // 같은 token 두 번 → 지급 0 (멱등)
    // persist + (추후) users 단발 merge
  iapGrantLedgerStore.ts  // token 상한 캡 · purge 연동 · 계정 귀속
```

`addGems`를 상점 버튼에서 **직접 호출 금지.** grant만 `addGems`/`grantExchangeCredits`/증서 claim을 부른다.

### 6-2. 버튼

`BmShopOverlayContent.handlePremiumAction`:

1. `iapPurchaseGate()` false → 닫기.
2. 증서/스타터 이미 보유 → 기존 알림.
3. SDK `purchase(productId)`.
4. 검증(A2 또는 B) 성공 전 **지급 0**.
5. `applyVerifiedIapGrant`.
6. 소비성 `consume`, 그 외 `acknowledge`. 미처리 시 구글 **3일 환불**.
7. 실패 → 재화 변동 없음. coming soon 문구 제거는 **라이선스 테스트 통과 후**.

### 6-3. 복원

상점 「구매 복원」: 비소비·구독만. 소비성 보석팩은 복원 없음(이미 consume).  
`purgeLocalAccountData` 후에도 Play가 가진 비소비는 복원으로 재지급. **더미 증서 경로로 우회 금지.**

### 6-4. 일일 VIP 보석

`dailyGemGrant`는 CSV 고정. 지급은 **12:00 KST `runArcCoreDailyOpsBatch`에 편입** 또는 hydrate 1회(날짜 키). 틱·`setInterval` 금지.

### 6-5. 스키마 (신규 · 계정 귀속)

BM 리포트 `purchaseHistory`는 미구현. 신설:

```text
iapGrantLedger (AsyncStorage, bounded ≤ 40)
  tokenHash, productId, kind, grantedAt
player.gems: number          // 유지
starterPurchasedAt?: number
seasonPass 기존 트랙 스토어에 유료 플래그만
vip: { tier, expiresAt, lastDailyGrantDayKey }
```

`purgeLocalAccountData`에 원장·VIP·스타터 플래그 포함. Play 쪽 구매는 지우지 않음(복원).

Firestore: gems·원장 요약만 **단발 merge**. `onSnapshot` 금지.

---

## 7. 지급 매핑 (기존 함수)

| productId | 검증 후 |
|---|---|
| `gem_pack_*` | `addGems(gemGrantAmount)` + persist |
| `starter_pack` | gems 250 + credits 25000 + 장비 테이블 + 1회 플래그 |
| `season_pass_premium` | 시즌 트랙 유료 비트. gems 0 |
| `planet_deed_grant` | `applyPurchase`만. **`grantPlanetDeedPurchaseDummy` 삭제**. 픽커는 검증 후 |
| `vip_*` | tier·expiresAt·dailyGemGrant(CSV) |

스타터 장비 행이 `bm_product_contents`에 `starter_gear`만 있으면 **지급 아이템 ID는 구현 전 CSV 보강**(신규 행 추가 — 기존 행 수량 변경 아님).

---

## 8. 금지

| 금지 | 이유 |
|---|---|
| 검증 전 `addGems` / 더미 증서 | BM §9 · 실금 우회 |
| `onSnapshot`으로 구매 감시 | v4.0 |
| Stage 3 · dispose 전 상점 | SIGSEGV / GL |
| 크레딧→보석 | BM §9 |
| CSV `gemAmount`/`dailyGemGrant` 무단 변경 | 기존값 |
| Play productId를 CSV와 다르게 생성 | 매핑 붕괴 |
| 클라에 Google/Lambda 비밀키 | 탈취 |
| 교환 SKU를 Play에 등록 | 현금 상품 아님 |
| 구매마다 즉시 거대 JSON persist | PSS — 코얼레스 1.5s + 원장 캡 |

---

## 9. 순서 — 제출 게이트 ≠ IAP

```text
관련실 R1–R12 (상품·테스터)     ← 지금 가능
        │
대표님 §10 (A2/B · 가격 · VIP 1차 범위)
        │
김팀장 클라 SDK + grant (더미 증서 제거)
        │
내부 트랙 + 라이선스 테스터 구매
        │
스토어 제출 게이트 (target 36 · AAB · 상용서명)  ← 별축, 막히면 프로덕션 IAP 불가
```

Expo 51 / target 34는 2026-08-03 문서와 동일. **콘솔에서 실제 제출 에러를 관련실이 캡처**하는 것이 코드 추측보다 빠르다.

---

## 10. 대표님 확인 (클라 착수 전)

1. **검증** — A2(Lambda) / B(RevenueCat류). C·A1 없음.  
2. **1차 SKU** — 소비성 보석팩만 / +스타터·증서 / +시즌 / +VIP. 권장: **보석팩 4 + 스타터 + 증서**. 시즌·VIP는 콘솔 초안만.  
3. **가격** — §3 의도 KRW를 출시가로 쓸지, 배관만 두고 가는지.  
4. **스토어 게이트** — API 36·AAB를 IAP와 같은 스프린트에 둘지. 관련실 R14 회신 후.

이미 확정으로 다루는 것: 교환은 IAP 아님. 영수증 없는 지급 없음. productId=CSV.

---

## 11. 완료 정의

**관련실 완료(연동 준비)**: R1–R12 + §4-4 한 장 핸드오프.

**클라 1차 완료(승인 후)**: 더미 증서 제거 · grant 멱등 · 라이선스 테스터로 보석팩 1종 실구매(테스트 카드) · consume · 재실행 시 중복 지급 0 · `tsc` · Stage3에서 상점 안 열림.

**프로덕션 완료**: 제출 게이트 PASS + 실금 1건 수동 검증 + 환불 시 재화 회수 정책(별도 1쪽).

---

## 12. 파일 지도

| 역할 | 경로 |
|---|---|
| 상품 정본 | `tables/balance/gem_pack_catalog.csv` · `vip_tier_policy.csv` · `bm_product_contents.csv` |
| UI | `src/ui/overlay/content/BmShopOverlayContent.tsx` |
| 카탈로그 | `src/bm/bmShopCatalog.ts` |
| 증서(더미 제거 대상) | `src/bm/planetDeedCashGrantService.ts` |
| 지갑 | `src/store/playerStore.ts` `gems` / `addGems` |
| 경제 금지 | `docs/_000_ARCFIRE_BM_REPORT_v2.0.md` §9 |
| 제출 게이트 | `docs/BUILD_PACKAGING_ANDROID_PLAY_RESCAN_2026-08-03.md` |

승인 전 **코드 없음.**
