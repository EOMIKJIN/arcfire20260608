# ============================================================
# 3시간 집중 메모리 감시 — native_heap 주도 PSS 급증 추적 (2026-07-08)
# 앱 무영향: PC adb 샘플링만. 10분 간격, PSS/GL/native_heap/views 기록.
# 임계 초과 시 stdout에 ALERT 라인(부모 에이전트 notify용).
# ============================================================
param(
  [int]$DurationMin = 180,
  [int]$IntervalSec = 600,
  [string]$LogPath = "$PSScriptRoot/logs/intensive-watch-3h.csv"
)

$pkg = 'com.arcfire.online'
$deadline = (Get-Date).AddMinutes($DurationMin)

# 임계 (mem-gl-leak-rules와 정렬)
$PSS_SOFT = 800
$PSS_HARD = 950
$GL_HARD = 200
$VIEWS_WARN = 450
$NATIVE_WARN = 450

if (-not (Test-Path $LogPath)) {
  Set-Content -Path $LogPath -Value 'iso_kst,pid,pss_mb,gl_mb,egl_mb,native_heap_mb,views,swap_mb,flags' -Encoding utf8
}

function Get-MemSample {
  $raw = & adb shell dumpsys meminfo $pkg 2>&1 | Out-String
  if ([string]::IsNullOrWhiteSpace($raw) -or $raw -notmatch 'TOTAL PSS') {
    return $null
  }
  $pssPid = ''
  if ($raw -match '\[pid (\d+)') { $pssPid = $Matches[1] }
  elseif ($raw -match 'pid (\d+)') { $pssPid = $Matches[1] }
  $pss = 0.0; $gl = 0.0; $egl = 0.0; $native = 0.0; $views = 0; $swap = 0.0
  if ($raw -match 'TOTAL PSS:\s*(\d+)') { $pss = [math]::Round([double]$Matches[1] / 1024, 1) }
  if ($raw -match 'GL mtrack\s+(\d+)') { $gl = [math]::Round([double]$Matches[1] / 1024, 1) }
  if ($raw -match 'EGL mtrack\s+(\d+)') { $egl = [math]::Round([double]$Matches[1] / 1024, 1) }
  if ($raw -match 'Native Heap:\s*(\d+)') { $native = [math]::Round([double]$Matches[1] / 1024, 1) }
  if ($raw -match 'Views:\s*(\d+)') { $views = [int]$Matches[1] }
  if ($raw -match 'TOTAL SWAP PSS:\s*(\d+)') { $swap = [math]::Round([double]$Matches[1] / 1024, 1) }
  return @{ Pid = $pssPid; Pss = $pss; Gl = $gl; Egl = $egl; Native = $native; Views = $views; Swap = $swap }
}

Write-Output "INTENSIVE_WATCH_START kst=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') duration=${DurationMin}m interval=${IntervalSec}s"

while ((Get-Date) -lt $deadline) {
  $s = Get-MemSample
  $kst = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  if ($null -eq $s) {
    Add-Content -Path $LogPath -Value "$kst,,,,,,,APP_NOT_RUNNING" -Encoding utf8
    Write-Output "SAMPLE kst=$kst APP_NOT_RUNNING"
  } else {
    $flags = @()
    if ($s.Pss -ge $PSS_HARD) { $flags += 'PSS_HARD' }
    elseif ($s.Pss -ge $PSS_SOFT) { $flags += 'PSS_SOFT' }
    if ($s.Gl -ge $GL_HARD) { $flags += 'GL_HARD' }
    if ($s.Views -ge $VIEWS_WARN) { $flags += 'VIEWS_WARN' }
    if ($s.Native -ge $NATIVE_WARN) { $flags += 'NATIVE_WARN' }
    $flagStr = if ($flags.Count -gt 0) { $flags -join '|' } else { 'ok' }
    Add-Content -Path $LogPath -Value "$kst,$($s.Pid),$($s.Pss),$($s.Gl),$($s.Egl),$($s.Native),$($s.Views),$($s.Swap),$flagStr" -Encoding utf8
    $line = "SAMPLE kst=$kst pid=$($s.Pid) pss=$($s.Pss) gl=$($s.Gl) native=$($s.Native) views=$($s.Views) swap=$($s.Swap) flags=$flagStr"
    Write-Output $line
    if ($flags -contains 'PSS_HARD' -or $flags -contains 'GL_HARD') {
      Write-Output "ALERT_CRITICAL kst=$kst pss=$($s.Pss) gl=$($s.Gl) native=$($s.Native) views=$($s.Views)"
    } elseif ($flags.Count -gt 0 -and $flagStr -ne 'ok') {
      Write-Output "ALERT_WARN kst=$kst flags=$flagStr pss=$($s.Pss) native=$($s.Native) views=$($s.Views)"
    }
  }
  Start-Sleep -Seconds $IntervalSec
}

Write-Output "INTENSIVE_WATCH_DONE kst=$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
