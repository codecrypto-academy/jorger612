# Configuración de Anvil como Red por Defecto

## Cambios Implementados

### 1. Conexión Manual (Sin Auto-Conexión)

**Antes:**
- La aplicación se conectaba automáticamente si detectaba que MetaMask ya estaba conectado
- Esto podía causar conexiones no deseadas

**Ahora:**
- ✅ La aplicación espera a que el usuario haga click en "Connect with MetaMask"
- ✅ El usuario tiene control total sobre cuándo conectarse
- ✅ No hay reconexión automática al recargar la página

### 2. Anvil como Red por Defecto

**Configuración:**
- Red por defecto: **Anvil (Localhost)**
- Chain ID: **31337**
- RPC URL: **http://localhost:8545**

**Comportamiento:**
- Al hacer click en "Connect with MetaMask", la aplicación:
  1. Se conecta a MetaMask
  2. Detecta la red actual
  3. Si NO estás en Anvil (Chain ID 31337), automáticamente cambia a Anvil
  4. Si ya estás en Anvil, continúa sin cambiar nada

### 3. Orden de Redes en el Selector

Las redes ahora aparecen en este orden:
1. **Anvil (Localhost)** - Primera opción, red por defecto
2. **Sepolia Testnet** - Segunda opción

## Cómo Usar

### Paso 1: Iniciar Anvil

Antes de conectar, asegúrate de tener Anvil corriendo:

```bash
# En una terminal separada, inicia Anvil
anvil

# Debería mostrar algo como:
# Listening on http://0.0.0.0:8545
```

### Paso 2: Agregar Anvil a MetaMask (Primera Vez)

Si es la primera vez que usas Anvil con MetaMask:

1. Abre MetaMask
2. Click en el selector de red (arriba)
3. Click en "Add Network" o "Agregar red"
4. Selecciona "Add a network manually" o "Agregar una red manualmente"
5. Ingresa estos datos:
   - **Network Name:** Anvil Local
   - **New RPC URL:** http://localhost:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
6. Click en "Save" o "Guardar"

**NOTA:** La aplicación también puede agregar esta red automáticamente cuando intentes cambiar a ella.

### Paso 3: Importar Cuentas de Anvil (Opcional)

Anvil genera 10 cuentas de prueba con 10,000 ETH cada una. Para importarlas:

1. Cuando inicies Anvil, verás las private keys en la terminal
2. En MetaMask, click en el ícono de cuenta (arriba derecha)
3. Click en "Import Account" o "Importar cuenta"
4. Pega una de las private keys de Anvil
5. Click en "Import" o "Importar"

### Paso 4: Conectar la Aplicación

1. Abre http://localhost:3000
2. Verás la pantalla de bienvenida con:
   - Mensaje "Welcome!"
   - Indicación de red por defecto: "Anvil (localhost:8545)"
3. Click en "Connect with MetaMask"
4. MetaMask te pedirá aprobación - Click en "Connect" o "Conectar"
5. Si no estás en Anvil, MetaMask te pedirá cambiar de red - Click en "Switch network" o "Cambiar red"
6. ¡Listo! Ahora estás conectado a Anvil

## Flujo de Conexión Completo

```
┌─────────────────────────────┐
│  Usuario abre la app        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Pantalla de Bienvenida     │
│  - Muestra "Welcome!"       │
│  - Indica red: Anvil        │
│  - Espera click del usuario │
└──────────┬──────────────────┘
           │
           │ Click en "Connect with MetaMask"
           ▼
┌─────────────────────────────┐
│  MetaMask solicita permiso  │
│  Usuario aprueba conexión   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  ¿Red actual es Anvil?      │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     │           │
    SÍ          NO
     │           │
     │           ▼
     │  ┌─────────────────────────────┐
     │  │ Cambiar automáticamente     │
     │  │ a Anvil (Chain ID 31337)    │
     │  │ MetaMask pide confirmación  │
     │  └──────────┬──────────────────┘
     │             │
     └─────┬───────┘
           │
           ▼
┌─────────────────────────────┐
│  Dashboard conectado        │
│  - Muestra dirección        │
│  - Muestra balance          │
│  - Red: Anvil (Localhost)   │
└─────────────────────────────┘
```

## Beneficios

✅ **Control Total:** El usuario decide cuándo conectarse
✅ **Red Consistente:** Siempre inicia en Anvil para desarrollo local
✅ **Menos Errores:** No hay cambios de red inesperados
✅ **Mejor Experiencia:** Flujo de conexión claro y predecible
✅ **Desarrollo Rápido:** Anvil proporciona transacciones instantáneas

## Cambiar de Red Manualmente

Si necesitas cambiar a Sepolia u otra red:

1. Una vez conectado, mira el header (barra superior)
2. Verás un selector de red que muestra "Anvil (Localhost)"
3. Click en el selector
4. Selecciona "Sepolia Testnet"
5. MetaMask te pedirá confirmar el cambio

## Troubleshooting

### Error: "MetaMask no está instalado"
- Instala MetaMask desde https://metamask.io

### Error: No se puede conectar a Anvil
- Verifica que Anvil esté corriendo en http://localhost:8545
- Ejecuta `anvil` en una terminal

### Error: No se puede cambiar de red
- Asegúrate de haber agregado Anvil a MetaMask
- La aplicación intentará agregarla automáticamente si no existe

### Balance muestra 0.0000 ETH
- Verifica que estés usando una cuenta de Anvil
- Importa una private key de Anvil si es necesario
- Anvil regenera las cuentas cada vez que se reinicia

## Archivos Modificados

- `app/hooks/useWallet.ts`:
  - Eliminada auto-conexión
  - Agregado cambio automático a Anvil al conectar

- `app/lib/blockchain.ts`:
  - Anvil ahora es la primera red en el objeto NETWORKS
  - Nombre actualizado a "Anvil (Localhost)"

- `app/components/WelcomeScreen.tsx`:
  - Agregado mensaje indicando red por defecto
