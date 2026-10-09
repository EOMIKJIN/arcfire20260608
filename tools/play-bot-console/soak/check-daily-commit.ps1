# 자정 데일리 커밋·푸시 확인 — 김플레이 2026-10-09
# 지정 시각까지 기다렸다가 ArcfireOnline_DailyCommit 결과 · 커밋 · 원격 반영을 확인해 출력한다.
param([string]$At = '00:12', [string]$Branch = 'sdk54-upgrade')
$target = [datetime]::Today.AddDays(1).Add([timespan]::Parse($At))
if ((Get-Date).TimeOfDay -lt [timespan]::Parse($At)) { $target = [datetime]::Today.Add([timespan]::Parse($At)) }
$wait = [int]($target - (Get-Date)).TotalSeconds
if ($wait -gt 0) { Start-Sleep -Seconds $wait }
Set-Location (Split-Path (Split-Path (Split-Path $PSScriptRoot)))
"checked_at=$(Get-Date -Format s)"
$info = Get-ScheduledTaskInfo -TaskName ArcfireOnline_DailyCommit -ErrorAction SilentlyContinue
"task_last_run=$($info.LastRunTime) result=$($info.LastTaskResult)"
git fetch origin $Branch 2>&1 | Out-Null
"head=$(git rev-parse --short HEAD) origin=$(git rev-parse --short origin/$Branch)"
git status -sb | Select-Object -First 1
git log -2 --format="%h %ad %s" --date=iso
git show --stat --format="" HEAD | Select-Object -Last 1
