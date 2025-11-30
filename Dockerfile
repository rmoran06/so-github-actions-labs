# Imagen base ligera con Node.js
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Crear un archivo simple dentro del contenedor
RUN echo "Hola desde dentro del contenedor Docker en GitHub Actions!" > mensaje.txt

# Script de entrada para demostrar comunicación host <-> contenedor
RUN echo '#!/bin/sh\n\
echo "=== Dentro del contenedor ==="\n\
echo "Mensaje recibido desde el HOST (variable de entorno MESSAGE_FROM_HOST):"\n\
echo "$MESSAGE_FROM_HOST"\n\
echo\n\
echo "Contenido de mensaje.txt:"\n\
cat mensaje.txt\n\
echo\n\
# Intentar escribir un archivo hacia el volumen compartido (si existe)\n\
if [ -d "/app/host-data" ]; then\n\
  echo "Hola host, este archivo fue creado desde el contenedor." > /app/host-data/from-container.txt\n\
  echo "Se escribió /app/host-data/from-container.txt"\n\
else\n\
  echo "Directorio /app/host-data no encontrado dentro del contenedor."\n\
fi\n\
' > /entrypoint.sh && chmod +x /entrypoint.sh

# Comando por defecto al ejecutar el contenedor
CMD ["/entrypoint.sh"]
