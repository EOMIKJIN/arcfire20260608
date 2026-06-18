# 노드복구 (Galaxy Node Restore)

은하지도 미개척 노드 비활성/삭제 작업의 **복구 기준점**과 절차.

## 작업 내역 (2026-06-18)
- 목적: 미네르바↔아이언크로스 **이동 동선/거리 조정**을 위해 미개척 노드 3개 비활성.
- 대상: **미개척-7 / 미개척-12 / 미개척-38** = `synth_007` / `synth_012` / `synth_038`.
- 구현 위치: `src/data/galaxy100.ts` 의 `DISABLED_SYNTH_ORDINALS = new Set([7, 12, 38])`.
  - 연결(엣지) 생성 **이전**에 제외 → 나머지 노드 id·번호·좌표 체계 유지, 경로만 재배선, 노드는 은하지도 비표시.
- CSV·저장데이터 무변경. `synth_033·073`(DEV 특수) 무관.

## 스냅샷 (변경 직전 원본)
- `tools/node-restore/galaxy100.snapshot-20260618.ts.bak` — 변경 직전 `src/data/galaxy100.ts` 전체 사본.

## '노드복구' 명령 시 절차
사용자가 **"노드복구"** 라고 하면 아래 중 하나로 **변경 직전 상태로 원복**한다.

### 방법 A — 비활성만 해제(권장, 최소 변경)
`src/data/galaxy100.ts` 에서:
```ts
export const DISABLED_SYNTH_ORDINALS: ReadonlySet<number> = new Set();
```
→ 3개 노드가 다시 표시되고 경로가 원래대로 재형성됨. (다른 변경이 없었다면 이걸로 충분)

### 방법 B — 스냅샷 전체 원복(구조까지 꼬였을 때)
```powershell
Copy-Item -Path tools/node-restore/galaxy100.snapshot-20260618.ts.bak -Destination src/data/galaxy100.ts -Force
```
→ 변경 직전 `galaxy100.ts` 원본으로 완전 복구.

### 공통 마무리
- `npx tsc --noEmit -p tsconfig.client.json` 통과 확인.
- 적용 반영: JS 변경이므로 리로드(또는 릴리즈 재빌드 시 포함).
