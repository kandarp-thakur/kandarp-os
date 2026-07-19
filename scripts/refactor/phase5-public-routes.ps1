# ==============================================================================
# Phase 5 - Reorganize src/app public routes into (public) route group
# ------------------------------------------------------------------------------
# Moves the public-facing route directories into src/app/(public)/ so the
# App Router tree clearly separates:
#   src/app/
#     layout.tsx, page.tsx, error.tsx, ...   (root - shared)
#     (public)/                              (public portfolio routes)
#       about/, blog/, projects/, ...
#     admin/                                 (admin console)
#     api/                                   (REST API)
#
# Route groups (parenthesized) do NOT affect the URL. /about stays /about.
# Git history preserved via `git mv`.
# ==============================================================================

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$appDir = Join-Path $root 'src\app'
$publicDir = Join-Path $appDir '(public)'

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
    if (Test-Path $from) { Remove-Item -LiteralPath $from -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "  moved: $fromRel -> $toRel"
}

Write-Host '== Phase 5: (public) route group =='

# Public route directories to move into (public)/
$publicRoutes = @(
    'about',
    'background-preview',
    'blog',
    'cloud-infinity-preview',
    'contact',
    'experience',
    'infrastructure',
    'projects',
    'skills'
)

foreach ($r in $publicRoutes) {
    Move-Dir "src\app\$r" "src\app\(public)\$r"
}

Write-Host '== Phase 5 complete =='
