$p = (Select-String -Path 'src\data\provinces.ts' -Pattern "id:\s*'p\d").Count
$r = (Select-String -Path 'src\data\regions.ts' -Pattern "id:\s*'").Count
"provinces hardcoded: $p"
"regions templates: $r"
# 关键 nation 名字确认
Write-Output "`n--- key nations in worldgen ---"
Select-String -Path 'src\engine\worldgen.ts' -Pattern "name:\s*'[^']+'" | Select-Object -First 20 | ForEach-Object { ($_.Line.Trim()) }
