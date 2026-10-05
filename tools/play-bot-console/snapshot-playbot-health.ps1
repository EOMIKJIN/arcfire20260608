# 플레이봇 학습·프로세스 상태 스냅샷 (김클로드 점검용 · 읽기 전용)
# powershell -File tools/play-bot-console/snapshot-playbot-health.ps1 -Out <json>
param([string]$Out = '')

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent
$logs = Join-Path $PSScriptRoot 'logs'
$learned = Join-Path $logs 'learned'
function J([string]$p) { if (Test-Path $p) { try { return Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json } catch { } }; return $null }
function PidOf([string]$f) { $v = 0; if (Test-Path $f) { [void][int]::TryParse((Get-Content $f -Raw).Trim(), [ref]$v) }; return $v }
function ProcInfo([int]$id) {
  $p = Get-Process -Id $id -ErrorAction SilentlyContinue
  if (-not $p) { return @{ pid = $id; alive = $false } }
  return @{ pid = $id; alive = $true; privMB = [math]::Round($p.PrivateMemorySize64 / 1MB); startedAt = $p.StartTime.ToString('s') }
}

$status = J (Join-Path $logs 'PLAYBOT_STATUS_LATEST.json')
$stall = J (Join-Path $learned 'stall-replay.json')
$fqa = J (Join-Path $learned 'fqa-review-state.json')
$delta = J (Join-Path $learned 'human-delta.json')
$policy = J (Join-Path $learned 'playbot-policy.json')
$cycle = J (Join-Path $learned 'learn-cycle-latest.json')
$seed = J (Join-Path $learned 'human-seed-v0.json')

# 실기 수집: 진행 중 세션 로그의 PLAY_VERB·MEM_PROFILE 수
$ownerDir = Join-Path $learned 'human-raw'
$lastSession = Get-ChildItem $ownerDir -Recurse -Filter 'session.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$playVerb = 0; $memProf = 0
if ($lastSession) {
  $playVerb = @(Select-String -Path $lastSession.FullName -Pattern '\[PLAY_VERB\]').Count
  $memProf = @(Select-String -Path $lastSession.FullName -Pattern '\[MEM_PROFILE\]').Count
}
$ownerLog = @(Get-Content (Join-Path $logs 'owner-playlog-auto.log') -Tail 200 -Encoding UTF8 | ForEach-Object { [string]$_ })
$imports = @($ownerLog | Where-Object { $_ -match ' import owner-auto' })
$closes = @($ownerLog | Where-Object { $_ -match ' close owner-auto' })

$snap = [ordered]@{
  at = (Get-Date).ToString('s')
  harness = ProcInfo (PidOf (Join-Path $logs 'playbot-harness.pid'))
  ownerDaemon = ProcInfo (PidOf (Join-Path $logs 'playbot-owner-auto.pid'))
  fqaLoop = ProcInfo (PidOf (Join-Path $logs 'playbot-fqa-review.pid'))
  watchdog = ProcInfo (PidOf (Join-Path $root 'tools\long-run-monitor\logs\perpetual-watchdog.pid'))
  device = ((& adb get-state 2>$null) -join '').Trim()
  appPid = ((& adb shell pidof com.arcfire.online 2>$null) -join '').Trim()
  run = @{ id = $status.runId; updatedAt = $status.updatedAt; day = $status.kpi.day; level = $status.kpi.level; quest = $status.kpi.questCleared; annex = $status.kpi.annexOk; credits = $status.kpi.credits }
  stall = @{ restarts = $stall.restarts; lastAt = $stall.baseline.at; lastReason = $stall.baseline.reason; lastLevel = $stall.baseline.level; lastQuest = $stall.baseline.questCleared }
  learn = @{ generation = $policy.generation; policyUpdatedAt = $policy.updatedAt; notes = $policy.lastNotes; cycleSig = $cycle.signature; cycleUpdatedAt = $cycle.updatedAt }
  human = @{ seedSessions = @($seed.traces).Count; deltaSession = $delta.sessionId; deltaKinds = $delta.coveredKinds; deltaConsumed = $delta.consumed; lastSessionLog = $(if ($lastSession) { $lastSession.Directory.Name } else { '' }); playVerbLines = $playVerb; memProfileLines = $memProf; recentCloses = @($closes | Select-Object -Last 3); recentImports = @($imports | Select-Object -Last 3) }
  fqa = @{ reviews = $fqa.reviews; consultPending = $fqa.consultPending; evidence = $fqa.seenEvidence }
}
$json = $snap | ConvertTo-Json -Depth 6
if ($Out) { [IO.File]::WriteAllText($Out, $json, (New-Object Text.UTF8Encoding $false)) }
$json
