# precision-playtest / crash 로그 실시간 패턴 스캔 → playtest-alerts.log
# v2 — Get-ArcfireCrashLogEvents 신선도만 (구 SIGSEGV 오탐 차단)
param(
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [int]$PollSec = 20,
  [int]$MaxCrashAgeMin = 15
)

. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')
. (Join-Path $PSScriptRoot 'watch-alert-filters.ps1')

$alertLog = Join-Path $LogDir 'playtest-alerts.log'
$offsetFile = Join-Path $LogDir '.playtest-scan-offset'
$seenFile = Join-Path $LogDir '.playtest-scan-seen.txt'
$pidFile = Join-Path $LogDir 'playtest-scan.pid'

function Get-LatestPrecisionLog {
  Get-ChildItem -Path $LogDir -Filter 'precision-playtest-*.log' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

function Test-Seen([string]$key) {
  if (-not (Test-Path $seenFile)) { return $false }
  return (Select-String -Path $seenFile -Pattern ([regex]::Escape($key)) -Quiet -ErrorAction SilentlyContinue)
}

function Mark-Seen([string]$key) {
  Add-Content -Path $seenFile -Value $key -Encoding ascii
}

function Emit-CrashAlert([object]$ev) {
  $key = "CRASH|$($ev.Line)"
  if (Test-Seen $key) { return }
  Mark-Seen $key
  $evtLine = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [ARCFIRE_CRASH age=$($ev.AgeMin)m] $($ev.Line)"
  Add-Content -Path $alertLog -Value $evtLine -Encoding utf8
  Write-Host $evtLine -ForegroundColor Red
  try {
    & (Join-Path $PSScriptRoot 'invoke-incident-investigation.ps1') -Reason 'arcfire_crash_playtest' -AlertLine $evtLine
  } catch {
    Write-Host "INVESTIGATION invoke failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Set-Content -Path $pidFile -Value $PID -Encoding ascii
Add-Content -Path $alertLog -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] SCANNER_START v2 pid=$PID poll=${PollSec}s maxAge=${MaxCrashAgeMin}m"

$trackedFile = ''
$offset = 0
if (Test-Path $offsetFile) {
  $parts = (Get-Content $offsetFile -Raw).Trim().Split('|')
  if ($parts.Count -ge 2) {
    $trackedFile = $parts[0]
    [void][int64]::TryParse($parts[1], [ref]$offset)
  }
}

while ($true) {
  $file = Get-LatestPrecisionLog
  if ($file) {
    if ($trackedFile -ne $file.FullName) {
      $trackedFile = $file.FullName
      $offset = 0
    }
    $fi = Get-Item $file.FullName
    if ($fi.Length -gt $offset) {
      $fs = [System.IO.File]::Open($file.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
      $fs.Seek([int64]$offset, [System.IO.SeekOrigin]::Begin) | Out-Null
      $reader = New-Object System.IO.StreamReader($fs)
      $chunk = $reader.ReadToEnd()
      $reader.Close()
      $fs.Close()
      $offset = $fi.Length
      Set-Content -Path $offsetFile -Value "$trackedFile|$offset" -Encoding utf8

      foreach ($ev in (Get-ArcfireCrashLogEvents -Text $chunk -MaxAgeMin $MaxCrashAgeMin)) {
        Emit-CrashAlert $ev
      }
    }
  }

  # 표준 crash-*.log tail (precision 없을 때 백업)
  $crash = Get-ChildItem -Path $LogDir -Filter 'crash-*.log' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($crash) {
    $crashOffFile = Join-Path $LogDir '.playtest-scan-crash-offset'
    $tail = Read-CrashLogTailBytes -CrashPath $crash.FullName -OffsetFile $crashOffFile -MaxAgeMin $MaxCrashAgeMin
    foreach ($ev in $tail.Events) { Emit-CrashAlert $ev }
  }

  # PSS/GL 하드실링 — 즉시 investigation (playtest 중)
  $timelineCsv = Join-Path $LogDir 'mem-timeline.csv'
  if (Test-Path $timelineCsv) {
    $lastRow = (Get-Content $timelineCsv -Tail 1 -ErrorAction SilentlyContinue) -split ','
    if ($lastRow.Count -ge 5) {
      $gl = 0.0; $pss = 0.0
      [void][double]::TryParse($lastRow[4], [ref]$gl)
      [void][double]::TryParse($lastRow[2], [ref]$pss)
      if ((Test-MemHardCeilingBreach -GlMb $gl -PssMb $pss)) {
        $memKey = "MEMCEIL|${pss}|${gl}"
        if (-not (Test-Seen $memKey)) {
          Mark-Seen $memKey
          $memLine = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [MEM_HARD_CEILING] pss=${pss}MB gl=${gl}MB"
          Add-Content -Path $alertLog -Value $memLine -Encoding utf8
          Write-Host $memLine -ForegroundColor Magenta
          try {
            & (Join-Path $PSScriptRoot 'invoke-incident-investigation.ps1') -Reason 'mem_hard_ceiling_playtest' -AlertLine $memLine
          } catch { }
        }
      }
    }
  }

  Start-Sleep -Seconds $PollSec
}
