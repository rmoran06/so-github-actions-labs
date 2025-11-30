Write-Output "=== Script PowerShell Iniciado ==="

# Manejo de errores
$ErrorActionPreference = "Stop"

# Crear archivo
"Archivo generado desde Windows" | Out-File output_windows.txt

# Variables de entorno
Write-Output "=== Variables de entorno ==="
Get-ChildItem Env: | Select-Object -First 10

# Proceso en segundo plano
Start-Process -FilePath "powershell" -ArgumentList "-Command", "Start-Sleep -Seconds 5"
Write-Output "Proceso en background iniciado."

# Mostrar permisos del archivo
Write-Output "Permisos del archivo:"
icacls output_windows.txt

# Leer secreto
Write-Output "Secreto recibido: $env:MY_SECRET"

Write-Output "=== Finalizando script ==="
exit 0
