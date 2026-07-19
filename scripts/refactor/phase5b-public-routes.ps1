# ==============================================================================
# Phase 5b - Move remaining public routes file-by-file (avoids dir-rename lock)
# ------------------------------------------------------------------------------
# The atomic directory rename in Phase 5 failed on blog/tags due to a Windows
# file lock. This script moves each file individually with `git mv`, creating
# destination directories first. Falls back to copy+delete if git mv fails.
# ==============================================================================

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path

function Test-Tracked([string]$rel) {
    $out = git ls-files -- $rel 2>$null
    return -not [string]::IsNullOrWhiteSpace($out)
}

function Move-File([string]$fromRel, [string]$toRel) {
    $from = Join-Path $root $fromRel
    $to = Join-Path $root $toRel
    if (-not (Test-Path $from)) { Write-Host "    skip (missing): $fromRel"; return }
    $toDir = Split-Path $to -Parent
    if (-not (Test-Path $toDir)) { New-Item -ItemType Directory -Force -Path $toDir | Out-Null }
    if (Test-Tracked $fromRel) {
        $retry = 0
        while ($retry -lt 3) {
            $err = git mv $from $to 2>&1
            if ($LASTEXITCODE -eq 0) { break }
            $retry++
            Write-Host "    retry $retry : $fromRel ($err)"
            Start-Sleep -Milliseconds 500
        }
        if ($LASTEXITCODE -ne 0) {
            # Fallback: copy + git rm + git add
            Write-Host "    fallback copy: $fromRel"
            Copy-Item -LiteralPath $from $to -Force
            git rm $from 2>&1 | Out-Null
            git add $to 2>&1 | Out-Null
        }
    }
    else {
        Move-Item -LiteralPath $from $to -Force
    }
}

function Move-Tree([string]$fromRel, [string]$toRel) {
    $from = Join-Path $root $fromRel
    if (-not (Test-Path $from)) { Write-Host "  skip (missing): $fromRel"; return }
    $items = Get-ChildItem -LiteralPath $from -Recurse -File
    foreach ($item in $items) {
        # Compute relative path from root manually (Resolve-Path is unreliable)
        $relFrom = $item.FullName.Substring($root.Length).TrimStart('\').Replace('\', '/')
        $sub = $item.FullName.Substring($from.Length).TrimStart('\').Replace('\', '/')
        $relTo = "$toRel/$sub"
        Move-File $relFrom $relTo
    }
    # Remove now-empty source tree
    if (Test-Path $from) { Remove-Item -LiteralPath $from -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "  moved: $fromRel -> $toRel"
}

Write-Host '== Phase 5b: file-by-file public route move =='

$publicRoutes = @(
    'blog',
    'cloud-infinity-preview',
    'contact',
    'experience',
    'infrastructure',
    'projects',
    'skills'
)

foreach ($r in $publicRoutes) {
    Move-Tree "src/app/$r" "src/app/(public)/$r"
}

Write-Host '== Phase 5b complete =='
