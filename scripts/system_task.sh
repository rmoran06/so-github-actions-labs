#!/bin/bash

set -e  # Detiene el script si ocurre un error

echo "=== Script Bash Iniciado ==="

# Crear archivo
echo "Archivo generado desde Linux/macOS" > output_linux.txt

# Mostrar primeras variables de entorno
echo "=== Variables de entorno ==="
env | head -n 10

# Crear proceso en segundo plano
sleep 5 &
echo "Proceso en background creado con PID $!"

# Cambiar permisos de archivo
chmod 644 output_linux.txt
echo "Permisos cambiados para output_linux.txt"

# Simular lectura de secreto (GitHub lo inyectará)
echo "El valor del secreto es: ${MY_SECRET:-No definido}"

echo "=== Finalizando script con código 0 ==="
exit 0
