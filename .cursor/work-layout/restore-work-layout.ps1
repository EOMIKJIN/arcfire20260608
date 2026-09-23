#Requires -Version 5.1
<#
  기존작업환경 복구 — 김클로드를 가운데 탭으로 다시 연다.
  정본: .cursor/work-layout/WORK_LAYOUT.json
#>
$ErrorActionPreference = 'Stop'
$LayoutDir = $PSScriptRoot
$Root = Split-Path -Parent (Split-Path -Parent $LayoutDir)
$LayoutPath = Join-Path $LayoutDir 'WORK_LAYOUT.json'
if (-not (Test-Path $LayoutPath)) { throw "WORK_LAYOUT.json missing: $LayoutPath" }

$layout = Get-Content -LiteralPath $LayoutPath -Raw -Encoding UTF8 | ConvertFrom-Json
$vscodeDir = Join-Path $Root '.vscode'
New-Item -ItemType Directory -Force -Path $vscodeDir | Out-Null
$wsPath = Join-Path $vscodeDir 'settings.json'
$ws = @{}
if (Test-Path $wsPath) {
  $ws = Get-Content -LiteralPath $wsPath -Raw -Encoding UTF8 | ConvertFrom-Json
}
foreach ($p in $layout.workspaceSettings.PSObject.Properties) {
  $ws | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force
}
($ws | ConvertTo-Json -Depth 8) + "`n" | Set-Content -LiteralPath $wsPath -Encoding UTF8

$userPath = Join-Path $env:APPDATA 'Cursor\User\settings.json'
if (Test-Path $userPath) {
  $user = Get-Content -LiteralPath $userPath -Raw -Encoding UTF8 | ConvertFrom-Json
  foreach ($p in $layout.userSettingsMerge.PSObject.Properties) {
    $user | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force
  }
  ($user | ConvertTo-Json -Depth 8) + "`n" | Set-Content -LiteralPath $userPath -Encoding UTF8
}

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class NativeWinRestore {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
}
"@
Add-Type -AssemblyName System.Windows.Forms
$p = Get-Process | Where-Object { $_.ProcessName -eq 'Cursor' -and $_.MainWindowTitle -like '*arcfire20260607*' } | Select-Object -First 1
if (-not $p) { $p = Get-Process | Where-Object { $_.ProcessName -eq 'Cursor' -and $_.MainWindowTitle } | Select-Object -First 1 }
if (-not $p) { Write-Host 'restore-work-layout: settings written; Cursor window not found'; exit 0 }
if ([NativeWinRestore]::IsIconic($p.MainWindowHandle)) { [void][NativeWinRestore]::ShowWindow($p.MainWindowHandle, 9) }
[void][NativeWinRestore]::SetForegroundWindow($p.MainWindowHandle)
Start-Sleep -Milliseconds 350
Set-Clipboard -Value ([string]$layout.openClaudeCode.commandTitle)
[System.Windows.Forms.SendKeys]::SendWait('^+p')
Start-Sleep -Milliseconds 450
[System.Windows.Forms.SendKeys]::SendWait('^v')
Start-Sleep -Milliseconds 350
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Write-Host 'restore-work-layout: settings applied; Claude Code Open in New Tab sent'
