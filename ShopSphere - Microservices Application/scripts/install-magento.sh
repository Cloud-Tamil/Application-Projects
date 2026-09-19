#!/usr/bin/env bash
# Installs Magento 2 into the running magento container.
set -euo pipefail

CONTAINER="${CONTAINER:-shopsphere-magento}"
BASE_URL="${MAGENTO_BASE_URL:-http://localhost:8080}"
ADMIN_USER="${MAGENTO_ADMIN_USER:-admin}"
ADMIN_PASS="${MAGENTO_ADMIN_PASSWORD:-admin123}"
ADMIN_EMAIL="${MAGENTO_ADMIN_EMAIL:-admin@shopsphere.com}"
DB_HOST="${MAGENTO_DB_HOST:-mysql}"
DB_NAME="${MAGENTO_DB_NAME:-magento}"
DB_USER="${MAGENTO_DB_USER:-magento}"
DB_PASS="${MAGENTO_DB_PASSWORD:-magento}"

echo "🛍️  Installing Magento into container: ${CONTAINER}"
echo "    Base URL: ${BASE_URL}"

docker exec -u www-data "${CONTAINER}" bash -lc "
  set -e
  cd /var/www/html
  if [ ! -f composer.json ]; then
    composer create-project --repository-url=https://repo.magento.com/ \
      magento/project-community-edition:2.4.7 .
  fi

  php bin/magento setup:install \
    --base-url='${BASE_URL}' \
    --db-host='${DB_HOST}' \
    --db-name='${DB_NAME}' \
    --db-user='${DB_USER}' \
    --db-password='${DB_PASS}' \
    --admin-firstname=Admin \
    --admin-lastname=User \
    --admin-email='${ADMIN_EMAIL}' \
    --admin-user='${ADMIN_USER}' \
    --admin-password='${ADMIN_PASS}' \
    --language=en_US \
    --currency=USD \
    --timezone=UTC \
    --use-rewrites=1 \
    --search-engine=opensearch \
    --opensearch-host=opensearch \
    --opensearch-port=9200 \
    --backend-frontname=admin

  php bin/magento deploy:mode:set developer
  php bin/magento cache:flush
"

echo "✅ Magento installed."
echo "   Admin: ${BASE_URL}/admin"
echo "   User:  ${ADMIN_USER}"
echo "   Pass:  ${ADMIN_PASS}"
