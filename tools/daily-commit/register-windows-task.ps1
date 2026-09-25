#Requires -Version 5.1
<#
  Windows 작업 스케줄러 — 매일 자정 00:00(KST) 안정화·커밋·푸시.

  관리자 PowerShell:
    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # 최초 1회
    Set-Location D:\arcfire20260607
    .\tools\daily-commit\register-windows-task.ps1

  제거:
    schtasks /Delete /TN "ArcfireOnline_DailyCommit" /F
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$TaskName = 'ArcfireOnline_DailyCommit',
  [string]$TimeLocal = '00:00',
  [string]$StartDate = '',  # MM/dd/yyyy — 비우면 내일(KST) 자정
  [switch]$Push,
  [switch]$RunAudit,
  [switch]$NoPush,
  [switch]$NoAudit
)

$settingsPath = Join-Path $PSScriptRoot 'settings.ps1'
if (Test-Path $settingsPath) { . $settingsPath }

$scriptPath = Join-Path $RepoRoot 'tools\daily-commit\daily-commit.ps1'
if (-not (Test-Path $scriptPath)) {
  Write-Error "Missing $scriptPath"
  exit 1
}

$doPush = if ($NoPush) { $false } elseif ($Push) { $true } else { [bool]$DailyCommitPush }
$doAudit = if ($NoAudit) { $false } elseif ($RunAudit) { $true } else { [bool]$DailyCommitRunAudit }

$flagParts = @()
if ($doPush) { $flagParts += '-Push' }
if ($doAudit) { $flagParts += '-RunAudit' }
$flagStr = if ($flagParts.Count -gt 0) { ' ' + ($flagParts -join ' ') } else { '' }

$tr = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -RepoRoot `"$RepoRoot`"$flagStr"

if (-not $StartDate) {
  $nowKst = [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId((Get-Date), 'Korea Standard Time')
  $target = $nowKst.Date
  if ($nowKst -ge $target) { $target = $target.AddDays(1) }
  $StartDate = $target.ToString('MM/dd/yyyy')
}

schtasks /Create `
  /TN $TaskName `
  /TR $tr `
  /SC DAILY `
  /ST $TimeLocal `
  /SD $StartDate `
  /F | Out-Null

if ($LASTEXITCODE -ne 0) {
  Write-Error 'schtasks /Create failed'
  exit $LASTEXITCODE
}

# schtasks /Create 기본값은 절전·미실행 대응이 없다. 반드시 덮어쓴다.
#  - StartWhenAvailable : 자정에 PC가 꺼져/잠들어 있었으면 «다음에 켜질 때» 실행 (핵심)
#  - WakeToRun          : 절전 중이면 깨워서 실행 (전원 구성표 «깨우기 타이머»가 사용 상태여야 실제 동작)
#  - Batteries          : 데스크톱 기준 무의미하나, 노트북 전환 시 중단되지 않도록 해제
# 2026-09-25: 기본값(StartWhenAvailable=False·WakeToRun=False)이라 자정 미실행 시 «따라잡기»가 없었다.
$taskSettings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
  -MultipleInstances IgnoreNew
$taskSettings.DisallowStartIfOnBatteries = $false
$taskSettings.StopIfGoingOnBatteries = $false
try {
  Set-ScheduledTask -TaskName $TaskName -Settings $taskSettings -ErrorAction Stop | Out-Null
  Write-Host 'OK — settings: StartWhenAvailable=True WakeToRun=True Batteries=allow limit=2h'
} catch {
  Write-Warning "설정 덮어쓰기 실패 — 관리자 PowerShell에서 재실행 필요: $($_.Exception.Message)"
}

Write-Host "OK — task '$TaskName' daily at $TimeLocal (PC local time), first run on $StartDate."
Write-Host "Pipeline: audit=$doAudit push=$doPush"
Write-Host "TR: $tr"
Write-Host ""
Write-Host "Note: Set Windows timezone to Korea Standard Time so 00:00 = KST midnight."
Write-Host "Test now: powershell -File `"$scriptPath`"$flagStr"
Write-Host "Or: npm run daily:release"
