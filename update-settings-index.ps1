# Update Settings Index
# This script scans the settings folder and updates index.json with all available presets

$settingsPath = "e:\Web\ferro\settings"
$indexFile = "$settingsPath\index.json"

# Get all JSON files except index.json
$presetFiles = Get-ChildItem -Path $settingsPath -Filter "*.json" | Where-Object { $_.Name -ne "index.json" }

# Create preset objects
$presets = @()
foreach ($file in $presetFiles) {
    $name = $file.BaseName -replace '[-_]', ' ' | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase($_) }
    
    $preset = @{
        file = $file.Name
        name = $name
        description = "Preset: $name"
    }
    $presets += $preset
}

# Create index object
$index = @{
    presets = $presets
    lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    version = "1.0"
}

# Write to index.json
$index | ConvertTo-Json -Depth 3 | Set-Content -Path $indexFile -Encoding UTF8

Write-Host "Updated index.json with $($presets.Count) presets:"
$presets | ForEach-Object { Write-Host "  - $($_.name) ($($_.file))" }
