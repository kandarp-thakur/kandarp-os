# Phase 2c - Fix the @types/* alias collision.
# TypeScript reserves `@types/<name>` for ambient type declaration packages
# (e.g. @types/react), so a path alias named `@types/*` is rejected with
# TS6137 ("Cannot import type declaration files"). Rewrite every `@types/`
# import to the canonical `@packages/types/` alias instead.

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

$old = '@types/'
$new = '@packages/types/'

$count = 0
Get-ChildItem -Path $src -Recurse -Include '*.ts', '*.tsx' -File | ForEach-Object {
    $path = $_.FullName
    $content = [IO.File]::ReadAllText($path)
    $original = $content
    $content = $content -replace ('from "' + [regex]::Escape($old)), ('from "' + $new)
    $content = $content -replace ("from '" + [regex]::Escape($old)), ("from '" + $new)
    if ($content -ne $original) {
        [IO.File]::WriteAllText($path, $content)
        $script:count++
        Write-Host ("rewrote : " + $path.Substring($root.Length + 1))
    }
}
Write-Host "PHASE2C DONE - files rewritten: $count"
