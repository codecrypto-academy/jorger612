#!/bin/bash
# Despliegue de SecurityManager en Anvil local
# Uso: ./desplegar.sh
# Requiere: Anvil corriendo en http://localhost:8545

set -e
cd "$(dirname "$0")"

RPC_URL="${RPC_URL:-http://localhost:8545}"
PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

echo "Desplegando SecurityManager en $RPC_URL ..."
forge script anvil/SecurityManager.s.sol:SecurityManagerScript \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast

echo ""
echo "Listo."
