#!/bin/sh
set -e

# Solo ejecutar las migraciones si el comando es frankenphp
if [ "$1" = "frankenphp" ]; then
    echo "Preparando el backend..."
    
    # Esperar a MySQL
    echo "Esperando a que MySQL esté listo..."
    max_attempts=30
    attempt=0
    until nc -z mysql 3306 || [ $attempt -eq $max_attempts ]; do
      attempt=$((attempt + 1))
      sleep 1
    done
    
    if [ $attempt -eq $max_attempts ]; then
      echo "ERROR: MySQL no respondió después de 30 segundos"
      exit 1
    fi
    
    echo "MySQL está listo!"
    
    # Crear enlace de storage si no existe
    php artisan storage:link || true
    
    # Limpiar cachés
    php artisan config:clear
    php artisan cache:clear
    
    # Ejecutar migraciones
    echo "Ejecutando migraciones de la base de datos..."
    php artisan migrate --force --seed
    
    echo "Backend listo. Arrancando servidor..."
fi

# Ejecutar el comando original
exec "$@"