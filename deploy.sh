#!/bin/bash

set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
FOUNDRY_DIR="$PROJECT_ROOT/sc"
RPC_URL="${ETH_RPC_URL:-http://localhost:8545}"
KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: required command '$1' not found in PATH." >&2
        exit 1
    fi
}

deploy_contract() {
    local label="$1"
    shift
    local output address

    if ! output=$(ETH_RPC_URL="$RPC_URL" forge create --private-key="$KEY" --broadcast "$@" 2>&1); then
        echo "Error deploying $label." >&2
        echo "$output" >&2
        exit 1
    fi

    echo "$output" >&2

    address=$(echo "$output" | awk '/Deployed to:/ {print $3; exit}')
    if [[ ! "$address" =~ ^0x[0-9a-fA-F]{40}$ ]]; then
        echo "Error: could not parse address for $label. Output was:" >&2
        echo "$output" >&2
        exit 1
    fi

    printf '%s\n' "$address"
}

send_transaction() {
    local description="$1"
    shift
    local output

    if ! output=$(cast send --private-key="$KEY" --rpc-url="$RPC_URL" "$@" 2>&1); then
        echo "Error while $description." >&2
        echo "$output" >&2
        exit 1
    fi

    echo "$output"
}

mint_token() {
    local token="$1"
    local recipient="$2"
    local amount="$3"

    cast send --private-key="$KEY" --rpc-url="$RPC_URL" "$token" "mint(address,uint256)" "$recipient" "$amount" >/dev/null
}

ensure_dependency() {
    local path="$1"
    shift
    local install_cmd=("$@")

    if [[ ! -e "$path" ]]; then
        echo "Dependency not found at $path. Installing..."
        "${install_cmd[@]}"
    fi
}

require_command forge
require_command cast
require_command curl

if ! curl -s "$RPC_URL" >/dev/null 2>&1; then
    echo "Error: Anvil not running at $RPC_URL. Run: anvil" >&2
    exit 1
fi

echo "Deploying contracts..."

cd "$FOUNDRY_DIR"

ensure_dependency "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol" forge install openzeppelin/openzeppelin-contracts --no-git

ESCROW=$(deploy_contract "Escrow contract" src/Escrow.sol:Escrow)
TOKENA=$(deploy_contract "Token A (MockERC20)" src/MockERC20.sol:MockERC20 --constructor-args "Token A" "TKA")
TOKENB=$(deploy_contract "Token B (MockERC20)" src/MockERC20.sol:MockERC20 --constructor-args "Token B" "TKB")

echo "Adding tokens to Escrow contract..."
send_transaction "adding Token A to Escrow" "$ESCROW" "addToken(address)" "$TOKENA" >/dev/null
send_transaction "adding Token B to Escrow" "$ESCROW" "addToken(address)" "$TOKENB" >/dev/null
echo "✅ Tokens added to Escrow"

echo "Minting tokens to accounts..."
MINT_AMOUNT="1000000000000000000000" # 1000 tokens with 18 decimals
ACCOUNTS=(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
)

for ADDR in "${ACCOUNTS[@]}"; do
    mint_token "$TOKENA" "$ADDR" "$MINT_AMOUNT"
    mint_token "$TOKENB" "$ADDR" "$MINT_AMOUNT"
done
echo "✅ Tokens minted to ${#ACCOUNTS[@]} accounts"

cd "$PROJECT_ROOT"

FRONTEND_CONTRACTS_FILE="$PROJECT_ROOT/web/lib/contracts.ts"
if [[ -f "$FRONTEND_CONTRACTS_FILE" ]]; then
    sed -i.bak "s/export const ESCROW_ADDRESS = '0x[a-fA-F0-9]\\{40\\}'/export const ESCROW_ADDRESS = '${ESCROW}'/" "$FRONTEND_CONTRACTS_FILE"
    sed -i.bak "s/export const TOKEN_A_ADDRESS = '0x[a-fA-F0-9]\\{40\\}'/export const TOKEN_A_ADDRESS = '${TOKENA}'/" "$FRONTEND_CONTRACTS_FILE"
    sed -i.bak "s/export const TOKEN_B_ADDRESS = '0x[a-fA-F0-9]\\{40\\}'/export const TOKEN_B_ADDRESS = '${TOKENB}'/" "$FRONTEND_CONTRACTS_FILE"
    rm -f "${FRONTEND_CONTRACTS_FILE}.bak"
    echo "✅ Updated frontend contract addresses in $FRONTEND_CONTRACTS_FILE"
else
    echo "ℹ️  Skipped frontend contract update (file not found at $FRONTEND_CONTRACTS_FILE)"
fi

cat > "$PROJECT_ROOT/deployment-info.txt" <<EOF
Escrow:  $ESCROW
Token A: $TOKENA (TKA)
Token B: $TOKENB (TKB)

Accounts (1000 TKA + 1000 TKB each):
$(printf '  %s\n' "${ACCOUNTS[@]}")
EOF

echo ""
echo "✅ Deployed"
echo "Escrow:  $ESCROW"
echo "Token A: $TOKENA"
echo "Token B: $TOKENB"
echo ""
echo "Verifying tokens were added to Escrow..."
ALLOWED_TOKENS=$(cast call --rpc-url="$RPC_URL" "$ESCROW" "getAllowedTokens()(address[])")
echo "Allowed tokens in contract: $ALLOWED_TOKENS"
