# Implementación de Selección de Rol

## Resumen

Se ha implementado un sistema de selección de roles que permite a los usuarios elegir su rol en la cadena de suministro. Cada rol está asociado con una cuenta específica de Ethereum.

---

## Roles Configurados

| Rol | Icono | Cuenta de Ethereum |
|-----|-------|-------------------|
| **Admin** | 👑 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| **Producer** | 🌾 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Factory** | 🏭 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| **Retailer** | 🏪 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| **Consumer** | 🛒 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

**Nota:** El rol Admin no se muestra en el selector de roles (solo disponible para desarrollo/testing).

---

## Flujo de Usuario

### Flujo Completo

```
┌─────────────────────────────────────────────────┐
│ 1. Usuario abre la aplicación                  │
│    Estado: mounted = false                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Loading Screen                               │
│    - Spinner animado                            │
│    - "Loading..."                               │
└────────────────┬────────────────────────────────┘
                 │
                 │ mounted = true
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. WelcomeScreen                                │
│    - "Welcome!"                                 │
│    - Botón "Connect with MetaMask"              │
│    Estado: isConnected = false                  │
└────────────────┬────────────────────────────────┘
                 │
                 │ Usuario hace click
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. MetaMask Popup - Conexión                    │
│    - Usuario aprueba conexión                   │
│    - Se conecta a Anvil (31337)                 │
└────────────────┬────────────────────────────────┘
                 │
                 │ isConnected = true
                 │ hasSelectedRole = false
                 ▼
┌─────────────────────────────────────────────────┐
│ 5. RoleSelection Screen ⭐ NUEVO                │
│    - "Register for Access"                      │
│    - Dropdown con roles                         │
│    - Producer, Factory, Retailer, Consumer      │
└────────────────┬────────────────────────────────┘
                 │
                 │ Usuario selecciona rol
                 ▼
┌─────────────────────────────────────────────────┐
│ 6. Muestra cuenta asociada                      │
│    - Información del rol                        │
│    - Dirección de la cuenta                     │
│    - Botón "Request Registration"               │
└────────────────┬────────────────────────────────┘
                 │
                 │ Click en "Request Registration"
                 ▼
┌─────────────────────────────────────────────────┐
│ 7. MetaMask Popup - Cambio de Cuenta           │
│    - wallet_requestPermissions                  │
│    - Usuario selecciona cuenta del rol          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────┴────────┐
        │                 │
       SÍ                NO
  (Cuenta correcta)  (Cuenta incorrecta)
        │                 │
        │                 ▼
        │    ┌─────────────────────────────────────┐
        │    │ 8. Error mostrado                    │
        │    │    "Please select the account..."    │
        │    │    Usuario debe reintentar           │
        │    └─────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────┐
│ 9. Rol seleccionado exitosamente                │
│    hasSelectedRole = true                        │
│    selectedRole = { ... }                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 10. Dashboard                                    │
│     - Header con badge de rol                    │
│     - Información de la cuenta                   │
│     - Funcionalidades del sistema                │
└─────────────────────────────────────────────────┘
```

---

## Archivos Creados

### 1. `app/lib/roles.ts`

**Propósito:** Configuración centralizada de roles y utilidades

**Contenido:**
```typescript
export interface Role {
  id: string;
  name: string;
  account: string;
  icon: string;
  description: string;
}

export const ROLES: Record<string, Role> = {
  admin: { ... },
  producer: { ... },
  factory: { ... },
  retailer: { ... },
  consumer: { ... },
};

export const ROLE_LIST = Object.values(ROLES);

export function getRoleByAccount(account: string): Role | null;
export function getRoleById(id: string): Role | null;
```

**Características:**
- ✅ Tipado fuerte con TypeScript
- ✅ Constantes exportadas para fácil acceso
- ✅ Funciones utilitarias para búsqueda
- ✅ Normalización de direcciones (toLowerCase)

---

### 2. `app/components/RoleSelection.tsx`

**Propósito:** Pantalla de selección de rol

**Estructura del Componente:**

```typescript
interface RoleSelectionProps {
  onRoleSelect: (role: Role) => void;
  isLoading?: boolean;
}

export default function RoleSelection({
  onRoleSelect,
  isLoading = false
}: RoleSelectionProps)
```

**Elementos UI:**

1. **Icono de Usuario**
   - Círculo morado con icono de usuario
   - Tamaño: 12x12

2. **Título y Descripción**
   - "Register for Access"
   - Texto explicativo

3. **Selector de Rol (Dropdown)**
   - Lista de roles (excepto Admin)
   - Cada opción muestra:
     - Icono emoji
     - Nombre del rol
     - Descripción corta

4. **Información de Cuenta**
   - Se muestra cuando se selecciona un rol
   - Fondo morado claro
   - Cuenta en formato monospace

5. **Botón de Envío**
   - "Request Registration"
   - Deshabilitado si no hay rol seleccionado
   - Muestra estado de carga

**Estilos:**
- Diseño basado en imagen de referencia
- Colores: Morado para acentos
- Responsive design
- Hover states
- Animaciones de transición

---

## Modificaciones a Archivos Existentes

### 1. `app/hooks/useWallet.ts`

#### Cambios en WalletState

**Antes:**
```typescript
interface WalletState {
  address: string | null;
  chainId: number | null;
  network: NetworkConfig | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}
```

**Después:**
```typescript
interface WalletState {
  address: string | null;
  chainId: number | null;
  network: NetworkConfig | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasSelectedRole: boolean;      // ✅ Nuevo
  selectedRole: Role | null;     // ✅ Nuevo
  error: string | null;
}
```

#### Nueva Función: `selectRole()`

**Propósito:** Manejar la selección de rol y verificar la cuenta

**Flujo:**
```typescript
async function selectRole(role: Role) {
  // 1. Solicitar permisos para cambiar cuenta
  await window.ethereum.request({
    method: 'wallet_requestPermissions',
    params: [{ eth_accounts: {} }],
  });

  // 2. Solicitar cuentas
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  // 3. Verificar cuenta seleccionada
  if (selectedAccount !== expectedAccount) {
    // Error: cuenta incorrecta
    setState({ error: "Please select the account..." });
    return;
  }

  // 4. Actualizar estado
  setState({
    hasSelectedRole: true,
    selectedRole: role,
    address: accounts[0],
  });

  // 5. Obtener balance
  await updateBalance(accounts[0]);
}
```

**Características:**
- ✅ Validación de cuenta
- ✅ Mensajes de error descriptivos
- ✅ Manejo de excepciones
- ✅ Actualización automática de balance

---

### 2. `app/page.tsx`

**Cambios:** Flujo de navegación de 2 pasos a 3 pasos

**Antes:**
```typescript
if (!isConnected) return <WelcomeScreen />;
return <><Header /><Dashboard /></>;
```

**Después:**
```typescript
// Paso 1: No conectado
if (!isConnected) {
  return <WelcomeScreen />;
}

// Paso 2: Conectado pero sin rol
if (isConnected && !hasSelectedRole) {
  return <RoleSelection onRoleSelect={handleRoleSelect} />;
}

// Paso 3: Conectado con rol
return <><Header /><Dashboard /></>;
```

**Lógica:**
- ✅ Renderizado condicional basado en estado
- ✅ Flujo secuencial claro
- ✅ Handler para selección de rol

---

### 3. `app/components/Header.tsx`

**Cambio:** Agregar badge de rol

**Nuevo Elemento:**
```typescript
{selectedRole && (
  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
    <span className="text-lg">{selectedRole.icon}</span>
    <span className="text-sm font-medium text-purple-700">
      {selectedRole.name}
    </span>
  </div>
)}
```

**Características:**
- ✅ Solo visible si hay rol seleccionado
- ✅ Responsive (hidden en mobile)
- ✅ Colores consistentes (morado)
- ✅ Muestra icono y nombre

---

## Interacción con MetaMask

### Métodos Utilizados

#### 1. `wallet_requestPermissions`

**Propósito:** Solicitar permisos para acceder a cuentas

```javascript
await window.ethereum.request({
  method: 'wallet_requestPermissions',
  params: [{ eth_accounts: {} }],
});
```

**Efecto:**
- Abre popup de MetaMask
- Muestra lista de cuentas disponibles
- Usuario puede seleccionar otra cuenta

---

#### 2. `eth_requestAccounts`

**Propósito:** Obtener la cuenta seleccionada

```javascript
const accounts = await window.ethereum.request({
  method: 'eth_requestAccounts',
});
```

**Retorna:** Array de direcciones de cuentas

---

### Limitación Importante

⚠️ **MetaMask no permite cambiar de cuenta programáticamente**

- No existe un método para forzar el cambio a una cuenta específica
- El usuario DEBE seleccionar manualmente la cuenta en MetaMask
- La aplicación solo puede VERIFICAR que la cuenta correcta fue seleccionada

**Solución Implementada:**
1. Mostrar la dirección esperada al usuario
2. Solicitar permisos (abre popup)
3. Usuario selecciona la cuenta manualmente
4. Verificar que sea la correcta
5. Mostrar error si no coincide

---

## Validación de Cuenta

### Proceso de Verificación

```typescript
const selectedAccount = accounts[0].toLowerCase();
const expectedAccount = role.account.toLowerCase();

if (selectedAccount !== expectedAccount) {
  setState({
    error: `Please select the account ${role.account} in MetaMask for the ${role.name} role`
  });
  return;
}
```

**Características:**
- ✅ Normalización con `toLowerCase()`
- ✅ Mensaje de error claro y específico
- ✅ Incluye rol y cuenta esperada
- ✅ No continúa si la cuenta es incorrecta

---

## Diseño UI/UX

### Paleta de Colores

- **Principal:** Morado (`purple-50`, `purple-200`, `purple-600`)
- **Fondo:** Gradiente azul (`blue-50` a `indigo-100`)
- **Texto:** Gris (`gray-600`, `gray-900`)
- **Acentos:** Verde (conexión), Rojo (error)

### Iconos

Cada rol tiene un emoji asociado:
- 👑 Admin
- 🌾 Producer
- 🏭 Factory
- 🏪 Retailer
- 🛒 Consumer

### Responsive Design

```css
/* Mobile First */
.role-badge {
  display: none; /* Oculto en mobile */
}

/* Tablet y Desktop */
@media (min-width: 768px) {
  .role-badge {
    display: flex; /* Visible en md+ */
  }
}
```

---

## Cuentas de Anvil

Estas son las cuentas pre-configuradas en Anvil (nodo local de Hardhat/Foundry):

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Admin)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Producer)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Factory)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (Retailer)
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Account #4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (Consumer)
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

### Importar Cuentas en MetaMask

1. Copia la Private Key del rol deseado
2. MetaMask → Clic en ícono de cuenta
3. "Import Account"
4. Pega la Private Key
5. Click "Import"

---

## Testing

### Flujo de Testing Manual

1. **Iniciar Anvil**
   ```bash
   anvil
   ```

2. **Importar cuentas en MetaMask**
   - Importar al menos 2 cuentas diferentes

3. **Abrir aplicación**
   ```
   http://localhost:3000
   ```

4. **Conectar con MetaMask**
   - Click en "Connect with MetaMask"
   - Aprobar conexión

5. **Seleccionar rol**
   - Elegir "Producer" del dropdown
   - Verificar que muestra la cuenta correcta
   - Click en "Request Registration"

6. **Cambiar cuenta en MetaMask**
   - En el popup, seleccionar la cuenta de Producer
   - Aprobar

7. **Verificar Dashboard**
   - Header debe mostrar badge "🌾 Producer"
   - Dirección debe ser la del Producer
   - Balance actualizado

### Casos de Prueba

#### ✅ Caso 1: Selección exitosa
- Rol: Producer
- Cuenta seleccionada: 0x7099... (Producer)
- **Resultado esperado:** Dashboard con rol Producer

#### ❌ Caso 2: Cuenta incorrecta
- Rol: Producer
- Cuenta seleccionada: 0x3C44... (Factory)
- **Resultado esperado:** Error "Please select the account..."

#### ✅ Caso 3: Cambio de rol
- Disconnect
- Volver a conectar
- Seleccionar diferente rol
- **Resultado esperado:** Nuevo rol asignado

---

## Próximas Mejoras

### Funcionalidades Futuras

1. **Persistencia de Rol**
   - Guardar rol en localStorage
   - Recordar entre sesiones

2. **Cambio de Rol**
   - Botón para cambiar de rol sin desconectar
   - Modal de confirmación

3. **Registro en Smart Contract**
   - Llamada a contrato para registrar rol
   - Verificación on-chain

4. **Permisos basados en Rol**
   - Mostrar/ocultar funcionalidades según rol
   - Rutas protegidas

5. **Multi-sig para Admin**
   - Requiere múltiples aprobaciones
   - Mayor seguridad

---

## Troubleshooting

### Problema: "Please select the account..."

**Causa:** Usuario seleccionó cuenta incorrecta en MetaMask

**Solución:**
1. Click en "Request Registration" nuevamente
2. En el popup de MetaMask, seleccionar la cuenta correcta
3. La cuenta debe coincidir con la mostrada

---

### Problema: No aparece popup de MetaMask

**Causa:** Popup bloqueado por el navegador

**Solución:**
1. Verificar que MetaMask esté instalado
2. Permitir popups para localhost:3000
3. Refrescar la página

---

### Problema: Cuenta no se actualiza

**Causa:** MetaMask cachea estado

**Solución:**
1. Disconnect en la app
2. Desconectar en MetaMask también
3. Volver a conectar

---

## Referencias Técnicas

### MetaMask Documentation
- [Provider API](https://docs.metamask.io/wallet/reference/provider-api/)
- [Permissions](https://docs.metamask.io/wallet/reference/wallet_requestpermissions/)
- [Account Management](https://docs.metamask.io/wallet/how-to/connect/detect-accounts/)

### Anvil Documentation
- [Foundry Anvil](https://book.getfoundry.sh/reference/anvil/)
- [Default Accounts](https://book.getfoundry.sh/reference/anvil/#default-accounts)

---

## Conclusión

Se ha implementado exitosamente un sistema de selección de roles que:

✅ Permite al usuario elegir su rol en la cadena de suministro
✅ Asocia cada rol con una cuenta específica de Ethereum
✅ Valida que la cuenta correcta sea seleccionada
✅ Proporciona feedback claro al usuario
✅ Integra perfectamente con el flujo existente de la aplicación
✅ Sigue el diseño UI/UX proporcionado

El sistema está listo para integrarse con smart contracts y expandirse con más funcionalidades basadas en roles.

---

**Archivos Creados:**
- `app/lib/roles.ts`
- `app/components/RoleSelection.tsx`
- `ROLE_SELECTION.md` (este documento)

**Archivos Modificados:**
- `app/hooks/useWallet.ts`
- `app/page.tsx`
- `app/components/Header.tsx`

**Estado:** ✅ Implementación Completa y Funcional
