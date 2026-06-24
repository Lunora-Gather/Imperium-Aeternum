Write-Output "=== events ids ==="
Select-String -Path 'src\data\events.ts' -Pattern "^\s+id:\s*'(\w+)'" | ForEach-Object { $_.Matches[0].Groups[1].Value }
Write-Output "`n=== buildings ids ==="
Select-String -Path 'src\data\buildings.ts' -Pattern "^\s+id:\s*'(\w+)'" | ForEach-Object { $_.Matches[0].Groups[1].Value }
Write-Output "`n=== policies ids ==="
Select-String -Path 'src\data\policies.ts' -Pattern "^\s+id:\s*'(\w+)'" | ForEach-Object { $_.Matches[0].Groups[1].Value }
Write-Output "`n=== technologies ids ==="
Select-String -Path 'src\data\technologies.ts' -Pattern "^\s+id:\s*'(\w+)'" | ForEach-Object { $_.Matches[0].Groups[1].Value }
Write-Output "`n=== counts ==="
$e = (Select-String -Path 'src\data\events.ts' -Pattern "^\s+id:\s*'(\w+)'" | Measure-Object).Count
$b = (Select-String -Path 'src\data\buildings.ts' -Pattern "^\s+id:\s*'(\w+)'" | Measure-Object).Count
$p = (Select-String -Path 'src\data\policies.ts' -Pattern "^\s+id:\s*'(\w+)'" | Measure-Object).Count
$t = (Select-String -Path 'src\data\technologies.ts' -Pattern "^\s+id:\s*'(\w+)'" | Measure-Object).Count
"events=$e buildings=$b policies=$p techs=$t"
