#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="shopsphere"
read -r -s -p "JWT secret (minimum 32 characters): " JWT_SECRET
printf '\n'

if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "JWT secret must contain at least 32 characters." >&2
  exit 1
fi

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
kubectl -n "$NAMESPACE" create secret generic shopsphere-secrets \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "ShopSphere Kubernetes secret created/updated."
