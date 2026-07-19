# Phase 3 - Reorganize src/components/* into feature-based src/features/*.
# Moves whole subdirectories with `git mv` (preserves history) and rewrites
# the corresponding `@/components/<dir>/` imports to `@features/<feature>/components/`.
# Idempotent: skips directories that no longer exist at the source.

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

# source dir (under src\components) -> dest dir (under src\features)
$dirMoves = [ordered]@{
    'navigation' = 'navigation\components'
    'footer'     = 'footer\components'
    'background' = 'background\components'
    'blog'       = 'blog\components'
    'admin'      = 'admin\components'
    'layout'     = 'layout\components'
    'sections'   = 'sections'          # split per-file below
    'cards'      = 'cards'              # split per-file below
    'shared'     = 'shared\components'  # cross-cutting shared components
}

# Per-file moves for sections/ -> feature/components (domain split).
$sectionMoves = [ordered]@{
    'HeroBackground.tsx'         = 'hero\components\HeroBackground.tsx'
    'HeroPortrait.tsx'           = 'hero\components\HeroPortrait.tsx'
    'HeroPortrait3D.tsx'         = 'hero\components\HeroPortrait3D.tsx'
    'HeroScrollIndicator.tsx'    = 'hero\components\HeroScrollIndicator.tsx'
    'HeroSection.tsx'            = 'hero\components\HeroSection.tsx'
    'HeroTerminal.tsx'           = 'hero\components\HeroTerminal.tsx'
    'AboutOutputView.tsx'        = 'about\components\AboutOutputView.tsx'
    'AboutTerminal.tsx'          = 'about\components\AboutTerminal.tsx'
    'AchievementsGrid.tsx'       = 'about\components\AchievementsGrid.tsx'
    'BootScreen.tsx'             = 'hero\components\BootScreen.tsx'
    'ConnectLinks.tsx'           = 'contact\components\ConnectLinks.tsx'
    'ContactTerminal.tsx'        = 'contact\components\ContactTerminal.tsx'
    'ContainerFleet.tsx'         = 'projects\components\ContainerFleet.tsx'
    'ExperienceTimeline.tsx'     = 'experience\components\ExperienceTimeline.tsx'
    'InfrastructureTopology.tsx' = 'infrastructure\components\InfrastructureTopology.tsx'
    'SkillsMesh.tsx'             = 'skills\components\SkillsMesh.tsx'
}

# Per-file moves for cards/ -> feature/components (domain split).
$cardMoves = [ordered]@{
    'ContainerInspect.tsx' = 'projects\components\ContainerInspect.tsx'
    'ContainerRow.tsx'     = 'projects\components\ContainerRow.tsx'
    'DeploymentCard.tsx'   = 'experience\components\DeploymentCard.tsx'
    'NodeInspect.tsx'      = 'infrastructure\components\NodeInspect.tsx'
}

# 1. Create feature directories.
$features = @('hero', 'about', 'projects', 'experience', 'skills', 'infrastructure',
    'blog', 'contact', 'navigation', 'footer', 'background', 'admin',
    'layout', 'shared')
foreach ($f in $features) {
    New-Item -ItemType Directory -Force -Path (Join-Path $src "features\$f\components") | Out-Null
}

# 2. Move whole directories.
function Move-Dir($fromRel, $toRel) {
    $from = Join-Path $src $fromRel
    if (-not (Test-Path -LiteralPath $from)) { Write-Host "SKIP (missing): $fromRel"; return }
    $to = Join-Path $src $toRel
    $toDir = Split-Path $to -Parent
    if (-not (Test-Path $toDir)) { New-Item -ItemType Directory -Force -Path $toDir | Out-Null }

    # If dest exists (partial run), move contents individually.
    if (Test-Path -LiteralPath $to) {
        Get-ChildItem -LiteralPath $from -Force | ForEach-Object {
            $dest = Join-Path $to $_.Name
            Move-Item -LiteralPath $_.FullName -Destination $dest -Force
        }
        Write-Host "merged  : $fromRel -> $toRel"
        return
    }
    $listed = (& git ls-files -- $from 2>$null)
    $tracked = (-not [string]::IsNullOrWhiteSpace($listed))
    if ($tracked) {
        & git mv $from $to 2>&1 | Out-Null
        Write-Host "git mv  : $fromRel -> $toRel"
    }
    else {
        Move-Item -LiteralPath $from -Destination $to -Force
        Write-Host "move    : $fromRel -> $toRel"
    }
}

foreach ($k in $dirMoves.Keys) {
    if ($k -eq 'sections' -or $k -eq 'cards') { continue }   # handled per-file
    Move-Dir "components\$k" $dirMoves[$k]
}

# 3. Move section + card files individually (domain split).
function Move-File($fromRel, $toRel) {
    $from = Join-Path $src $fromRel
    if (-not (Test-Path -LiteralPath $from)) { Write-Host "SKIP (missing): $fromRel"; return }
    $to = Join-Path $src $toRel
    $toDir = Split-Path $to -Parent
    if (-not (Test-Path $toDir)) { New-Item -ItemType Directory -Force -Path $toDir | Out-Null }
    $listed = (& git ls-files -- $from 2>$null)
    $tracked = (-not [string]::IsNullOrWhiteSpace($listed))
    if ($tracked) {
        & git mv $from $to 2>&1 | Out-Null
        Write-Host "git mv  : $fromRel -> $toRel"
    }
    else {
        Move-Item -LiteralPath $from -Destination $to -Force
        Write-Host "move    : $fromRel -> $toRel"
    }
}

foreach ($k in $sectionMoves.Keys) { Move-File "components\sections\$k" $sectionMoves[$k] }
foreach ($k in $cardMoves.Keys) { Move-File "components\cards\$k"    $cardMoves[$k] }

# 4. Rewrite imports across every .ts/.tsx under src/.
#    @/components/<dir>/<file> -> @features/<feature>/components/<file>
#    Order: longest source prefix first to avoid partial matches.
$importMap = [ordered]@{
    '@/components/navigation/' = '@features/navigation/components/'
    '@/components/footer/'     = '@features/footer/components/'
    '@/components/background/' = '@features/background/components/'
    '@/components/blog/'       = '@features/blog/components/'
    '@/components/admin/'      = '@features/admin/components/'
    '@/components/layout/'     = '@features/layout/components/'
    '@/components/shared/'     = '@features/shared/components/'
    '@/components/sections/'   = '@features/sections/'   # temp; refined below
    '@/components/cards/'      = '@features/cards/'      # temp; refined below
}

# Per-file section rewrites (after the dir rewrite above, these target the
# new @features/sections/<File> paths and repoint them to the domain feature).
$sectionFileMap = [ordered]@{
    'HeroBackground.tsx'         = '@features/hero/components/HeroBackground'
    'HeroPortrait.tsx'           = '@features/hero/components/HeroPortrait'
    'HeroPortrait3D.tsx'         = '@features/hero/components/HeroPortrait3D'
    'HeroScrollIndicator.tsx'    = '@features/hero/components/HeroScrollIndicator'
    'HeroSection.tsx'            = '@features/hero/components/HeroSection'
    'HeroTerminal.tsx'           = '@features/hero/components/HeroTerminal'
    'AboutOutputView.tsx'        = '@features/about/components/AboutOutputView'
    'AboutTerminal.tsx'          = '@features/about/components/AboutTerminal'
    'AchievementsGrid.tsx'       = '@features/about/components/AchievementsGrid'
    'BootScreen.tsx'             = '@features/hero/components/BootScreen'
    'ConnectLinks.tsx'           = '@features/contact/components/ConnectLinks'
    'ContactTerminal.tsx'        = '@features/contact/components/ContactTerminal'
    'ContainerFleet.tsx'         = '@features/projects/components/ContainerFleet'
    'ExperienceTimeline.tsx'     = '@features/experience/components/ExperienceTimeline'
    'InfrastructureTopology.tsx' = '@features/infrastructure/components/InfrastructureTopology'
    'SkillsMesh.tsx'             = '@features/skills/components/SkillsMesh'
}
$cardFileMap = [ordered]@{
    'ContainerInspect.tsx' = '@features/projects/components/ContainerInspect'
    'ContainerRow.tsx'     = '@features/projects/components/ContainerRow'
    'DeploymentCard.tsx'   = '@features/experience/components/DeploymentCard'
    'NodeInspect.tsx'      = '@features/infrastructure/components/NodeInspect'
}

$count = 0
Get-ChildItem -Path $src -Recurse -Include '*.ts', '*.tsx' -File | ForEach-Object {
    $path = $_.FullName
    $content = [IO.File]::ReadAllText($path)
    $original = $content

    # 4a. Directory-level rewrites.
    foreach ($k in $importMap.Keys) {
        $content = $content -replace ('from "' + [regex]::Escape($k)), ('from "' + $importMap[$k])
        $content = $content -replace ("from '" + [regex]::Escape($k)), ("from '" + $importMap[$k])
    }
    # 4b. Per-file section rewrites (refine the temp @features/sections/<File>).
    foreach ($k in $sectionFileMap.Keys) {
        $content = $content -replace ('from "@features/sections/' + $k + '"'), ('from "' + $sectionFileMap[$k] + '"')
        $content = $content -replace ("from '@features/sections/'" + $k + "'"), ("from '" + $sectionFileMap[$k] + "'")
    }
    # 4c. Per-file card rewrites.
    foreach ($k in $cardFileMap.Keys) {
        $content = $content -replace ('from "@features/cards/' + $k + '"'), ('from "' + $cardFileMap[$k] + '"')
        $content = $content -replace ("from '@features/cards/'" + $k + "'"), ("from '" + $cardFileMap[$k] + "'")
    }

    if ($content -ne $original) {
        [IO.File]::WriteAllText($path, $content)
        $script:count++
        Write-Host ("rewrote : " + $path.Substring($root.Length + 1))
    }
}
Write-Host "PHASE3 DONE - files rewritten: $count"
