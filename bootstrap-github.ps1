[CmdletBinding()]
param(
    [string]$Repository = 'Anrixa/anrixa-audit-js'
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

function Invoke-Native {
    param([string]$FilePath, [string[]]$Arguments)
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$FilePath failed with exit code $LASTEXITCODE" }
}

$Root = $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $Root 'package.json') -PathType Leaf)) {
    throw 'PROJECT_ROOT_GATE=FAIL package.json missing'
}
Set-Location $Root
Write-Host "PROJECT_ROOT=$Root"
Write-Host 'PROJECT_ROOT_GATE=PASS'

$Git = (Get-Command git -ErrorAction Stop).Source
$Gh = (Get-Command gh -ErrorAction Stop).Source
$Node = (Get-Command node -ErrorAction Stop).Source
$Npm = (Get-Command npm -ErrorAction Stop).Source

Invoke-Native $Gh @('auth','status')
Invoke-Native $Node @('--version')
Invoke-Native $Npm @('--version')

if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
    Invoke-Native $Git @('init','-b','main')
}

$Branch = (& $Git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $Branch -ne 'main') { throw "BRANCH_GATE=FAIL actual=$Branch" }
Write-Host 'BRANCH_GATE=PASS'

Invoke-Native $Npm @('test')
Invoke-Native $Npm @('pack','--dry-run')
Write-Host 'LOCAL_VALIDATION_GATE=PASS'

$Remotes = @(& $Git remote)
if ($LASTEXITCODE -ne 0) { throw 'REMOTE_LIST_GATE=FAIL' }
$ExpectedUrl = "https://github.com/$Repository.git"
if ($Remotes -contains 'origin') {
    $Origin = (& $Git remote get-url origin).Trim()
    if ($Origin -ne $ExpectedUrl) { throw "ORIGIN_GATE=FAIL actual=$Origin expected=$ExpectedUrl" }
}

Invoke-Native $Git @('add','--all')
$Status = @(& $Git status --porcelain)
if ($Status.Count -gt 0) {
    Invoke-Native $Git @('commit','-m','Initial release: @anrixa/audit 0.1.0')
}

$OldEap = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $Gh repo view $Repository '--json' 'nameWithOwner' *> $null
$RepoExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $OldEap

if (-not $RepoExists) {
    Invoke-Native $Gh @(
        'repo','create',$Repository,
        '--public',
        '--description','Deterministic audit gates and SHA-256 evidence for Node.js workflows.',
        '--source',$Root,
        '--remote','origin',
        '--push'
    )
} else {
    $Remotes = @(& $Git remote)
    if ($Remotes -notcontains 'origin') { Invoke-Native $Git @('remote','add','origin',$ExpectedUrl) }
    Invoke-Native $Git @('push','-u','origin','main')
}

$Head = (& $Git rev-parse HEAD).Trim()
Write-Host "HEAD=$Head"
Write-Host "REPOSITORY=$Repository"
Write-Host 'GITHUB_BOOTSTRAP_GATE=PASS'
