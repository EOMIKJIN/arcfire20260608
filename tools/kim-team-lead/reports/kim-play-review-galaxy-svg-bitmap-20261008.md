# 김플레이 검수 — 은하 지도 SVG 비트맵 복사 (2026-10-08)

작성: 김팀장. 검수: 김플레이. 코드 수정은 김팀장만.

## 판정 요청

pid 14101이 은하 지도에 머무는 동안 PSS가 한 번에 올라간 뒤 45분 이상 내려오지 않은 원인. 계단이 계속 오르는 누수가 아니라, **같은 크기 SVG 비트맵이 다시 그려질 때마다 이전 버퍼가 남는 것**.

## 실측 (pid 14101, 지도 체류)

| 시각 | PSS | GL | native heap | views |
|---|---:|---:|---:|---:|
| 17:14 허브 | 808.6 | 52.5 | 307.4 | 360 |
| 17:30 지도 | 1388.8 | 179.1 | 757.1 | 197 |
| 18:18 지도 | 1371.6 | 179.2 | 749.6 | 200 |

17:27:54 이후 지도에 고정. deep reclaim은 반복 실행됐고 GL/native는 움직이지 않았다.

dumpsys + smaps:

- `SvgView` 1개, 크기 `4598×5034`
- 그 크기 ARGB = 90416KB (88.3MB)
- scudo secondary에 **같은 90416KB 블록 15개**. RSS가 가득 찬 것은 5개 (약 441MB)
- dumpsys `Bitmap (malloced)` 1356231KB ≈ 15 × 90416KB
- Java 힙 dump에는 `android.graphics.Bitmap` 인스턴스 0개. 픽셀은 SvgView가 recycle 후 새로 `createBitmap` 하면서 scudo에 남은 것
- 허브 native +450MB와 이 5장의 상주분이 맞다. GL +127MB는 그 비트맵의 GPU 복사 1장

`hubSkia=true` 로그는 reclaim 옵션이다. 허브 Skia가 살아 있다는 뜻이 아니다.

## 수정

`react-native-svg` `SvgView`: 크기가 같으면 비트맵을 버리지 않고 지운 뒤 다시 그린다. 크기가 바뀌거나 detach될 때만 recycle.

- 파일: `node_modules/react-native-svg/android/src/main/java/com/horcrux/svg/SvgView.java`
- 패치: `patches/react-native-svg+15.12.1.patch`
- 성계명 래스터 배율(`GALAXY_MAP_SVG_RASTER_SCALE = 1`)은 그대로다
- 새 타이머, store, `planetMainStageLayout` 변경 없음

Java 수정이라 Metro `r`로는 반영되지 않는다. 다음 debug APK 설치 후에만 기기에서 효과가 있다.

```text
[pss-pre-dev] hot_path=SvgView invalidate (기존 redraw) alloc=same-size createBitmap 제거 cache=bitmap 1장 재사용
[pss-pre-dev] stage=galaxy_map 체류 / detach 시 recycle risk=P1 P2
[pss-pre-dev] verdict=PASS
```

## 김플레이 확인

1. 새 APK 설치 후 프로세스 재시작 (지금 pid 14101의 88MB×5는 재시작 전엔 남는다)
2. 허브 idle PSS/GL/native 한 줄
3. 은하 지도 진입 후 3분, 그리고 10분. native가 허브 대비 +88MB 안팎(1장)에서 멈추는지. +400MB로 다시 붙으면 FAIL
4. 지도를 나갔다 다시 들어도 블록이 5장으로 늘지 않는지
5. 성계 이름·점령 라벨이 이전과 같은지 (래스터 배율은 안 바꿈)

스파이 tick·하단 inset·키보드 수정은 이 건과 별개다. 건드리지 않았다.
