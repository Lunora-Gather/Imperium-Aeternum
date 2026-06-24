Get-ChildItem -Path src\data,src\engine,docs -Recurse -File | Where-Object { $_.Extension -in '.ts','.md' } | ForEach-Object {
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  '{0,-50} {1,5} lines' -f ($_.FullName.Replace('D:\Wonderful\games\Imperium-Aeternum\','')), $lines
} | Sort-Object
