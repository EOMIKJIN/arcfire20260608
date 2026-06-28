# 실시간 heartbeat — report-watch 단일 인스턴스 (visible 콘솔 우선)
param(
  [string]$Package = 'com.arcfire.online',
  [int]$IntervalMin = 10
)

& (Join-Path $PSScriptRoot 'report-watch-ensure.ps1') -Package $Package -IntervalMin $IntervalMin
