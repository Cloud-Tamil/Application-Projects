#!/usr/bin/env bash
# Creates Kubernetes secret with app credentials.
# Run this ONCE before `kubectl apply -f k8s/`.
set -euo pipefail

NAMESPACE="${NAMESPACE:-shopsphere}"
SECRET_NAME="${SECRET_NAME:-shopsphere-secrets}"

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
REFRESH_TOKEN_SECRET="${REFRESH_TOKEN_SECRET:-$(openssl rand -hex 32)}"
MONGO_ROOT_USER="${MONGO_ROOT_USER:-root}"
MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:-$(openssl rand -hex 16)}"

echo "🔐 Ensuring namespace '${NAMESPACE}' exists..."
kubectl get ns "${NAMESPACE}" >/dev/null 2>&1 || kubectl create namespace "${NAMESPACE}"

echo "🔐 Creating/updating secret '${SECRET_NAME}' in '${NAMESPACE}'..."
kubectl -n "${NAMESPACE}" create secret generic "${SECRET_NAME}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --from-literal=REFRESH_TOKEN_SECRET="${REFRESH_TOKEN_SECRET}" \
  --from-literal=MONGO_ROOT_USER="${MONGO_ROOT_USER}" \
  --from-literal=MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secret '${SECRET_NAME}' ready."
echo "   JWT_SECRET=${JWT_SECRET}"
echo "   (keep this safe — it validates all user sessions)"
