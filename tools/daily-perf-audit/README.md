# 일일 성능·위생 점검 (`audit:daily`)

아크코어 완성 전 단계에서 **불필요한 메모리·비효율 후보를 주기적으로 잡기 위한 자동 분석**입니다.  
**코드를 자동으로 대량 수정하지 않습니다.** 보고서를 보고 에이전트·인간이 수정합니다.

## 실행

```bash
npm run audit:daily
```

결과: `reports/latest.md` (및 `latest.txt`).

## 1일 1회 자동화

### A) GitHub에 푸시하는 경우

`.github/workflows/daily-performance-audit.yml` — 매일 UTC 15:00 (한국 시간 자정에 가깝게 조정 가능) + 수동 `workflow_dispatch`.

아티팩트로 `reports/latest.md` 업로드.

### B) 로컬 PC (Windows 작업 스케줄러)

관리자 PowerShell에서 저장소 루트 경로를 본인 환경에 맞게 바꿉니다.

```powershell
$repo = "D:\ArcfireOnline"
schtasks /Create /TN "ArcfireOnline_DailyAudit" /TR "powershell -NoProfile -ExecutionPolicy Bypass -Command `"cd '$repo'; npm run audit:daily`"" /SC DAILY /ST 09:00 /F
```

- `/ST 09:00`: 매일 09:00 로컬 시각 실행 — 원하면 변경.
- 실패 시 작업 스케줄러 기록에 남고, CI와 동일하게 `tsc`·콘텐츠 빌드 실패 시 exit code 1.

### C) Cursor / 에이전트

정기 작업 대신 수동으로 `npm run audit:daily` 후 `reports/latest.md`를 열어 항목별 수정.

## 점검 내용

| 단계 | 목적 |
|------|------|
| `tsc --noEmit` | 타입·데드 경로 등 기본 안전 |
| `build:content-tables` | CSV 정본과 생성 TS 불일치 조기 발견 |
| 대용량 TS/TSX | 분할·지연 로딩 후보 |
| `setInterval` 목록 | 타이머 정리 누락 후보 |
| `subscribe` / `addEventListener` | 구독·리스너 해제 검토 후보 |
| `depcheck` (선택) | `AUDIT_RUN_DEPCHECK=1 npm run audit:daily` — 미사용 의존성 힌트 (RN/Expo 오탐 가능) |

## 확장

- ESLint + `eslint-plugin-react-hooks` 도입 후 같은 워크플로에 `npm run lint` 추가.
- 번들 분석: `npx expo export` + 시각화는 CI 시간이 길어지므로 주간 워크플로로 분리 권장.
- 아크코어 범위를 Cursor 에이전트에 넘기려면: **`npm run audit:arc-self-optimize:pack`** (`../arc-core-self-optimize/README.md`).
