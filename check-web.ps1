try {
  $r = Invoke-WebRequest -Uri http://localhost:5173 -UseBasicParsing -TimeoutSec 5
  Write-Output "status: $($r.StatusCode)"
  Write-Output "len: $($r.Content.Length)"
  # 检查关键内容是否渲染
  if ($r.Content -match 'Imperium') { Write-Output 'content: has Imperium' }
  if ($r.Content -match 'root') { Write-Output 'content: has root div' }
} catch {
  Write-Output "err: $($_.Exception.Message)"
}
