FROM dunglas/frankenphp:1-php8.4

# Instalar dependencias del sistema y netcat
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    curl \
    netcat-openbsd

# Instalar extensiones de PHP
RUN pecl install redis && docker-php-ext-enable redis
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar solo los archivos de dependencias
COPY ./backend/composer.json ./backend/composer.lock /var/www/html/

# Instalar sin scripts ni autoloader (para que no falle al no tener el código aún)
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist

COPY ./backend /var/www/html

# Generar el autoloader optimizado
RUN composer dump-autoload --optimize

# Permisos para Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Configuración del Entrypoint
COPY ./docker/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Establecer el script como el punto de entrada
ENTRYPOINT ["docker-entrypoint.sh"]