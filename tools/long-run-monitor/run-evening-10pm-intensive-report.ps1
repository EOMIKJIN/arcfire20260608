# 22:00 KST 집중 감시 종합 보고 — 경제·행성개발 자동화·메모리 이상·비정상 점유
param(
  [string]$Package = 'com.arcfire.online',
  [string]$ReportPath = '',
  [string]$TimelineMarker = 'INTENSIVE_WATCH_1600_START',
  [string]$ReportTitle = 'Arcfire intensive watch 16:00–22:00 KST — 22:00 comprehensive report'
)

$ErrorActionPreference = 'Continue'
$ScriptRoot = $PSScriptRoot
$logDir = Join-Path $ScriptRoot 'logs'
$Root = Split-Path $ScriptRoot -Parent | Split-Path -Parent
$balanceOpsPath = Join-Path $Root 'tools\balance-ops-audit\reports\latest.md'
$retentionPath = Join-Path $Root 'tools\memory-profiler\reports\latest-retention-audit.md'

if (-not $ReportPath) {
  $kst = (Get-Date).ToUniversalTime().AddHours(9)
  $ReportPath = Join-Path $logDir ("evening-watch-report-{0}.md" -f $kst.ToString('yyyyMMdd-HHmm'))
}

# Base report (memory · incidents · retention · gaps)
$basePath = & (Join-Path $ScriptRoot 'run-evening-6pm-comprehensive-report.ps1') `
  -Package $Package `
  -ReportPath $ReportPath `
  -TimelineMarker $TimelineMarker `
  -ReportTitle $ReportTitle

$extra = @()
$extra += ''
$extra += '---'
$extra += ''
$extra += '## 9. ArcCore economy system (balance-ops)'
$extra += ''
if (Test-Path $balanceOpsPath) {
  $bo = Get-Content $balanceOpsPath -Raw -Encoding utf8
  $overall = if ($bo -match '\*\*Overall:\*\*\s*(\w+)') { $Matches[1] } else { 'UNKNOWN' }
  $whale = if ($bo -match 'Whale/F2P:\s*([\d.]+)') { $Matches[1] } else { '?' }
  $extra += "- **Overall:** $overall"
  $extra += "- **Whale/F2P ratio:** $whale (critical if >=8)"
  $extra += "- **Daily batch contract:** v4.0 section 10 — 12:00 KST single batch (see balance-ops report)"
  $extra += "- **Price elasticity:** 0 (realtime disabled)"
  if ($bo -match 'Convoy 일일:.*?fail=(\d+)') { $extra += "- **Convoy daily fail count:** $($Matches[1])" }
  if ($bo -match 'max fee/upkeep:\s*\*\*([^*]+)\*\*') { $extra += "- **Planet fiscal max fee/upkeep:** $($Matches[1].Trim())" }
  $extra += ''
  $extra += '### balance-ops excerpt (head)'
  $extra += '```'
  $extra += (($bo -split "`n" | Select-Object -First 55) -join "`n")
  $extra += '```'
} else {
  $extra += '_balance-ops report missing — run `npm run audit:balance-ops`_'
}
$extra += ''

$extra += '## 10. ArcCore RED planet development automation'
$extra += ''
$extra += '| Contract | Status | Reference |'
$extra += '|----------|--------|-----------|'
$extra += '| 60s wall tick job complete | wired | `ArcCoreDailyOpsSubCore` -> `runArcCorePlanetDevWallTick` |'
$extra += '| RED-only allocator | policy CSV | `arc_core_planet_dev_investment_policy.csv` |'
$extra += '| Vault funding (real spend) | arc_core_vault | `planetDevelopmentFunding.ts` |'
$extra += '| Central bank -> budget pool | daily 33% slice | `runArcCoreCentralBankExpenditurePass` |'
$extra += '| Player RED stay/dev block | gate | `planetTerritoryPlayerAccess.ts` |'
$extra += '| World axis purge preserve | RED runtime kept | `arcCoreWorldPlanetRuntimePreservation.ts` |'
$extra += '| Device-local world (no cloud sync) | by design | `planetCoreRuntimeStore` no uid |'
$extra += ''
$extra += '**Watch KPI (22:00):**'
$extra += '- No onBoot synchronous full-planet dev pass (batch/tick only)'
$extra += '- Budget ledger AsyncStorage bounded; no tick persist storm'
$extra += '- RED eligible planets <=10; zero-allocation eligible list in wall tick'
$extra += '- After account purge: RED dev preserved, player BLUE reset'
$extra += ''

$extra += '## 11. Abnormal memory occupation (focused analysis)'
$extra += ''
$timeline = Join-Path $logDir 'mem-timeline.csv'
$markerRows = @()
if (Test-Path $timeline) {
  $all = Get-Content $timeline -ErrorAction SilentlyContinue
  $started = $false
  foreach ($line in $all) {
    if ($line -match [regex]::Escape($TimelineMarker)) { $started = $true; continue }
    if ($started -and $line -match '^\d{4}-\d{2}-\d{2}') { $markerRows += $line }
  }
}
$glSpikes = @($markerRows | Where-Object { $_ -match 'GL_SPIKE' })
$pssSoft = @($markerRows | Where-Object { $_ -match 'PSS_SOFT|PSS_SPIKE' })
$notRunning = @($markerRows | Where-Object { $_ -match 'PROCESS_NOT_RUNNING' })
$glRecovered = @($markerRows | Where-Object { $_ -match 'GL_RECOVERED' })
$pidChanges = @($markerRows | Where-Object { $_ -match ',,,,,,,,,,,,PID_CHANGE' -or $_ -match 'PID_CHANGE' })

$extra += "| Signal | Count (since $TimelineMarker) | Assessment |"
$extra += "|--------|------------------------------|------------|"
$extra += "| GL_SPIKE | $($glSpikes.Count) | hub Skia / nebula / combat footprint |"
$extra += "| GL_RECOVERED | $($glRecovered.Count) | idle reclaim OK if >0 after spike |"
$extra += "| PSS soft/spike | $($pssSoft.Count) | native / graphics pressure |"
$extra += "| PROCESS_NOT_RUNNING | $($notRunning.Count) | clean exit if no crash tail |"
$extra += "| Samples | $($markerRows.Count) | 15m interval target ~24/window |"
$extra += ''

if ($glSpikes.Count -ge 3 -and $glRecovered.Count -eq 0) {
  $extra += '> **P0** — 3+ GL_SPIKE without GL_RECOVERED: step leak suspected; auto-remediation may relaunch.'
} elseif ($notRunning.Count -ge 4) {
  $extra += '> **WARN** — repeated PROCESS_NOT_RUNNING: verify adb cable / app killed manually vs crash.'
} else {
  $extra += '> **OK** — no step-leak pattern in watch window; continue floor trend.'
}
$extra += ''

if ($glSpikes.Count) {
  $extra += '### GL_SPIKE rows'
  $extra += '```csv'
  $extra += ($glSpikes | Select-Object -Last 8) -join "`n"
  $extra += '```'
  $extra += ''
}

$extra += '## 12. Immediate action matrix (22:00)'
$extra += ''
$extra += '| Severity | Trigger | Action |'
$extra += '|----------|---------|--------|'
$extra += '| P0 | PSS>=950 or 3x GL_SPIKE | auto-remediation ON -> force-stop + handoff |'
$extra += '| P0 | FATAL/SIGSEGV crash | logcat capture + kim-team-lead code fix |'
$extra += '| P1 | PSS floor +40MB no GL spike | native reclaim / ingress audit |'
$extra += '| P1 | balance-ops convoy fail | core_prime route — economy watch |'
$extra += '| P2 | level-band gap CRITICAL | static backlog — not runtime blocker |'
$extra += ''

$append = $extra -join "`n"
Add-Content -Path $basePath -Value $append -Encoding utf8
Write-Output $basePath
