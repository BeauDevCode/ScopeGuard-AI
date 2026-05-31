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

$allowedFiles = @(
  ".gitignore",
  "package-lock.json",
  "scripts\check-public-safety.ps1"
)

$seriousTerms = @(
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
  "VIDAXL_REQUEST_CAPTURE",
  "SAFE_TEST_LOG",
  "REQUEST_MAP_PRIVATE",
  "FINDINGS_PRIVATE",
  "X-Bugcrowd-Ninja"
)

$trackedPathTerms = @(
  "private/",
  "private\",
  "CAPTURE",
  "AUTOPILOT",
  "browser-profile",
  "SAFE_TEST_LOG",
  "REQUEST_MAP",
  "FINDINGS",
  "VIDAXL",
  "Moneybox",
  "YesWeHack",
  "bugcrowdninja",
  "yeswehack.ninja",
  "5044519259",
  "Harrells",
  "Baton Rouge",
  "dcc050",
  "cbeaub"
)

$informationalTerms = @(
  "cookie",
  "authorization",
  "bearer",
  "jwt",
  "session",
  "password",
  "csrf",
  "secret"
)

$uuidLike = "\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b"
$seriousFindings = New-Object System.Collections.Generic.List[string]
$infoFindings = New-Object System.Collections.Generic.List[string]

function Get-RepoRelativePath {
  param([string]$Path)

  $rootWithSeparator = $repoRoot
  if (-not $rootWithSeparator.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $rootWithSeparator = "$rootWithSeparator$([System.IO.Path]::DirectorySeparatorChar)"
  }

  $rootUri = New-Object System.Uri($rootWithSeparator)
  $pathUri = New-Object System.Uri($Path)
  return [System.Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString())
}

function Test-SkippedFile {
  param([string]$Path)

  $relative = Get-RepoRelativePath -Path $Path
  $relativeForCompare = $relative.Replace("/", "\")
  if ($allowedFiles -contains $relativeForCompare) { return $true }
  if ($relativeForCompare.EndsWith(".tsbuildinfo", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }

  $parts = $relativeForCompare -split "[\\/]+"
  foreach ($part in $parts) {
    if ($skipDirs -contains $part) {
      return $true
    }
  }

  return $false
}

function Add-ContentFindings {
  param(
    [string]$Relative,
    [string]$Content
  )

  foreach ($term in $seriousTerms) {
    if ($Content.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      $seriousFindings.Add("$Relative contains possible private leak marker: $term")
    }
  }

  foreach ($term in $informationalTerms) {
    if ($Content.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      $infoFindings.Add("$Relative mentions safety/redaction term: $term")
    }
  }

  if (($Relative.StartsWith("docs\", [System.StringComparison]::OrdinalIgnoreCase) -or
      $Relative.StartsWith("examples\", [System.StringComparison]::OrdinalIgnoreCase)) -and
      [regex]::IsMatch($Content, $uuidLike)) {
    $seriousFindings.Add("$Relative contains UUID-like value in public docs/examples")
  }
}

function Add-TrackedPathFindings {
  $gitFiles = & git -C $repoRoot ls-files 2>$null
  if ($LASTEXITCODE -ne 0 -or $null -eq $gitFiles) {
    $infoFindings.Add("git ls-files was unavailable; tracked-path safety check skipped")
    return
  }

  foreach ($file in $gitFiles) {
    foreach ($term in $trackedPathTerms) {
      if ($file.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        $seriousFindings.Add("tracked path contains private-looking marker: $file")
      }
    }
  }
}

function Get-PublicFiles {
  param([string]$Directory)

  foreach ($item in Get-ChildItem -LiteralPath $Directory -Force) {
    if ($item.PSIsContainer) {
      if ($skipDirs -contains $item.Name) { continue }
      if (($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
      Get-PublicFiles -Directory $item.FullName
      continue
    }

    if (-not (Test-SkippedFile -Path $item.FullName)) {
      $item
    }
  }
}

$files = @(Get-PublicFiles -Directory $repoRoot)

foreach ($file in $files) {
  $relative = (Get-RepoRelativePath -Path $file.FullName).Replace("/", "\")
  $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
  if ($null -eq $content) { continue }

  Add-ContentFindings -Relative $relative -Content $content
}

Add-TrackedPathFindings

Write-Host "Public safety scan summary"
Write-Host "Files scanned: $($files.Count)"
Write-Host "Informational safety-term hits: $($infoFindings.Count)"
Write-Host "Possible leak findings: $($seriousFindings.Count)"

if ($infoFindings.Count -gt 0) {
  Write-Host ""
  Write-Host "Informational hits are safety/redaction vocabulary in public-safe docs or code."
  Write-Host "Set SCOPEGUARD_SAFETY_VERBOSE=1 to list every informational hit."
  if ($env:SCOPEGUARD_SAFETY_VERBOSE -eq "1") {
    foreach ($finding in $infoFindings) {
      Write-Host "INFO: $finding"
    }
  }
}

if ($seriousFindings.Count -gt 0) {
  Write-Host ""
  Write-Host "Possible leak findings:"
  foreach ($finding in $seriousFindings) {
    Write-Host "FAIL: $finding"
  }
  Write-Host ""
  Write-Host "Public safety scan failed. Move private material to ignored private/ paths or sanitize the public file."
  exit 1
}

Write-Host ""
Write-Host "Public safety scan passed: no serious private-data markers found outside ignored/private areas."
exit 0
