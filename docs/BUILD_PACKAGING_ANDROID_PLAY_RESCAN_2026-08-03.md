# 2026-08-03 — 빌드·패키징 최적화 · Google Play Android 준비 정밀 재조사

> **작성**: 김팀장 세션(분석 · **앱 코드/네이티브 설정 미수정**)  
> **측정 기준일**: 2026-08-03 KST  
> **대상**: 향후 APK/AAB 패키징 최적화 · Google Play 제출/업데이트 게이트  
> **연관 기존 문서**:  
> - `docs/archive/RELEASE_READINESS_MILESTONE_2026-06-23.md` (제품 출시 준비도)  
> - `docs/FIRESTORE_PRODUCTION_READINESS.md` (Firestore · 배포 순서)  
> - `docs/BOOT_INIT_OPTIMIZATION_ROADMAP.md` (부트 JS 최적화 · 보류)  
> - `README.md` (로컬 release 빌드 한 줄)  
> - `tools/long-run-monitor/reports/release-build-watch-*-KST.md` (릴리스 soak)

---

## 0. Executive Verdict

| 질문 | 판정 | 한 줄 |
|------|------|--------|
| **내부 릴리스 APK(로컬 검증) 가능?** | 🟡 **가능** | Hermes·PNG crunch·`transform-remove-console` 있음. **debug 서명·R8 미사용·fat ABI** |
| **Google Play 제출 가능(2026-08-03 기준)?** | ❌ **불가에 가깝다** | **targetSdk=34** · 신규/업데이트는 **~2026-08-31부터 API 36 필수** · 상용 서명·IAP·Data safety 미비 |
| **패키지 최적화 성숙도** | 🔴 **~25%** | Native **arm64 ≈ 200MB .so**, 4 ABI 합 **~745MB** 원본 · R8/shrink off · store 파이프라인 부재 |
| **Play 정책·SDK 선제 준비** | 🔴 **FAIL** | AGP **8.2.1** · NDK **26.1** · target **34** — **API 35/36·16KB page** 경로 미정리 |

**한 줄 요약:**  
런타임 안정화 문서(릴리스 마일스톤·Firestore)는 있어도, **스토어 패키징·Play API/서명/크기 정책 축 문서·코드 설정은 거의 비어 있다.** 특히 **오늘(2026-08-03) 기준 약 4주 뒤 Play target API 36** 데드라인이므로, **Expo 51 / RN 0.74 / target 34 스택의는 제출이 막힐 가능성이 매우 높다.**

---

## 1. 조사 범위 (코드·설정 실측)

| 축 | 경로·근거 |
|----|-----------|
| Expo 설정 | `app.json` · `app.config.js` · `package.json` |
| 네이티브 (로컬 prebuild 산출) | `android/**` — **`.gitignore`에 `android/` 포함** → 저장소 비커밋, 로컬 prebuild 결과 기준 |
| 빌드 최적화 | `babel.config.js` · `metro.config.js` · `gradle.properties` · `app/build.gradle` · `proguard-rules.pro` |
| Manifest | `android/app/src/main/AndroidManifest.xml` · 병합 release manifest |
| 릴리스 산출 실측 | `merged_native_libs/release` · `output-metadata.json` · debug APK ~139MB |
| 백엔드/보안 | `docs/FIRESTORE_PRODUCTION_READINESS.md` · AD_ID 권한 병합 결과 |
| 정책(외부) | [Play target API](https://support.google.com/googleplay/android-developer/answer/11926878) · [16KB page](https://developer.android.com/guide/practices/page-sizes) |

`android/` 는 prebuild 재생성 대상이므로, **스토어 게이트 값을 코드 정본으로 남기려면 `app.config.js` / Expo config plugin / 커밋된 `android/` 정책 재검토**가 필요하다.

---

## 2. 현재 빌드 스택 스냅샷 (실측)

| 항목 | 값 | 비고 |
|------|-----|------|
| App version | `0.1.1` (`package.json` · app config) | 상용 시맨틱 미정 |
| versionCode | `101` (`app/build.gradle` · `app.config.js` 공식: maj·minor·patch → 101) | 일치 |
| Expo | `~51.0.0` | 노후 — API 36은 **상위 Expo/RN 업그레이드** 사실상 필요 |
| React Native | `0.74.5` | patch 있음 (`patches/react-native+0.74.5.patch`) |
| Hermes | **ON** | `gradle.properties` `hermesEnabled=true` |
| New Architecture | **OFF** | `newArchEnabled=false` |
| minSdk | **23** | 병합 manifest 실측 |
| compileSdk / targetSdk | **34 / 34** | 병합 manifest 실측 |
| AGP (빌드 메타) | **8.2.1** | `app-metadata.properties` |
| NDK | **26.1.10909125** | `android/build.gradle` ext |
| Gradle Wrapper | **8.8** | |
| Package | `com.arcfire.online` | |
| allowBackup | **false** | good (보안) |
| extractNativeLibs | **false** | `expo.useLegacyPackaging=false` — 16KB 관점 유리 쪽 |
| Updates (EAS OTA) | `ENABLED=false` | 의도적 무갱신 |
| EAS / `eas.json` | **없음** | CI AAB 파이프라인 없음 |

### 2.1 JS 번들 최적화

| 항목 | 상태 | 판정 |
|------|------|------|
| Hermes bytecode | ON | ✅ |
| `transform-remove-console` (production) | `babel.config.js` NODE_ENV=production 시 적용 | ✅ |
| Metro 커스텀 minify 설정 | 기본 Expo | ⚪ 보통 |
| 생성 CSV TS | `src/data/generated` **~2.3MB / 25 files** | ⚪ 수용 가능(압축 후 더 작음) |
| 부트 lazy 로드맵 | `BOOT_INIT_OPTIMIZATION_ROADMAP` **보류** | 🟡 런타임 크기/기동 체감 — 패키지 외에 중요 |
| MEM_PROFILE release | env `EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1` 만 | ✅ 기본 OFF |

### 2.2 Android 바이트코드·리소스 축소

| 항목 | 현재 | 판정 |
|------|------|------|
| R8 / ProGuard `minifyEnabled` | **false** (기본, `android.enableProguardInReleaseBuilds` 미설정) | 🔴 미적용 |
| `shrinkResources` | **false** | 🔴 미적용 |
| PNG crunch | **true** | ✅ |
| ProGuard keep | reanimated + turbomodule 최소 keep만 | 🟡 R8 켤 때 Firebase/Skia 규칙 **추가 필요** |
| Release 서명 | **`signingConfigs.debug`** | 🔴 **스토어 제출 금지 수준** |

### 2.3 ABI · Native 무게 (release intermediates 실측)

| ABI | `.so` 합계 |
|-----|-----------:|
| arm64-v8a | **~200.1 MB** |
| armeabi-v7a | ~174.9 MB |
| x86 | ~176.9 MB |
| x86_64 | ~193.2 MB |
| **4 ABI 합** | **~745.1 MB** |

- 상위: `librnskia.so` arm64 **~37.3 MB** · `libfabricjni.so` ~33 MB · codegen/SVG/Screens 수 MB급 다수  
- `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` — **에뮬레이터용 2개까지 유니버설 APK에 포함**  
- **AAB**면 기기당 1 ABI 전달이나 **arm64 사용자 다운로드 원천 네이티브만 ~200MB** → Play 크기·전환율에 **치명적**  
- 로컬 debug APK 실측 예: **~139 MB** (`app-debug.apk`, 2026-06-26) — release 단일 APK 메타는 있으나 파일 부재(빌드 산출 부분)

### 2.4 권한 (병합 release)

| 권한 | 평가 |
|------|------|
| INTERNET · ACCESS_NETWORK_STATE · VIBRATE | 정상 계열 |
| READ/WRITE_EXTERNAL_STORAGE | target 33+ **레거시** — 필요성 재검토 · scoped storage 정책 |
| SYSTEM_ALERT_WINDOW | **의심** — RN dev/overlay 잔재 가능. 스토어 정책·신뢰 리스크 |
| AD_ID + AdServices | Firebase Analytics 계열 유입 가능 → **Data safety / AD_ID 선언 의무** |
| WAKE_LOCK · install referrer | Firebase/GMS 계열 |

---

## 3. Google Play · Android 정책 정합 (2026-08)

### 3-A. Target API (최우선 · 시간 민감)

| 정책 | 기한 | Arcfire 실측 | 갭 |
|------|------|--------------|-----|
| **신규/업데이트 target ≥ API 36** | **2026-08-31** | target **34** | 🔴 **약 4주 이내 블로커** (연장 신청 시 ~11-01) |
| 기존앱 target ≥ 35 (미제출 시 신규 기기 배포 제한) | 2026-08-31 (기존 정책 축) | 34 | 🔴 |
| 직전 주기 target 35 | 2025-08-31 | 미충족 상태 유지로 보임 | 이력이면 콘솔 경고 누적 |

**코드 결론:** `android/build.gradle` 기본 `targetSdkVersion=34` · Expo 51 prebuild 결과와 동일. **`app.json`에 `android` target 명시 없음.**  
API 36 대응은 **Expo/RN 메이저 업 + prebuild 재생성 + 회귀 soak** 없이는 비현실적.

### 3-B. 16 KB page size

| 정책 | 내용 | Arcfire |
|------|------|---------|
| Play | target **35+** 앱/업데이트: **64-bit native 16KB 정렬** (2025-11-01~) | target 34라 **당장 강제 아닐 수 있으나**, **API 35/36 올리면 즉시 강제** |
| 권장 툴 | AGP **≥8.5.1**, NDK **r28+**, uncompressed JNI + 재빌드 | AGP **8.2.1** · NDK **26.1** 🔴 |
| 패키징 | `extractNativeLibs=false` | ✅ 방향 맞음 |
| 검증 | APK Analyzer / Play Bundle Explorer / 16KB 에뮬 | **문서·CI 없음** 🔴 |

Skia · Hermes · Firebase · Reanimated 등 **다수 `.so`** → vendored SDK 버전 **16KB 호환 릴리즈로 동시 상향** 필수.

### 3-C. 서명 · 배포 형태

| 항목 | 상태 |
|------|------|
| Upload / App signing | release → **debug keystore** 🔴 |
| AAB (`bundleRelease`) 스크립트 | 문서·npm script **없음** (로컬 `expo run:android --variant release` 위주) |
| Play App Signing | 콘솔 미문서화 |
| EAS Build | `eas.json` 없음 |

### 3-D. 상업·신뢰·프라이버시 (코드 차원)

| 항목 | 코드/설정 | 스토어 영향 |
|------|-----------|-------------|
| Billing / IAP | **미연동** (BM 카탈로그·💎교환만, Play Billing 패키지 없음) | 유료 출시 불가 · 정책 위반 위험 시 무과금만 |
| Privacy Policy URL | 앱 내/설정 **미확인 정본 없음** | 데이터 수집(Firebase) 시 필수 |
| Data safety | AD_ID·Analytics 존재 → 선언 필요 | 코드 밖 콘솔 작업, **추적 문서 부족** |
| App Check / Play Integrity | Firestore handoff에 **로드맵만** | 변조 클라는 잔여 리스크 |
| 계정 복구 (Play Games) | 문서 잔여 | uid 기기 스코프 |

### 3-E. SDK 정책 마이너 이슈

| 이슈 | 비고 |
|------|------|
| target 34 → 35/36 **edge-to-edge / 예측형 뒤로가기** | Expo upgrade 시 RN 기본 동작 검증 필요 |
| STORAGE 권한 maxSdk | 미적용 가능성 — 리뷰 질문 유발 |
| DevSettingsActivity | release 포함 여부 재검 (debug 분리 권장) |

---

## 4. 패키징 최적화 갭 (P0~P2)

### P0 — 스토어 게이트 (먼저)

1. **목표 스택 확정**: target/compile **36**(또는 단계적 35→36) · Expo SDK 호환 경로 · AGP ≥8.5.1 · NDK r28+  
2. **Release 상용 서명 + AAB** 파이프라인 (`bundleRelease` / EAS) — debug 서명 **제거**  
3. **16KB** 네이티브 재빌드 · Play 콘솔 “Supports 16KB” 확인  
4. **Data safety · privacy · AD_ID** 선언 준비 (Analytics 유지/제거 결정)  
5. **릴리스 soak 게이트** (기존 long-run)를 **AAB + target 신 SDK** 빌드에 재적용  

### P1 — 크기·다운로드

6. ABI: 배포 **`arm64-v8a` 우선** (+ 필요 시 `armeabi-v7a`) — **x86/x86_64는 내부 CI 전용**  
7. R8 minify + shrinkResources **ON** (keep 규칙: Firebase · Skia · Reanimated · Hermes) + minify crash 회귀 1회  
8. AAB asset 패킹 · 불필요 Fresco gif 등 플래그 재검토 (`expo.gif` 등)  
9. Skia/의존성 strip 옵션 · Hermes 소스맵 비포함 스토어 빌드  
10. 부트 lazy (`BOOT_INIT…`) — 패키지보다 **PSS/기동**이나 다운로드 체감 연동  

### P2 — 운영·품질

11. App Check / Integrity  
12. Play Billing 연동 (M2 BM)  
13. `proguard-rules`/`consumer-rules` 문서화  
14. **prebuild 정본 전략**: `android/` git 추적 vs config plugin으로 target/min/ABI 고정  
15. 스토어 스크린샷·콘텐츠 등급·Families 정책 (본 문서 외 운영)

---

## 5. 기존 문서 대비 보완 포인트

| 문서 | 2026-06~07 상태 | 2026-08-03 보완 필요 |
|------|-----------------|---------------------|
| `RELEASE_READINESS_MILESTONE` | 제품 M1~M3 · 상용 ~35% | **Play API 36·AAB·서명·크기 축 전무** → 본 보고서 교차 링크 + 빌드 절 추가 |
| `FIRESTORE_PRODUCTION_READINESS` | rules·익명 인증 배포 순서 | APK/AAB **한 줄만** · **target/서명 전제** 명시 필요 |
| `BOOT_INIT_OPTIMIZATION_ROADMAP` | 부트 JS lazy | 유지 · **패키지 P1과 별축** |
| `README` | `expo run:android --variant release` | AAB·서명·ABI 절 없음 |
| long-run release soak | 안정성 중심 | **target/AAB 빌드 종류 태그** 권장 |

*(본 턴에서 위 문서에 교차 링크·짧은 절 업데이트 수행 — 아래 §8.)*

---

## 6. 권장 실행 순서 (구현은 Opus/김클로드 · 본 문서 기준)

```text
1) 스택 조사: Expo SDK 현재 LTS vs API 36 / RN version matrix (upgrade 설계 문서)
2) app.config 또는 prebuild 정책에 targetSdk/compileSdk/ABI 고정
3) release signing + bundleRelease (또는 EAS production profile)
4) 16KB 에뮬 + Play pre-launch
5) R8/shrink ON + 크래시 회귀
6) arm64 전용 AAB 사이즈 측정 → 목표 e.g. download < 150MB (현실: RN+Skia  constrains)
7) Data safety + privacy policy + (선택) Billing
8) 기존 M1 soak를 신 빌드에 1회 이상 통과
```

**크기 현실 체크:** Skia 단일 lib **~37MB arm64**. 최적화해도 **모바일 게임을 소형 캐주얼 APK 수준으로 줄이기는 어렵고**, 목표는 **불필요 ABI·미압축 낭비·미사용 native 제거**다.

---

## 7. 체크리스트 (Go/No-Go 요약)

| # | 항목 | 지금 |
|---|------|------|
| 1 | Hermes ON | ✅ |
| 2 | console strip (prod) | ✅ |
| 3 | allowBackup false | ✅ |
| 4 | R8 minify | ❌ |
| 5 | shrinkResources | ❌ |
| 6 | Production signing | ❌ |
| 7 | AAB 파이프라인 | ❌ |
| 8 | targetSdk ≥ 35 | ❌ (34) |
| 9 | targetSdk ≥ 36 (제출 직전 필수) | ❌ |
| 10 | 16KB 검증 문서/실측 | ❌ |
| 11 | ABI store 정책 | ❌ (4ABI fat) |
| 12 | Data safety / AD_ID 정리 | ❌ 문서 부재 |
| 13 | Play Billing | ❌ |
| 14 | App Check | ❌ (로드맵만) |
| 15 | Firestore rules + 새 클라 순서 | ✅ 문서 있음 |
| 16 | Release soak tooling | ✅ 도구 있음 / 신 SDK 재검 필요 |

**종합 Go/No-Go: 스토어 제출 No-Go.** 내부 알파/릴리스 APK 검증은 제한적 Yes.

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-08-03 | 초판 — 코드·gradle·native 실측 · Play API 36·16KB·크기 정밀 재조사 |

---

**문서 종료 — BUILD_PACKAGING_ANDROID_PLAY_RESCAN v1 · 2026-08-03**
