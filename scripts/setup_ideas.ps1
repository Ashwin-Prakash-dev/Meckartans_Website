# Setup script for the 8 transition idea projects
$baseDir = "D:\Projects\Meckartans Website"
$ideas = @(
    @{ id = "idea1"; port = 3001; name = "Telemetry Slipstream" },
    @{ id = "idea2"; port = 3002; name = "Starting Grid Gantry" },
    @{ id = "idea3"; port = 3003; name = "Carbon Aero Louvers" },
    @{ id = "idea4"; port = 3004; name = "Tachometer Redline Sweep" },
    @{ id = "idea5"; port = 3005; name = "Pit Wall Telemetry HUD" },
    @{ id = "idea6"; port = 3006; name = "Anamorphic Laser Flare" },
    @{ id = "idea7"; port = 3007; name = "Velocity Vector Warp" },
    @{ id = "idea8"; port = 3008; name = "Carbon Monocoque Origami" }
)

foreach ($item in $ideas) {
    $dir = Join-Path $baseDir "ideas\$($item.id)"
    Write-Host "Setting up $($item.id) on port $($item.port)..."
    
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

    # Custom package.json with specific port
    $pkgPath = Join-Path $baseDir "package.json"
    $pkgJson = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $pkgJson.scripts.dev = "next dev --port $($item.port)"
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
}

Write-Host "All 8 idea projects initialized successfully!"
