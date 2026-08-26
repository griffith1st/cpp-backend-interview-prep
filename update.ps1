param(
    [switch]$IncludeDirty
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Join-Path $root 'repos'
$failed = 0

Get-ChildItem -LiteralPath $repoRoot -Directory | Sort-Object Name | ForEach-Object {
    $repo = $_.FullName
    if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) {
        return
    }

    $dirty = git -C $repo status --porcelain
    if ($dirty -and -not $IncludeDirty) {
        Write-Warning "SKIP $($_.Name): local changes detected; pass -IncludeDirty only if you have reviewed them."
        $failed++
        return
    }

    Write-Host "UPDATE $($_.Name)"
    git -C $repo pull --ff-only --no-tags
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "FAIL $($_.Name): git pull exited $LASTEXITCODE"
        $failed++
    }
}

if ($failed -gt 0) {
    Write-Warning "$failed repository update(s) need attention."
    exit 1
}
Write-Host 'All clean repositories updated.'
exit 0

