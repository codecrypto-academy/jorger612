# Traza - Sistema de Trazabilidad en Solana

Un sistema completo de trazabilidad de productos en la cadena de suministro construido en Solana. Incluye un programa Anchor que gestiona roles y transferencias de tokens, y una aplicación web Next.js para interactuar con el blockchain.

## 📋 Descripción del Proyecto

**Traza** es un sistema que permite rastrear productos a través de la cadena de suministro con roles validados:

- **Producer**: Productor que crea tokens (productos)
- **Factory**: Fábrica que transforma/procesa productos
- **Retailer**: Distribuidor que vende al consumidor final
- **Consumer**: Consumidor final

El sistema garantiza trazabilidad mediante:
- Validación de roles por un authority
- Tokens que se transfieren entre roles
- Escrow (custodia) durante las transferencias
- Historial de transferencias en el blockchain

## 🏗️ Estructura del Proyecto

```
solana_trazabilidad/
├── traza/                    # Programa Solana (Anchor)
│   ├── programs/
│   │   └── traza/
│   │       └── src/
│   │           ├── lib.rs    # Instrucciones del programa
│   │           └── state.rs  # Estructuras de datos
│   ├── tests/                # Tests del programa
│   ├── Anchor.toml           # Configuración de Anchor
│   ├── Cargo.toml            # Dependencias de Rust
│   └── README.md             # Documentación del programa
│
├── web/                      # Aplicación Next.js
│   ├── app/
│   │   ├── page.tsx          # Página de inicio
│   │   ├── register-role/    # Registro de roles
│   │   └── dashboard/        # Dashboard por rol
│   ├── components/           # Componentes React
│   ├── lib/                  # Funciones auxiliares
│   ├── types/                # Tipos TypeScript
│   └── package.json
│
├── test-ledger/              # Validador local de Solana
└── README.md                 # Este archivo
```

## 📦 Requisitos Previos

### 🎯 Empezar Rápido (Antes que nada)

1. **Descarga Backpack** → [backpack.app](https://www.backpack.app/)
2. Crea/importa tu wallet
3. **Configura Custom RPC** en Backpack:
   - URL: `http://localhost:8899`
   - Nombre: "Localnet"
4. ¡Listo! Ya tienes wallet lista

Después de esto, sigue los pasos de Software.

### Software necesario:

1. **Rust** (1.70+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

2. **Solana CLI** (v1.18+)
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
   export PATH="/home/usuario/.local/share/solana/install/active_release/bin:$PATH"
   ```

3. **Node.js** (18+) y **npm** o **yarn**
   ```bash
   # Con nvm (recomendado)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
   nvm install 18
   nvm use 18
   ```

4. **Anchor** (framework Solana)
   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked
   avm install latest
   avm use latest
   ```

### Verificar instalación:
```bash
rustc --version
solana --version
node --version
anchor --version
```

## 🚀 Setup Inicial

### 1. Clonar el repositorio
```bash
cd solana_trazabilidad
```

### 2. Configurar Backpack Wallet

**Opción A: Usar Backpack (Recomendado para Localnet)**

1. Descarga [Backpack](https://www.backpack.app/)
2. Crea una nueva wallet o importa existente
3. En Backpack, configura Custom RPC:
   - URL: `http://localhost:8899`
   - Nombre: "Localnet"
4. ¡Listo! Ya está conectado a tu nodo local

**Opción B: Crear wallet CLI (para deployments)**

```bash
# Crear una wallet local para desplegar programas
solana-keygen new --outfile ~/.config/solana/id.json

# Verificar la configuración
solana address
solana config get
```

**Nota**: La wallet CLI es para desplegar el programa. La wallet Backpack es para interactuar desde la web app.

### 3. Iniciar el validador local
En una **nueva terminal**:
```bash
cd solana_trazabilidad
solana-test-validator --ledger test-ledger
```

Deberías ver algo como:
```
Ledger location: test-ledger
Log: test-ledger/validator.log
⠂ Initializing...
```

El validador está listo cuando veas:
```
✓ Validator startup complete
```

**Importante**: Mantén esta terminal abierta mientras trabajas.

## 🔨 Compilar y Desplegar el Programa Solana

En una **segunda terminal**:

### 1. Compilar el programa
```bash
cd solana_trazabilidad/traza
anchor build
```

Esto crea:
- `target/deploy/traza.so` - El programa compilado
- `target/idl/traza.json` - IDL (Interface Definition Language)

### 2. Desplegar el programa
```bash
anchor deploy
```

Verás algo como:
```
Deploying cluster: http://localhost:8899
Upgrade authority: /home/usuario/.config/solana/id.json
Deploying program "traza"...
Program deployed to: 27w7DWngggMpAEERYrin3rKKkcyaLFvV5VmvP2nEKFys
```

**Guarda el Program ID**, lo necesitarás.

### 3. Actualizar el Program ID
Actualiza `traza/Anchor.toml` con el Program ID:
```toml
[programs.localnet]
traza = "TU_PROGRAM_ID_AQUI"
```

## 🧪 Ejecutar Tests del Programa

```bash
cd traza
anchor test
```

Esto ejecutará todos los tests en `tests/` y verificará que el programa funciona correctamente.

## 🌐 Ejecutar la Aplicación Web

En una **tercera terminal**:

### 1. Instalar dependencias
```bash
cd solana_trazabilidad/web
npm install
# o si usas yarn
yarn install
```

### 2. Copiar el IDL
```bash
# El IDL se genera automáticamente en traza/target/idl/
cp ../traza/target/idl/traza.json ./types/
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Usar la Aplicación

### Configurar Backpack Wallet (Recomendado)

**Backpack** es la wallet más fácil de usar con un nodo local. Sigue estos pasos:

#### 1. Descargar Backpack

- Descarga desde [backpack.app](https://www.backpack.app/)
- Disponible para Chrome, Firefox, Safari, Edge
- Instala la extensión

#### 2. Crear o Importar Wallet

- Abre Backpack en tu navegador
- Crea una nueva wallet o importa una existente
- Guarda tu seed phrase en un lugar seguro

#### 3. Configurar Localnet en Backpack

**Opción A: Localhost (si todo está en la misma máquina)**

En Backpack:
1. Haz clic en el botón de red (arriba a la derecha, normalmente dice "Mainnet")
2. Selecciona **"Custom RPC"** o **"Localhost"**
3. Ingresa: `http://localhost:8899`
4. Nombre: "Localnet" (opcional)
5. Haz clic en guardar

**Ahora tu Backpack está conectado a tu validador local** ✅

**Opción B: Usar ngrok (si está en otra máquina/red)**

Si `localhost:8899` no funciona (porque usas VPN, otra máquina, etc):

```bash
# 1. Instalar ngrok (una sola vez)
# macOS:
brew install ngrok

# Linux/Windows: descarga en https://ngrok.com/download

# 2. En una nueva terminal, crea un túnel
ngrok http 8899
```

Verás:
```
Forwarding: https://1a2b3c4d5e6f.ngrok.io -> http://localhost:8899
```

En Backpack, usa la URL de ngrok:
- RPC URL: `https://1a2b3c4d5e6f.ngrok.io`

#### 4. Obtener SOL en Localnet

Como es local, puedes pedir SOL sin límite:

```bash
# Obtener la dirección pública de tu Backpack
# (La ves en la extensión de Backpack)

# En terminal:
solana airdrop 10 TU_DIRECCION_PUBLICA

# Ejemplo:
solana airdrop 10 9B5X6wrjCYstBgq2n6Bhyzcn91ztYWqJ7FSVqwNAv7fs

# Verificar saldo
solana balance 9B5X6wrjCYstBgq2n6Bhyzcn91ztYWqJ7FSVqwNAv7fs
```

**El saldo aparecerá en Backpack en segundos** ⚡

### Flujo básico de uso:

1. **Conectar Backpack** (arriba a la derecha de la app)
   - Backpack te pide permiso
   - Autoriza el acceso a tu dirección

2. **Registrar rol** (en la página de inicio)
   - Selecciona tu rol (Producer, Factory, etc.)
   - Backpack pide que firmes la transacción
   - El authority debe validar tu solicitud

3. **En el dashboard** (según tu rol)
   - **Producer**: Crear tokens
   - **Factory**: Ver tokens, crear nuevos, transferir
   - **Retailer/Consumer**: Aceptar transferencias

## 🔐 Gestión de Roles - Guía Detallada

### ¿Qué es un rol?

Un rol define **qué acciones puede realizar** cada participante en la cadena de suministro:

| Rol | Creador | Puede crear tokens | Puede transferir a | Recibe de |
|-----|---------|-------------------|-------------------|-----------|
| **Producer** | Granja/Productor | ✅ Sí (básicos) | Factory | - |
| **Factory** | Procesadora | ✅ Sí (referenciando tokens Producer) | Retailer | Producer |
| **Retailer** | Distribuidor | ❌ No | Consumer | Factory |
| **Consumer** | Cliente final | ❌ No | - | Retailer |

### Flujo de Validación de Roles

El sistema tiene **dos estados** para los roles:

#### 1️⃣ Rol Pendiente (PendingRoleRegistration)
```
Usuario solicita un rol
        ↓
Se crea cuenta PendingRoleRegistration
        ↓
Authority ve la solicitud pendiente
        ↓
Authority valida o rechaza
```

**Datos almacenados:**
- `wallet`: Dirección de quien solicita
- `requested_role`: El rol solicitado
- `created_at`: Cuándo se hizo la solicitud
- `bump`: Derivación de PDA

#### 2️⃣ Rol Validado (RoleRegistry)
```
Authority aprueba la solicitud
        ↓
Se crea cuenta RoleRegistry
        ↓
PendingRoleRegistration se cierra (reembolso SOL)
        ↓
Usuario ya tiene rol y puede actuar
```

**Datos almacenados:**
- `wallet`: Usuario con rol validado
- `role`: El rol asignado
- `validated_at`: Cuándo se validó
- `bump`: Derivación de PDA

### Implementación en el Código

#### Paso 1: Usuario solicita rol (Frontend)

```typescript
// web/app/register-role/page.tsx

const registerRole = async (role: string) => {
  try {
    // 1. Obtener la PDA del rol pendiente
    const [pendingRolePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pending_role"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // 2. Obtener la PDA del rol registry (debe estar vacía)
    const [roleRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("role_registry"), wallet.publicKey.toBuffer()],
      program.programId
    );

    // 3. Enviar instrucción register_role
    const tx = await program.methods
      .registerRole({ [role]: {} }) // Producer, Factory, etc.
      .accounts({
        pendingRole: pendingRolePda,
        roleRegistry: roleRegistryPda,
        wallet: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet])
      .rpc();

    console.log("Solicitud enviada:", tx);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

#### Paso 2: Authority valida el rol (Backend/Admin)

```typescript
// El authority (owner del contrato) valida solicitudes pendientes

const validateRole = async (userWallet: PublicKey) => {
  // 1. Obtener la solicitud pendiente
  const [pendingRolePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pending_role"), userWallet.toBuffer()],
    program.programId
  );

  // 2. Obtener la PDA del config (solo authority puede usarla)
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  // 3. Obtener la PDA del rol registry (se creará aquí)
  const [roleRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("role_registry"), userWallet.toBuffer()],
    program.programId
  );

  // 4. Enviar instrucción validate_role (solo authority firma)
  const tx = await program.methods
    .validateRole()
    .accounts({
      programConfig: configPda,
      pendingRole: pendingRolePda,
      roleRegistry: roleRegistryPda,
      authority: authorityWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([authorityWallet])
    .rpc();

  console.log("Rol validado:", tx);
};
```

#### Paso 3: Verificar si un usuario tiene un rol

```typescript
// Verificar si una wallet tiene un rol validado

const checkUserRole = async (userWallet: PublicKey) => {
  try {
    const [roleRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("role_registry"), userWallet.toBuffer()],
      program.programId
    );

    // Intentar obtener la cuenta
    const roleRegistry = await program.account.roleRegistry.fetch(roleRegistryPda);

    if (roleRegistry) {
      console.log(`Usuario tiene rol: ${roleRegistry.role}`);
      console.log(`Validado en: ${new Date(roleRegistry.validatedAt.toNumber() * 1000)}`);
      return roleRegistry.role;
    }
  } catch (error) {
    console.log("Usuario no tiene rol validado");
    return null;
  }
};
```

### Restricciones por Rol

El programa valida automáticamente:

#### Producer
```
✅ Puede crear tokens (basados)
✅ Puede iniciar transferencia a Factory
❌ No puede transferir a otros roles
❌ No puede crear tokens con "source_tokens"
```

#### Factory
```
✅ Puede crear tokens (referenciando Producer)
✅ Puede iniciar transferencia a Retailer
❌ No puede transferir a Consumer
❌ Debe referenciar tokens Producer al crear
```

#### Retailer
```
❌ No puede crear tokens
✅ Puede iniciar transferencia a Consumer
❌ No puede crear ni transferir a otros
```

#### Consumer
```
❌ No puede crear tokens
❌ No puede iniciar transferencias
✅ Solo puede aceptar transferencias
```

**Las restricciones se validan en el programa Rust:**

```rust
// En create_token (traza/programs/traza/src/instructions/create_token.rs)
require!(
  matches!(role_registry.role, Role::Producer | Role::Factory),
  TrazaError::UnauthorizedRole
);

// En initiate_transfer
require!(
  matches!(from_role.role, Role::Producer | Role::Factory | Role::Retailer),
  TrazaError::CannotInitiateTransfer
);
```

### Gestión en el Dashboard

El dashboard muestra opciones diferentes según el rol:

```typescript
// web/app/dashboard/page.tsx

export default function Dashboard() {
  const userRole = useUserRole(); // Tu función para obtener el rol

  return (
    <>
      {userRole === "Producer" && (
        <>
          <Link href="/dashboard/producer/create-token">Crear Token</Link>
          <Link href="/dashboard/producer/transfers">Mis Transferencias</Link>
          <Link href="/dashboard/producer/my-tokens">Mis Tokens</Link>
        </>
      )}

      {userRole === "Factory" && (
        <>
          <Link href="/dashboard/factory/create-token">Crear Token Procesado</Link>
          <Link href="/dashboard/factory/transfers">Transferencias</Link>
          <Link href="/dashboard/factory/my-tokens">Mis Tokens</Link>
        </>
      )}

      {(userRole === "Retailer" || userRole === "Consumer") && (
        <>
          <Link href={`/dashboard/${userRole.toLowerCase()}/my-tokens`}>
            Mis Tokens
          </Link>
          <Link href={`/dashboard/${userRole.toLowerCase()}/transfers`}>
            Transferencias Pendientes
          </Link>
        </>
      )}
    </>
  );
}
```

### Escenario Completo: Flujo de Roles

```
1. INICIO
   └─ App web se conecta, wallet = 0xAAA

2. SOLICITUD DE ROL
   └─ 0xAAA solicita rol "Producer"
   └─ Se crea: PendingRoleRegistration(wallet=0xAAA, role=Producer)

3. VALIDACIÓN (Authority = 0xAUTH)
   └─ Authority ve que 0xAAA pidió Producer
   └─ Authority ejecuta validate_role()
   └─ Se crea: RoleRegistry(wallet=0xAAA, role=Producer, validated_at=T1)
   └─ PendingRoleRegistration se cierra (reembolso de SOL)

4. USUARIO YA TIENE ROL
   └─ 0xAAA puede ahora crear tokens
   └─ Program verifica: RoleRegistry existe → role_registry.role == Producer ✅
   └─ Permite crear token

5. CAMBIO DE ROL (si es necesario)
   └─ Usuario no puede tener 2 roles simultáneamente
   └─ Solo 1 RoleRegistry por wallet
   └─ Para cambiar: Authority cierra rol actual, valida nuevo
```

### Testing de Roles

En `traza/tests/`, hay tests para cada rol:

```bash
# Compilar tests
cd traza
anchor build

# Ejecutar todos los tests
anchor test

# Ejecutar test específico de roles
anchor test -- --grep "role"
```

**Estructura de los tests:**

```typescript
// traza/tests/traza.ts
describe("Roles", () => {
  it("Producer can register and be validated", async () => {
    // 1. Crear wallet de prueba
    // 2. Solicitar rol Producer
    // 3. Authority valida
    // 4. Verificar que la wallet tiene el rol
  });

  it("Only Producer can create tokens", async () => {
    // 1. Factory intenta crear token sin ser Producer
    // 2. Debe fallar
  });

  it("Factory cannot transfer to Consumer", async () => {
    // 1. Factory intenta transferir a Consumer
    // 2. Debe fallar
  });
});
```

### Troubleshooting de Roles

| Problema | Causa | Solución |
|----------|-------|----------|
| "RoleAlreadyValidated" | Ya tienes rol validado | Crea nueva wallet |
| "InvalidRole" | Intentas acciones con rol inválido | Valida tu rol primero |
| "UnauthorizedRole" | Tu rol no puede hacer esa acción | Usa el rol correcto |
| "CannotInitiateTransfer" | Transferencia no válida para tu rol | Revisa transiciones válidas |

### Transiciones Válidas de Tokens

Las transferencias solo son válidas en cierta dirección (no puedes ir hacia atrás):

```
Producer → Factory → Retailer → Consumer
   ↓        ↓          ↓
  [Crea]  [Crea]    [Recibe]
         (ref tokens producer)

Reglas:
- Producer → Factory ✅ (crea nueva cadena de trazabilidad)
- Factory → Retailer ✅ (pasa al distribuidor)
- Retailer → Consumer ✅ (entrega final)

NO PERMITIDO:
- Producer → Retailer ❌ (se salta Factory)
- Factory → Producer ❌ (retroceso)
- Retailer → Factory ❌ (retroceso)
- Consumer → Cualquiera ❌ (es el final)
- Factory → Consumer ❌ (se salta Retailer)
```

**El programa valida esto automáticamente:**

```rust
// En initiate_transfer
fn validate_transfer(from_role: &Role, to_role: &Role) -> Result<()> {
    match (from_role, to_role) {
        // Transiciones permitidas
        (Role::Producer, Role::Factory) => Ok(()),
        (Role::Factory, Role::Retailer) => Ok(()),
        (Role::Retailer, Role::Consumer) => Ok(()),

        // Cualquier otra combinación falla
        _ => Err(TrazaError::InvalidTransition.into()),
    }
}
```

### Cómo Verificar Transiciones en Frontend

```typescript
// lib/roles.ts - Funciones auxiliares

export const VALID_TRANSITIONS = {
  Producer: ["Factory"],
  Factory: ["Retailer"],
  Retailer: ["Consumer"],
  Consumer: [],
};

export function canTransferTo(fromRole: string, toRole: string): boolean {
  return VALID_TRANSITIONS[fromRole]?.includes(toRole) ?? false;
}

// Uso en componente
const { fromRole, toRole } = getUsersRoles();

if (canTransferTo(fromRole, toRole)) {
  // Permitir iniciar transferencia
} else {
  // Mostrar error
  console.error(`No se puede transferir de ${fromRole} a ${toRole}`);
}
```

### Ejemplo Completo: Ciclo de Vida de un Token

```typescript
// Ciclo completo desde Producer hasta Consumer

// 1. PRODUCER CREA TOKEN
const mint1 = Keypair.generate();
await program.methods
  .createToken(new BN(100), "Lote Trigo ABC")
  .accounts({
    traceToken: traceTokenPda(mint1.publicKey),
    mint: mint1.publicKey,
    creator: producer.publicKey,
    roleRegistry: getRoleRegistryPda(producer.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([producer, mint1])
  .rpc();
// Token estado: "Created"
// Propietario: Producer

// 2. PRODUCER INICIA TRANSFERENCIA A FACTORY
await program.methods
  .initiateTransfer(new BN(100))
  .accounts({
    traceToken: traceTokenPda(mint1.publicKey),
    pendingTransfer: pendingTransferPda(mint1.publicKey),
    from: producer.publicKey,
    to: factory.publicKey,
    fromRoleRegistry: getRoleRegistryPda(producer.publicKey),
    toRoleRegistry: getRoleRegistryPda(factory.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([producer])
  .rpc();
// Token estado: "InTransfer"
// Propietario actual: sigue siendo Producer (en escrow)

// 3. FACTORY ACEPTA TRANSFERENCIA
await program.methods
  .acceptTransfer()
  .accounts({
    traceToken: traceTokenPda(mint1.publicKey),
    pendingTransfer: pendingTransferPda(mint1.publicKey),
    to: factory.publicKey,
    roleRegistry: getRoleRegistryPda(factory.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([factory])
  .rpc();
// Token estado: "Accepted"
// Propietario actual: Factory
// PendingTransfer se cierra

// 4. FACTORY CREA NUEVO TOKEN (REFERENCIANDO PRODUCER)
const mint2 = Keypair.generate();
await program.methods
  .createToken(
    new BN(100),
    "Harina Procesada",
    [mint1.publicKey] // ← Referencia al token Producer
  )
  .accounts({
    traceToken: traceTokenPda(mint2.publicKey),
    mint: mint2.publicKey,
    creator: factory.publicKey,
    roleRegistry: getRoleRegistryPda(factory.publicKey),
    systemProgram: SystemProgram.programId,
    // Remaining accounts: Cuenta TraceToken del mint1 de Producer
  })
  .remainingAccounts([
    {
      pubkey: traceTokenPda(mint1.publicKey),
      isSigner: false,
      isWritable: false,
    },
  ])
  .signers([factory, mint2])
  .rpc();
// Nuevo token creado por Factory
// source_tokens = [mint1.publicKey] ← Trazabilidad de origen

// 5. FACTORY INICIA TRANSFERENCIA A RETAILER
await program.methods
  .initiateTransfer(new BN(100))
  .accounts({
    traceToken: traceTokenPda(mint2.publicKey),
    pendingTransfer: pendingTransferPda(mint2.publicKey),
    from: factory.publicKey,
    to: retailer.publicKey,
    fromRoleRegistry: getRoleRegistryPda(factory.publicKey),
    toRoleRegistry: getRoleRegistryPda(retailer.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([factory])
  .rpc();
// Token (mint2) estado: "InTransfer"

// 6. RETAILER ACEPTA
await program.methods
  .acceptTransfer()
  .accounts({
    traceToken: traceTokenPda(mint2.publicKey),
    pendingTransfer: pendingTransferPda(mint2.publicKey),
    to: retailer.publicKey,
    roleRegistry: getRoleRegistryPda(retailer.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([retailer])
  .rpc();
// Token propietario: Retailer

// 7. RETAILER INICIA TRANSFERENCIA A CONSUMER
await program.methods
  .initiateTransfer(new BN(100))
  .accounts({
    traceToken: traceTokenPda(mint2.publicKey),
    pendingTransfer: pendingTransferPda(mint2.publicKey),
    from: retailer.publicKey,
    to: consumer.publicKey,
    fromRoleRegistry: getRoleRegistryPda(retailer.publicKey),
    toRoleRegistry: getRoleRegistryPda(consumer.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([retailer])
  .rpc();

// 8. CONSUMER ACEPTA (FIN DEL CICLO)
await program.methods
  .acceptTransfer()
  .accounts({
    traceToken: traceTokenPda(mint2.publicKey),
    pendingTransfer: pendingTransferPda(mint2.publicKey),
    to: consumer.publicKey,
    roleRegistry: getRoleRegistryPda(consumer.publicKey),
    systemProgram: SystemProgram.programId,
  })
  .signers([consumer])
  .rpc();
// Token propietario: Consumer (FINAL)
```

### Panel de Administración: Validar Roles (Authority)

El **authority** (el que desplegó el programa) tiene un panel especial para validar solicitudes:

```typescript
// web/app/dashboard/authority/validate-roles/page.tsx

"use client";

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

export default function ValidateRoles() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) return;

    const fetchPendingRoles = async () => {
      try {
        // Obtener todas las solicitudes pendientes
        const program = new Program(IDL, PROGRAM_ID, { connection });

        const pendingRoles = await program.account.pendingRoleRegistration.all();

        setPendingRequests(
          pendingRoles.map(({ publicKey, account }) => ({
            pda: publicKey,
            wallet: account.wallet.toBase58(),
            role: Object.keys(account.requestedRole)[0], // "Producer", "Factory", etc.
            createdAt: new Date(account.createdAt.toNumber() * 1000),
          }))
        );
      } catch (error) {
        console.error("Error fetching pending roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRoles();
  }, [wallet, connection]);

  const handleValidateRole = async (userWallet: PublicKey) => {
    try {
      const program = new Program(IDL, PROGRAM_ID, { connection });

      // Derivar las PDAs necesarias
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
      );

      const [pendingRolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pending_role"), userWallet.toBuffer()],
        program.programId
      );

      const [roleRegistryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("role_registry"), userWallet.toBuffer()],
        program.programId
      );

      // Validar rol
      const tx = await program.methods
        .validateRole()
        .accounts({
          programConfig: configPda,
          pendingRole: pendingRolePda,
          roleRegistry: roleRegistryPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet])
        .rpc();

      console.log("Rol validado:", tx);

      // Actualizar lista
      setPendingRequests(prev =>
        prev.filter(req => req.wallet !== userWallet.toBase58())
      );
    } catch (error) {
      console.error("Error validando rol:", error);
    }
  };

  if (loading) return <div>Cargando solicitudes pendientes...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Validar Solicitudes de Rol</h1>

      {pendingRequests.length === 0 ? (
        <p className="text-gray-500">No hay solicitudes pendientes</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Wallet</th>
              <th className="border p-2">Rol Solicitado</th>
              <th className="border p-2">Fecha Solicitud</th>
              <th className="border p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((req) => (
              <tr key={req.wallet} className="border">
                <td className="border p-2 font-mono text-sm">
                  {req.wallet.slice(0, 8)}...
                </td>
                <td className="border p-2">
                  <span className="bg-blue-100 px-2 py-1 rounded">
                    {req.role}
                  </span>
                </td>
                <td className="border p-2">
                  {req.createdAt.toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleValidateRole(new PublicKey(req.wallet))}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    ✓ Aprobar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Gestionar Múltiples Wallets de Prueba

Para probar el sistema completo localmente, necesitas múltiples wallets:

```bash
# En tu terminal, crear wallets de prueba
solana-keygen new --no-passphrase --outfile wallet-producer.json
solana-keygen new --no-passphrase --outfile wallet-factory.json
solana-keygen new --no-passphrase --outfile wallet-retailer.json
solana-keygen new --no-passphrase --outfile wallet-consumer.json

# Pedir SOL de prueba a cada una
solana airdrop 10 wallet-producer.json
solana airdrop 10 wallet-factory.json
solana airdrop 10 wallet-retailer.json
solana airdrop 10 wallet-consumer.json

# Verificar saldos
solana balance wallet-producer.json
```

**Usar diferentes wallets en el frontend:**

```typescript
// Simular diferentes usuarios
const producers = [
  "wallet-producer.json",
  // ... más producers
];

// Cada usuario conecta con su wallet y solicita su rol
// Authority valida cada solicitud
```

### Debugging: Ver qué Rol Tiene Alguien

```typescript
// Verificar el rol de una wallet específica
async function inspectUserRole(userAddress: string) {
  const userPubkey = new PublicKey(userAddress);

  const [roleRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("role_registry"), userPubkey.toBuffer()],
    program.programId
  );

  try {
    const roleRegistry = await program.account.roleRegistry.fetch(roleRegistryPda);
    console.log("✅ Usuario tiene rol validado:");
    console.log("   Rol:", Object.keys(roleRegistry.role)[0]);
    console.log("   Validado:", new Date(roleRegistry.validatedAt.toNumber() * 1000));
    return roleRegistry;
  } catch (error) {
    console.log("❌ Usuario NO tiene rol validado");

    // Verificar si hay solicitud pendiente
    const [pendingRolePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pending_role"), userPubkey.toBuffer()],
      program.programId
    );

    try {
      const pending = await program.account.pendingRoleRegistration.fetch(
        pendingRolePda
      );
      console.log("⏳ Usuario tiene solicitud pendiente:");
      console.log("   Rol solicitado:", Object.keys(pending.requestedRole)[0]);
      console.log("   Creada:", new Date(pending.createdAt.toNumber() * 1000));
      return pending;
    } catch (e) {
      console.log("❌ Usuario sin solicitud tampoco");
      return null;
    }
  }
}
```

### Visualización: Estados y Transiciones

#### Estado del Sistema de Roles

```
┌─────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN SOLANA                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ProgramConfig (Authority)                                  │
│  ├─ authority: 0xAAA                                        │
│  └─ initialized: true                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ USUARIO 0xBBB - Sin Rol Aún                         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • roleRegistry PDA: VACÍA                            │  │
│  │ • pendingRoleRegistration PDA: EXISTE               │  │
│  │   - wallet: 0xBBB                                    │  │
│  │   - requested_role: Producer                         │  │
│  │   - created_at: 1234567890                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ⬇ Authority valida                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ USUARIO 0xBBB - Rol Validado (Producer)            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • roleRegistry PDA: EXISTE                           │  │
│  │   - wallet: 0xBBB                                    │  │
│  │   - role: Producer ✅                                │  │
│  │   - validated_at: 1234567900                         │  │
│  │ • pendingRoleRegistration PDA: CERRADA (reembolso)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ⬇ Ahora puede actuar               │
│  • Crear tokens                                             │
│  • Transferir a Factory                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Flujo de Transferencia de Tokens (Cadena de Suministro)

```
ESTADO INICIAL:
┌─────────────┐
│  Producer   │ ← Tiene TOKEN (status: Created)
│  (0xBBB)    │
└─────────────┘

PASO 1: Producer inicia transfer a Factory
┌─────────────────────────────┐
│ TraceToken                  │
│ - currentOwner: 0xBBB      │
│ - status: InTransfer       │
│ - creator: 0xBBB           │
└─────────────────────────────┘
        ⬇ escrow
┌─────────────────────────────┐
│ PendingTransfer             │
│ - from: 0xBBB              │
│ - to: 0xCCC                │
│ - amount: 100              │
└─────────────────────────────┘

PASO 2: Factory acepta transfer
┌─────────────┐
│  Factory    │ ← Ahora TIENE TOKEN (status: Accepted)
│  (0xCCC)    │
└─────────────┘

PASO 3: Factory crea nuevo token (referenciando Producer)
┌────────────────────────────────┐
│  TraceToken (creado por Factory)│
│ - creator: 0xCCC               │
│ - currentOwner: 0xCCC          │
│ - source_tokens: [0xBBB_token] │ ← Traza origen
└────────────────────────────────┘

PASO 4-5: Factory → Retailer (similar)
PASO 6-7: Retailer → Consumer (similar)

FINAL:
┌─────────────┐
│  Consumer   │ ← Tiene TOKEN (puede rastrear origen)
│  (0xDDD)    │
└─────────────┘
```

#### Árbol de Autorización

```
                    Authority (0xAUTH)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ✅ VALIDA        ✅ VALIDA        ✅ VALIDA
        │                 │                 │
    Producer          Factory            Retailer
      (0xBBB)           (0xCCC)            (0xDDD)
        │                 │                 │
    Puede:             Puede:            Puede:
    • Crear tokens     • Crear tokens    • RECIBIR tokens
    • Transferir          (con refs)     • Transferir
      a Factory        • Transferir        a Consumer
                         a Retailer

    Consumer (0xEEE)
        │
    Puede:
    • RECIBIR tokens
    • VER historial

⛔ PROHIBIDO: Cambiar de rol sin Authority
⛔ PROHIBIDO: Saltar pasos (Factory → Consumer)
⛔ PROHIBIDO: Actuar sin rol validado
```

### Checklist para Gestión de Roles

- ✅ Authority está configurado en `initialize()`
- ✅ Usuario solicita rol con `register_role()`
- ✅ Authority valida con `validate_role()`
- ✅ Programa verifica rol antes de permitir acciones
- ✅ Dashboard muestra opciones según rol
- ✅ Tests validan restricciones por rol
- ✅ Transiciones de roles son validadas correctamente
- ✅ Solo un rol por wallet simultáneamente
- ✅ Authority tiene panel para ver y validar solicitudes
- ✅ Se pueden debuggear roles fácilmente
- ✅ Entiende los estados: Pendiente → Validado → Activo

## 🌐 Usar Devnet o Testnet (Red Pública)

Una vez que tu aplicación funciona en **Localnet**, puedes probarla en redes públicas de Solana:

### Diferencias entre redes:

| Característica | Localnet | Testnet | Devnet | Mainnet |
|---|---|---|---|---|
| **Propósito** | Desarrollo local | Testing | Testing avanzado | Producción real |
| **Validador** | Tu máquina | Red Solana | Red Solana | Red Solana |
| **SOL real** | No | No | No | ✅ Sí |
| **Presupuesto** | Ilimitado | Limitado | Limitado | $$ |
| **Uso** | Desarrollo | Pruebas finales | Pruebas extensas | Producción |
| **Faucet** | `solana airdrop` | [faucet.solana.com](https://faucet.solana.com) | [faucet.solana.com](https://faucet.solana.com) | ❌ No |

### Cambiar de Red en la CLI

```bash
# Ver red actual
solana config get

# Cambiar a Testnet
solana config set --url https://api.testnet.solana.com

# Cambiar a Devnet
solana config set --url https://api.devnet.solana.com

# Volver a Localnet
solana config set --url http://localhost:8899
```

### Obtener SOL en Testnet/Devnet (Faucet Oficial)

#### Opción 1: Usar el Faucet Online

1. Ve a [faucet.solana.com](https://faucet.solana.com)
2. Selecciona la red (Devnet o Testnet)
3. Pega tu dirección pública
4. Haz clic en "Airdrop" (obtienes 2 SOL)

**Límite**: 2 SOL cada 24 horas

#### Opción 2: Usar CLI

```bash
# Asegúrate de estar en la red correcta
solana config set --url https://api.devnet.solana.com

# Pedir SOL
solana airdrop 2

# Verificar saldo
solana balance

# Para una dirección específica
solana airdrop 2 9B5X6wrjCYstBgq2n6Bhyzcn91ztYWqJ7FSVqwNAv7fs
```

### Cambiar Red en Backpack

Para usar Devnet/Testnet en Backpack:

1. Abre Backpack
2. Haz clic en el botón de red (esquina superior)
3. Selecciona **"Devnet"** o **"Testnet"**
4. El saldo se actualizará automáticamente

### Paso a Paso: Desplegar en Devnet

#### 1. Cambiar CLI a Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana config get  # Verifica que sea devnet
```

#### 2. Obtener SOL en el Faucet

```bash
# Si no tienes saldo
solana airdrop 2
```

#### 3. Compilar el Programa

```bash
cd traza
anchor build
```

#### 4. Actualizar Anchor.toml

```toml
[provider]
cluster = "devnet"  # Cambiar de "localnet" a "devnet"
wallet = "~/.config/solana/id.json"
```

#### 5. Desplegar

```bash
anchor deploy
```

El programa se desplegará en Devnet. Copiar el nuevo Program ID.

#### 6. Actualizar la Web App

```bash
# Copiar el nuevo IDL
cp target/idl/traza.json ../web/types/

# Actualizar web/lib/constants.ts con el nuevo PROGRAM_ID
```

#### 7. Cambiar Web App a Devnet

```typescript
// web/app/layout.tsx o donde conectes el provider

import { clusterApiUrl } from "@solana/web3.js";

const endpoint = clusterApiUrl("devnet"); // Cambiar de "localnet"
```

#### 8. Conectar Backpack a Devnet y Probar

```bash
npm run dev
```

1. Abre http://localhost:3000
2. En Backpack, selecciona "Devnet"
3. Conecta tu wallet
4. ¡Usa la app en Devnet!

### Comparación: Localnet vs Devnet vs Testnet

```
LOCALNET (Desarrollo)
├─ Validador local en tu máquina
├─ SOL ilimitado (solana airdrop)
├─ Transacciones instantáneas
├─ Útil para: Desarrollo rápido
└─ Problemas: Solo funciona en tu máquina

DEVNET (Testing)
├─ Red Solana pública
├─ SOL limitado (faucet 2/día)
├─ Transacciones reales (5-10 segundos)
├─ Útil para: Testing riguroso
└─ Problemas: Resets periódicos

TESTNET (Testing avanzado)
├─ Red Solana (más estable que Devnet)
├─ SOL limitado (faucet 2/día)
├─ Más cercano a Mainnet
├─ Útil para: Validación final
└─ Problemas: Menos usado

MAINNET (Producción)
├─ Red Solana real
├─ SOL REAL ($$$)
├─ Sin faucet
├─ Transacciones lentas en congestión
└─ CUIDADO: Dinero real en juego
```

### Workflow Recomendado

```
1. DESARROLLAR EN LOCALNET ← Iteraciones rápidas
   └─ solana-test-validator
   └─ anchor build && anchor deploy
   └─ npm run dev

2. TESTEAR EN DEVNET ← Antes de mergear
   └─ solana config set devnet
   └─ Pedir SOL en faucet.solana.com
   └─ anchor deploy
   └─ Pruebas finales

3. TESTEAR EN TESTNET ← Validación crítica
   └─ Último nivel de testing
   └─ Verificar performance

4. DEPLOY EN MAINNET ← Después de auditoría
   └─ SOLO si es código de producción
   └─ SOL REAL
```

### Cambiar entre Redes Rápidamente

Crea aliases en `.bashrc` o `.zshrc`:

```bash
# ~/.bashrc o ~/.zshrc

alias solana-local="solana config set --url http://localhost:8899"
alias solana-devnet="solana config set --url https://api.devnet.solana.com"
alias solana-testnet="solana config set --url https://api.testnet.solana.com"

alias sol-network="solana config get | grep 'RPC URL'"
```

Luego:
```bash
solana-devnet
sol-network  # Verifica que estés en devnet
```

### Troubleshooting: Redes Públicas

**Problema**: "Error: Invalid account data" en Devnet

**Solución**:
```bash
# El programa no está desplegado en esa red
# O tienes el Program ID incorrecto
# Verifica:
solana program show TU_PROGRAM_ID --url https://api.devnet.solana.com
```

**Problema**: Airdrop lento o falla

**Solución**:
```bash
# El faucet puede estar limitado
# Usa faucet.solana.com directamente
# O espera 24 horas para siguiente airdrop
```

**Problema**: Devnet no tiene tu programa

**Solución**:
```bash
# Devnet se resetea periódicamente (cada semana aprox)
# Necesitas re-desplegar:
anchor deploy --provider.cluster devnet
```

## 🔄 Workflow de Desarrollo

### Realizar cambios en el programa:

```bash
# 1. Edita traza/programs/traza/src/lib.rs
# 2. Compila
cd traza
anchor build

# 3. Despliega
anchor deploy

# 4. Copia el IDL a web (si cambió la estructura)
cp target/idl/traza.json ../web/types/

# 5. Reinicia la app web (presiona Ctrl+C y npm run dev)
```

### Realizar cambios en la web:

```bash
cd web
npm run dev
```

Los cambios se recargan automáticamente.

## 🐛 Troubleshooting

### El validador no inicia
```bash
# Limpiar la ledger anterior
rm -rf test-ledger

# Reintentar
solana-test-validator --ledger test-ledger

# Si persiste, verifica puerto 8899
lsof -i :8899  # Matar proceso si está en uso
```

### Error: "Program not found"
- Verifica que el validador esté corriendo
- Confirma que el Program ID en `Anchor.toml` es correcto
- Vuelve a desplegar: `anchor deploy`

### Error: "Insufficient balance"
```bash
# En Localnet: pide SOL
solana airdrop 10

# En Devnet/Testnet: usa faucet
# Opción 1: faucet.solana.com
# Opción 2: solana airdrop 2
```

### Backpack no se conecta a la app
**Problema**: "Wallet not detected"

**Soluciones**:
1. Verifica que Backpack está instalado (búscalo en extensiones)
2. Abre Backpack y asegúrate de haber creado una wallet
3. En la app web, presiona Conectar Wallet nuevamente
4. Revisa consola (F12 → Console) para errores de conexión

### La app web no detecta la red correcta
**Problema**: "Program not deployed on this network"

**Soluciones**:
```bash
# 1. Verifica red en CLI
solana config get

# 2. Verifica que Backpack esté en la misma red
#    (Localnet en Backpack si usas solana-test-validator)

# 3. Verifica que el Program ID sea correcto
#    - En Anchor.toml
#    - En web/lib/constants.ts (si existe)

# 4. Si cambiaste de red, re-despliega
anchor deploy
cp target/idl/traza.json ../web/types/
```

### Backpack muestra 0 SOL en Localnet
```bash
# Backpack necesita tu dirección pública
# Ver en Backpack: copia tu "Public Key"

# En terminal:
solana airdrop 10 TU_DIRECCION_PUBLICA

# Espera 5 segundos y recarga Backpack
```

### "Wallet requires too many confirmations"
```bash
# En Localnet, aumenta velocidad de bloques
# Reinicia el validador con:
solana-test-validator --ledger test-ledger --bpf-program <tu programa>
```

### La app web no conecta con Backpack
```bash
# Asegúrate que Backpack permite esta conexión
# En Backpack: Settings → Notifications
# Acepta todas las solicitudes de conexión

# Si sigue fallando:
# 1. Abre Backpack directamente
# 2. Verifica que tengas saldo
# 3. Recarga la página de la app
```

### Backpack no puede acceder a localhost:8899 (Red diferente/VPN)

**Problema**: "Cannot connect to localhost"

**Solución: Usar ngrok**

```bash
# 1. Instalar ngrok
brew install ngrok  # o descarga en https://ngrok.com/download

# 2. Crear túnel
ngrok http 8899

# 3. Copiar URL de ngrok (ej: https://1a2b3c4d5e6f.ngrok.io)

# 4. En Backpack: Custom RPC → Ingresa la URL de ngrok
# 5. Espera 10 segundos y recarga la app web
```

**¿Por qué ngrok?**
- Crea un túnel HTTPS público a tu localhost
- Funciona desde cualquier red
- Perfecto para máquinas remotas o VPN

### Tests fallan
```bash
# Asegúrate de que el validador esté corriendo
cd traza
anchor test --skip-build

# Si fallan con "Program not found":
# Re-compila y despliega
anchor build
anchor deploy
anchor test
```

### Error: "Transaction timeout" en Devnet
```bash
# Devnet puede estar congestionado
# Soluciones:
# 1. Espera unos minutos
# 2. Intenta nuevamente
# 3. Usa Testnet que es más estable
```

### Devnet se reseteó y desapareció mi programa
```bash
# Devnet se resetea periódicamente (cada ~1 semana)
# Solución: Re-desplegar

cd traza
anchor build
solana config set --url https://api.devnet.solana.com
solana airdrop 2  # Pedir SOL nuevo
anchor deploy

# Copiar nuevo Program ID y actualizar web app
```

## 📚 Documentación

### Empezar Rápido

- **[QUICK_START.md](./QUICK_START.md)** ⚡ - Empezar en 15 minutos (EMPIEZA AQUÍ)
- **[NGROK_SETUP.md](./NGROK_SETUP.md)** - Acceder desde otra red o máquina
- **[README.md](./README.md)** - Documentación completa (este archivo)

### Para Trabajos Finales de Máster (TFM)

- **[TFM_SOLANA_FOOD_TRACEABILITY.md](./TFM_SOLANA_FOOD_TRACEABILITY.md)** 📋 - **Trazabilidad Alimentaria en Solana** (Adaptación del TFM 1)
  - Descripción completa del proyecto
  - Contexto y problemas a resolver
  - Componentes MVP en Solana
  - Comparativa Solana vs EVM
  - Referencia GrainChain

- **[FOOD_TRACEABILITY_ANCHOR_GUIDE.md](./FOOD_TRACEABILITY_ANCHOR_GUIDE.md)** 💻 - **Guía Técnica Detallada para Implementar Trazabilidad Alimentaria**
  - Setup del proyecto Anchor
  - Estructura de datos completa (Accounts)
  - Implementación de instrucciones
  - Validaciones y permisos
  - Testing con Anchor
  - Código listo para usar

### Documentación Técnica del Proyecto

- **[traza/README.md](./traza/README.md)** - Detalles del programa Solana actual
- **[Programa Actual: Traza](./traza)** - Implementación de roles y transferencias

### Documentación Externa

- **[Solana Docs](https://docs.solana.com/)** - Documentación oficial de Solana
- **[Anchor Docs](https://www.anchor-lang.com/)** - Framework Anchor para Solana
- **[Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)** - Librería JavaScript
- **[Backpack](https://www.backpack.app/)** - Wallet recomendada
- **[Faucet Solana](https://faucet.solana.com)** - Obtener SOL en Devnet/Testnet
- **[ngrok](https://ngrok.com/)** - Crear túneles HTTPS locales

## 🎯 Próximos Pasos

1. ✅ Compilar y desplegar el programa
2. ✅ Ejecutar los tests
3. ✅ Correr la app web
4. 📝 Modificar el programa según necesidades
5. 🎨 Personalizar la interfaz web
6. 🔐 Configurar manejo de errores

## 💡 Tips de Desarrollo

- **Mantener las 3 terminales abiertas**: Validador, compilación, app web
- **Limpiar build si hay problemas**: `rm -rf target/` y `anchor build`
- **Usar logs**: En Rust usa `msg!()`, en TypeScript usa `console.log()`
- **Probar primero en tests**: Escribe tests antes de usar la web
- **IDL es crítico**: Siempre copia el IDL actualizado a la web

## 🗺️ Guía de Referencia Rápida

### Setup Localnet (Desarrollo)

```bash
# Terminal 1: Validador
solana-test-validator --ledger test-ledger

# Terminal 2: Compilar y desplegar programa
cd traza
anchor build
anchor deploy

# Terminal 3: Correr app web
cd web
npm install
npm run dev
```

**Backpack**: Custom RPC → `http://localhost:8899`
**SOL**: `solana airdrop 10`

---

### Setup Devnet (Testing)

```bash
# Cambiar red
solana config set --url https://api.devnet.solana.com

# Obtener SOL
# Opción 1: faucet.solana.com
# Opción 2: solana airdrop 2

# Desplegar programa
cd traza
anchor build
anchor deploy

# Actualizar Program ID en web/types/
cp target/idl/traza.json ../web/types/

# Cambiar endpoint web
# En web/app/layout.tsx cambiar a clusterApiUrl("devnet")

# Correr web
npm run dev
```

**Backpack**: Seleccionar "Devnet" en el dropdown

---

### Setup Testnet (Testing Avanzado)

```bash
# Cambiar red
solana config set --url https://api.testnet.solana.com

# Mismo proceso que Devnet
# Testnet es más estable y cercano a Mainnet
```

**Backpack**: Seleccionar "Testnet"

---

### Cambiar entre Redes Rápido

```bash
# Ver red actual
solana config get

# Cambiar CLI
solana config set --url http://localhost:8899         # Localnet
solana config set --url https://api.devnet.solana.com # Devnet
solana config set --url https://api.testnet.solana.com # Testnet

# Cambiar Backpack: Haz clic en nombre de la red arriba
```

---

### Agregar Fondos Rápidamente

| Red | Comando | Limite |
|-----|---------|--------|
| **Localnet** | `solana airdrop 10` | Ilimitado |
| **Devnet** | `solana airdrop 2` o [faucet.solana.com](https://faucet.solana.com) | 2 SOL/24h |
| **Testnet** | `solana airdrop 2` o [faucet.solana.com](https://faucet.solana.com) | 2 SOL/24h |

---

### Checklist de Deployment

- [ ] Backpack instalado y configurado
- [ ] Validador corriendo (si es Localnet)
- [ ] Programa compilado: `anchor build`
- [ ] Programa desplegado: `anchor deploy`
- [ ] IDL copiado: `cp traza/target/idl/traza.json web/types/`
- [ ] Program ID actualizado en web app
- [ ] Web app comparte misma red que CLI
- [ ] Backpack está en misma red que CLI
- [ ] Backpack tiene SOL (visualizar en extensión)
- [ ] App web levantada: `npm run dev`

## 📞 Soporte

Para problemas específicos:
- Revisa los logs del validador: `tail -f test-ledger/validator.log`
- Consulta la consola del navegador: F12 → Console
- Ejecuta `anchor test` para verificar el programa

---

**¡Éxito en tu desarrollo!** 🚀
