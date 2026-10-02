# 대표님 실기 플레이 원시데이터 수집 — 종료
# 로그 기록 중지 → 플레이 후 저장 DB 복사(after.sqlite) → manifest 마감
$ErrorActionPreference = 'Stop'
$pkg = 'com.arcfire.online'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = Join-Path $root 'logs\learned\human-raw'

$open = Get-ChildItem $base -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path (Join-Path $_.FullName 'capture.pid') } |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $open) { Write-Host '진행 중인 수집 없음'; exit 1 }
$dir = $open.FullName

$capPid = [int](Get-Content (Join-Path $dir 'capture.pid') | Select-Object -First 1)
try { & taskkill /T /F /PID $capPid | Out-Null } catch { }
Remove-Item (Join-Path $dir 'capture.pid') -Force

cmd /c "adb exec-out run-as $pkg cat databases/RKStorage > `"$dir\after.sqlite`""

$log = Join-Path $dir 'session.log'
$lines = if (Test-Path $log) { [IO.File]::ReadAllLines($log, [Text.Encoding]::UTF8) } else { @() }
$markers = @($lines | Where-Object { $_ -match '\[MEM_PROFILE\]' }).Count

$mf = Join-Path $dir 'manifest.json'
$m = Get-Content $mf -Raw -Encoding UTF8 | ConvertFrom-Json
$m | Add-Member -NotePropertyName endedAt -NotePropertyValue (Get-Date).ToString('o') -Force
$m | Add-Member -NotePropertyName minutes -NotePropertyValue ([math]::Round(((Get-Date) - [datetime]$m.startedAt).TotalMinutes, 1)) -Force
$m | Add-Member -NotePropertyName logLines -NotePropertyValue $lines.Count -Force
$m | Add-Member -NotePropertyName memProfileMarkers -NotePropertyValue $markers -Force
$m | ConvertTo-Json | Set-Content -Encoding utf8 $mf

Write-Host "수집 종료: $($open.Name) · $($m.minutes)분 · 로그 $($lines.Count)줄 · 화면/이동 마커 $($markers)개"
Write-Host "  $dir"

if ($markers -gt 0 -and (Test-Path $log)) {
  $repo = (Resolve-Path (Join-Path $root '..\..')).Path
  Push-Location $repo
  try {
    npx --yes tsx "$root\import-mem-profile-trace.ts" --in $log --kind human --force-kind --run-id $open.Name
    if ($LASTEXITCODE -eq 0) {
      Write-Host "  human-seed 수입 완료 (sessionKind=human)"
    } else {
      Write-Host "  human-seed 수입 실패 (exit $LASTEXITCODE) — 로그는 유지됨"
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Host '  마커 0 — 시드 수입 생략. 플레이 중 화면 이동이 있어야 [MEM_PROFILE]이 남습니다.'
}
