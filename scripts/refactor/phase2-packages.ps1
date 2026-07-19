# Phase 2 - Promote cross-cutting shared code into src/packages/* with barrel
# exports. Moves files with `git mv` (preserves history). Existing path aliases
# (@/utils/*, @/types/*, @/hooks/*) are repointed at the new package locations
# so no per-file import rewrites are needed; a new canonical @packages/* alias
# is added for direct package access.
# Idempotent: skips files that no longer exist at the source path.

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

# (relative source path under src) -> (relative dest under src, without ext)
$moves = [ordered]@{
    'utils\cn.ts'                 = 'packages\utils\cn.ts'
    'utils\constants.ts'          = 'packages\utils\constants.ts'
    'utils\navigation.ts'         = 'packages\utils\navigation.ts'
    'config\site.ts'              = 'packages\config\site.ts'
    'types\about.ts'              = 'packages\types\about.ts'
    'types\achievements.ts'       = 'packages\types\achievements.ts'
    'types\blog.ts'               = 'packages\types\blog.ts'
    'types\contact.ts'            = 'packages\types\contact.ts'
    'types\experience.ts'         = 'packages\types\experience.ts'
    'types\index.ts'              = 'packages\types\index.ts'
    'types\infrastructure.ts'     = 'packages\types\infrastructure.ts'
    'types\projects.ts'           = 'packages\types\projects.ts'
    'types\skills.ts'             = 'packages\types\skills.ts'
    'hooks\useAboutTerminal.ts'   = 'packages\hooks\useAboutTerminal.ts'
    'hooks\useAnalyticsBeacon.ts' = 'packages\hooks\useAnalyticsBeacon.ts'
    'hooks\useHeroTerminal.ts'    = 'packages\hooks\useHeroTerminal.ts'
    'hooks\useSiteConfig.ts'      = 'packages\hooks\useSiteConfig.ts'
    'hooks\useTerminal.ts'        = 'packages\hooks\useTerminal.ts'
    'hooks\useTimerQueue.ts'      = 'packages\hooks\useTimerQueue.ts'
    'components\ui\Avatar.tsx'    = 'packages\ui\Avatar.tsx'
    'components\ui\Badge.tsx'     = 'packages\ui\Badge.tsx'
    'components\ui\Button.tsx'    = 'packages\ui\Button.tsx'
    'components\ui\Card.tsx'      = 'packages\ui\Card.tsx'
    'components\ui\GlassCard.tsx' = 'packages\ui\GlassCard.tsx'
    'components\ui\Heading.tsx'   = 'packages\ui\Heading.tsx'
    'components\ui\Input.tsx'     = 'packages\ui\Input.tsx'
    'components\ui\Modal.tsx'     = 'packages\ui\Modal.tsx'
    'components\ui\Popover.tsx'   = 'packages\ui\Popover.tsx'
    'components\ui\Textarea.tsx'  = 'packages\ui\Textarea.tsx'
    'components\ui\Tooltip.tsx'   = 'packages\ui\Tooltip.tsx'
    'components\ui\index.ts'      = 'packages\ui\index.ts'
}

# 1. Create destination package directories.
$pkgs = @('utils', 'config', 'types', 'hooks', 'ui')
foreach ($p in $pkgs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $src "packages\$p") | Out-Null
}

# 2. Move files (git mv when tracked, else Move-Item).
function Move-File($fromRel, $toRel) {
    $from = Join-Path $src $fromRel
    if (-not (Test-Path -LiteralPath $from)) {
        Write-Host "SKIP (missing): $fromRel"
        return
    }
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

foreach ($k in $moves.Keys) { Move-File $k $moves[$k] }

# 3. Create barrel index.ts for packages that lack one (utils, config, types, hooks).
function Ensure-Barrel($pkgRel, $exports) {
    $idx = Join-Path $src $pkgRel
    if (Test-Path -LiteralPath $idx) { Write-Host "barrel exists: $pkgRel"; return }
    $body = ($exports | ForEach-Object { "export * from './$_';" }) -join "`r`n"
    [IO.File]::WriteAllText($idx, $body + "`r`n")
    Write-Host "barrel wrote: $pkgRel"
}
Ensure-Barrel 'packages\utils\index.ts' @('cn', 'constants', 'navigation')
Ensure-Barrel 'packages\config\index.ts' @('site')
Ensure-Barrel 'packages\types\index.ts' @('about', 'achievements', 'blog', 'contact', 'experience', 'infrastructure', 'projects', 'skills')
Ensure-Barrel 'packages\hooks\index.ts' @('useAboutTerminal', 'useAnalyticsBeacon', 'useHeroTerminal', 'useSiteConfig', 'useTerminal', 'useTimerQueue')

Write-Host "PHASE2 DONE - moves: $($moves.Count)"
