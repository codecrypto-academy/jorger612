## Escrow P2P DApp (Frontend)

Aplicación web3 construida con Next.js + ethers.js para interactuar con el
contrato `Escrow.sol` desplegado en el entorno local de Anvil. Toda la conexión
se realiza directamente con MetaMask, sin wagmi ni RainbowKit.

### Requisitos

- Node.js 18+
- Contratos desplegados con `./deploy.sh` (genera direcciones y tokens mock)
- Nodo Anvil disponible en `http://localhost:8545` (chainId `31337`)
- MetaMask instalada en el navegador (la app detecta y guía la conexión)

### Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La app quedará disponible en `http://localhost:3000`.

### Flujo de trabajo

- **Panel (`/`)**: permite crear operaciones (approve + createOperation) y
  listar/cancelar las operaciones activas del usuario conectado. El flujo guiado
  cubre el `approve` y el `createOperation`.

- **Operaciones disponibles (`/available-operations`)**: muestra las operaciones
  de otros usuarios y guía el proceso (`approve` + `completeOperation`).

- **Administración (`/admin`)**: sección exclusiva para el owner del contrato
  donde se puede añadir nuevos tokens permitidos y revisar la lista actual.

### Dirección de contratos (último deployment)

Los valores se cargan desde `src/config/contracts.ts`. Si vuelves a ejecutar
`./deploy.sh`, recuerda actualizar este archivo o regenerarlo usando el script.

- Escrow: `0x7a2088a1bFc9d81c55368AE168C2C02570cB814F`
- Token A (TKA): `0x09635F643e140090A9A8Dcd712eD6285858ceBef`
- Token B (TKB): `0xc5a5C42992dECbae36851359345FE25997F5C42d`

### Manejo de errores

Los mensajes de revert se muestran al usuario utilizando el extractor definido
en `src/lib/errors.ts`, facilitando la depuración desde la UI.

### Estructura principal

- `src/app/` — rutas principales de la aplicación (Next.js App Router)
- `src/components/` — componentes reutilizables (formularios, tablas, navbar)
- `src/hooks/` — hooks personalizados para leer datos on-chain
- `src/config/` — direcciones de contratos y configuración de red
- `src/context/` — proveedor React para la conexión con MetaMask vía ethers.js
- `src/lib/` — utilidades (formateo de errores, proveedores RPC, etc.)

### Scripts útiles

- `npm run dev` — inicia el modo desarrollo
- `npm run lint` — ejecuta el linter configurado por Next.js
