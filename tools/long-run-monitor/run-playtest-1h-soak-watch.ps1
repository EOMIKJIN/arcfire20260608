# 1시간 반복 플레이 구간 — 5분 간격 면밀 감시 (PSS/GL/PID/크래시)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$DurationMin = 60,
  [int]$IntervalMin = 5,
  [string]$SoakLabel = '1h_soak_repeat_play'
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'mem-gl-leak-rules.ps1')

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$kst = (Get-Date).ToUniversalTime().AddHours(9)
$tag = "$SoakLabel-$($kst.ToString('yyyyMMdd-HHmmss'))"
$csv = Join-Path $logDir "soak-1h-$tag.csv"
$watchLog = Join-Path $logDir "soak-1h-$tag.log"
$pidFile = Join-Path $logDir 'soak-1h-watch.pid'

$header = 'iso_kst,pid,pss_mb,gl_mb,native_mb,views,pid_changed,gl_hard_ceiling,crash_new,note'
Set-Content -Path $csv -Value $header -Encoding utf8

function Write-Watch([string]$msg, [string]$color) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  if ($color) { Write-Host $line -ForegroundColor $color } else { Write-Host $line }
  Add-Content -Path $watchLog -Value $line -Encoding utf8
}

function Parse-Mem([string]$raw) {
  $m = @{ PssKb = 0; GlKb = 0; NativeKb = 0; Views = 0 }
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $m.PssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $m.GlKb = [int]$Matches[1] }
  if ($raw -match 'Native Heap:\s+(\d+)') { $m.NativeKb = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)') { $m.Views = [int]$Matches[1] }
  return $m
}

$alertLog = Join-Path $logDir 'playtest-alerts.log'
$alertOffset = 0
if (Test-Path $alertLog) { $alertOffset = (Get-Item $alertLog).Length }

$baselinePid = ''
$baselineGl = 0.0
$baselinePss = 0.0
$peakGl = 0.0
$peakPss = 0.0
$floorGl = 9999.0
$pidChangeCount = 0
$hardCeilingCount = 0
$crashNewCount = 0
$sampleCount = 0

Set-Content -Path $pidFile -Value $PID -Encoding ascii
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$($kst.ToString('yyyy-MM-dd HH:mm:ss'))] SOAK_1H_START $tag duration=${DurationMin}m interval=${IntervalMin}m"
Write-Watch "SOAK_1H_START tag=$tag duration=${DurationMin}m interval=${IntervalMin}m" 'Cyan'

$endAt = (Get-Date).AddMinutes($DurationMin)
while ((Get-Date) -lt $endAt) {
  $iso = (Get-Date).ToUniversalTime().AddHours(9).ToString('yyyy-MM-dd HH:mm:ss')
  $appPid = (adb shell "pidof $Package" 2>$null | Out-String).Trim()
  $pidChanged = 0
  $glHard = 0
  $crashNew = 0
  $note = ''

  if (-not $appPid) {
    Write-Watch "!! PROCESS_NOT_RUNNING" 'Red'
    $line = "$iso,,,,,,1,0,0,PROCESS_NOT_RUNNING"
    Add-Content -Path $csv -Value $line -Encoding utf8
    Add-Content -Path (Join-Path $logDir 'playtest-alerts.log') -Value "[$iso] [SOAK_1H] PROCESS_NOT_RUNNING"
  } else {
    $raw = adb shell dumpsys meminfo $Package 2>&1 | Out-String
    $m = Parse-Mem $raw
    $pss = [math]::Round($m.PssKb / 1024, 1)
    $gl = [math]::Round($m.GlKb / 1024, 1)
    $nat = [math]::Round($m.NativeKb / 1024, 1)
    $views = $m.Views

    if (-not $baselinePid) {
      $baselinePid = $appPid
      $baselineGl = $gl
      $baselinePss = $pss
      $note = 'SOAK_BASELINE'
    } elseif ($appPid -ne $baselinePid) {
      $pidChanged = 1
      $pidChangeCount++
      $note = "PID_CHANGE was=$baselinePid now=$appPid"
      Write-Watch "!! $note" 'Red'
      $baselinePid = $appPid
    }

    if ($gl -gt $peakGl) { $peakGl = $gl }
    if ($pss -gt $peakPss) { $peakPss = $pss }
    if ($gl -gt 0 -and $gl -lt $floorGl) { $floorGl = $gl }

    if (Test-MemHardCeilingBreach -GlMb $gl -PssMb $pss) {
      $glHard = 1
      $hardCeilingCount++
      if ($gl -ge 200) { Write-Watch "WARN GL_HARD_CEILING gl=${gl}MB pss=${pss}MB views=$views" 'Yellow' }
      if ($pss -ge 950) { Write-Watch "!! PSS_HARD_CEILING pss=${pss}MB" 'Red' }
    }

    # new precision alerts
    if (Test-Path $alertLog) {
      $fi = Get-Item $alertLog
      if ($fi.Length -gt $alertOffset) {
        $fs = [System.IO.File]::Open($alertLog, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $fs.Seek($alertOffset, [System.IO.SeekOrigin]::Begin) | Out-Null
        $reader = New-Object System.IO.StreamReader($fs)
        $newChunk = $reader.ReadToEnd()
        $reader.Close(); $fs.Close()
        $alertOffset = $fi.Length
        if ($newChunk -match 'SIGSEGV|ARCFIRE_CRASH|\[PATTERN\]') {
          $crashNew = 1
          $crashNewCount++
          Write-Watch "!! NEW_CRASH_ALERT in playtest-alerts.log" 'Red'
        }
      }
    }

    # crash log tail (precision)
    $prec = Get-ChildItem -Path $logDir -Filter 'precision-playtest-*.log' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($prec) {
      $tail = Get-Content $prec.FullName -Tail 80 -ErrorAction SilentlyContinue | Out-String
      if (Test-ArcfireCrashLogText -Text $tail -MaxAgeMin 10) {
        $crashNew = 1
        $crashNewCount++
        Write-Watch "!! FRESH_CRASH in $($prec.Name)" 'Red'
      }
    }

    $glDrift = if ($baselineGl -gt 0) { [math]::Round($gl - $baselineGl, 1) } else { 0 }
    $color = 'Green'
    if ($glHard -or $pidChanged -or $crashNew) { $color = 'Red' }
    elseif ($gl -ge 180 -or $glDrift -ge 20) { $color = 'Yellow' }

    Write-Watch "OK pid=$appPid pss=${pss}MB gl=${gl}MB(Δ${glDrift}) nat=${nat}MB views=$views" $color

    $line = "$iso,$appPid,$pss,$gl,$nat,$views,$pidChanged,$glHard,$crashNew,$note"
    Add-Content -Path $csv -Value $line -Encoding utf8
    $sampleCount++
  }

  Start-Sleep -Seconds ($IntervalMin * 60)
}

$ended = (Get-Date).ToUniversalTime().AddHours(9)
$summary = @"
# 1h soak watch summary — $tag

- Ended (KST): $($ended.ToString('yyyy-MM-dd HH:mm:ss'))
- Samples: $sampleCount
- Baseline: GL ${baselineGl}MB / PSS ${baselinePss}MB / PID $baselinePid
- Peak: GL ${peakGl}MB / PSS ${peakPss}MB
- Floor GL: $(if ($floorGl -lt 9999) { "$floorGl MB" } else { 'n/a' })
- PID changes: $pidChangeCount
- GL/PSS hard ceiling hits: $hardCeilingCount
- New crash alerts: $crashNewCount
- CSV: $csv
- Log: $watchLog

## Verdict
$(if ($pidChangeCount -eq 0 -and $crashNewCount -eq 0) { 'STABILITY: PASS (no crash/PID change)' } else { 'STABILITY: FAIL — investigate crash-*.log + playtest-alerts.log' })
$(if ($floorGl -lt 9999 -and $baselineGl -gt 0 -and ($floorGl - $baselineGl) -ge 25) { "GL_FLOOR_DRIFT: WARN (+$([math]::Round($floorGl - $baselineGl, 1))MB vs soak baseline)" } else { 'GL_FLOOR_DRIFT: within +25MB soak window (or insufficient idle samples)' })
"@
$reportPath = Join-Path $logDir "soak-1h-report-$tag.md"
$summary | Set-Content -Path $reportPath -Encoding utf8
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$($ended.ToString('yyyy-MM-dd HH:mm:ss'))] SOAK_1H_END $tag pid_changes=$pidChangeCount crashes=$crashNewCount peak_gl=$peakGl peak_pss=$peakPss"
Write-Watch "SOAK_1H_END report=$reportPath" 'Cyan'
Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
