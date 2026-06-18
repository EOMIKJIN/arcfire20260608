# GL/PSS 이상 감지 시 런타임 자동 복구 + 정적 Skia 감사
param(
  [string]$Package = 'com.arcfire.online',
  [string]$LogDir = (Join-Path $PSScriptRoot 'logs'),
  [string]$Reason = 'unspecified',
  [hashtable]$Ctx = @{},
  [int]$MinIntervalMin = 45,
  [double]$CriticalGlMb = 80
)

$remediationLog = Join-Path $LogDir 'remediation.log'
$refixFlag = Join-Path $LogDir 'gl-leak-refix-requested.flag'
$throttleFile = Join-Path $LogDir 'last-auto-remediation.txt'
$baselineJson = Join-Path $LogDir 'mem-baseline.json'
$pauseFlag = Join-Path $LogDir 'monitor-paused.flag'
$root = Resolve-Path (Join-Path $PSScriptRoot '../..')

function Write-Remediation([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -Path $remediationLog -Value $line
  Write-Host $line
}

# 검증 분리: logs/monitor-paused.flag 가 있으면 자동조치(앱 강제 재시작·정적 감사)를 건너뛴다.
# release/첫 빌드 검증 중에는 이 플래그를 만들어 두면 PSS/GL 하드실링에도 앱이 강제 재시작되지 않는다.
# 감시·기록(run-monitor·report-watch)은 계속된다. 검증 종료 후 플래그를 지우면 자동조치 복귀.
if (Test-Path $pauseFlag) {
  Write-Remediation "AUTO_FIX SKIPPED (monitor-paused.flag present) reason=$Reason — verification mode, no relaunch"
  exit 0
}

function Get-LastRemediationAgeMin {
  if (-not (Test-Path $throttleFile)) { return 9999 }
  try {
    $ts = [datetime]::Parse((Get-Content $throttleFile -Raw).Trim())
    return ((Get-Date) - $ts).TotalMinutes
  } catch {
    return 9999
  }
}

function Parse-GlMb([string]$raw) {
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') {
    return [math]::Round([int]$Matches[1] / 1024, 1)
  }
  return $null
}

function Invoke-StaticSkiaAudit {
  Write-Remediation 'AUTO_FIX static audit:skia-memory start'
  try {
    Push-Location $root
    $out = npm run audit:skia-memory 2>&1 | Out-String
    $ok = $LASTEXITCODE -eq 0
    Write-Remediation ("AUTO_FIX audit:skia-memory " + $(if ($ok) { 'PASS' } else { "FAIL exit=$LASTEXITCODE" }))
    if (-not $ok) {
      Add-Content -Path $remediationLog -Value $out.Trim()
    }
  } catch {
    Write-Remediation "AUTO_FIX audit:skia-memory ERROR $($_.Exception.Message)"
  } finally {
    Pop-Location
  }
}

function Invoke-AppRelaunch {
  Write-Remediation "AUTO_FIX app relaunch reason=$Reason package=$Package"
  adb shell am force-stop $Package 2>$null | Out-Null
  Start-Sleep -Seconds 2
  $monkey = adb shell monkey -p $Package -c android.intent.category.LAUNCHER 1 2>&1 | Out-String
  if ($monkey -match 'No activities found|Error') {
    adb shell cmd package resolve-activity --brief $Package 2>$null | ForEach-Object {
      if ($_ -match '^(\S+/\S+)$') {
        adb shell am start -n $Matches[1] 2>$null | Out-Null
      }
    }
  }
  Start-Sleep -Seconds 12
}

function Reset-GlBaseline {
  $raw = (adb shell dumpsys meminfo $Package 2>&1 | Out-String)
  $appPid = (adb shell "pidof $Package" 2>$null).ToString().Trim()
  $gl = Parse-GlMb $raw
  if (-not $appPid -or -not $gl) {
    Write-Remediation 'AUTO_FIX baseline reset skipped (process not ready)'
    return
  }
  $pss = 0.0
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $pss = [math]::Round([int]$Matches[1] / 1024, 1) }
  @{
    pid = $appPid
    glMb = $gl
    pssMb = $pss
    peakGlMb = $gl
    updatedAt = (Get-Date -Format 'o')
    note = "post_auto_remediation_$Reason"
  } | ConvertTo-Json | Set-Content -Path $baselineJson -Encoding utf8
  Write-Remediation "AUTO_FIX baseline reset pid=$appPid gl=${gl}MB pss=${pss}MB"
}

$ageMin = Get-LastRemediationAgeMin
$currentGl = $Ctx['lastGlMb']
if ($null -eq $currentGl -and (Test-Path (Join-Path $LogDir 'mem-timeline.csv'))) {
  $lastRow = (Get-Content (Join-Path $LogDir 'mem-timeline.csv') | Select-Object -Last 1) -split ','
  if ($lastRow.Count -ge 5) { [void][double]::TryParse($lastRow[4], [ref]$currentGl) }
}

$critical = ($currentGl -ge $CriticalGlMb)
if (-not $critical -and $ageMin -lt $MinIntervalMin) {
  Write-Remediation "AUTO_FIX throttled reason=$Reason age=${([math]::Round($ageMin,1))}m min=${MinIntervalMin}m gl=${currentGl}MB"
  exit 0
}

Set-Content -Path $throttleFile -Value (Get-Date -Format 'o') -Encoding utf8

Invoke-StaticSkiaAudit

$needsRelaunch = @(
  'consecutive_gl_spikes',
  'baseline_gl_drift',
  'process_death',
  'gl_critical_active_hub'
) -contains $Reason

if ($needsRelaunch -or $critical) {
  Invoke-AppRelaunch
  Reset-GlBaseline
}

if (Test-Path $refixFlag) {
  Remove-Item $refixFlag -Force -ErrorAction SilentlyContinue
}

Write-Remediation "AUTO_FIX done reason=$Reason critical=$critical ctx=$($Ctx | ConvertTo-Json -Compress)"
exit 0
