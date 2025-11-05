# Guía de Integración con Smart Contract

Este documento explica cómo integrar tu smart contract con el juego.

## Preparación

Una vez que tengas tu smart contract compilado y desplegado, necesitarás:

1. **ABI del contrato**: El JSON del ABI exportado de Remix, Hardhat, o tu herramienta de desarrollo
2. **Dirección del contrato**: La dirección donde se desplegó el contrato (0x...)

## Funciones Requeridas del Smart Contract

El juego espera que tu smart contract tenga las siguientes funciones (o equivalentes):

### 1. Gestión de Tokens

```solidity
// Obtener balance de tokens de una cuenta
function balanceOf(address account) external view returns (uint256);

// Comprar tokens del banco
function buyTokens(uint256 amount) external payable;

// Transferir tokens
function transfer(address to, uint256 amount) external returns (bool);
```

### 2. Sistema de Vidas

```solidity
// Comprar vidas con tokens
function buyLives(uint256 livesCount) external returns (bool);
```

### 3. Sistema de Apuestas

```solidity
// Hacer una apuesta
function placeBet(uint256 amount) external returns (bool);

// Obtener apuestas actuales
function getBets() external view returns (Bet[] memory);

// Distribuir ganancias al ganador
function distributeWinnings(address winner, uint256 totalPot) external returns (bool);
```

## Integración

### Paso 1: Cargar el ABI

Edita `static/blockchain.js` y busca la función `setContractInfo`. Puedes llamarla así:

```javascript
// En la consola del navegador o en tu código:
const contractABI = [/* tu ABI aquí */];
const contractAddress = "0x..."; // dirección de tu contrato desplegado

window.blockchainModule.setContractInfo(contractABI, contractAddress);
```

O mejor, crea un archivo de configuración:

### Paso 2: Crear archivo de configuración (Opcional)

Crea `static/contract-config.js`:

```javascript
// Configuración del contrato
const CONTRACT_CONFIG = {
    abi: [/* Tu ABI aquí */],
    address: "0x..." // Tu dirección del contrato
};

// Auto-cargar cuando el módulo blockchain esté listo
window.addEventListener('load', () => {
    if (window.blockchainModule && CONTRACT_CONFIG.abi && CONTRACT_CONFIG.address) {
        window.blockchainModule.setContractInfo(
            CONTRACT_CONFIG.abi,
            CONTRACT_CONFIG.address
        );
    }
});
```

Y agrégalo al HTML antes de `blockchain.js`:

```html
<script src="{{ url_for('static', filename='contract-config.js') }}"></script>
<script src="{{ url_for('static', filename='blockchain.js') }}"></script>
```

### Paso 3: Actualizar funciones en blockchain.js

Las funciones que necesitas actualizar están marcadas con comentarios:

1. **`getTokenBalance(address)`**: Reemplazar la simulación con llamada real
2. **`buyTokens(accountAddress, amount)`**: Implementar transacción real
3. **`buyLives(accountAddress, livesCount)`**: Implementar transacción real
4. **`placeBet(accountAddress, betAmount)`**: Implementar transacción real
5. **`distributeWinnings(winnerAddress, totalPot)`**: Implementar transacción real

Ejemplo de actualización:

```javascript
async function getTokenBalance(address) {
    if (!contract) {
        return accountBalances[address] || 0;
    }
    
    try {
        const balance = await contract.balanceOf(address);
        return ethers.utils.formatEther(balance); // o formatUnits si usas 18 decimales
    } catch (error) {
        console.error('Error al obtener balance:', error);
        return 0;
    }
}
```

### Paso 4: Agregar Event Listeners (Opcional pero Recomendado)

Si tu contrato emite eventos, puedes escucharlos:

```javascript
// En la función loadContract()
contract.on("TokensPurchased", (account, amount) => {
    console.log(`Tokens comprados: ${account}, cantidad: ${amount}`);
    loadAccountBalances();
});

contract.on("LivesPurchased", (account, lives) => {
    console.log(`Vidas compradas: ${account}, cantidad: ${lives}`);
    // Actualizar UI
});

contract.on("BetPlaced", (account, amount) => {
    console.log(`Apuesta realizada: ${account}, cantidad: ${amount}`);
    updateBettingCards();
});
```

## Testing

1. Asegúrate de estar en la red correcta (testnet o mainnet)
2. Verifica que MetaMask esté conectado
3. Prueba cada función:
   - Conectar wallet
   - Comprar tokens
   - Seleccionar jugador activo
   - Comprar vidas
   - Realizar apuestas
   - Jugar y terminar juego
   - Distribuir ganancias

## Estructura de Datos Esperada

### Apuestas (Bets)

El contrato debería almacenar apuestas con al menos:
- Dirección del apostador
- Cantidad apostada
- Puntaje predicho (opcional, para versión mejorada)

### Balance de Tokens

Cada cuenta debe tener un balance rastreable vía `balanceOf()`.

## Notas de Seguridad

1. **Validación**: Siempre valida los montos en el frontend y backend
2. **Gas Limits**: Considera los límites de gas para transacciones complejas
3. **Reentrancy**: Asegúrate de que tu contrato proteja contra ataques de reentrancy
4. **Access Control**: Implementa controles de acceso apropiados

## Troubleshooting

### "Contract not loaded"
- Verifica que el ABI sea válido JSON
- Verifica que la dirección del contrato sea correcta
- Verifica que estés en la red correcta en MetaMask

### "Transaction failed"
- Verifica que tengas suficiente balance de ETH para gas
- Verifica que tengas suficientes tokens para la operación
- Revisa la consola del navegador para errores detallados

### "Function not found"
- Verifica que el nombre de la función coincida exactamente
- Verifica que los parámetros sean del tipo correcto
- Revisa el ABI para asegurarte de que la función existe

## Soporte

Para más ayuda, consulta:
- [Documentación de ethers.js](https://docs.ethers.io/)
- [Documentación de MetaMask](https://docs.metamask.io/)
- Tu documentación del smart contract

