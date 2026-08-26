param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Pattern,
    [string]$Path = '.',
    [switch]$Code
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = if ([IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path $root $Path }

if (-not (Test-Path -LiteralPath $target)) {
    throw "Search path does not exist: $target"
}

if (-not (Get-Command rg -ErrorAction SilentlyContinue)) {
    throw 'ripgrep (rg) is required. Install it or run the search from an editor.'
}

$args = @('--line-number', '--hidden', '--glob', '!**/.git/**')
if ($Code) {
    $args += @('--glob', '*.c', '--glob', '*.cc', '--glob', '*.cpp', '--glob', '*.cxx', '--glob', '*.h', '--glob', '*.hpp', '--glob', '*.cmake')
}
$args += @($Pattern, $target)
& rg @args
exit $LASTEXITCODE

