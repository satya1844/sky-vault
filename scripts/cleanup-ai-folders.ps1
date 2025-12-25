Param(
    [string]$AiRoot = "app\api\ai"
)

Write-Host "Cleanup AI folders under: $AiRoot"
if (-not (Test-Path -LiteralPath $AiRoot)) {
    Write-Host "AI root does not exist: $AiRoot"; return
}

$removed = 0
Get-ChildItem -LiteralPath $AiRoot -Force | Where-Object { $_.PSIsContainer } | ForEach-Object {
    $dir = $_.FullName
    $hasFiles = (Get-ChildItem -LiteralPath $dir -Recurse -File -Force | Select-Object -First 1)
    if (-not $hasFiles) {
        Write-Host "Removing empty folder: $dir"
        Remove-Item -LiteralPath $dir -Recurse -Force
        $removed++
    } else {
        Write-Host "Skipping non-empty: $dir"
    }
}

Write-Host "Done. Removed $removed empty folders."