# TypeScript Anvil Remix

Proyecto TypeScript para interactuar con un smart contract desplegado en Anvil usando ethers.js.

## Descripción

Este proyecto demuestra cómo interactuar con un contrato inteligente `Storage` desplegado en una red local (Anvil) usando TypeScript y ethers.js.

### Contrato Storage

El contrato tiene dos funciones principales:
- `store(uint256 num)`: Almacena un número en el contrato
- `retrieve()`: Recupera el número almacenado

## Configuración

### Requisitos previos

- Node.js (versión 16 o superior)
- Anvil ejecutándose en `http://localhost:8545`
- Contrato desplegado en la dirección: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Compilar el proyecto:
```bash
npm run build
```

## Uso

### Ejecutar el programa principal

```bash
npm run dev
```

O después de compilar:

```bash
npm start
```

### Ejecutar las pruebas

```bash
npm run test
```

## Estructura del proyecto

```
src/
├── config.ts          # Configuración del contrato y la red
├── contractService.ts  # Servicio para interactuar con el contrato
├── index.ts           # Programa principal
└── test.ts            # Script de pruebas
```

## Funcionalidades

- ✅ Conexión a la red local Anvil
- ✅ Verificación del balance del address desplegador
- ✅ Almacenamiento de números en el contrato
- ✅ Recuperación de números del contrato
- ✅ Manejo de errores y transacciones
- ✅ Script de pruebas automatizadas

## Configuración del contrato

El contrato está configurado con:
- **Dirección**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **RPC URL**: `http://localhost:8545`
- **Clave privada**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Address desplegador**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

## Notas

- Asegúrate de que Anvil esté ejecutándose antes de ejecutar el programa
- El contrato debe estar desplegado en la dirección especificada
- Las transacciones se envían desde el address del desplegador
