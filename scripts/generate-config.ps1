<#
.SYNOPSIS
Generates config.local.js from the OPENWEATHER_API_KEY environment variable (PowerShell)
#>
param()

$key = $env:OPENWEATHER_API_KEY
if (-not $key) {
  Write-Error 'OPENWEATHER_API_KEY environment variable not set. Set it and re-run this script.'
  exit 2
}

$out = "window.OPENWEATHER_API_KEY = '$key';`n"
$dest = Join-Path -Path (Get-Location) -ChildPath 'config.local.js'
try {
  Set-Content -Path $dest -Value $out -Encoding UTF8
  Write-Host "Wrote $dest"
} catch {
  Write-Error "Failed to write config.local.js: $_"
  exit 3
}
