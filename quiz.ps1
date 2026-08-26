param(
    [ValidateRange(1, 105)]
    [int]$Count = 20,
    [string]$Match
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$questionFile = Join-Path $root '08-题库\高频问题.md'
$questions = Get-Content -LiteralPath $questionFile -Encoding UTF8 |
    Where-Object { $_ -match '^\d+\.\s+\S' }

if ($Match) {
    $questions = $questions | Where-Object { $_ -match $Match }
}

$questions = @($questions)
if ($questions.Count -eq 0) {
    throw 'No questions matched the requested filter.'
}

$take = [Math]::Min($Count, $questions.Count)
$questions | Get-Random -Count $take | ForEach-Object { $_ }

