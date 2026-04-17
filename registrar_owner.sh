#!/bin/bash
# Registra al owner del contrato como primera cuenta autorizada (Super Admin)
# Ejecutar UNA sola vez tras el despliegue del contrato.

set -e

cd "$(dirname "$0")"

if [ -f ".env" ]; then
  set -a
  . ./.env
  set +a
fi

CONTRACT="${CONTRACT_ADDRESS:-}"
OWNER="${1:-${CONTRACT_OWNER_ADDRESS:-0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266}}"
PRIVATE_KEY="${PRIVATE_KEY:-0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63}"
RPC="${RPC_URL:-http://localhost:8545}"

if [ -z "$CONTRACT" ]; then
  echo "CONTRACT_ADDRESS no definido. Ejecuta primero ./desplegar.sh o define CONTRACT_ADDRESS en .env."
  exit 1
fi

echo "Registrando owner como Super Admin en el contrato..."
echo "  Contrato : $CONTRACT"
echo "  Owner    : $OWNER"
echo "  RPC      : $RPC"
echo ""

cast send "$CONTRACT" \
  "crearCuenta(address,string)" \
  "$OWNER" \
  "Super Admin" \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --legacy \
  --gas-limit 200000 \
  --gas-price 1000

echo ""
echo "Listo. Verifica en la dapp > Gestionar Cuentas."
