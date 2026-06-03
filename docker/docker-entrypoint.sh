#!/bin/sh
set -e

# Solo ejecutar las migraciones si el comando es frankenphp
if [ "$1" = "frankenphp" ]; then
    echo "Preparando el backend..."
    
    # Forzar al script a esperar a que el puerto TCP esté abierto
    echo "Esperando a que MySQL abra el puerto de red 3306..."
    while ! nc -z mysql 3306; do
      sleep 1
    done
    echo "MySQL está completamente listo para recibir conexiones!"
    
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

# Ejecutar el comando original que se le pasó al contenedor
exec "$@"