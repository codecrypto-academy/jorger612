# Solución al Error de Cambio de Red

## Problema Original

```
network changed: 11155111 => 31337
(event="changed", code=NETWORK_ERROR, version=6.15.0)
```

## ¿Por qué ocurrió este error?

Este error es una característica de seguridad de **ethers.js v6** que previene el uso de datos incorrectos cuando cambia la red de blockchain.

### Explicación Técnica:

1. **Provider Estático**: Cuando creamos un `BrowserProvider`, este se vincula a la red actual en ese momento (por ejemplo, Sepolia con Chain ID 11155111).

2. **Cambio de Red**: Cuando el usuario cambia de red en MetaMask (por ejemplo, a Localhost con Chain ID 31337), el provider anterior queda **invalidado** automáticamente.

3. **Detección de Cambio**: ethers.js detecta que la red cambió y lanza el error `NETWORK_ERROR` para evitar:
   - Enviar transacciones a la red equivocada
   - Leer datos de la blockchain incorrecta
   - Usar nonces o gas prices incorrectos

4. **Problema en el Código Original**:
   ```typescript
   // ❌ PROBLEMA: Provider creado una sola vez
   this.provider = new BrowserProvider(window.ethereum);

   // Al cambiar de red, este provider queda obsoleto
   const balance = await this.provider.getBalance(address);
   // ❌ ERROR: El provider sigue apuntando a la red antigua
   ```

## Solución Implementada

### 1. Método `refreshProvider()`

Creamos un método privado que **reinicializa** el provider cada vez que se necesita:

```typescript
private async refreshProvider(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  // ✅ Crear nuevo provider que apunta a la red actual
  this.provider = new BrowserProvider(window.ethereum);
  this.signer = await this.provider.getSigner();
}
```

### 2. Llamar a `refreshProvider()` antes de operaciones críticas

```typescript
// ✅ SOLUCIÓN: Refrescar provider antes de obtener balance
async getBalance(address: string): Promise<string> {
  try {
    await this.refreshProvider(); // Obtener provider actualizado

    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error: any) {
    console.error('Error getting balance:', error);
    return '0';
  }
}

// ✅ SOLUCIÓN: Refrescar provider antes de obtener red
async getCurrentNetwork(): Promise<NetworkConfig | null> {
  try {
    await this.refreshProvider(); // Obtener provider actualizado

    if (!this.provider) return null;

    const network = await this.provider.getNetwork();
    const chainId = Number(network.chainId);

    // ... resto del código
  }
}
```

### 3. Añadir delays para estabilidad

En el hook `useWallet`, agregamos delays para permitir que MetaMask procese completamente el cambio:

```typescript
// ✅ Esperar que MetaMask procese el cambio de red
const handleChainChanged = async (chainIdHex: string) => {
  const chainId = parseInt(chainIdHex, 16);

  // Delay de 300ms para estabilidad
  await new Promise(resolve => setTimeout(resolve, 300));

  setState((prev) => ({ ...prev, chainId }));
  await updateNetwork();

  // Actualizar balance con el nuevo provider
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (accounts.length > 0) {
    await updateBalance(accounts[0]);
  }
};
```

## Beneficios de esta Solución

1. **Seguridad**: Siempre usamos el provider correcto para la red actual
2. **Confiabilidad**: No hay errores al cambiar de red
3. **Actualización Automática**: Balance y datos se actualizan automáticamente
4. **Manejo de Errores**: Fallback a valores seguros si algo falla
5. **Compatibilidad**: Funciona con cualquier red (Sepolia, Localhost, Mainnet, etc.)

## Pruebas Realizadas

✅ Cambio de Sepolia (11155111) a Localhost (31337)
✅ Cambio de Localhost (31337) a Sepolia (11155111)
✅ Actualización automática de balance
✅ Actualización automática de información de red
✅ Manejo de errores cuando la red no está disponible

## Archivos Modificados

- `app/lib/blockchain.ts`: Método `refreshProvider()` y llamadas en `getBalance()` y `getCurrentNetwork()`
- `app/hooks/useWallet.ts`: Delays y actualización automática de datos en `handleChainChanged()`

## Recomendaciones Adicionales

1. **Siempre refrescar el provider** antes de operaciones sensibles a la red
2. **No cachear datos** de blockchain por mucho tiempo cuando se permite cambio de red
3. **Implementar retry logic** para operaciones que fallan durante el cambio de red
4. **Informar al usuario** cuando se está procesando un cambio de red
