# Phase 3 fix - The Phase 3 dir-moves landed at src/<feature>/ instead of
# src/features/<feature>/. Move each misplaced feature dir into src/features/.
# The empty src/features/<feature>/components dirs already exist, so we merge
# contents (the misplaced dir has the real files; the features one is empty).

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

$features = @('hero', 'about', 'projects', 'experience', 'skills', 'infrastructure',
    'blog', 'contact', 'navigation', 'footer', 'background', 'admin',
    'layout', 'shared')

foreach ($f in $features) {
    $misplaced = Join-Path $src $f
    $target = Join-Path $src "features\$f"
    if (-not (Test-Path -LiteralPath $misplaced)) { Write-Host "SKIP (missing): $f"; continue }

    # Merge contents of misplaced dir into target (target already exists).
    Get-ChildItem -LiteralPath $misplaced -Force | ForEach-Object {
        $dest = Join-Path $target $_.Name
        if (Test-Path -LiteralPath $dest) {
            # dest exists (e.g. empty components dir) - merge into it.
            Get-ChildItem -LiteralPath $_.FullName -Force | ForEach-Object {
                Move-Item -LiteralPath $_.FullName -Destination $dest -Force
            }
        }
        else {
            Move-Item -LiteralPath $_.FullName -Destination $dest -Force
        }
    }
    # Remove the now-empty misplaced dir.
    Remove-Item -LiteralPath $misplaced -Recurse -Force
    Write-Host "merged  : $f -> features\$f"
}
Write-Host "PHASE3-FIX DONE"
