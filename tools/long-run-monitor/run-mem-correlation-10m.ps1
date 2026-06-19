# 10분 간격 meminfo — PSS creep 상관 (Unknown/GL/Native 분해)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10,
  [int]$MaxSamples = 0
)

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$csv = Join-Path $logDir 'mem-correlation-10m.csv'
$header = 'iso_time,pid,pss_mb,gl_mb,native_heap_mb,graphics_mb,unknown_pss_est_mb,views,note'

if (-not (Test-Path $csv)) {
  Set-Content -Path $csv -Value $header -Encoding utf8
}

function Parse-Metrics([string]$raw) {
  $m = @{ PssKb = 0; GlKb = 0; NativeKb = 0; GraphicsKb = 0; UnknownKb = 0; Views = 0 }
  if ($raw -match 'TOTAL PSS:\s+(\d+)') { $m.PssKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*GL mtrack\s+(\d+)') { $m.GlKb = [int]$Matches[1] }
  if ($raw -match 'Native Heap:\s+(\d+)') { $m.NativeKb = [int]$Matches[1] }
  if ($raw -match 'Graphics:\s+(\d+)') { $m.GraphicsKb = [int]$Matches[1] }
  if ($raw -match '(?m)^\s*Unknown\s+(\d+)') { $m.UnknownKb = [int]$Matches[1] }
  if ($raw -match 'Views:\s+(\d+)') { $m.Views = [int]$Matches[1] }
  return $m
}

$n = 0
while ($true) {
  $iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $pid = (adb shell "pidof $Package" 2>$null).ToString().Trim()
  if (-not $pid) {
    $line = "$iso,,,,,,,PROCESS_NOT_RUNNING"
    Add-Content -Path $csv -Value $line -Encoding utf8
    Write-Host "[$iso] process not running"
  } else {
    $raw = adb shell dumpsys meminfo $Package 2>$null | Out-String
    $m = Parse-Metrics $raw
    $pss = [math]::Round($m.PssKb / 1024, 1)
    $gl = [math]::Round($m.GlKb / 1024, 1)
    $native = [math]::Round($m.NativeKb / 1024, 1)
    $gfx = [math]::Round($m.GraphicsKb / 1024, 1)
    $unk = [math]::Round($m.UnknownKb / 1024, 1)
    $line = "$iso,$pid,$pss,$gl,$native,$gfx,$unk,$($m.Views),"
    Add-Content -Path $csv -Value $line -Encoding utf8
    Write-Host "[$iso] pid=$pid PSS=${pss}MB GL=${gl}MB Native=${native}MB Unknown=${unk}MB views=$($m.Views)"
  }
  $n++
  if ($MaxSamples -gt 0 -and $n -ge $MaxSamples) { break }
  Start-Sleep -Seconds ($IntervalMin * 60)
}
