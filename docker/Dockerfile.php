FROM dunglas/frankenphp:1-php8.4

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    curl

# Instalar extensiones de PHP
RUN pecl install redis && docker-php-ext-enable redis
RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar el contenido del backend
COPY ./backend /var/www/html

# Permisos para Laravel (Evita errores de escritura en logs y caché)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache