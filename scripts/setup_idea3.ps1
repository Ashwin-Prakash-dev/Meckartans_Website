$baseDir = "D:\Projects\Meckartans Website"
$dir = Join-Path $baseDir "ideas\idea3"
Write-Host "Setting up idea3 on port 3003..."

if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Copy source code and config files
if (-not (Test-Path (Join-Path $dir "src"))) {
    Copy-Item -Recurse -Force (Join-Path $baseDir "src") (Join-Path $dir "src")
}
Copy-Item -Force (Join-Path $baseDir "next.config.ts") (Join-Path $dir "next.config.ts")
Copy-Item -Force (Join-Path $baseDir "tokens.json") (Join-Path $dir "tokens.json")
Copy-Item -Force (Join-Path $baseDir "tsconfig.json") (Join-Path $dir "tsconfig.json")
Copy-Item -Force (Join-Path $baseDir "postcss.config.mjs") (Join-Path $dir "postcss.config.mjs")

# Custom package.json with specific port 3003
$pkgPath = Join-Path $baseDir "package.json"
$pkgJson = Get-Content $pkgPath -Raw | ConvertFrom-Json
$pkgJson.scripts.dev = "next dev --port 3003"
$pkgJson | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $dir "package.json")

# Create directory junctions for node_modules and public
$nmTarget = Join-Path $dir "node_modules"
if (-not (Test-Path $nmTarget)) {
    cmd /c mklink /J "$nmTarget" "$baseDir\node_modules"
}

$pubTarget = Join-Path $dir "public"
if (-not (Test-Path $pubTarget)) {
    cmd /c mklink /J "$pubTarget" "$baseDir\public"
}

Write-Host "Idea 3 initialized successfully!"
