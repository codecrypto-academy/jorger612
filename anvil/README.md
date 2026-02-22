# Despliegue en Anvil

Script de despliegue del contrato `SecurityManager.sol` para la red local Anvil de Foundry.

## Requisitos

- [Foundry](https://getfoundry.sh/) instalado (`forge`, `anvil`, `cast`)

## Uso

### 1. Iniciar Anvil (en una terminal)

```bash
anvil
```

Anvil arranca por defecto en `http://127.0.0.1:8545` con 10 cuentas de prueba prefinanciadas.

### 2. Desplegar SecurityManager (en otra terminal)

```bash
forge script anvil/SecurityManager.s.sol:SecurityManagerScript \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

O usando variable de entorno:

```bash
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script anvil/SecurityManager.s.sol:SecurityManagerScript \
  --rpc-url http://localhost:8545 \
  --broadcast
```

### 3. Direcciones de cuentas Anvil por defecto

| Índice | Dirección | Clave privada |
|--------|-----------|---------------|
| 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |

(Ver `anvil --help` para más cuentas)
