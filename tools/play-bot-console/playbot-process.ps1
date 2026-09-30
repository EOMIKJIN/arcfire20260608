# 플레이봇 프로세스 트리 · 기록 플래그. 창 종료 = 기록 종료.

function Get-PlaybotNextUntilWall {
  $kst = [DateTime]::UtcNow.AddHours(9)
  $eight = New-Object DateTime $kst.Year, $kst.Month, $kst.Day, 8, 0, 0
  if ($kst -ge $eight) { $eight = $eight.AddDays(1) }
  return ($eight.ToString('yyyy-MM-dd') + 'T08:00:00+09:00')
}
$script:PlaybotToolRoot = $PSScriptRoot
$script:PlaybotLogDir = Join-Path $PSScriptRoot 'logs'

function Get-PlaybotLogDir {
  New-Item -ItemType Directory -Force -Path $script:PlaybotLogDir | Out-Null
  return $script:PlaybotLogDir
}

function Test-PlaybotProcAlive([int]$id) {
  if ($id -le 0) { return $false }
  try { return $null -ne (Get-Process -Id $id -ErrorAction SilentlyContinue) } catch { return $false }
}

function Read-PlaybotPid([string]$name) {
  $path = Join-Path (Get-PlaybotLogDir) $name
  if (-not (Test-Path $path)) { return 0 }
  $id = 0
  [void][int]::TryParse((Get-Content $path -Raw -ErrorAction SilentlyContinue).Trim(), [ref]$id)
  return $id
}

function Write-PlaybotPid([string]$name, [int]$id) {
  Set-Content -Path (Join-Path (Get-PlaybotLogDir) $name) -Value $id -Encoding ascii
}

function Stop-PlaybotPidTree([int]$id) {
  if ($id -le 0) { return }
  & taskkill.exe /F /T /PID $id 2>$null | Out-Null
  Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
}

function Stop-PlaybotHarnessByCommandLine {
  try {
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object {
        $_.CommandLine -and
        ($_.CommandLine -match 'play-bot-console[\\/]+run-harness\.ts')
      } |
      ForEach-Object { Stop-PlaybotPidTree ([int]$_.ProcessId) }
  } catch {}
}

function Clear-PlaybotRecordingFlag {
  $flag = Join-Path (Get-PlaybotLogDir) 'PLAYBOT_RECORDING.flag'
  $stamp = Join-Path (Get-PlaybotLogDir) 'PLAYBOT_RECORDING_STOPPED.txt'
  Remove-Item $flag -Force -ErrorAction SilentlyContinue
  Set-Content -Path $stamp -Value ("stoppedAt=" + (Get-Date).ToString('o')) -Encoding utf8
}

function Stop-PlaybotRecordingSession {
  Stop-PlaybotPidTree (Read-PlaybotPid 'playbot-harness.pid')
  Stop-PlaybotHarnessByCommandLine
  Clear-PlaybotRecordingFlag
  Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-harness.pid') -Force -ErrorAction SilentlyContinue
}

function Stop-PlaybotAll {
  $consoleId = Read-PlaybotPid 'playbot-console.pid'
  $watchId = Read-PlaybotPid 'playbot-watch.pid'
  Stop-PlaybotRecordingSession
  Stop-PlaybotPidTree $watchId
  Stop-PlaybotPidTree $consoleId
  Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-watch.pid') -Force -ErrorAction SilentlyContinue
  Remove-Item (Join-Path (Get-PlaybotLogDir) 'playbot-console.pid') -Force -ErrorAction SilentlyContinue
}
