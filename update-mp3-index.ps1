# Update MP3 Index Script
# This script scans the mp3/ folder and creates an index.json file

$mp3Dir = Join-Path $PSScriptRoot "mp3"
$indexFile = Join-Path $mp3Dir "index.json"

Write-Host "Scanning MP3 directory: $mp3Dir" -ForegroundColor Green

if (-not (Test-Path $mp3Dir)) {
    Write-Host "MP3 directory not found: $mp3Dir" -ForegroundColor Red
    exit 1
}

# Get all MP3 files
$mp3Files = Get-ChildItem -Path $mp3Dir -Filter "*.mp3" | 
    Sort-Object Name | 
    Select-Object -ExpandProperty Name

Write-Host "Found $($mp3Files.Count) MP3 files:" -ForegroundColor Yellow
foreach ($file in $mp3Files) {
    Write-Host "  - $file" -ForegroundColor Cyan
}

# Create index object
$indexData = @{
    generated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    count = $mp3Files.Count
    files = $mp3Files
}

# Convert to JSON and save
try {
    $indexData | ConvertTo-Json -Depth 3 | Out-File -FilePath $indexFile -Encoding UTF8
    Write-Host "✅ MP3 index updated successfully: $indexFile" -ForegroundColor Green
    Write-Host "📁 Indexed $($mp3Files.Count) MP3 files" -ForegroundColor Green
} catch {
    Write-Host "❌ Error creating index file: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎵 MP3 indexing complete!" -ForegroundColor Magenta
