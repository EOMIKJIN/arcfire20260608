# 플레이테스트 마일스톤 — mem-timeline + incidents 에 시나리오 구간 기록
param(
  [Parameter(Mandatory = $true)]
  [string]$Label,
  [string]$Package = 'com.arcfire.online'
)

$logDir = Join-Path $PSScriptRoot 'logs'
$sessionFile = Join-Path $logDir 'playtest-session-active.json'
$iso = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

if (Test-Path $sessionFile) {
  try {
    $sess = Get-Content $sessionFile -Raw | ConvertFrom-Json
    $milestones = @()
    if ($sess.milestones) { $milestones = @($sess.milestones) }
    $milestones += @{ atKst = $iso; label = $Label }
    $sess | Add-Member -NotePropertyName milestones -NotePropertyValue $milestones -Force
    $sess | ConvertTo-Json -Depth 6 | Set-Content -Path $sessionFile -Encoding utf8
  } catch {}
}

& (Join-Path $PSScriptRoot 'manual-mem-snapshot.ps1') -Package $Package -Note "PLAYTEST_MILESTONE:$Label"
Add-Content -Path (Join-Path $logDir 'incidents.log') -Value "[$iso] PLAYTEST_MILESTONE $Label"
Write-Output "milestone=$Label at=$iso"
