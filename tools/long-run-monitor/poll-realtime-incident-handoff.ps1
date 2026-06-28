# 5분 주기 — 신규 actionable incident·신선 크래시 → 김팀장 handoff + CHAT_REPORT_PENDING
param(
  [string]$Package = 'com.arcfire.online',
  [int]$InvestigationThrottleMin = 8
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$incidentsLog = Join-Path $logDir 'incidents.log'
$offsetFile = Join-Path $logDir '.incident-poll-line-offset'
$crashOffsetFile = Join-Path $logDir '.crash-byte-offset-poll'
$pollLog = Join-Path $logDir 'realtime-incident-poll.log'

. (Join-Path $ScriptRoot 'invoke-node-hidden.ps1')
. (Join-Path $ScriptRoot 'watch-alert-filters.ps1')
. (Join-Path $ScriptRoot 'mem-gl-leak-rules.ps1')

function Log([string]$msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  try { Add-Content -Path $pollLog -Value $line -Encoding utf8 } catch {}
}

function Get-LineOffset {
  if (-not (Test-Path $offsetFile)) { return 0 }
  try { return [int](Get-Content $offsetFile -Raw).Trim() } catch { return 0 }
}

function Set-LineOffset([int]$n) {
  Set-Content -Path $offsetFile -Value $n -Encoding ascii
}

function Get-NewIncidentLines {
  if (-not (Test-Path $incidentsLog)) { return @() }
  $all = @(Get-Content -Path $incidentsLog -ErrorAction SilentlyContinue)
  $prev = Get-LineOffset
  # 최초 1회 — 과거 로그 일괄 handoff 방지(신규분만 감시)
  if (-not (Test-Path $offsetFile)) {
    Set-LineOffset $all.Count
    Log "INIT offset=$($all.Count) (skip historical incidents)"
    return @()
  }
  if ($all.Count -le $prev) { return @() }
  $new = @($all[$prev..($all.Count - 1)] | Where-Object { $_ -and $_.Trim().Length -gt 0 })
  Set-LineOffset $all.Count
  return $new
}

function Invoke-HandoffPipeline([string]$reason, [string]$alertLine) {
  Log "TRIGGER reason=$reason alert=$alertLine"
  try {
    & (Join-Path $ScriptRoot 'invoke-incident-investigation.ps1') -Reason $reason -AlertLine $alertLine
  } catch {
    Log "WARN investigation $($_.Exception.Message)"
  }
  try {
    Invoke-NodeHidden -ScriptPath (Join-Path $ScriptRoot 'write-incident-chat-pending.cjs') -NodeArgs @($reason) | Out-Null
  } catch {
    Log "WARN chat_pending $($_.Exception.Message)"
  }
}

$newLines = @(Get-NewIncidentLines)
$actionable = @($newLines | Where-Object { Test-WatchActionableIncident $_ })
if ($actionable.Count -gt 0) {
  $line = ($actionable | Select-Object -Last 1)
  $reason = if ($line -match 'INVESTIGATION_TRIGGERED\s+(\S+)') { $Matches[1] }
    elseif ($line -match 'PROCESS_DEATH|ABNORMAL_RESTART') { 'process_death' }
    elseif ($line -match 'GL_HARD_CEILING|GL_LEAK|GL_BASELINE') { 'mem_anomaly' }
    else { 'incident_log' }
  Invoke-HandoffPipeline -reason $reason -alertLine $line
}

$crash = Get-ChildItem -Path $logDir -Filter 'crash-*.log' -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($crash) {
  $tail = Read-CrashLogTailBytes -CrashPath $crash.FullName -OffsetFile $crashOffsetFile -MaxAgeMin 25
  if ($tail.Events.Count -gt 0) {
    $ev = ($tail.Events | Select-Object -Last 1)
    Invoke-HandoffPipeline -reason 'fresh_crash_log' -alertLine $ev.Line
  }
}

Write-Output "poll_ok actionable=$($actionable.Count)"
