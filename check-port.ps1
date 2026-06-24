$ports = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -ge 5170 -and $_.LocalPort -le 5180 } | Select-Object -ExpandProperty LocalPort
if ($ports) { "listening: " + ($ports -join ', ') } else { 'no vite port listening' }
