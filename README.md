# 아크파이어 온라인 (Arcfire Online)

텍스트 & 도트 픽셀 그래픽 기반 우주 무역 전투 게임
React Native (Expo bare workflow)

---

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. Firebase 설정 (필수)
- Firebase 콘솔에서 Android/iOS 앱 등록
- `google-services.json` → 프로젝트 루트 교체
- `GoogleService-Info.plist` → 프로젝트 루트 교체
- `app.json`의 `iosUrlScheme` → 실제 Google Client ID로 교체

### 3. 빌드 & 실행
```bash
# Android 실기 테스트
npx expo run:android --variant release --device

# iOS
npx expo run:ios --device
```

---

## 프로젝트 구조

```
ArcfireOnline/
├── app/                    # Expo Router 화면
│   ├── index.tsx           # 타이틀/로그인
│   └── (game)/             # 게임 화면 그룹
│       ├── nickname.tsx    # 닉네임 생성
│       ├── intro.tsx       # 인트로 스토리
│       ├── planet.tsx      # 행성 허브
│       ├── worldmap.tsx    # 갤럭시맵 (Skia)
│       ├── combat.tsx      # 전투 (D20)
│       ├── skilltree.tsx   # 스킬 트리
│       ├── trade.tsx       # 무역소
│       └── shipyard.tsx    # 조선소
├── src/
│   ├── types/              # 전체 타입 정의
│   ├── data/               # 게임 데이터 (20개 성계, 함선, 스킬 등)
│   ├── engine/             # D20/전투/무역/미션/스킬 엔진
│   ├── store/              # Zustand 상태관리
│   ├── firebase/           # Auth + Firestore
│   ├── renderer/           # Skia 렌더러 (별, 함선, 행성)
│   ├── components/         # 공통 컴포넌트
│   └── utils/              # 유틸리티 (theme, dice, math, save)
├── assets/                 # 아이콘/스플래시 이미지
├── google-services.json    # Android Firebase 설정 (교체 필요)
└── GoogleService-Info.plist # iOS Firebase 설정 (교체 필요)
```

---

## 주요 기술 스택

| 항목 | 패키지 |
|------|--------|
| 렌더링 | @shopify/react-native-skia |
| 인증 | @react-native-firebase/auth |
| DB | @react-native-firebase/firestore |
| 상태관리 | zustand |
| 네비게이션 | expo-router |
| 로컬저장 | @react-native-async-storage |

---

## 게임 플레이 흐름

```
로그인 → 닉네임 생성 → 인트로 스토리
→ 아르카디아 행성 (시작)
→ 1번 미션 자동 시작
→ 갤럭시맵 이동
→ 전투 (D20 판정)
→ 미션 완료 → 보상 → 레벨업 → 스킬 획득
```
