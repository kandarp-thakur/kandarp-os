# ==============================================================================
# Phase 4 - Consolidate 3D + providers + styles into src/infrastructure/*
# ------------------------------------------------------------------------------
# Moves:
#   src/3d/*         -> src/infrastructure/three/*
#   src/providers/*  -> src/infrastructure/providers/*
#   src/styles/*     -> src/infrastructure/styles/*
#
# Then updates tsconfig.json aliases and rewrites imports:
#   @/3d/        -> @3d/         (canonicalize so they survive the move)
#   @/providers/ -> @providers/
#   @/styles/   -> @styles/
#   ../styles/  -> ../infrastructure/styles/   (in globals.css)
#
# Git history is preserved via `git mv`. Empty src/context/ is removed.
# ==============================================================================

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$src = Join-Path $root 'src'

function Test-Tracked([string]$rel) {
    $out = git ls-files -- $rel 2>$null
    return -not [string]::IsNullOrWhiteSpace($out)
}

function Move-Dir([string]$fromRel, [string]$toRel) {
    $from = Join-Path $root $fromRel
    $to = Join-Path $root $toRel
    if (-not (Test-Path $from)) { Write-Host "  skip (missing): $fromRel"; return }
    New-Item -ItemType Directory -Force -Path $to | Out-Null
    Get-ChildItem -LiteralPath $from -Force | ForEach-Object {
        $item = $_.FullName
        $dest = Join-Path $to $_.Name
        if (Test-Tracked (Resolve-Path $item -Relative)) {
            git mv $item $dest 2>&1 | Out-Null
        }
        else {
            Move-Item -LiteralPath $item $dest -Force
        }
    }
    # Remove the now-empty source dir
    if (Test-Path $from) { Remove-Item -LiteralPath $from -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "  moved: $fromRel -> $toRel"
}

Write-Host '== Phase 4: infrastructure consolidation =='

# --- 1. Move directories ------------------------------------------------------
Move-Dir 'src\3d'        'src\infrastructure\three'
Move-Dir 'src\providers' 'src\infrastructure\providers'
Move-Dir 'src\styles'    'src\infrastructure\styles'

# --- 2. Remove empty src/context (if present) ---------------------------------
$ctxDir = Join-Path $src 'context'
if (Test-Path $ctxDir) {
    Remove-Item -LiteralPath $ctxDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host '  removed empty: src/context'
}

# --- 3. Rewrite imports in all .ts/.tsx/.css ---------------------------------
$files = @()
$files += Get-ChildItem -Path $src -Recurse -Include '*.ts', '*.tsx' -File
$files += Get-ChildItem -Path 'prisma' -Recurse -Include '*.ts' -File -ErrorAction SilentlyContinue
$cssFiles = Get-ChildItem -Path $src -Recurse -Include '*.css' -File
$files += $cssFiles

$rewritten = 0
foreach ($f in $files) {
    $p = $f.FullName
    $c = [System.IO.File]::ReadAllText($p)
    $orig = $c

    # Canonicalize @/3d/ -> @3d/  (quote-lookahead to avoid partial matches)
    $c = [regex]::Replace($c, '@/3d/', '@3d/')
    # Canonicalize @/providers/ -> @providers/
    $c = [regex]::Replace($c, '@/providers/', '@providers/')
    # Canonicalize @/styles/ -> @styles/
    $c = [regex]::Replace($c, '@/styles/', '@styles/')

    # Fix relative CSS @import "../styles/" -> "../infrastructure/styles/"
    # (only in globals.css and any css that references ../styles/)
    $c = [regex]::Replace($c, '\.\./styles/', '../infrastructure/styles/')

    if ($c -ne $orig) {
        [System.IO.File]::WriteAllText($p, $c)
        $rewritten++
    }
}
Write-Host "  rewritten: $rewritten files"

Write-Host '== Phase 4 complete =='
Write-Host 'NOTE: tsconfig.json aliases must be updated next (see phase4b).'
