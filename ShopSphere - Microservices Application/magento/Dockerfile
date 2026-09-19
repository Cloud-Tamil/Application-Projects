FROM php:8.2-fpm-alpine

ENV MAGENTO_VERSION=2.4.7 \
    COMPOSER_VERSION=2.6.5 \
    MAGENTO_ROOT=/var/www/html

RUN apk add --no-cache \
      bash curl git unzip icu-dev libxml2-dev libpng-dev libjpeg-turbo-dev \
      freetype-dev oniguruma-dev libzip-dev openssl-dev shadow supervisor nginx \
      mysql-client && \
    docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) \
      bcmath gd intl mbstring opcache pdo_mysql soap sockets xsl zip && \
    pecl install redis && docker-php-ext-enable redis

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR ${MAGENTO_ROOT}
COPY php.ini /usr/local/etc/php/conf.d/magento.ini
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisord.conf

RUN mkdir -p /var/log/supervisor /var/log/nginx /run/nginx && \
    chown -R www-data:www-data /var/log/nginx ${MAGENTO_ROOT}

EXPOSE 80 9000
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
