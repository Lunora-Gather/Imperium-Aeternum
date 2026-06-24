# 统计各数据表条目数
$counts = @{
  'nations (5国版)' = (Select-String -Path 'src\data\nations.ts' -Pattern "^\s+id: '").Count
  'governments'    = (Select-String -Path 'src\data\governments.ts' -Pattern "^\s+id: '").Count
  'characters'     = (Select-String -Path 'src\data\national-characters.ts' -Pattern "^\s+id: '").Count
  'policies'       = (Select-String -Path 'src\data\policies.ts' -Pattern "^\s+id: '").Count
  'buildings'      = (Select-String -Path 'src\data\buildings.ts' -Pattern "^\s+id: '").Count
  'technologies'   = (Select-String -Path 'src\data\technologies.ts' -Pattern "^\s+id: '").Count
  'factions'       = (Select-String -Path 'src\data\factions.ts' -Pattern "^\s+id: '").Count
  'events'         = (Select-String -Path 'src\data\events.ts' -Pattern "^\s+id: '").Count
  'provinces (5国版)' = (Select-String -Path 'src\data\provinces.ts' -Pattern "^\s+id: 'p").Count
  'regions (洲模板)' = (Select-String -Path 'src\data\regions.ts' -Pattern "^\s+id: '").Count
}
foreach ($k in ($counts.Keys | Sort-Object)) { '{0,-25} {1,4}' -f $k, $counts[$k] }

# events category 分布
Write-Output "`n--- events by category ---"
Select-String -Path 'src\data\events.ts' -Pattern "category: '(\w+)'" | ForEach-Object { $_.Matches[0].Value } | Group-Object | Sort-Object Count -Descending | ForEach-Object { '{0,-25} {1,4}' -f $_.Name, $_.Count }
