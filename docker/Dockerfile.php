FROM php:8.4-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    curl

# Instalar extensiones de PHP (He quitado la línea repetida)
RUN pecl install redis && docker-php-ext-enable redis
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# INSTALAR COMPOSER (Vital para tu TFG)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiamos el contenido del backend
COPY ./backend /var/www/html

# Permisos para Laravel (Evita errores de escritura en logs y caché)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache