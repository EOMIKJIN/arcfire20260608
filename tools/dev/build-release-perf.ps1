# release 측정 빌드 원커맨드 — 김플레이 2026-10-10
# 용도: 테스트·검수 단계(실기 메모리·성능 판정). 구현 단계는 개발 빌드(npm run android + Metro)를 쓴다.
#
#   powershell -ExecutionPolicy Bypass -File tools/dev/build-release-perf.ps1            # 측정 빌드 + 설치 + 실행
#   powershell -ExecutionPolicy Bypass -File tools/dev/build-release-perf.ps1 -NoInstall # 빌드만
#   powershell -ExecutionPolicy Bypass -File tools/dev/build-release-perf.ps1 -Plain     # 측정 플래그 없는 일반 release(출시 전 확인용)
#
# 오늘 실제로 겪은 함정을 자동 처리한다.
#  1) 측정 로그는 플래그 2개가 모두 필요하다: EXPO_PUBLIC_ARC_PERF_LOG=1(console 유지) + EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1([MEM_PROFILE]).
#  2) Gradle은 환경변수 변경을 감지하지 못해 JS 번들 단계를 UP-TO-DATE로 건너뛴다 → --rerun으로 강제한다.
#  3) Metro 변환 캐시와 Gradle 데몬이 이전 환경변수를 재사용할 수 있다 → 데몬을 재시작한다.
#  4) 번들 안의 문자열로 플래그가 반영됐는지 검증한다(측정: MEM_PROFILE ≥ 1 / 일반: arc-hitch-min = 0).
param(
  [switch]$NoInstall,
  [switch]$Plain
)
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot)
Set-Location $root
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$logDir = Join-Path $root 'tools/play-bot-console/logs/soak'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir "release-build-$stamp.log"

if ($Plain) {
  Remove-Item Env:EXPO_PUBLIC_ARC_PERF_LOG -ErrorAction SilentlyContinue
  Remove-Item Env:EXPO_PUBLIC_ARCFIRE_MEM_PROFILE -ErrorAction SilentlyContinue
  $metroCache = Join-Path $env:TEMP 'metro-cache'
  if (Test-Path $metroCache) { Remove-Item -Recurse -Force $metroCache }
  Write-Host '[build] 일반 release(측정 플래그 없음) — Metro 캐시 비움'
} else {
  $env:EXPO_PUBLIC_ARC_PERF_LOG = '1'
  $env:EXPO_PUBLIC_ARCFIRE_MEM_PROFILE = '1'
  Write-Host '[build] release 측정 빌드(PERF_LOG + MEM_PROFILE)'
}

$manifest = Join-Path $root 'android/app/src/main/AndroidManifest.xml'
if ((Test-Path $manifest) -and (Select-String -Path $manifest -Pattern 'profileable' -Quiet)) {
  Write-Warning '[build] 로컬 매니페스트에 진단 플래그 <profileable>가 있다 — 측정용으로는 정상, 출시 빌드 전에는 반드시 제거.'
}

Push-Location (Join-Path $root 'android')
try {
  .\gradlew.bat --stop *> $null
  .\gradlew.bat :app:createBundleReleaseJsAndAssets --rerun --console=plain *> $log
  if ($LASTEXITCODE -ne 0) { throw "번들 단계 실패 — $log" }
  .\gradlew.bat assembleRelease --console=plain *>> $log
  if ($LASTEXITCODE -ne 0) { throw "assembleRelease 실패 — $log" }
} finally {
  Pop-Location
}

$bundle = Join-Path $root 'android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle'
$txt = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($bundle))
$memProfile = ([regex]::Matches($txt, 'MEM_PROFILE')).Count
$hitchMin = ([regex]::Matches($txt, 'arc-hitch-min')).Count
Write-Host "[build] 번들 검사: MEM_PROFILE=$memProfile arc-hitch-min=$hitchMin"
if (-not $Plain -and $memProfile -lt 1) { throw '측정 플래그가 번들에 반영되지 않았다(MEM_PROFILE=0).' }

$apk = Join-Path $root 'android/app/build/outputs/apk/release/app-release.apk'
Write-Host "[build] APK: $apk ($([math]::Round((Get-Item $apk).Length/1MB,1))MB) · 로그: $log"
if ($NoInstall) { return }

adb install -r $apk
if ($LASTEXITCODE -ne 0) { throw 'adb install 실패 — 기기 연결(adb devices)을 확인' }
adb shell monkey -p com.arcfire.online -c android.intent.category.LAUNCHER 1 *> $null
Write-Host '[build] 설치·실행 완료'
