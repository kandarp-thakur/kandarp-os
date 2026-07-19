# Phase 3b - Clean up the remaining stale component imports after Phase 3.
# Fixes:
#   1. @features/sections/<File>  -> @features/<domain>/components/<File>
#   2. @features/cards/<File>     -> @features/<domain>/components/<File>
#   3. @/components/layout        -> @features/layout/components   (barrel, no slash)
#   4. @/components/background/    -> @features/background/components/
#   5. @/components/3d/            -> @/3d/   (3D avatar stays under src/3d for now)
# Idempotent.

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

# Per-file section -> domain feature (matches both "..." and '...' forms).
$sectionFileMap = [ordered]@{
    'HeroBackground'         = 'hero/components/HeroBackground'
    'HeroPortrait'           = 'hero/components/HeroPortrait'
    'HeroPortrait3D'         = 'hero/components/HeroPortrait3D'
    'HeroScrollIndicator'    = 'hero/components/HeroScrollIndicator'
    'HeroSection'            = 'hero/components/HeroSection'
    'HeroTerminal'           = 'hero/components/HeroTerminal'
    'AboutOutputView'        = 'about/components/AboutOutputView'
    'AboutTerminal'          = 'about/components/AboutTerminal'
    'AchievementsGrid'       = 'about/components/AchievementsGrid'
    'BootScreen'             = 'hero/components/BootScreen'
    'ConnectLinks'           = 'contact/components/ConnectLinks'
    'ContactTerminal'        = 'contact/components/ContactTerminal'
    'ContainerFleet'         = 'projects/components/ContainerFleet'
    'ExperienceTimeline'     = 'experience/components/ExperienceTimeline'
    'InfrastructureTopology' = 'infrastructure/components/InfrastructureTopology'
    'SkillsMesh'             = 'skills/components/SkillsMesh'
}
$cardFileMap = [ordered]@{
    'ContainerInspect' = 'projects/components/ContainerInspect'
    'ContainerRow'     = 'projects/components/ContainerRow'
    'DeploymentCard'   = 'experience/components/DeploymentCard'
    'NodeInspect'      = 'infrastructure/components/NodeInspect'
}

# Literal string replacements (quote-agnostic: applied to both " and ').
$literalReplaces = [ordered]@{
    '@/components/layout'      = '@features/layout/components'
    '@/components/background/' = '@features/background/components/'
    '@/components/3d/'         = '@/3d/'
}

$count = 0
Get-ChildItem -Path $src -Recurse -Include '*.ts', '*.tsx' -File | ForEach-Object {
    $path = $_.FullName
    $content = [IO.File]::ReadAllText($path)
    $original = $content

    # 1. Section per-file rewrites: @features/sections/<File> -> @features/<domain>/components/<File>
    foreach ($k in $sectionFileMap.Keys) {
        $content = $content -replace ('@features/sections/' + $k + '"'), ('@features/' + $sectionFileMap[$k] + '"')
        $content = $content -replace ("@features/sections/$k'"), ("@features/" + $sectionFileMap[$k] + "'")
    }
    # 2. Card per-file rewrites.
    foreach ($k in $cardFileMap.Keys) {
        $content = $content -replace ('@features/cards/' + $k + '"'), ('@features/' + $cardFileMap[$k] + '"')
        $content = $content -replace ("@features/cards/$k'"), ("@features/" + $cardFileMap[$k] + "'")
    }
    # 3. Literal replacements.
    foreach ($k in $literalReplaces.Keys) {
        $content = $content.Replace($k, $literalReplaces[$k])
    }

    if ($content -ne $original) {
        [IO.File]::WriteAllText($path, $content)
        $script:count++
        Write-Host ("rewrote : " + $path.Substring($root.Length + 1))
    }
}
Write-Host "PHASE3B DONE - files rewritten: $count"
