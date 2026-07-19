# Phase 2b - Rewrite legacy `@/<pkg>/...` imports to the canonical package
# aliases now that the shared code lives under src/packages/*.
#
#   @/utils/<x>   -> @utils/<x>      (alias -> ./src/packages/utils/*)
#   @/types/<x>   -> @types/<x>      (alias -> ./src/packages/types/*)
#   @/hooks/<x>   -> @hooks/<x>      (alias -> ./src/packages/hooks/*)
#   @/config/<x>  -> @config/<x>     (alias -> ./src/packages/config/*)
#
# `@/components/ui/<x>` is left as-is for now (Phase 3 reorganizes components);
# the ui files moved to packages/ui but are still re-exported from
# components/ui via a compatibility barrel created in Phase 3.
#
# Idempotent.

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

# Order matters: longest prefix first so `@/types/` is rewritten before any
# shorter overlapping prefix. None of these overlap, but we keep the map
# explicit for clarity.
$rewrites = [ordered]@{
    '@/utils/'         = '@utils/'
    '@/types/'         = '@types/'
    '@/hooks/'         = '@hooks/'
    '@/config/'        = '@config/'
    '@/components/ui/' = '@packages/ui/'
}

$count = 0
Get-ChildItem -Path $src -Recurse -Include '*.ts', '*.tsx' -File | ForEach-Object {
    $path = $_.FullName
    $content = [IO.File]::ReadAllText($path)
    $original = $content
    foreach ($k in $rewrites.Keys) {
        $content = $content -replace ('from "' + [regex]::Escape($k)), ('from "' + $rewrites[$k])
        $content = $content -replace ('from "''' + [regex]::Escape($k)), ("from ''" + $rewrites[$k])
    }
    if ($content -ne $original) {
        [IO.File]::WriteAllText($path, $content)
        $script:count++
        Write-Host ("rewrote : " + $path.Substring($root.Length + 1))
    }
}

# Also rewrite the seed script outside src/.
$seed = Join-Path $root 'prisma\seed.ts'
if (Test-Path -LiteralPath $seed) {
    $c = [IO.File]::ReadAllText($seed)
    $o = $c
    foreach ($k in $rewrites.Keys) {
        $c = $c -replace ('from "' + [regex]::Escape($k)), ('from "' + $rewrites[$k])
    }
    if ($c -ne $o) { [IO.File]::WriteAllText($seed, $c); Write-Host "rewrote : prisma\seed.ts" }
}

Write-Host "PHASE2B DONE - files rewritten: $count"
