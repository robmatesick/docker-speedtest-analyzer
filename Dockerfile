FROM python:alpine3.15

LABEL org.opencontainers.image.authors="rob@matesick.org>"

# install dependencies
RUN apk add --no-cache \
  bash \
  git \
  nginx \
  nginx-mod-http-lua

RUN \
  pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir speedtest-cli

# Remove default nginx web content
RUN rm -R /var/www/*

# Create directory structure
RUN mkdir -p /etc/nginx
RUN mkdir -p /run/nginx
RUN mkdir -p /etc/nginx/global
RUN mkdir -p /var/www/html

# Create required data files
RUN touch /var/log/nginx/access.log && touch /var/log/nginx/error.log

# Install nginx vhost config
ADD config/vhost.conf /etc/nginx/http.d/default.conf
ADD config/nginxEnv.conf /etc/nginx/modules/nginxEnv.conf

# Install webroot files
ADD . /var/www/html/

EXPOSE 80
EXPOSE 443

RUN chown -R nginx:nginx /var/www/html/
RUN chmod +x /var/www/html/config/run.sh
RUN chmod 755 /var/www/html/scripts/speedtestRunner.py

ENTRYPOINT ["/var/www/html/config/run.sh"]
