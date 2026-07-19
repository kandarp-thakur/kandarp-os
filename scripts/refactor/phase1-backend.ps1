# Phase 1 - Reorganize src/lib/admin/* into a layered src/backend/* architecture.
# Moves files with `git mv` (preserves history) and rewrites all
# `@/lib/admin/<module>` imports to `@backend/<layer>/<module>`.
# Idempotent: skips files that no longer exist at the source path.

$ErrorActionPreference = 'Stop'
$root = 'd:\my_work\Portfolio'
$src = Join-Path $root 'src'

# module name -> new path under src/backend (without extension)
$map = [ordered]@{
    'db'                 = 'database\db'
    'logger'             = 'logging\logger'
    'env-schema'         = 'config\env-schema'
    'env'                = 'config\env'
    'auth'               = 'auth\auth'
    'session'            = 'auth\session'
    'session-service'    = 'auth\session-service'
    'rbac'               = 'permissions\rbac'
    'repo'               = 'repositories\repo'
    'repo-prisma'        = 'repositories\repo-prisma'
    'crud'               = 'controllers\crud'
    'configs'            = 'controllers\configs'
    'types'              = 'schemas\types'
    'api'                = 'middlewares\api'
    'with-logging'       = 'middlewares\with-logging'
    'request-context'    = 'middlewares\request-context'
    'revalidate'         = 'cache\revalidate'
    'storage'            = 'storage\storage'
    'image-optimization' = 'services\image-optimization'
    'seed'               = 'services\seed'
    'relationships'      = 'services\relationships'
    'public-data'        = 'services\public-data'
    'store'              = 'services\store'
}

# 1. Create destination directories.
$dirs = @('database', 'logging', 'config', 'auth', 'permissions', 'repositories',
    'controllers', 'schemas', 'middlewares', 'cache', 'storage', 'services')
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $src "backend\$d") | Out-Null
}

# 2. Move files. Use `git mv` when tracked (preserves history), else Move-Item.
function Move-File($rel) {
    $from = Join-Path $src $rel
    if (-not (Test-Path -LiteralPath $from)) {
        Write-Host "SKIP (missing): $rel"
        return
    }
    $mod = [IO.Path]::GetFileNameWithoutExtension($from)
    $to = Join-Path $src ('backend\' + $map[$mod] + '.ts')
    $toDir = Split-Path $to -Parent
    if (-not (Test-Path $toDir)) { New-Item -ItemType Directory -Force -Path $toDir | Out-Null }

    # Determine tracked-ness without letting git's stderr abort the script.
    # `git ls-files <path>` prints the path if tracked, nothing if untracked,
    # and never errors - so it is safe to call without stderr redirection.
    $listed = (& git ls-files -- $from 2>$null)
    $tracked = (-not [string]::IsNullOrWhiteSpace($listed))

    if ($tracked) {
        & git mv $from $to 2>&1 | Out-Null
        Write-Host "git mv  : $rel -> backend\$($map[$mod]).ts"
    }
    else {
        Move-Item -LiteralPath $from -Destination $to -Force
        Write-Host "move    : $rel -> backend\$($map[$mod]).ts"
    }
}

$files = @(
    'lib\admin\db.ts', 'lib\admin\logger.ts', 'lib\admin\env-schema.ts', 'lib\admin\env.ts',
    'lib\admin\auth.ts', 'lib\admin\session.ts', 'lib\admin\session-service.ts',
    'lib\admin\rbac.ts', 'lib\admin\repo.ts', 'lib\admin\repo-prisma.ts',
    'lib\admin\crud.ts', 'lib\admin\configs.ts', 'lib\admin\types.ts',
    'lib\admin\api.ts', 'lib\admin\with-logging.ts', 'lib\admin\request-context.ts',
    'lib\admin\revalidate.ts', 'lib\admin\storage.ts',
    'lib\admin\image-optimization.ts', 'lib\admin\seed.ts', 'lib\admin\relationships.ts',
    'lib\admin\public-data.ts', 'lib\admin\store.ts'
)
foreach ($f in $files) { Move-File $f }

# 3. Rewrite imports across every .ts/.tsx under src/.
#    Pattern: @/lib/admin/<module> immediately followed by a quote.
#    The quote-lookahead prevents partial matches (e.g. `env` inside `env-schema`).
$rewrote = 0
Get-ChildItem -Path $src -Recurse -Include '*.ts', '*.tsx' -File | ForEach-Object {
    $path = $_.FullName
    $content = [IO.File]::ReadAllText($path)
    $original = $content
    foreach ($k in $map.Keys) {
        $pattern = '@/lib/admin/' + [regex]::Escape($k) + '(?=["''])'
        $replacement = '@backend/' + ($map[$k] -replace '\\', '/')
        $content = [regex]::Replace($content, $pattern, $replacement)
    }
    if ($content -ne $original) {
        [IO.File]::WriteAllText($path, $content)
        $script:rewrote++
        Write-Host ("rewrote : " + $path.Substring($root.Length + 1))
    }
}
Write-Host "PHASE1 DONE - files rewritten: $rewrote"
