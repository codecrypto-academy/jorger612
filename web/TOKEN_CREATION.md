# Token Creation Functionality

## Overview

The token creation functionality allows producers to create new tokens in the supply chain system. When a producer clicks on the "Create Token" card in the dashboard, a modal opens with a form to capture token details.

## Implementation Details

### Components

1. **CreateTokenModal** (`app/components/CreateTokenModal.tsx`)
   - Modal form component for token creation
   - Form fields: Token Name, Total Supply, Features (JSON)
   - Form validation for required fields and JSON format
   - Loading states and error handling

2. **Dashboard** (`app/components/Dashboard.tsx`)
   - Updated to include click handler for "Create Token" card
   - Integrated with CreateTokenModal component
   - Handles token creation logic

### Blockchain Integration

3. **BlockchainService** (`app/lib/blockchain.ts`)
   - Added `createToken()` method to interact with smart contract
   - Contract ABI integration
   - Transaction handling and event parsing
   - Error handling and provider management

### Smart Contract Function

The implementation calls the smart contract function:
```solidity
createToken(string memory name, uint totalSupply, string memory features, uint parentId)
```

Where:
- `name`: Token name (required)
- `totalSupply`: Total supply amount (required, must be positive number)
- `features`: JSON string with product characteristics (optional)
- `parentId`: Admin ID (set to 1 by default)

## Usage Flow

1. **Producer Login**: Producer connects with MetaMask using the producer account
2. **Dashboard Access**: Producer sees the dashboard with "Create Token" card
3. **Open Modal**: Click on "Create Token" card opens the modal
4. **Fill Form**: 
   - Enter token name (required)
   - Enter total supply (required, positive number)
   - Enter features as JSON (optional)
5. **Submit**: Click "Create Token" button
6. **Transaction**: MetaMask prompts for transaction approval
7. **Confirmation**: Success message with transaction hash

## Form Validation

- **Token Name**: Required field, cannot be empty
- **Total Supply**: Required field, must be a positive number
- **Features**: Optional field, must be valid JSON if provided

## Error Handling

- Network connection errors
- Smart contract interaction errors
- Form validation errors
- Transaction rejection by user

## Configuration

### Contract Address

Update the contract address in `app/lib/blockchain.ts`:

```typescript
export const CONTRACT_ADDRESSES: Record<string, string> = {
  localhost: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Update with actual deployed contract
  sepolia: '', // Add when deployed to Sepolia
};
```

### Network Support

Currently configured for:
- **Localhost/Anvil**: Chain ID 31337
- **Sepolia**: Chain ID 11155111 (contract address needed)

## Testing

1. **Start Anvil**: `anvil` (if using local development)
2. **Deploy Contract**: Deploy the smart contract and update the address
3. **Start App**: `npm run dev`
4. **Connect Producer**: Use producer account (0x7099...79C8)
5. **Test Creation**: Click "Create Token" and fill the form

## Example Features JSON

```json
{
  "origin": "Colombia",
  "quality": "Premium",
  "certification": "Organic",
  "harvest_date": "2024-03-15",
  "weight": "100kg",
  "temperature": "22°C"
}
```

## Security Considerations

- All transactions require MetaMask approval
- Form validation prevents invalid data submission
- Smart contract enforces business logic
- Provider refresh prevents network change errors

## Future Enhancements

- Token list display
- Token transfer functionality
- Token history tracking
- Batch token creation
- Token metadata validation
- Image upload for token features
