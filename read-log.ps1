if (Test-Path dev.log) { Get-Content dev.log -Tail 25 } else { Write-Output 'no log file' }
