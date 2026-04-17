#!/bin/bash
# Despliegue de SecurityManager
# Uso: ./desplegar.sh

set -e
cd "$(dirname "$0")"

if [ -f ".env" ]; then
  set -a
  . ./.env
  set +a
fi

RPC_URL="${RPC_URL:-http://localhost:8545}"
CHAIN_ID="${CHAIN_ID:-31337}"
PRIVATE_KEY="${PRIVATE_KEY:-0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63}"
GAS_PRICE="${GAS_PRICE:-2000000000}"

echo "Desplegando SecurityManager..."
echo "  RPC_URL  : $RPC_URL"
echo "  CHAIN_ID : $CHAIN_ID"
echo "  GAS_PRICE: $GAS_PRICE"

DEPLOY_OUTPUT="$(forge create src-eth/SecurityManager.sol:SecurityManager \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --evm-version paris \
  --gas-limit 5000000 \
  --gas-price "$GAS_PRICE" \
  --legacy \
  --broadcast)"

echo "$DEPLOY_OUTPUT"

NEW_CONTRACT_ADDRESS="$(printf '%s\n' "$DEPLOY_OUTPUT" | awk '/Deployed to:/ {print $3}' | tail -n 1)"
if [ -z "$NEW_CONTRACT_ADDRESS" ]; then
  echo "No se pudo detectar la direccion desplegada."
  exit 1
fi

if [ -f ".env" ]; then
  awk -v addr="$NEW_CONTRACT_ADDRESS" '
    BEGIN { found=0 }
    /^CONTRACT_ADDRESS=/ { print "CONTRACT_ADDRESS=" addr; found=1; next }
    { print }
    END { if (!found) print "CONTRACT_ADDRESS=" addr }
  ' .env > .env.tmp && mv .env.tmp .env
else
  printf "CONTRACT_ADDRESS=%s\n" "$NEW_CONTRACT_ADDRESS" > .env
fi

echo ""
echo "CONTRACT_ADDRESS actualizado en .env: $NEW_CONTRACT_ADDRESS"

echo ""
echo "Listo."
