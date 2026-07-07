param(
  [switch]$SkipFetch,
  [switch]$SkipTests,
  [string]$OutputDir
)

$ErrorActionPreference = "Continue"

function Add-Line {
  param([string]$Text = "")
  Add-Content -Path $TxtReport -Value $Text
}

function Run-Capture {
  param(
    [string]$Title,
    [string]$Exe,
    [string[]]$Args
  )

  Add-Line ""
  Add-Line "=== $Title ==="

  $tmpOut = Join-Path $RunDir ("cmd_" + ($Title -replace "[^A-Za-z0-9_-]","_") + "_out.txt")
  $tmpErr = Join-Path $RunDir ("cmd_" + ($Title -replace "[^A-Za-z0-9_-]","_") + "_err.txt")

  try {
    $p = Start-Process -FilePath $Exe -ArgumentList $Args -WorkingDirectory $RepoRoot -NoNewWindow -Wait -PassThru -RedirectStandardOutput $tmpOut -RedirectStandardError $tmpErr
    $stdout = if (Test-Path $tmpOut) { Get-Content $tmpOut -Raw } else { "" }
    $stderr = if (Test-Path $tmpErr) { Get-Content $tmpErr -Raw } else { "" }

    Add-Line ("ExitCode: " + $p.ExitCode)
    if ($stdout) { Add-Line "--- STDOUT ---"; Add-Line $stdout.TrimEnd() }
    if ($stderr) { Add-Line "--- STDERR ---"; Add-Line $stderr.TrimEnd() }

    return [ordered]@{
      title = $Title
      exe = $Exe
      args = $Args
      exit_code = $p.ExitCode
      stdout = $stdout
      stderr = $stderr
    }
  }
  catch {
    Add-Line ("ERROR: " + $_.Exception.Message)
    return [ordered]@{
      title = $Title
      exe = $Exe
      args = $Args
      exit_code = $null
      error = $_.Exception.Message
    }
  }
}

$RepoRoot = git rev-parse --show-toplevel 2>$null
if (-not $RepoRoot) { throw "Not inside a Git repository." }
$RepoRoot = $RepoRoot.Trim()
Set-Location $RepoRoot

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $OutputDir -or $OutputDir.Trim() -eq "") {
  $OutputDir = Join-Path (Split-Path $RepoRoot -Parent) ("GBSE_REPO_VERIFY_" + $stamp)
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$RunDir = $OutputDir
$TxtReport = Join-Path $OutputDir "GBSE_REPO_STATE_VERIFICATION_001.txt"
$JsonReport = Join-Path $OutputDir "GBSE_REPO_STATE_VERIFICATION_001.json"

"GBSE_REPO_STATE_VERIFICATION_001" | Set-Content -Path $TxtReport

$report = [ordered]@{
  report_id = "GBSE_REPO_STATE_VERIFICATION_001"
  generated_utc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  generated_local = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
  repo_root = $RepoRoot
  boundary = "LOCAL_REPO_OBSERVATION_ONLY / NOT_RUNTIME_PROOF / NOT_ATTA_AFFIRMATION"
  commands = @()
  key_files = @()
  untracked_items = @()
  package_scripts = $null
  test_summary = $null
}

Add-Line ("Generated_UTC: " + $report.generated_utc)
Add-Line ("Generated_Local: " + $report.generated_local)
Add-Line ("RepoRoot: " + $RepoRoot)
Add-Line "Boundary: LOCAL_REPO_OBSERVATION_ONLY / NOT_RUNTIME_PROOF / NOT_ATTA_AFFIRMATION"

$report.commands += Run-Capture "REPO ROOT" "git" @("rev-parse","--show-toplevel")
$report.commands += Run-Capture "CURRENT BRANCH" "git" @("branch","--show-current")
$report.commands += Run-Capture "REMOTES" "git" @("remote","-v")

if (-not $SkipFetch) {
  $report.commands += Run-Capture "FETCH ORIGIN / REMOTE REFRESH" "git" @("fetch","--all","--prune")
} else {
  Add-Line ""; Add-Line "=== FETCH ORIGIN / REMOTE REFRESH ==="; Add-Line "SKIPPED"
}

$report.commands += Run-Capture "LOCAL STATUS" "git" @("status","--short","--branch")
$report.commands += Run-Capture "LATEST LOCAL COMMIT" "git" @("log","-1","--oneline","--decorate")
$report.commands += Run-Capture "RECENT COMMITS" "git" @("log","--oneline","--decorate","--graph","-10")
$report.commands += Run-Capture "TAGS" "git" @("tag","--sort=-creatordate")
$report.commands += Run-Capture "UNTRACKED FILES" "git" @("ls-files","--others","--exclude-standard")
$report.commands += Run-Capture "MODIFIED TRACKED FILES" "git" @("diff","--name-only")
$report.commands += Run-Capture "STAGED FILES" "git" @("diff","--cached","--name-only")

Add-Line ""
Add-Line "=== KEY FILES CHECK ==="
$keyFiles = @(
  "README.md",
  "ROADMAP.md",
  "CHANGELOG.md",
  "SPECIFICATION.md",
  "HALLUCINATION_TAXONOMY.md",
  "package.json",
  "docs/standards",
  "docs/records",
  "fixtures",
  "tests",
  "src"
)

foreach ($f in $keyFiles) {
  $exists = Test-Path $f
  $kind = if ($exists) { if ((Get-Item $f).PSIsContainer) { "directory" } else { "file" } } else { "missing" }
  $line = if ($exists) { "FOUND: $f [$kind]" } else { "MISSING: $f" }
  Add-Line $line
  $report.key_files += [ordered]@{ path = $f; exists = $exists; kind = $kind }
}

Add-Line ""
Add-Line "=== DOCS/STANDARDS TREE ==="
if (Test-Path "docs/standards") {
  Get-ChildItem "docs/standards" -Recurse -Force | ForEach-Object {
    Add-Line ($_.FullName + " | Type=" + $_.PSIsContainer + " | Size=" + $_.Length + " | Modified=" + $_.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:sszzz"))
  }
} else {
  Add-Line "MISSING docs/standards"
}

Add-Line ""
Add-Line "=== DOCS/RECORDS TREE ==="
if (Test-Path "docs/records") {
  Get-ChildItem "docs/records" -Recurse -Force | ForEach-Object {
    Add-Line ($_.FullName + " | Type=" + $_.PSIsContainer + " | Size=" + $_.Length + " | Modified=" + $_.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:sszzz"))
  }
} else {
  Add-Line "MISSING docs/records"
}

Add-Line ""
Add-Line "=== UNTRACKED ITEM CLASSIFICATION ==="
$untracked = git ls-files --others --exclude-standard
foreach ($u in $untracked) {
  $classification = "REQUIRES_CLASSIFICATION"
  if ($u -like "GBSE_REPO_STATE_VERIFICATION_001*") { $classification = "LOCAL_VERIFICATION_ARTIFACT_DO_NOT_STAGE" }
  elseif ($u -like "verify-gbse-repo-state.ps1") { $classification = "ROOT_VERIFIER_SCRIPT_CANDIDATE" }
  elseif ($u -like "docs/records/*") { $classification = "UNTRACKED_RECORD_REVIEW_REQUIRED" }
  elseif ($u -like "docs/standards/*") { $classification = "UNTRACKED_STANDARD_REVIEW_REQUIRED" }

  Add-Line ($u + " | " + $classification)
  $report.untracked_items += [ordered]@{ path = $u; classification = $classification }
}

Add-Line ""
Add-Line "=== PACKAGE SCRIPTS ==="
if (Test-Path "package.json") {
  try {
    $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
    $report.package_scripts = $pkg.scripts
    $pkg.scripts | ConvertTo-Json -Depth 10 | Add-Line
  }
  catch {
    Add-Line ("PACKAGE_JSON_READ_ERROR: " + $_.Exception.Message)
  }
} else {
  Add-Line "MISSING package.json"
}

Add-Line ""
Add-Line "=== NPM TEST CHECK ==="
if ($SkipTests) {
  Add-Line "SKIPPED"
  $report.test_summary = "SKIPPED"
} elseif (Test-Path "package.json") {
  $testResult = Run-Capture "NPM TEST" "npm.cmd" @("test","--","--runInBand")
  $report.commands += $testResult
  $report.test_summary = if ($testResult.exit_code -eq 0) { "PASS" } else { "FAIL_OR_WARNING_CHECK_REPORT" }
} else {
  Add-Line "SKIPPED npm test: package.json missing"
  $report.test_summary = "SKIPPED_PACKAGE_JSON_MISSING"
}

Add-Line ""
Add-Line "=== FINAL BOUNDARY ==="
Add-Line "This report verifies local repo state only."
Add-Line "It does not prove new governance standards are repo-inserted, runtime-implemented, fixture-tested, benchmark-proven, or ATTA-affirmed."
Add-Line "GBSE must classify untracked items before staging, deleting, or preparing PR insertion."

$report | ConvertTo-Json -Depth 30 | Set-Content -Path $JsonReport -Encoding UTF8

Write-Host "GBSE_REPO_STATE_VERIFICATION_COMPLETE"
Write-Host "TXT:  $TxtReport"
Write-Host "JSON: $JsonReport"
