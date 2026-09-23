<#
.SYNOPSIS
  Switch arcfire-arc-core-chat-turn to nodejs24.x without wiping env (Groq key).
.EXAMPLE
  .\tools\arc-core-chat\update-lambda-runtime-node24.ps1
#>
param(
  [string]$FunctionName = 'arcfire-arc-core-chat-turn',
  [string]$Region = 'ap-northeast-2'
)

$ErrorActionPreference = 'Stop'

$aws = Get-Command aws -ErrorAction SilentlyContinue
if (-not $aws) {
  Write-Error 'aws CLI not found. Install AWS CLI v2 and retry, or set Runtime to nodejs24.x in the Lambda console.'
}

$before = aws lambda get-function-configuration --function-name $FunctionName --region $Region --query '{Runtime:Runtime,LastModified:LastModified}' --output json
Write-Host "[runtime] before: $before"

aws lambda update-function-configuration `
  --function-name $FunctionName `
  --region $Region `
  --runtime nodejs24.x

$after = aws lambda get-function-configuration --function-name $FunctionName --region $Region --query '{Runtime:Runtime,LastModified:LastModified,State:State}' --output json
Write-Host "[runtime] after: $after"
Write-Host 'OK — runtime only. Groq key was not rewritten.'
