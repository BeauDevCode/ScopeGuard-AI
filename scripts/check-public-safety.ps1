$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$skipDirs = @(
  ".git",
  "node_modules",
  "dist",
  "private",
  "coverage",
  "playwright-report",
  "test-results",
  "generic-browser-profile",
  "vidaxl-browser-profile",
  "bugcrowd-browser-profile",
  "yeswehack-browser-profile"
)

$riskyTerms = @(
  "cookie",
  "authorization",
  "bearer",
  "jwt",
  "session",
  "password",
  "bugcrowdninja",
  "yeswehack.ninja",
  "C:\Users\Beaub",
  "dcc050",
  "cbeaub",
  "5044519259",
  "Baton Rouge",
  "Harrells Ferry",
  "vidaXL",
  "Moneybox",
  "live capture",
  "VIDAXL_REQUEST_CAPTURE",
  "SAFE_TEST_LOG",
  "X-Bugcrowd-Ninja"
)

$uuidLike = "\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"
$warnings = New-Object System.Collections.Generic.List[string]

function Should-SkipFile {
  param([string]$Path)

  $relative = $Path.Substring($repoRoot.Length).TrimStart("\", "/")
  if ($relative -eq "scripts\check-public-safety.ps1") { return $true }
  if ($relative -eq "package-lock.json") { return $true }
  if ($relative -eq ".gitignore") { return $true }
  if ($relative.EndsWith(".tsbuildinfo", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

  $parts = $relative -split "[\\/]+"
  foreach ($part in $parts) {
    if ($skipDirs -contains $part) {
      return $true
    }
  }

  foreach ($dir in $skipDirs) {
    if ($relative -eq $dir -or $relative.StartsWith("$dir\", [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }
  return $false
}

$files = Get-ChildItem -LiteralPath $repoRoot -Recurse -File -Force |
  Where-Object { -not (Should-SkipFile -Path $_.FullName) }

foreach ($file in $files) {
  $relative = $file.FullName.Substring($repoRoot.Length).TrimStart("\", "/")
  $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
  if ($null -eq $content) { continue }

  foreach ($term in $riskyTerms) {
    if ($content.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      $warnings.Add("$relative contains risky string: $term")
    }
  }

  if (($relative.StartsWith("docs\", [System.StringComparison]::OrdinalIgnoreCase) -or
      $relative.StartsWith("examples\", [System.StringComparison]::OrdinalIgnoreCase)) -and
      [regex]::IsMatch($content, $uuidLike)) {
    $warnings.Add("$relative contains UUID-like value in public docs/examples")
  }
}

if ($warnings.Count -eq 0) {
  Write-Host "Public safety scan passed: no risky strings found outside ignored/private areas."
} else {
  Write-Host "Public safety scan warnings:"
  foreach ($warning in $warnings) {
    Write-Host "WARN: $warning"
  }
  Write-Host ""
  Write-Host "Warnings are informational. Review whether each hit is an acceptable public safety disclaimer/redaction term or must be moved into private/."
}

exit 0
