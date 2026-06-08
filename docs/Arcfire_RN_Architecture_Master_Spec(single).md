# 🚀 아크파이어 — React Native 모바일게임 프로젝트 아키텍처 구조설계서

> **문서 버전**: v2.1  
> **최종 업데이트**: 2026-06-08  
> **문서 상태**: 설계 정본 + §18 구현 동기화  
> **감사**: [`Arcfire_Architecture_Audit_2026-06-08.md`](./Arcfire_Architecture_Audit_2026-06-08.md) · [`ARCHITECTURE_RISK_REGISTER.md`](./ARCHITECTURE_RISK_REGISTER.md)  
> **인덱스**: [`README_ARCHITECTURE.md`](./README_ARCHITECTURE.md)  
> **변경 이력**: v1.1 MO 멀티플레이 → v2.0 싱글플레이 + AI 가상유저  
> **통합 출처**: flowchart v2026.05 · Memory Spec v1.0 · AABS v2.2 · Post-AABS Roadmap · AGDS · Master Spec v1.0  
> **핵심 원칙**: `Table-First` · `Session-Based Memory` · `Hybrid Rendering` · `Navigation.replace()` · `Local-AI-First`

---

## 🔄 v1.1 → v2.0 설계 변경 요약

> **변경 이유**: 채널 기반 실유저 동시접속 설계는 구현 공백(채널 관리·데이터 동기화·타유저 렌더링)이 크고 네트워크 의존성이 높다.  
> 싱글플레이 + AI 가상유저 방식으로 전환하여 **설계 공백 전부 해소**, **네트워크 부하 제거**, **완전 오프라인 플레이** 가능.

| 항목 | v1.1 (MO 멀티플레이) | v2.0 (싱글 + AI 가상유저) | 변경 이유 |
|------|------|------|------|
| 장르 | MO (소규모 동시접속) | 싱글플레이 + AI 가상유저 | 구현 공백 해소, 네트워크 의존 제거 |
| 채널 구조 | 채널당 실유저 100명 | **제거** → 로컬 AI 가상유저 풀로 대체 | 채널 관리 로직 공백 해소 |
| 타유저 동기화 | Firestore 실시간 동기화 필요 | **제거** → 로컬 시뮬레이션 전용 | 설계 공백 2·3 해소 |
| 타유저 렌더링 | 채널 내 실유저 전함 표시 | AI 가상유저 전함 로컬 렌더링 | 설계 공백 3 해소 |
| Firestore 역할 | 유저 데이터 + 채널 동기화 | **유저 데이터 단독** (더 단순) | 서버 의존 최소화 |
| AABS Sim-Bot | 밸런싱 전용 가상봇 200명 | **역할 확장** → 게임 세계 AI 가상유저 통합 | 봇 코드 재활용 |
| 오프라인 플레이 | 불가 (채널 동기화 필수) | **가능** (로컬 AI 처리) | UX 향상 |

---

## 🎯 0. 게임 핵심 컨셉 정의 (Core Concept)

> **이 섹션은 모든 설계 판단의 최상위 기준이다. 구현 방향이 모호할 때 반드시 이 컨셉으로 돌아와 판단한다.**

### 0-1. 게임 장르 및 규모

| 항목 | 정의 |
|------|------|
| **장르** | **싱글플레이 우주 전략** — 실유저 간 상호작용 없음. AI 가상유저가 세계에 생동감 부여 |
| **플랫폼** | React Native 모바일 (iOS / Android) |
| **서버 구조** | **서버리스 (Serverless)** — 전용 게임 서버 없음. Firestore(유저 데이터) + 클라이언트 로컬 AI 처리 |
| **오프라인** | AI 가상유저는 로컬 시뮬레이션이므로 **오프라인 플레이 가능** (Firestore 저장은 온라인 시 동기화) |

### 0-2. AI 가상유저 구조 (채널 개념 대체)

```
기존 v1.1: 채널 A (행성 X) ─── 실유저 최대 100명 [폐기]

v2.0: 행성 X ─── 유저 1명 (실제 플레이어)
              └── AI 가상유저 풀 (로컬 시뮬레이션)
                    ├─ 전투형 AI: N명 (레벨 밴드 기반 생성)
                    ├─ 무역형 AI: N명 (경제 시뮬레이션 참여)
                    └─ 탐사형 AI: N명 (Galaxy Map 이동 연출)
```

- AI 가상유저 수는 AABS가 `aiVirtualPlayerDensity` 파라미터로 행성 레벨·세계관 상태에 따라 자동 조절
- AI 가상유저는 **화면에 전함 형태로 표시**되어 세계 생동감 제공 (실유저처럼 보임)
- AI 가상유저 데이터는 **전적으로 클라이언트 로컬 메모리**에 존재 — Firestore 저장 없음

### 0-3. 플레이 방식 (핵심)

| 항목 | 방식 | 비고 |
|------|------|------|
| **게임 모드** | 싱글플레이 | 실유저 간 직접 인터랙션 없음 |
| **AI 가상유저** | 로컬 시뮬레이션 | 세계 밀도·분위기 연출 목적 |
| **전투 방식** | **자동전투 (Auto-Combat)** | 클라이언트 독립 시뮬레이션 |
| **저장 방식** | Firestore (실 플레이어 데이터만) | AI 가상유저 상태는 저장 안 함 |
| **데이터 공유** | **없음** | 실유저 간 동기화 완전 제거 |

### 0-4. 그래픽 방침

```
이미지 기반 최소화 원칙:
  ├─ 전함·무기·NPC → 이미지 에셋 사용 (3D 렌더링 없음)
  ├─ AI 가상유저 전함 → 실 플레이어 전함과 동일 에셋 사용 (구분 불필요)
  ├─ 효과 (성운·궤적·파티클) → Skia 벡터/쉐이더로 경량 처리
  └─ UI 마커 → RN Animated (이미지 스프라이트 기반)
```

### 0-5. Firestore 역할 명확화 (v2.0 — 더 단순해짐)

```
Firestore 사용 범위 (실 플레이어 데이터만):
  ✅ arcfire_player_v1 (유저 프로필)
  ✅ ship.equipSlots (함선 장착 정보)
  ✅ 게임 진행 저장 데이터
  ✅ BM 데이터 (시즌패스, VIP, 퍼널)
  
  ❌ 채널 관리 데이터 → v2.0에서 완전 제거
  ❌ 실시간 타유저 동기화 → v2.0에서 완전 제거
  ❌ AI 가상유저 상태 → 로컬 메모리 전용, Firestore 저장 금지
```

### 0-6. AI 가상유저 vs NPC 구분

> 두 개념은 다르다. 혼용 금지.

| 구분 | AI 가상유저 (Virtual AI Player) | NPC |
|------|------|------|
| **역할** | 실유저처럼 보이는 세계 밀도 연출 | 게임 세계 내 고정 캐릭터 |
| **행동** | 이동·전투·무역 패턴 시뮬레이션 | 대화·퀘스트·Governor System |
| **데이터 출처** | `aiVirtualPlayerStore` (로컬) | `npcMap` CSV 인덱스 |
| **렌더링** | Skia Layer (전함 형태) | RN Layer (마커 형태) |
| **Firestore** | ❌ 저장 없음 | ❌ 저장 없음 |
| **AABS 연동** | ✅ 밀도·성향 보정 | ✅ 배치·레벨 보정 |

---

## ⚠️ 0-A. v1.1 설계 공백 해소 결과

> v1.1에서 미해결이었던 3개 설계 공백이 v2.0 전환으로 전부 해소된다.

| v1.1 공백 | v1.1 상태 | v2.0 해소 방법 |
|---------|---------|---------|
| **[공백 1] 채널 관리 로직** | 미정 (100명 초과 시 분기 로직 없음) | ✅ **채널 개념 폐기** — AI 가상유저 풀로 대체 |
| **[공백 2] 전함 데이터 공유 방식** | 미정 (Firestore vs 소켓 결정 안됨) | ✅ **공유 불필요** — 로컬 AI 처리로 완전 해소 |
| **[공백 3] 타유저 전함 렌더링** | 미정 (실유저 전함 표시 방법 없음) | ✅ **AI 가상유저 전함 렌더링**으로 대체 (로컬) |

### 신규 설계 확인 사항 (v2.0)

```
[확인 1] AI 가상유저 생성 규칙
  - 행성 입장 시 몇 명의 AI 가상유저를 생성하는가?
  - 레벨 밴드·행성 타입별 생성 기준 CSV 정의 필요
  - → aiVirtualPlayerDensity.csv (신규 추가)

[확인 2] AI 가상유저 행동 시뮬레이션 상세
  - AI 가상유저의 이동·전투 패턴 로직 범위 정의
  - 너무 복잡하면 메모리 예산 초과 위험 → 경량 패턴 설계 필요

[확인 3] AI 가상유저 세션 생명주기
  - 행성 이탈 시 AI 가상유저 상태 dispose 시점 확인
  - Stage 1 메모리 계약에 aiVirtualPlayerStore.dispose() 추가 필요
```

---

## 목차

1. [시스템 개요 및 핵심 원칙](#1-시스템-개요-및-핵심-원칙)
2. [기술 스택](#2-기술-스택)
3. [앱 초기화 및 부트스트랩](#3-앱-초기화-및-부트스트랩)
4. [사용자 인증 및 세션 활성화](#4-사용자-인증-및-세션-활성화)
5. [스테이지 구조 및 메모리 예산](#5-스테이지-구조-및-메모리-예산)
6. [메인 스테이지 허브 (Stage 1)](#6-메인-스테이지-허브-stage-1)
7. [게임플레이 루프: 출격·이동·전투 (Stage 2~3)](#7-게임플레이-루프-출격이동전투-stage-23)
8. [메모리 관리 핵심 설계](#8-메모리-관리-핵심-설계)
9. [렌더링 파이프라인](#9-렌더링-파이프라인)
10. [AABS: 능동형 밸런싱 시스템](#10-aabs-능동형-밸런싱-시스템)
11. [AGDS: 자율형 개발 운영 시스템](#11-agds-자율형-개발-운영-시스템)
12. [Post-AABS 운영 로드맵](#12-post-aabs-운영-로드맵)
13. [파일 구조](#13-파일-구조)
14. [절대 금지 사항 (Do Not Drift)](#14-절대-금지-사항-do-not-drift)
15. [Cursor 개발 체크리스트](#15-cursor-개발-체크리스트)
16. [전체 플로우차트 (Mermaid)](#16-전체-플로우차트-mermaid)
17. [BM 개발 구현 개요 (Business Model)](#17-bm-개발-구현-개요-business-model)

---

## 1. 시스템 개요 및 핵심 원칙

아크파이어는 **React Native** 기반 모바일 우주 전략 **싱글플레이** 게임이다. AI 엔진 **ArcCore**가 게임 밸런스를 능동적으로 조절하고, **AI 가상유저**가 게임 세계에 생동감을 부여하며, 유저가 내러티브 인터랙션을 통해 세계관에 개입하는 **유저 주도형 샌드박스** 환경을 제공한다.

실유저 간 네트워크 동기화는 존재하지 않는다. 모든 세계 시뮬레이션은 클라이언트 로컬에서 처리되며, Firestore는 오직 실 플레이어의 영속 데이터만 담당한다.

### 5대 설계 원칙

| 원칙 | 내용 | 위반 시 결과 |
|------|------|-------------|
| **Table-First** | CSV 정본 데이터를 앱 시작 시 `Map`으로 인덱싱, 런타임 중 정본 수정 금지 | 검색 성능 저하, 데이터 불일치 |
| **Session-Based Memory** | 스테이지 전환 시 이전 세션 자원 명시적 `dispose`, 영속 스토어만 유지 | 200MB → 800MB 메모리 누수, 크래시 |
| **Hybrid Rendering** | 대량 객체(AI 가상유저 전함 포함)는 Skia, 상호작용 UI는 RN Animated로 레이어 분리 | 프레임 드롭, 렌더 desync |
| **Navigation.replace()** | 모든 주요 스테이지 전환은 `replace()` 강제, `navigate()` 사용 금지 | 스택 누적, 이전 스테이지 언마운트 안됨 |
| **Local-AI-First** | AI 가상유저는 클라이언트 로컬 전용. Firestore 저장·채널 동기화 금지 | 설계 원칙 위반, 네트워크 의존성 증가 |

---

## 2. 기술 스택

| 영역 | 기술 | 역할 |
|------|------|------|
| **프레임워크** | React Native | 앱 전체 기반 |
| **렌더링 (대량)** | `@shopify/react-native-skia` | AI 가상유저 전함·수송선·성운·전투 이펙트 |
| **렌더링 (UI)** | `Animated.transform` | NPC 마커·UI 애니메이션 |
| **데이터베이스** | Firebase Firestore | **실 플레이어 데이터 전용** (프로필·함선 장착 정보·진행 저장·BM) |
| **정적 데이터** | CSV + `Map<id, row>` 인덱스 | 함선·무기·NPC·AI 가상유저 밀도 테이블 |
| **상태 관리** | `planetCoreRuntimeStore` | 영속 런타임 상태 (AABS 보정값) |
| **세션 캐시** | `planetMemoCache` | 휘발성 세션 데이터 |
| **AI 가상유저** | `aiVirtualPlayerStore` | 로컬 전용, 스테이지 이탈 시 dispose |
| **네비게이션** | `Navigation.replace()` | 스택 관리 |

> ⚠️ **v2.0 변경**: `채널 관리 모듈` / `실시간 동기화 소켓` / `타유저 Firestore 리스너` — **기술 스택에서 완전 제거**

---

## 3. 앱 초기화 및 부트스트랩

앱 실행 시 아래 순서를 **반드시** 준수한다.

| 순서 | 단계 | 설명 |
|------|------|------|
| 1 | **앱 실행** | 어플리케이션 엔진 가동 |
| 2 | **기술 초기화** | RN 환경 + Skia 엔진 + 네이티브 모듈 초기화 |
| 3 | **테이블 데이터 인덱싱** ⭐ | CSV(함선·무기·NPC·**AI 가상유저 밀도**) → `Map` 구조 핫 패스 캐시 빌드 (`O(1)`) |
| 4 | **시작 화면** | 메인 타이틀 화면 진입 |

> ⭐ **Table-First 원칙**: 인덱싱은 앱 생명주기 동안 **단 1회**만 실행. 스테이지 전환 시 재인덱싱 절대 금지.

```typescript
// store/staticTableStore.ts
const shipMap = new Map<string, ShipRow>();
const weaponMap = new Map<string, WeaponRow>();
const npcMap = new Map<string, NpcRow>();
const aiVirtualPlayerDensityMap = new Map<string, AIVirtualPlayerDensityRow>(); // v2.0 신규

export function buildStaticIndexes(csvData: CsvBundle): void {
  csvData.ships.forEach(row => shipMap.set(row.id, row));
  csvData.weapons.forEach(row => weaponMap.set(row.id, row));
  csvData.npcs.forEach(row => npcMap.set(row.id, row));
  csvData.aiVirtualPlayerDensity.forEach(row =>           // v2.0 신규
    aiVirtualPlayerDensityMap.set(row.planetType, row)
  );
}

// O(1) 조회 — findIndex() 사용 금지
export const getShip = (id: string) => shipMap.get(id);
export const getWeapon = (id: string) => weaponMap.get(id);
export const getNpc = (id: string) => npcMap.get(id);
export const getAIVirtualPlayerDensity = (planetType: string) => // v2.0 신규
  aiVirtualPlayerDensityMap.get(planetType);
```

---

## 4. 사용자 인증 및 세션 활성화

### 4-1. 계정 확인 분기

```
Firestore 접속 → arcfire_player_v1 프로필 조회
       │
       ├─ [신규 유저] → 스토리 모드 재생 → 닉네임 생성 → 초기 데이터 생성
       │
       └─ [기존 유저] → 프로필 로드 → ship.equipSlots 장착 정보 로드
       │
       └─ [공통] → registerPlanetSessionResource()
                    └─ spawnAIVirtualPlayers()  ← v2.0 신규: AI 가상유저 로컬 생성
                    └─ 메인 스테이지 진입
```

### 4-2. 행성 세션 등록

- **호출 시점**: 메인 스테이지 진입 **직전** (인증 완료 후)
- **호출 함수**: `registerPlanetSessionResource()`
- **역할**: 현재 행성 메모리 자원 할당 + AI 가상유저 로컬 스폰 + 렌더링 준비 완료

### 4-3. AI 가상유저 스폰 (v2.0 신규)

```typescript
// v2.0: AI 가상유저는 세션 등록 시 로컬에서 생성
function spawnAIVirtualPlayers(planetType: string, playerLevel: number): void {
  const densityRow = getAIVirtualPlayerDensity(planetType); // O(1) CSV 조회
  if (!densityRow) return;

  const count = AABS.getAdjustedAIDensity(densityRow.baseCount); // AABS 보정 적용
  
  for (let i = 0; i < count; i++) {
    aiVirtualPlayerStore.spawn({
      shipId: densityRow.shipPool[i % densityRow.shipPool.length],
      behavior: densityRow.behaviorTypes[i % densityRow.behaviorTypes.length],
      levelBand: [playerLevel - 2, playerLevel + 2], // 플레이어 레벨 밴드 기준
    });
  }
}

// ⚠️ AI 가상유저 데이터는 Firestore에 절대 저장하지 않는다
// ⚠️ 스테이지 이탈 시 aiVirtualPlayerStore.dispose() 필수
```

---

## 5. 스테이지 구조 및 메모리 예산

> **배경**: 앱 초기 메모리 ~200MB → 전투 반복 후 ~800MB → 스마트폰 크래시  
> **원인**: 스테이지 전환 시 Skia 인스턴스·rAF 루프·Animated 객체·콜백 구독 미해제 누적  
> **v2.0 추가 주의**: AI 가상유저 전함 Skia 객체도 dispose 대상에 포함

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 0: Splash / Auth              목표: < 50MB           │
│  STAGE 1: Planet Hub (Main)          목표: < 200MB          │
│           └─ AI 가상유저 전함 포함                           │
│  STAGE 2: Galaxy Map                 목표: < 120MB          │
│           └─ AI 가상유저 이동 연출 포함                      │
│  STAGE 3: Combat                     목표: < 250MB          │
│  SUB-STAGE: 행성 시설 (Hub 위 Modal) 목표: < 80MB           │
└─────────────────────────────────────────────────────────────┘
```

**규칙**: 스테이지 전환 시 이전 스테이지의 메모리 예산을 **반드시 해제 후** 다음 스테이지를 초기화한다.  
**v2.0 추가**: `aiVirtualPlayerStore.dispose()`는 Stage 1 이탈 시 필수 수행.

### 5-1. 스테이지별 콘텐츠 분류 및 Cleanup 요구사항

| 콘텐츠 | 스테이지 | 진입 방식 | Cleanup 요구사항 |
|--------|----------|-----------|----------------|
| 필드 전투 / 은신처 소탕 / 공성전 | Stage 3 (Combat) | `Navigation.replace()` | Skia dispose + rAF 취소 + 콜백 null |
| 토너먼트 / 약탈·범죄 | Stage 3 (Combat 변형) | `Navigation.replace()` | Combat과 동일 |
| **AI 가상유저 전함 렌더링** | Stage 1 / Stage 2 | — (스테이지 내 포함) | **`aiVirtualPlayerStore.dispose()` 필수** |
| 용병 모집 / 부대 육성 / 포로 관리 | SUB-STAGE (Hub Modal) | `Modal.present()` | 모달 자체 상태 초기화 |
| 교역 / 작업장 / 수송단 | SUB-STAGE (Hub Modal) | `Modal.present()` | 교역 캐시 해제 |
| 대장기술 (무기 제작) | SUB-STAGE (Hub Modal) | `Modal.present()` | 제작 폼 상태 해제 |
| 도시 관리 / 정책 수립 | SUB-STAGE (Hub Modal) | `Modal.present()` | 정책 로컬 상태 초기화 |
| 가문 등급 / 동료 영입 / 외교 | SUB-STAGE (Hub Modal) | `Modal.present()` | NPC 리스트 참조 해제 |
| 퀘스트 | SUB-STAGE (Hub Modal) | `Modal.present()` | 진행 상태 저장 후 로컬 해제 |

---

## 6. 메인 스테이지 허브 (Stage 1)

> ArcCore와 UI 레이어가 결합된 고성능 허브. 메모리 예산 **< 200MB**.  
> v2.0: AI 가상유저 전함이 Skia Layer에 포함되어 세계 생동감 연출.

### 6-1. 렌더링 파이프라인

| 레이어 | 담당 역할 | 기술 |
|--------|-----------|------|
| **Skia Layer** | 아크 수송선 / **AI 가상유저 전함** / 성운(Nebula) 효과 | `@shopify/react-native-skia` |
| **RN Layer** | 테이블 기반 NPC 마커(Captain 마크 등) | `Animated.transform` |

> **v2.0**: AI 가상유저 전함은 실 플레이어 전함과 동일한 Skia 에셋으로 렌더링.  
> UI상 구분 표시 없음 — 실유저처럼 보이도록 의도한 설계.

### 6-2. 허브 기능

| 기능 | 설명 | 비고 |
|------|------|------|
| **스캔** | 주변 정보 거리순 정렬 확인 | `INFO_DISTANCE_SORT_INTERVAL_MS = 5000ms` |
| **선술집 / 조선소 / 무역소** | 행성 내부 시설 (Modal/BottomSheet) | `PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX` 적용 |
| **Governor System** | NPC 대화 → 행성 운영 방침 결정 | `planetCoreRuntimeStore.globalMultipliers` 즉시 반영 |
| **AI 가상유저 활동** | AI 전함들이 허브 내에서 이동·정박 패턴 연출 | 로컬 시뮬레이션, Skia Layer 렌더링 |
| **종료** | `dispose` 후 시작 화면 복귀 | 메모리 누수 방지 |

### 6-3. Governor System (내러티브 정책 결정)

유저가 성계 허브 핵심 NPC와 대화하여 행성 운영 방침을 결정한다.

| 정책 시나리오 | 효과 |
|-------------|------|
| **[치안 강화]** | 난이도 + 경험치 배율 상향 (전투 중심) |
| **[자유 무역]** | 세금 인하 + 무역 NPC 유입 증가 (경제 중심) |
| **[기술 발굴]** | 고티어 장비 드랍 가중치 상향 (파밍 중심) |

### 6-4. Stage 1 메모리 계약 (v2.0 업데이트)

**진입 시 (onMount)**
```
1. registerPlanetSessionResource() 호출
2. CSV 인덱스 캐시 확인 — 이미 빌드된 경우 재사용
3. PlanetHubOrbitSkiaLayer 초기화
4. orbitClockMs rAF 루프 시작 (rafId 저장 필수)
5. 거리 정렬 타이머 시작 (5000ms 간격)
6. [v2.0 신규] spawnAIVirtualPlayers() — AI 가상유저 로컬 생성
7. [v2.0 신규] aiVirtualPlayerStore 시뮬레이션 루프 시작
```

**이탈 시 (onUnmount)**
```
1. cancelAnimationFrame(rafId)             — orbitClockMs 루프 종료
2. clearInterval(distanceSortTimer)        — 거리 정렬 타이머 종료
3. PlanetHubOrbitSkiaLayer.dispose()       — Skia canvas 해제
4. Animated.stop()                         — NPC 마커 애니메이션 전체 정지
5. planetMemoCache.clear()                 — 세션 캐시 초기화
6. nearbyNpcList = null                    — 참조 해제
7. [v2.0 신규] aiVirtualPlayerStore.dispose() — AI 가상유저 전체 해제 필수
```

**SUB-STAGE (시설 진입)**
```
진입: Modal.present() — Hub rAF 루프 유지, AI 가상유저 시뮬레이션 일시 저속 가능
이탈: Modal.dismiss() → 각 시설 컴포넌트 자체 cleanup 실행
```

---

## 7. 게임플레이 루프: 출격·이동·전투 (Stage 2~3)

### 7-1. 출격 (Departure)

```typescript
// 스택을 비우며 은하계 지도로 전환 (뒤로가기 방지)
// v2.0: Stage 1 이탈 전 aiVirtualPlayerStore.dispose() 선행 필수
aiVirtualPlayerStore.dispose(); // AI 가상유저 메모리 해제
Navigation.replace('GalaxyMap');
```

### 7-2. 이동 (In-Transit / Stage 2)

```typescript
beginPlanetHubSuspendingNavigation(); // 이동 시뮬레이션 시작
```

**Stage 2 메모리 계약**

| 단계 | 처리 내용 |
|------|---------|
| 진입 | 은하계 지도 정적 데이터 로드 (CSV 인덱스 재활용, 재인덱싱 금지), 이동 시뮬레이션 타이머 시작, [v2.0] Galaxy Map AI 가상유저 이동 연출 초기화 |
| 이탈 | 이동 타이머 정지, 렌더링 상태 초기화, 로컬 이동 경로 배열 참조 해제, [v2.0] Galaxy Map AI 가상유저 dispose |

> ⚠️ Galaxy Map은 메모리 예산이 낮다(120MB). **AI 가상유저 수를 Stage 1보다 줄여 생성**하고, 전투 진입 전 Galaxy Map 자원을 먼저 해제한다.

### 7-3. 전투 파이프라인 (Stage 3)

```
전투 발생
    │
    ├─ [AI 가상유저와의 조우] — 로컬 AI 시뮬레이션 (v2.0)
    │        AI 가상유저 행동 패턴 → Combat 시뮬레이터 입력
    │
    ▼
PlanetEdenRaidOrbitSkiaCombat  ← 단일 렌더러
    │
    ├─ Simulation Step
    │       │ postStepRef 콜백 (구독)
    │       ▼
    └─ Skia Render Sync  ← 물리-프레임 완벽 동기화
```

**시각 규칙 (수정 금지)**
```typescript
// 미사일 명중 시 탄두 즉시 제거, 궤적만 잔상 유지
const shouldRenderHead = !m.hitApplied; // 이 조건 변경 금지
```

**Stage 3 메모리 계약 — 전투 종료마다 반드시 실행**

```
진입:
  1. 전투 자산 초기화 (함선·미사일·궤적 배열)
  2. PlanetEdenRaidOrbitSkiaCombat Skia canvas 초기화
  3. combatOrbitPostStepRef 콜백 등록
  4. 시뮬레이션 루프 시작

이탈:
  1. 시뮬레이션 루프 정지
  2. combatOrbitPostStepRef.current = null  ← 콜백 참조 해제 필수
  3. PlanetEdenRaidOrbitSkiaCombat.dispose() ← Skia canvas 명시적 해제
  4. missiles.length = 0                     ← 미사일 배열 초기화
  5. 함선 객체 배열 참조 해제
  6. cancelAnimationFrame(combatRafId)
  7. DISPOSE 완료 후 Navigation.replace() 호출
```

### 7-4. 복귀 및 정리

```typescript
dispose();               // 세션 자원 해제
Navigation.replace('PlanetHub'); // 메인 스테이지 복귀
// v2.0: 복귀 후 spawnAIVirtualPlayers() 재호출 (새 AI 가상유저 풀 생성)
```

---

## 8. 메모리 관리 핵심 설계

### 8-1. useStageMemory 훅 — 모든 스테이지 공통 계약

```typescript
// hooks/useStageMemory.ts
export function useStageMemory(
  stageId: string,
  onMount: () => void | Promise<void>,
  onUnmount: () => void,
): void

// 사용 예시 — v2.0: AI 가상유저 dispose 포함
useStageMemory(
  'PLANET_HUB',
  () => {
    registerPlanetSessionResources();
    spawnAIVirtualPlayers(planetType, playerLevel);   // v2.0 신규
    subscribePlanetCallbacks();
  },
  () => {
    aiVirtualPlayerStore.dispose();    // v2.0 신규 — 순서 중요: Skia 해제 전
    disposePlanetSkiaResources();
    cancelAllAnimationFrames();
    unsubscribeCallbacks();
  }
);
```

### 8-2. dispose() 체이닝 — 자원 등록과 해제는 항상 쌍으로

```typescript
// ✅ 올바른 패턴
useEffect(() => {
  const rafId = requestAnimationFrame(renderLoop);
  const subscription = eventEmitter.addListener('step', onStep);
  return () => {
    cancelAnimationFrame(rafId);
    subscription.remove();
  };
}, []);

// ❌ 금지 패턴 (cleanup 없음)
useEffect(() => {
  requestAnimationFrame(renderLoop); // rafId 저장 안 함 → 취소 불가
}, []);
```

### 8-3. 스토어 생명주기 (v2.0 업데이트)

```typescript
// ✅ 허용: 현재 행성 세션 데이터
planetMemoCache.set('nearbyNpcs', [...]);

// ❌ 금지: 영속 데이터를 memoCache에 저장
planetMemoCache.set('playerProfile', profile); // → planetCoreRuntimeStore 사용

// ❌ 금지: AI 가상유저 데이터를 Firestore에 저장
// AI 가상유저는 로컬 aiVirtualPlayerStore 전용
```

| 스토어 | 생명주기 | dispose 대상 | 용도 |
|--------|----------|-------------|------|
| `staticTableStore` | 앱 전체 | ❌ 제외 | CSV 정적 인덱스 |
| `planetCoreRuntimeStore` | 앱 전체 | ❌ 제외 | AABS 보정값, 영속 상태 |
| `planetMemoCache` | 행성 세션 | ✅ 포함 | 휘발성 세션 캐시 |
| `aiVirtualPlayerStore` | 행성 세션 | ✅ 포함 **(v2.0 신규)** | AI 가상유저 로컬 상태 |

### 8-4. RN Animated 관리 규칙

```typescript
// ✅ 올바른 패턴
const animX = useRef(new Animated.Value(0)).current;
useEffect(() => {
  const anim = Animated.loop(Animated.sequence([...]));
  anim.start();
  return () => {
    anim.stop();
    animX.setValue(0);
  };
}, []);

// ❌ 금지: 렌더마다 new Animated.Value() 생성 → 메모리 누수
const animX = new Animated.Value(0); // 직접 선언 금지
```

**위치 이동 규칙**: `transform: [{ translateX }, { translateY }]` 사용 (`left`/`top` layout 금지)

### 8-5. 누수 의심 패턴 체크리스트 (v2.0 업데이트)

```
□ useEffect에 return cleanup 함수가 없는 경우
□ setInterval / setTimeout의 clearInterval 누락
□ requestAnimationFrame의 cancelAnimationFrame 누락
□ Animated.loop().start() 후 .stop() 없는 경우
□ EventEmitter.addListener() 후 .remove() 없는 경우
□ combatOrbitPostStepRef.current = null 미실행
□ Navigation.navigate() 사용 (replace() 미사용)
□ planetMemoCache.clear() 미호출
□ Skia canvas dispose() 미호출
□ [v2.0 신규] aiVirtualPlayerStore.dispose() 미호출 (Stage 1·2 이탈 시)
□ [v2.0 신규] AI 가상유저 데이터를 Firestore에 저장하는 코드
```

### 8-6. 메모리 디버깅 가이드

```bash
# 메모리 상태 감사
npm run audit:memory

# 밸런스 + 메모리 동시 감사
npm run audit:balance && npm run audit:memory
```

```typescript
// 코드 내 체크포인트 (DEV 모드 한정)
if (__DEV__) {
  global.gc?.();
  console.log(`[MEM] ${stageId} disposed. Heap: ${performance.memory?.usedJSHeapSize}`);
  console.log(`[AI] Virtual players disposed: ${aiVirtualPlayerStore.count}`); // v2.0 신규
}
```

---

## 9. 렌더링 파이프라인

### 9-1. Hybrid Rendering 구조 (v2.0 업데이트)

```
┌────────────────────────────────────────┐
│            Rendering Layer             │
├───────────────────┬────────────────────┤
│    Skia Layer     │     RN Layer       │
│                   │                    │
│  • 배경           │  • NPC 마커        │
│  • 대량 수송선    │  • 상호작용 UI     │
│  • AI 가상유저    │  • Animated.       │
│    전함 (v2.0)    │    transform       │
│  • Nebula 효과   │  • Captain 캡션    │
│  • 전투 이펙트    │                    │
│  • Beacon 효과   │                    │
└───────────────────┴────────────────────┘
```

> **v2.0**: AI 가상유저 전함은 실 플레이어 전함과 동일한 Skia 렌더링 파이프라인 사용.  
> RN Layer로 이동 금지 — 대량 객체이므로 Skia Layer에서만 처리.

### 9-2. Combat Sync 메커니즘

```
Physics Simulation
       │
       │  postStepRef 콜백 (구독)  ← 독립 rAF 루프 추가 금지
       ▼
  Skia Renderer  ←  프레임 단위 동기화 보장
```

### 9-3. Skia 레이어 공통 규칙

```typescript
// ① Canvas ref는 언마운트 시 반드시 해제
const canvasRef = useRef<SkiaCanvas>(null);
useEffect(() => {
  return () => { canvasRef.current?.dispose?.(); };
}, []);

// ② Arc packing 업데이트는 시그니처 변경 시에만 실행 (매 프레임 repack 금지)
if (currentSignature !== prevSignatureRef.current) {
  repackArcs();
  prevSignatureRef.current = currentSignature;
}

// ③ 거리 정렬: 매 프레임 sort 금지, 5000ms 간격 스로틀링 준수
const arcShip = arcShipMap.get(shipId); // O(1) — findIndex() 금지

// ④ [v2.0] AI 가상유저 전함도 동일한 arcShipMap 패턴으로 O(1) 조회
const aiShip = aiVirtualPlayerStore.getShipById(aiId); // O(1)
```

### 9-4. Strategic Beacon Engine

유저가 아이템을 월드 좌표에 직접 배치하여 국지적 환경 변화를 유도한다.

| 비콘 종류 | 효과 | 기술 연동 |
|---------|------|---------|
| **유인 비콘 (Lure)** | 특정 레벨대 NPC 및 **AI 가상유저**를 해당 좌표로 유인 | `ArcCore.issueCaptainMoveCommand()` |
| **번영 비콘 (Prosperity)** | 설치 구역 내 자원 채굴 효율 + 드랍 가중치 상향 | `globalMultipliers` 갱신 |

**시각 피드백**: `postStepRef` 콜백을 통해 성운(Nebula) 색상 및 파티클 밀도 실시간 변경

---

## 10. AABS: 능동형 밸런싱 시스템

> ArcCore가 개발자 개입 없이 게임 밸런스를 자동으로 정책 목표치로 수렴시키는 시스템  
> **v2.0**: Sim-Bot이 AI 가상유저 역할을 겸임 — 밸런싱 시뮬레이션과 게임 내 연출을 통합

### 10-1. 연동 원칙

| 원칙 | 내용 |
|------|------|
| **정책 기반 항상성** | `planetCoreRuntimeStore` + AI 가상유저 시뮬레이션 지표로 `level_band_targets.csv` 목표치 수렴 |
| **Table-First 보정** | CSV 정본 수정 금지. 모든 조정은 런타임 스토어의 **GlobalMultiplier**만 사용 |
| **감사 연동** | `npm run audit:balance` 탐지 정책 이탈을 24시간 주기로 자동 보정 |
| **세션 자원 관리** | 분석 데이터는 `planetMemoCache` 활용, 세션 종료 시 자동 정리 |

### 10-2. 핵심 하위 모듈 (v2.0 업데이트)

#### A. AI 가상유저 시뮬레이션 엔진 (v2.0 — Sim-Bot 통합)

> v1.1의 Sim-Bot 200이 v2.0에서 **AI 가상유저 시스템으로 확장**.  
> 두 가지 역할을 동시 수행:
> 1. **AABS 밸런싱**: 전투·무역·탐사 성향 AI가 레벨업 예상 시간 달성 여부 검증
> 2. **게임 내 연출**: 동일한 AI가 화면에 전함으로 렌더링되어 세계 생동감 부여

```typescript
// aiVirtualPlayerStore.ts — v2.0
interface AIVirtualPlayer {
  id: string;
  shipId: string;
  behavior: 'combat' | 'trade' | 'explore';
  levelBand: [number, number];
  position: { x: number; y: number };
  
  // AABS 시뮬레이션 출력
  simMetrics: {
    xpPerHour: number;
    goldPerHour: number;
    levelUpTime: number;
  };
}
```

- 목표 수익/경험치 대비 **20% 이상 격차** 발생 시 `CRITICAL_DRIFT` 플래그 생성
- AI 가상유저 수는 `aiVirtualPlayerDensity.csv` + AABS `aiVirtualPlayerDensity` GlobalMultiplier로 제어

#### B. 성장 곡선 동기화 엔진

- `player_level_exp.csv` 목표 대비 정체 시 경험치 배율 **1.0~1.1x** 범위 내 미세 조정
- `weapon_list.csv` 기반 드랍 가중치 조절로 장비 도달률 관리

#### C. 경제 및 배치 정책 집행기

- 무역소 세금·수리비·채굴 효율 조정으로 시간당 목표 수익 준수
- 권장 레벨 정책 위반 NPC는 아크코어가 `issueCaptainMoveCommand`로 재배치
- [v2.0] AI 가상유저 밀도가 행성 분위기와 불일치 시 `aiVirtualPlayerDensity` 보정

### 10-3. 24시간 자동 운영 스케줄 (v2.1 — 일 1회 배치)

> **정본**: `ArcCoreDailyOpsSubCore` + `tables/balance/arc_core_daily_ops_policy.csv` (기본 12:00 `Asia/Seoul`).  
> 고빈도 행성·경제 패스는 **금지** — 관측만 벽시계 틱(`AiNpcSubCore` 등), 재배치는 배치 1회.

```
[24h 관측]  궤도 수송·planetDevelopmentAcc 누적·플레이어 상호작용 (실시간 틱)
     ↓
[배치 1회]  runArcCoreDailyOpsBatch()
  1. Observe  : 누적 지표 + audit:daily (수동/CI)
  2. Analyze  : level_band_targets · AABS Sim-Bot · 행성 코어 편차
  3. Execute  : planetCoreRuntimeStore · 무역소 시나리오 · AABS · 성계 개방(정책 on 시)
  4. Verify   : 다음일 배치 전 drift · Guardian Safe Mode
```

### 10-4. 보정 제약 및 안전장치

| 항목 | 규칙 |
|------|------|
| **보정폭** | 1회 최대 **5%**, 누적 최대 **±15%** |
| **미구현 제외** | `effectPending` / `pending` 상태 아이템은 보정 대상 제외 |
| **Safe Mode** | 임계치 초과 시 `safeModeEnabled` 가동 → 배율 **1.0** 강제 복구 |
| **[v2.0] AI 밀도 제한** | AI 가상유저 수 보정 1회 최대 **10명**, 누적 최대 **±30명** |

---

## 11. AGDS: 자율형 개발 운영 시스템

> Cursor와 ArcCore가 상호작용하여 코드 수정·테이블 갱신·밸런스 최적화를 자율 수행

### 단계별 구현 목표

| 단계 | 명칭 | 핵심 내용 |
|------|------|---------|
| **Stage 1** | 데이터 중심 자율 분석 엔진 | `audit:balance` 결과를 `logic_input.json`으로 병렬 출력 + 의사결정 트리 구축 |
| **Stage 2** | 테이블 자동 패치 | `dynamic_overlay.csv` 자동 생성 + `reloadTableIndices` 핫스왑 + Git 자동 커밋 |
| **Stage 3** | 커서 연동 코드 수정 | 성능 병목 감지 시 `.cursorrules` / `optimization_guide.md` 자동 생성 |
| **Stage 4** | 실시간 DB 동기화 | `planetCoreRuntimeStore` 변경 브로드캐스트 + 유저 데이터 안전 병합 |
| **Stage 5** | 자율형 루프 + Guardian | 24시간 Cron Job + 경제 붕괴 감지 시 즉시 롤백 |

### 자율 구동 시나리오 (v2.0)

```
1. 관측: AABS → AI 가상유저 시뮬레이션에서 유저 성장이 로드맵보다 느림 → JSON 보고
2. 분석: ArcCore → 경험치 보상 15% 부족 판단
3. 수정: dynamic_overlay.csv 생성 → 경험치 배율 1.15 자동 적용
4. 적용: 인덱싱 엔진이 실시간 새 배율 로드 → 모든 행성 반영
5. 확인: 다음날 시뮬레이션에서 성장 속도 정상 범위 복구 확인
```

---

## 12. Post-AABS 운영 로드맵

### 추가 작업 (Launch 전)

**A. AI 가상유저 행동 정밀도 향상**
- 특정 레벨 구간 체류 시간이 정책 대비 **1.5배** 이상 시 AI 가상유저 난이도 계수 자동 하향
- 어뷰징 채굴·비정상 무역 감지 시 해당 지역 보정 계수 즉시 긴급 조정

**B. 자연스러운 플레이 유도 (UX/Onboarding)**
- 미션-밸런싱 연동: 유저 전투력 부족 시 주변에 약한 AI 가상유저·고효율 잔해 자동 배치
- 동적 튜토리얼: 성장 속도 현저히 느릴 경우 인게임 가이드 시스템 활성화

**C. 생태계 고도화**
- AI 가상유저 밀도 자동 조절 (행성 특성·플레이어 레벨·시간대 기반)
- 특정 진영 AI 과강세 시 AI 세력 배치 빈도 조절로 세계관 긴장감 유지
- [v2.0] 실유저 없이도 살아있는 세계 연출 — AI 가상유저 행동 패턴 다양화

### Roadmap to Launch

| 단계 | 작업 항목 | 핵심 내용 |
|------|---------|---------|
| **Stage 1** | AI 가상유저 행동 튜닝 | Sim-Bot 데이터 → 실제 플레이어 초기 테스트 데이터로 교체 |
| **Stage 2** | 이벤트 시스템 연동 | 특정 기간 AABS 배율 강제 조정 이벤트 모드 구현 |
| **Stage 3** | 통합 감사 대시보드 | `audit:balance` 결과 웹 대시보드 시각화 |
| **Stage 4** | 글로벌 서버 최적화 | 지역별(한국/일본/동남아) 세그먼트 밸런싱 적용 |

---

## 13. 파일 구조 (v2.1 — 구현 정본)

```
app/(game)/                    ← Expo Router 스테이지 (구 screens/)
  planet.tsx                   ← STAGE 1 · useStageMemory
  worldmap.tsx                 ← STAGE 2
  combat.tsx                   ← STAGE 3
  trade|shipyard|tavern|...    ← SUB-STAGE · usePlanetSubStageMemory

src/
├── arcCore/                   ← 아크코어 허브·서브코어·명령 버스
│   ├── ArcCoreHub.ts
│   ├── subcores/
│   │   ├── ArcCoreDailyOpsSubCore.ts   ← 일 1회 운영 배치
│   │   ├── AiNpcSubCore.ts             ← 궤도·수송 (실시간)
│   │   ├── AiPlanetsSubCore.ts         ← 코어 DB 부트스트랩
│   │   └── AiEconomySubCore.ts         ← 무역소 명령 실행
│   └── schedule/
│       ├── runArcCoreDailyOpsBatch.ts
│       └── arcCoreDailyOpsPolicy.ts    ← arc_core_daily_ops_policy.csv
├── game/
│   ├── buildCsvStaticIndexes.ts        ← Table-First 부트 1회 (구 staticTableStore 개념)
│   ├── planetSessionRegistry.ts
│   └── planetMemoCache.ts
├── hooks/
│   ├── useStageMemory.ts
│   ├── usePlanetSubStageMemory.ts
│   └── useDisposable.ts
├── components/planet/
│   ├── PlanetEdenRaidOrbitSkiaCombat.tsx  ← 전투 렌더 정본
│   └── PlanetEdenRaidTestLayer.tsx        ← 시뮬 (분할 백로그)
├── npc/
│   └── nearbyOrbitPresenceSystem.ts       ← 궤도 INFO·보충 (CSV 인덱스)
└── store/
    └── planetCoreRuntimeStore.ts          ← 행성 5지표 런타임 정본

tables/
├── content/                   ← NPC·함선·행성 CSV
└── balance/
    ├── arc_core_daily_ops_policy.csv
    └── aiVirtualPlayerDensity.csv   ← AABS 밀도 파라미터 (스토어는 미분리)
```

> **v2.0 설계 대비**: `aiVirtualPlayerStore` / `src/ai/*` 는 **미구현**. 세계 밀도 연출은 **NPC CSV + AiNpcSubCore 수송 + orbit presence** 로 대체 — §18 참조.

---

## 14. 절대 금지 사항 (Do Not Drift) — v2.0

아래 항목은 **어떠한 이유로도** 변경하거나 우회하지 않는다.

```
① CSV 정본 데이터 직접 수정 금지 → AABS GlobalMultiplier만 사용
② Navigation.navigate() 사용으로 스택 누적 금지 → replace() 강제
③ Combat Skia에 독립 rAF 루프 추가 금지 → postStepRef 콜백 방식 유지
④ 미사일 탄두 제거 조건(!m.hitApplied) 변경 금지
⑤ 거리 정렬을 매 프레임 실행 금지 → INFO_DISTANCE_SORT_INTERVAL_MS 준수
⑥ NPC 마커 위치 이동을 layout left/top 방식으로 변경 금지 → transform 유지
⑦ arc 조회를 findIndex() O(n)으로 구현 금지 → Map O(1) 유지
⑧ AABS 보정폭 1회 5% / 누적 ±15% 초과 금지

[v2.0 신규]
⑨ AI 가상유저 데이터를 Firestore에 저장 금지 → 로컬 aiVirtualPlayerStore 전용
⑩ AI 가상유저를 RN Layer에서 렌더링 금지 → Skia Layer 전용 (성능 보호)
⑪ Stage 1·2 이탈 시 aiVirtualPlayerStore.dispose() 생략 금지 → 메모리 누수
⑫ AI 가상유저와 NPC를 동일 스토어에서 관리 금지 → 역할 분리 유지
⑬ 실유저 간 채널 동기화 코드 재도입 금지 → v2.0 설계 원칙 위반
```

---

## 15. Cursor 개발 체크리스트 (v2.0)

> **구현 추적**: `docs/V2_SINGLE_PLAYER_IMPLEMENTATION.md` (2026-05 갱신)

### P0 — 즉시 수정 (크래시 직결)

- [x] `Navigation.navigate()` → `Navigation.replace()` 전환 (주요 스테이지·왕복 페어)
- [x] `combatOrbitPostStepRef.current = null` (전투 종료 — `combatStageMemory` / SkiaCombat)
- [x] `PlanetEdenRaidOrbitSkiaCombat` 언마운트 시 postStep 해제
- [x] `orbitClockMs` rAF — `registerPlanetOrbitClockMs` / blur 시 정지
- [x] Stage 1 이탈 세션 dispose — `releasePlanetMainStageSession` / `planetSessionRegistry`

### P1 — 구조 보강 (반복 누수 방지)

- [x] `useStageMemory` — `planet` / `worldmap` / `combat`
- [x] `planetMemoCache` — `releasePlanetMainStageSession`
- [x] 거리 정렬 5000ms — `INFO_DISTANCE_SORT_INTERVAL_MS` (행성 허브)
- [ ] `UserModController` ArcCore 부트스트랩 주입 (`applyPolicyShift` — 부분: `planetPolicyMultiplierStore`)
- [ ] `StrategicBeacon` → `postStepRef` nebula 구독
- [x] `aiVirtualPlayerDensity.csv` (balance) + `buildCsvStaticIndexes`
- [ ] `aiVirtualPlayerStore` / `AIVirtualPlayerSpawner` — **미구현**; `AiNpcSubCore` + `npc_ai_*` CSV로 대체 (§18)
- [x] 궤도 presence·수송 — `nearbyOrbitPresenceSystem` + `listArcNpcTrafficRowsFromTables`

### P2 — 확장성 (신규 콘텐츠 대비)

- [x] `useDisposable` (`src/hooks/useDisposable.ts`)
- [ ] SUB-STAGE Modal cleanup 표준 문서화
- [ ] DEV 메모리 체크포인트
- [x] `audit:daily` / `audit:balance` / `audit:memory` (20/20 계약)
- [x] AABS Sim-Bot 200 + `runDailyPolicyAlignment` (일일 배치 내)
- [ ] `AIVirtualPlayerSimMetrics` 전용 모듈 — Sim-Bot으로 부분 대체

### P3 — v2.0 신규 설계 확인 사항 (v1.1 공백 해소 후 잔여)

- [x] **AI 가상유저 수**: `aiVirtualPlayerDensity.csv` (zone별 baseCount)
- [ ] **메모리 200MB 검증**: 기기 실측 필요
- [x] **Galaxy Map**: 축소 풀 `spawnAIVirtualPlayersForGalaxyMap` (최대 4)

### 최종 목표 점검

- [ ] 모든 성계 `enemyLevel`이 유저 레벨과 유기적으로 반응하는가? (AABS·테이블 — 지속 운영)
- [ ] ArcCore 함장 이동 명령이 물리적으로 타당하고 자연스러운가?
- [ ] 인플레이션 없이 유저가 지속적으로 장비를 교체할 동기가 부여되는가?
- [ ] 전투 반복 후 메모리가 목표 예산 이내로 유지되는가? (실기기 프로파일 필요)
- [x] 궤도·스캔 연출 (NPC/수송 CSV, Firestore 없음)
- [x] 행성 세션 dispose (`releasePlanetMainStageSession`)
- [x] **v2.1** `ArcCoreDailyOpsSubCore` 일 1회 배치 (`arc_core_daily_ops_policy.csv`)

---

## 16. 전체 플로우차트 (Mermaid) — v2.0

```mermaid
graph TD
    %% 초기화
    START([App Launch]) --> INIT[RN & ArcCore Init]
    INIT --> TABLE_IDX[Build CSV Static Indexes - O1\n+ aiVirtualPlayerDensityMap]
    TABLE_IDX --> SPLASH[Start Screen]

    %% 인증
    SPLASH --> DB_CONN{Firestore Access}
    DB_CONN -- 기존유저 --> SESSION[Register Planet Session Resource]
    DB_CONN -- 신규유저 --> STORY[Story Mode] --> SESSION

    %% AI 가상유저 생성
    SESSION --> SPAWN_AI[spawnAIVirtualPlayers\nCSV 밀도 기준 로컬 생성]
    SPAWN_AI --> MAIN_STAGE[Main Stage Hub - Stage 1]

    subgraph Hub_Optimization [Stage 1: Optimization & Rendering]
        MAIN_STAGE --> SKIA_LAYER[Skia: 수송선 + AI 가상유저 전함 + Nebula]
        MAIN_STAGE --> RN_ANIM[RN Transform: NPC 마커 전용]
        MAIN_STAGE --> SORT_INFO[Distance Sort: 5000ms Interval]
        MAIN_STAGE --> GOVERNOR[Governor System: Policy Decision]
        MAIN_STAGE --> BEACON[Strategic Beacon Engine]
        MAIN_STAGE --> AI_SIM[AI Virtual Player Behavior Loop\n로컬 시뮬레이션]
    end

    %% 출격
    MAIN_STAGE -- "aiVirtualPlayerStore.dispose()\nNavigation.replace()" --> GALAXY_MAP[Galaxy Map - Stage 2]

    %% 이동
    GALAXY_MAP --> MOVE[Moving: beginPlanetHubSuspendingNavigation]
    MOVE --> CHK_BATTLE{AI 가상유저\n전투 조우?}

    %% 전투 파이프라인
    subgraph Combat_Pipeline [Stage 3: Combat Rendering Pipeline]
        BATTLE_UI[PlanetEdenRaidOrbitSkiaCombat]
        SIM_STEP[Simulation Step] -->|postStepRef Callback| RENDER_SYNC[Skia Render Sync]
    end

    CHK_BATTLE -- Yes --> BATTLE_UI
    BATTLE_UI --> WIN_LOSE{Battle End}
    WIN_LOSE --> DISPOSE_COMBAT[Dispose: Skia + rAF + Callbacks] --> MOVE

    CHK_BATTLE -- No --> CHK_ENEMY{행성 적 존재?}
    CHK_ENEMY -- Yes --> BATTLE_UI

    %% 복귀
    CHK_ENEMY -- No --> RESET_SESSION[Clear Memo & Dispose Local Assets]
    RESET_SESSION -- "Navigation.replace()" --> SPAWN_AI

    %% AABS 24h 루프
    subgraph AABS_Loop [AABS: 24h Policy Alignment]
        OBS[Observe: AI Virtual Player Sim + User Log] --> ANALYZE[Analyze: Policy Drift Check]
        ANALYZE --> EXECUTE[Execute: Update GlobalMultiplier\n+ aiVirtualPlayerDensity]
        EXECUTE --> VERIFY[Verify: Next Cycle Convergence]
    end

    MAIN_STAGE -.->|Daily Trigger| AABS_Loop

    %% 종료
    MAIN_STAGE --> EXIT[Exit Game]
    EXIT --> DISPOSE_ALL[Dispose All Session Resources\n+ aiVirtualPlayerStore.dispose()]
    DISPOSE_ALL --> SPLASH
```

---

## 17. BM 개발 구현 개요 (Business Model)

> **출처**: 아크파이어_BM.docx 분석 기반  
> **v2.0 변경사항**: 싱글플레이 전환으로 BM 구조 자체는 유지되나, 채널/멀티 관련 지표 제거

---

### 17-1. BM 4축 구조 요약

| 축 | 핵심 상품 | 가격대 | 목표 매출 비중 | 개발 우선순위 |
|----|---------|--------|-------------|------------|
| 주력 매출 | 시즌패스 (50레벨 트랙) | US$9.99~14.99 | 30~40% | **P0** |
| 안정 매출 | VIP Basic / Plus / Max | US$4.99~12.99/월 | 15~25% | **P0** |
| 첫 결제 | 스타터팩 10종 | US$0.99~9.99 | — (전환율 지표) | **P1** |
| 피크 매출 | 이벤트 상점 | US$0.99~49.99 | 10~20% | **P1** |
| 보조 매출 | 리워드 광고 | 낮음 | 5~10% | **P2** |

---

### 17-2. 스테이지별 과금 포인트 매핑

| 스테이지 | 과금 상품 | 진입 방식 | 개발 주의사항 |
|---------|---------|---------|------------|
| **Stage 1 Planet Hub** | 시즌패스, VIP, 성장팩, 일일 상점 | `Modal.present()` — SUB-STAGE | Hub rAF + AI 가상유저 루프 유지, Modal 자체 cleanup 보장 |
| **Stage 2 Galaxy Map** | 이동권, 탐사 티켓, 에너지 회복 | 이동 비용 시스템 내 인라인 노출 | 이동 비용 수치는 반드시 CSV Table에서 O(1) 조회 |
| **Stage 3 Combat** | 재도전권, 부활권, 전투 버프, 드랍 부스트 | 전투 종료 팝업 | **`dispose()` 완료 이후에만 노출** — 메모리 초과 방지 |

> ⚠️ **절대 금지**: Combat Skia canvas `dispose()` 실행 전에 상점 Modal을 여는 것 금지. 메모리 예산(250MB) 초과 크래시 발생 위험.

---

### 17-3. 필요 데이터 테이블 (Table-First 원칙 적용)

| 테이블 파일명 | 역할 | AABS 보정 가능 여부 |
|-------------|------|:-----------------:|
| `season_pass_rewards.csv` | 시즌패스 50레벨 무료·유료 트랙 보상 정의 | ✅ 재화·배율 보정 |
| `vip_benefits.csv` | VIP 3등급 혜택 수치 | ❌ 구독 약관 기반 고정 |
| `iap_products.csv` | 스타터팩·이벤트 상품 구성 및 스토어 가격 | ❌ 스토어 정책 고정 |
| `event_shop.csv` | 이벤트 상점 상품 목록·기간·재고 | ✅ 라이브옵스 교체 |
| `purchase_funnel.csv` | 유저 여정 단계별 상품 노출 트리거 조건 | ✅ A/B 테스트 파라미터 |
| `aiVirtualPlayerDensity.csv` | **[v2.0 신규]** 행성 타입별 AI 가상유저 밀도 | ✅ AABS 밀도 보정 |

---

### 17-4. Firestore 스키마 확장

```typescript
// Firestore: arcfire_player_v1 추가 필드
interface PlayerBMData {
  seasonPass: {
    seasonId: string;
    isPremium: boolean;
    currentLevel: number;
    claimedRewards: string[];
    expiresAt: Timestamp;
  };

  vip: {
    tier: 'none' | 'basic' | 'plus' | 'max';
    subscribedAt: Timestamp | null;
    expiresAt: Timestamp | null;
    dailyBonusClaimedDate: string | null;
  };

  firstPurchaseFunnel: {
    funnelStage: number;
    firstPurchaseAt: Timestamp | null;
    purchasedPackIds: string[];
    shownOfferIds: string[];
  };

  // [v2.0] AI 가상유저 관련 데이터는 여기 포함하지 않는다
  // AI 가상유저 상태는 로컬 aiVirtualPlayerStore 전용
}
```

---

### 17-5~17-12. (BM 나머지 섹션)

> 17-5 런타임 스토어 역할 분담 / 17-6 VIP 혜택 런타임 연동 / 17-7 시즌패스 시스템 /  
> 17-8 첫 결제 퍼널 / 17-9 AABS 매출 지표 연동 / 17-10 리워드 광고 제약 /  
> 17-11 개발 체크리스트 / 17-12 BM 절대 금지 사항  
>
> ✅ **v2.0에서 변경 없음** — 채널 동기화를 전제로 한 항목이 없으므로 그대로 유지.  
> 단, 17-9 AABS 매출 지표의 `stageDropRate` 측정 기준이 **실유저 단독 행동 기반**으로 자동 적용됨.

---

### BM 관련 절대 금지 사항

```
⑨ Combat Skia dispose() 완료 전 상점 Modal 진입 금지 → 메모리 초과 크래시
⑩ CSV 정본(season_pass_rewards.csv 등) 직접 수정 금지 → GlobalMultiplier 경유
⑪ VIP 혜택에 전투력 직결 배율 추가 금지 → AABS level_band_targets와 충돌
⑫ Stage 3 Combat 중 리워드 광고 SDK 호출 금지 → rAF 루프 간섭
⑬ planetMemoCache에 VIP 등급 저장 금지 → 세션 종료 시 소멸, Firestore 사용
⑭ [v2.0] AI 가상유저 BM 지표를 실유저 지표와 혼산 금지 → AABS 보정 오염
```

---

*본 문서는 아크파이어의 최상위 기술 정책 문서이며, 모든 추가 개발은 본 명세서의 규칙을 최우선으로 따른다.*  
*신규 콘텐츠 추가 또는 렌더링 변경 전 반드시 본 문서를 참조한다.*

---

## 18. v2.1 구현 정본 (Implementation Truth) — 2026-06-08

> 스펙 v2.0의 **의도**는 유지하되, 아래가 **코드·커서 규칙·AGENTS.md** 와 일치하는 실제 정본이다. 충돌 시 **본 절 + `.cursor/rules/arcfire-online.mdc`** 가 우선한다.

### 18-1. 세계 밀도·궤도 연출 (AI 가상유저 대체)

| v2.0 문서 명칭 | 구현 정본 |
|----------------|-----------|
| `aiVirtualPlayerStore` | **없음** — 세션 dispose는 `releasePlanetMainStageSession` + orbit/combat sim cleanup |
| `spawnAIVirtualPlayers()` | `AiNpcSubCore` 궤도 수송 + `nearbyOrbitPresenceSystem` (CSV 함장·`arcOrbitPresenceFill`) |
| `aiVirtualPlayerDensity.csv` | `tables/balance/aiVirtualPlayerDensity.csv` — AABS·밸런스 참조용; 전용 Zustand 스토어 없음 |

### 18-2. 아크코어 운영 주기

| 구분 | 모듈 | 주기 |
|------|------|------|
| 관측 | `AiNpcSubCore`, `planetDevelopmentAccStore` | 벽시계 틱 (연출) |
| 재배치 | `ArcCoreDailyOpsSubCore` → `runArcCoreDailyOpsBatch` | **일 1회** (기본 12:00) |
| AABS | `runDailyPolicyAlignment` | 배치 내 1회 (Guardian·5% 규칙 유지) |
| 월드 확장 | `tryArcCoreWorldDailyUnlock` | 배치 내 (24h 간격 가드) |

### 18-3. 정적 테이블

- 부트: `buildCsvStaticIndexes()` (`app/_layout.tsx` 1회)
- 조회: `npcFleetRegistry`, `balanceTableRegistry`, `arcNpcTrafficTableRegistry` 등 **모듈별 Map 1회**

### 18-4. 메모리·보안 감사

```bash
npm run audit:memory    # 스테이지 계약 20항목
npm run audit:daily     # tsc·타이머 후보·대용량 파일
```

- 리스크·완화: [`ARCHITECTURE_RISK_REGISTER.md`](./ARCHITECTURE_RISK_REGISTER.md)
- 전수 검사: [`Arcfire_Architecture_Audit_2026-06-08.md`](./Arcfire_Architecture_Audit_2026-06-08.md)

### 18-5. 알려진 기술 부채 (P1)

1. `PlanetEdenRaidTestLayer.tsx` — 레거시 `PlanetEdenRaidOrbitSvgRafCombat` 블록 **미사용** (Skia 정본만 활성)
2. `functions/` — `audit:daily` tsc 노이즈 (클라이언트와 분리 필요)
3. 메모리 200MB 목표 — **실기기 프로파일 미완** (`audit:memory`는 정적 계약만)

---

**Arcfire Architecture Master Spec v2.1 — END**
