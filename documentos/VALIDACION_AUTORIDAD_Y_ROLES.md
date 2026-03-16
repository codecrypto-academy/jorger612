# 🔐 Validación de Autoridad y Roles en Traza

Guía completa de cómo está implementada y cómo mejorar la validación de propietario del contrato y roles de usuario en el programa Solana Anchor.

## 📋 Tabla de Contenidos

1. [Arquitectura de Validación](#arquitectura-de-validación)
2. [Validación del Propietario](#validación-del-propietario)
3. [Validación de Roles](#validación-de-roles)
4. [Flujo de Validación](#flujo-de-validación)
5. [Mejoras Recomendadas](#mejoras-recomendadas)
6. [Ejemplos de Código](#ejemplos-de-código)

---

## 🏗️ Arquitectura de Validación

### Entidades Clave

```
┌─────────────────────────────────────────────────────────┐
│          PROGRAMA TRAZA (Solana/Anchor)                 │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ ProgramConfig (PDA)                                     │
│  ├─ authority: Pubkey         <- PROPIETARIO            │
│  ├─ bump: u8                                            │
│  └─ initialized: bool                                   │
├─────────────────────────────────────────────────────────┤
│ RoleRegistry (PDA por usuario)                          │
│  ├─ wallet: Pubkey                                      │
│  ├─ role: Role (Producer|Factory|Retailer|Consumer)    │
│  ├─ bump: u8                                            │
│  └─ validated_at: i64 (timestamp)                       │
├─────────────────────────────────────────────────────────┤
│ TraceToken (PDA por token mint)                         │
│  ├─ mint: Pubkey                                        │
│  ├─ creator: Pubkey            <- CREADOR               │
│  ├─ current_owner: Pubkey                               │
│  ├─ amount: u64                                         │
│  ├─ status: TokenStatus                                 │
│  └─ metadata: String                                    │
└─────────────────────────────────────────────────────────┘
```

### Niveles de Validación

| Nivel | Descripción | Componente | Validación |
|-------|-------------|-----------|-----------|
| **L1: Autoridad** | Solo el propietario puede validar roles | `program_config.authority` | `authority.key() == program_config.authority` |
| **L2: Rol** | Usuario debe tener rol validado | `role_registry` | Debe existir y no estar vacío |
| **L3: Transacción** | Acciones permitidas según rol | Transfer rules | Validar transiciones (Producer→Factory, etc.) |

---

## 🔑 Validación del Propietario

### ¿Dónde se valida?

**Instrucción: `validate_role`** (`instructions/validate_role.rs`)

```rust
#[derive(Accounts)]
pub struct ValidateRole<'info> {
    #[account(
        seeds = [b"config"],
        bump = program_config.bump,
        constraint = program_config.authority == authority.key()
            @ crate::error::TrazaError::UnauthorizedAuthority  // ← VALIDACIÓN
    )]
    pub program_config: Account<'info, ProgramConfig>,

    // ... otras cuentas ...

    #[account(mut)]
    pub authority: Signer<'info>,  // ← DEBE FIRMAR ESTA TRANSACCIÓN
}
```

### Flujo de Validación del Propietario

```
1. Usuario llama a validate_role
   ↓
2. Se pasa la cuenta authority (Signer)
   ↓
3. Anchor verifica:
   - ¿program_config.authority == authority.key()?
   - ¿authority firma la transacción? (Signer trait)
   ↓
4. SI NO → Error: UnauthorizedAuthority
   SI SÍ → Continuar con validación de rol
   ↓
5. Se valida el rol y se crea RoleRegistry
```

### Casos de Error

```rust
// Error: UnauthorizedAuthority
if program_config.authority != authority.key() {
    return Err(TrazaError::UnauthorizedAuthority);
    // Mensaje: "Only the program authority can validate roles"
}
```

---

## 👥 Validación de Roles

### Estados del Rol

```
1. SIN REGISTRAR
   └─> Llamar: register_role
       ├─ Crear PendingRoleRegistration
       └─ Requiere aprobación del autoridad

2. PENDIENTE (PendingRoleRegistration existe)
   └─> Llamar: validate_role (solo autoridad)
       ├─ Crear RoleRegistry
       ├─ Destruir PendingRoleRegistration
       └─ Rol ahora validado

3. VALIDADO (RoleRegistry existe y no está vacío)
   └─> Puede usar instrucciones: create_token, initiate_transfer, accept_transfer
```

### Validación en Instrucciones

#### 1️⃣ Register Role (cualquiera puede solicitar)

**Archivo:** `instructions/register_role.rs`

```rust
pub fn handler(ctx: Context<RegisterRole>, params: RegisterRoleParams) -> Result<()> {
    // CHECK 1: Verificar que role_registry PDA sea la correcta
    let (expected_pda, _) = Pubkey::find_program_address(
        &[b"role_registry", ctx.accounts.wallet.key().as_ref()],
        ctx.program_id,
    );
    require!(
        ctx.accounts.role_registry.key() == expected_pda,
        TrazaError::InvalidRoleRegistryAccount
    );

    // CHECK 2: Usuario no puede tener rol ya validado
    require!(
        ctx.accounts.role_registry.data_is_empty(),  // ← Debe estar vacío
        TrazaError::RoleAlreadyValidated
    );

    // Se crea PendingRoleRegistration esperando validación de autoridad
}
```

#### 2️⃣ Validate Role (solo propietario)

**Archivo:** `instructions/validate_role.rs`

```rust
// Validación en constraint de Accounts
constraint = program_config.authority == authority.key()
    @ crate::error::TrazaError::UnauthorizedAuthority

// El handler simplemente copia datos:
// PendingRoleRegistration → RoleRegistry
registry.wallet = pending.wallet;
registry.role = pending.requested_role.clone();
```

#### 3️⃣ Create Token (solo Producer/Factory)

**Archivo:** `instructions/create_token.rs`

```rust
pub fn handler(ctx: Context<CreateToken>, params: CreateTokenParams) -> Result<()> {
    let creator_role = &ctx.accounts.creator_role_registry.role;

    // CHECK: Solo Producer o Factory pueden crear tokens
    require!(
        matches!(creator_role, Role::Producer | Role::Factory),
        TrazaError::InvalidCreatorRole  // ← VALIDACIÓN DE ROL
    );

    // Si es Factory, requiere source tokens de Producer
    if matches!(creator_role, Role::Factory) {
        require!(
            !params.source_tokens.is_empty(),
            TrazaError::FactoryRequiresSourceTokens
        );

        // Validar que source tokens vengan de Producer
        for source in &params.source_tokens {
            let source_creator = // obtener creador del token
            let source_creator_role = // obtener rol del creador
            require!(
                matches!(source_creator_role, Role::Producer),
                TrazaError::InvalidSourceTokenCreator
            );
        }
    }
}
```

#### 4️⃣ Initiate Transfer (validación de caminos)

**Archivo:** `instructions/initiate_transfer.rs`

```rust
pub fn handler(ctx: Context<InitiateTransfer>, params: InitiateTransferParams) -> Result<()> {
    let from_role = &ctx.accounts.from_role_registry.role;
    let to_role = &ctx.accounts.to_role_registry.role;

    // CHECK: Validar camino de transferencia permitido
    let valid = matches!(
        (from_role, to_role),
        (Role::Producer, Role::Factory)      // Producer → Factory ✅
            | (Role::Factory, Role::Retailer) // Factory → Retailer ✅
            | (Role::Retailer, Role::Consumer) // Retailer → Consumer ✅
    );
    require!(valid, TrazaError::InvalidTransferPath);

    // Otros caminos → Error: InvalidTransferPath
}
```

### Matriz de Permisos

| De / A | Factory | Retailer | Consumer | Producer |
|--------|---------|----------|----------|----------|
| **Producer** | ✅ | ❌ | ❌ | ❌ |
| **Factory** | ❌ | ✅ | ❌ | ❌ |
| **Retailer** | ❌ | ❌ | ✅ | ❌ |
| **Consumer** | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 Flujo de Validación Completo

### Escenario: Nuevo Usuario quiere ser Producer

```
Paso 1: Usuario A solicita rol (register_role)
┌────────────────────────────────────────┐
│ Transacción                            │
├────────────────────────────────────────┤
│ Cuentas:                               │
│  - pending_role (PDA a crear)          │
│  - role_registry (PDA debe estar vacío)│
│  - wallet A (Signer)                   │
│                                        │
│ Resultado:                             │
│  ✅ PendingRoleRegistration creado    │
│  ⏳ Esperando validación de autoridad  │
└────────────────────────────────────────┘

Paso 2: Autoridad valida el rol (validate_role)
┌────────────────────────────────────────┐
│ Transacción                            │
├────────────────────────────────────────┤
│ Validaciones:                          │
│  1. authority.key() == config.authority│
│  2. authority es Signer               │
│  3. pending_role existe y es válido   │
│                                        │
│ Resultado:                             │
│  ✅ RoleRegistry creado para Usuario A│
│  ✅ PendingRoleRegistration destruido │
│  ✅ Usuario A ahora es Producer       │
└────────────────────────────────────────┘

Paso 3: Producer crea tokens (create_token)
┌────────────────────────────────────────┐
│ Transacción                            │
├────────────────────────────────────────┤
│ Validaciones:                          │
│  1. creator_role == Producer           │
│  2. metadata.len() <= MAX_LEN          │
│  3. amount > 0                         │
│                                        │
│ Resultado:                             │
│  ✅ TraceToken creado                  │
│  ✅ current_owner = Usuario A          │
└────────────────────────────────────────┘
```

### Escenario: Transferencia Producer → Factory

```
Paso 1: Producer inicia transferencia (initiate_transfer)
┌────────────────────────────────────────┐
│ Validaciones:                          │
│  1. from_role = Producer               │
│  2. to_role = Factory                  │
│  3. (Producer, Factory) es camino válido
│  4. Token status != InTransfer         │
│  5. amount <= token.amount             │
│                                        │
│ Resultado:                             │
│  ✅ PendingTransfer creado             │
│  ✅ Token marcado como InTransfer      │
└────────────────────────────────────────┘

Paso 2: Factory acepta transferencia (accept_transfer)
┌────────────────────────────────────────┐
│ Validaciones:                          │
│  1. to.key() == pending_transfer.to   │
│  2. to es Signer                      │
│  3. PendingTransfer existe            │
│                                        │
│ Resultado:                             │
│  ✅ TraceToken.current_owner = Factory │
│  ✅ TraceToken.status = Available      │
│  ✅ PendingTransfer destruido          │
└────────────────────────────────────────┘
```

---

## 🚀 Mejoras Recomendadas

### 1. Crear un módulo `validators`

**Ubicación:** `src/validators/mod.rs`

```rust
pub mod authority;
pub mod role;

pub use authority::*;
pub use role::*;
```

**Archivo:** `src/validators/authority.rs`

```rust
use anchor_lang::prelude::*;
use crate::state::ProgramConfig;

pub fn validate_authority(
    program_config: &ProgramConfig,
    authority: &Pubkey,
) -> Result<()> {
    require!(
        program_config.authority == *authority,
        crate::error::TrazaError::UnauthorizedAuthority
    );
    Ok(())
}

pub fn is_authority(
    program_config: &ProgramConfig,
    authority: &Pubkey,
) -> bool {
    program_config.authority == *authority
}
```

**Archivo:** `src/validators/role.rs`

```rust
use crate::state::Role;
use crate::error::TrazaError;
use anchor_lang::prelude::*;

pub fn validate_role_exists(role: &Role) -> Result<()> {
    // Todas las variantes de Role son válidas
    Ok(())
}

pub fn can_create_token(role: &Role) -> Result<()> {
    require!(
        matches!(role, Role::Producer | Role::Factory),
        TrazaError::InvalidCreatorRole
    );
    Ok(())
}

pub fn can_transfer_to(from: &Role, to: &Role) -> Result<()> {
    let valid = matches!(
        (from, to),
        (Role::Producer, Role::Factory)
            | (Role::Factory, Role::Retailer)
            | (Role::Retailer, Role::Consumer)
    );
    require!(valid, TrazaError::InvalidTransferPath);
    Ok(())
}

pub fn is_producer(role: &Role) -> bool {
    matches!(role, Role::Producer)
}

pub fn is_factory(role: &Role) -> bool {
    matches!(role, Role::Factory)
}

pub fn is_retailer(role: &Role) -> bool {
    matches!(role, Role::Retailer)
}

pub fn is_consumer(role: &Role) -> bool {
    matches!(role, Role::Consumer)
}
```

### 2. Usar las funciones de validación

**Antes:**

```rust
pub fn handler(ctx: Context<InitiateTransfer>, params: InitiateTransferParams) -> Result<()> {
    let from_role = &ctx.accounts.from_role_registry.role;
    let to_role = &ctx.accounts.to_role_registry.role;

    let valid = matches!(
        (from_role, to_role),
        (Role::Producer, Role::Factory)
            | (Role::Factory, Role::Retailer)
            | (Role::Retailer, Role::Consumer)
    );
    require!(valid, TrazaError::InvalidTransferPath);
    // ...
}
```

**Después:**

```rust
use crate::validators::role::can_transfer_to;

pub fn handler(ctx: Context<InitiateTransfer>, params: InitiateTransferParams) -> Result<()> {
    let from_role = &ctx.accounts.from_role_registry.role;
    let to_role = &ctx.accounts.to_role_registry.role;

    can_transfer_to(from_role, to_role)?;
    // ...
}
```

### 3. Agregar evento de auditoría

```rust
#[event]
pub struct AuthorityCheckEvent {
    pub authority: Pubkey,
    pub signer: Pubkey,
    pub success: bool,
    #[index]
    pub timestamp: i64,
}

#[event]
pub struct RoleValidationEvent {
    pub wallet: Pubkey,
    pub role: String,
    pub validated_by: Pubkey,
    #[index]
    pub timestamp: i64,
}
```

### 4. Agregar más niveles de seguridad

```rust
// En program_config
#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,
    pub secondary_authority: Option<Pubkey>,  // ← Admin alternativo
    pub role_validators: Vec<Pubkey>,         // ← Múltiples validadores
    pub bump: u8,
    pub initialized: bool,
}

// En role_registry
#[account]
pub struct RoleRegistry {
    pub wallet: Pubkey,
    pub role: Role,
    pub bump: u8,
    pub validated_at: i64,
    pub validated_by: Pubkey,                 // ← Quién validó
    pub expiration: Option<i64>,              // ← Expiración opcional
}
```

---

## 💻 Ejemplos de Código

### Ejemplo 1: Crear la Config (solo una vez)

```rust
// CLI command
solana program deploy programs/traza/target/deploy/traza.so

// Después, desde la app web:
const initializeProgram = async () => {
  const tx = await program.methods
    .initialize()
    .accounts({
      programConfig: programConfigPDA,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();

  console.log("Program initialized:", tx);
};
```

### Ejemplo 2: Solicitar rol

```rust
const requestRole = async (roleType: string) => {
  const tx = await program.methods
    .registerRole({
      requestedRole: { [roleType.toLowerCase()]: {} },
    })
    .accounts({
      pendingRole: pendingRolePDA,
      roleRegistry: roleRegistryPDA,
      wallet: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();

  console.log("Role requested:", tx);
};
```

### Ejemplo 3: Validar rol (solo autoridad)

```rust
const validateRole = async (userWallet: string) => {
  // Verificar que yo soy la autoridad
  const config = await program.account.programConfig.fetch(configPDA);

  if (config.authority.toString() !== wallet.publicKey.toString()) {
    throw new Error("Solo la autoridad puede validar roles");
  }

  const tx = await program.methods
    .validateRole()
    .accounts({
      programConfig: configPDA,
      pendingRole: pendingRolePDA,
      roleRegistry: roleRegistryPDA,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();

  console.log("Role validated:", tx);
};
```

### Ejemplo 4: Crear token (solo Producer/Factory)

```rust
const createToken = async (metadata: string, amount: number) => {
  // Verificar rol
  const roleRegistry = await program.account.roleRegistry.fetch(roleRegistryPDA);

  if (!["producer", "factory"].includes(roleRegistry.role)) {
    throw new Error("Solo Producer o Factory pueden crear tokens");
  }

  const tx = await program.methods
    .createToken({
      metadata,
      amount: new BN(amount),
    })
    .accounts({
      traceToken: tokenPDA,
      creatorRoleRegistry: roleRegistryPDA,
      creator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();

  console.log("Token created:", tx);
};
```

### Ejemplo 5: Iniciar transferencia (con validación de roles)

```rust
const initiateTransfer = async (
  recipientWallet: string,
  amount: number
) => {
  // 1. Verificar que remitente tiene RoleRegistry
  const fromRole = await program.account.roleRegistry.fetch(
    fromRoleRegistryPDA
  );
  if (!fromRole) {
    throw new Error("Remitente no tiene rol validado");
  }

  // 2. Verificar que destinatario tiene RoleRegistry
  const toRole = await program.account.roleRegistry.fetch(
    toRoleRegistryPDA
  );
  if (!toRole) {
    throw new Error("Destinatario no tiene rol validado");
  }

  // 3. Verificar que el camino es válido
  const validPaths = {
    producer: ["factory"],
    factory: ["retailer"],
    retailer: ["consumer"],
  };

  if (!validPaths[fromRole.role]?.includes(toRole.role)) {
    throw new Error(
      `Transferencia no permitida: ${fromRole.role} → ${toRole.role}`
    );
  }

  // 4. Iniciar transferencia
  const tx = await program.methods
    .initiateTransfer({
      amount: new BN(amount),
    })
    .accounts({
      traceToken: tokenPDA,
      pendingTransfer: pendingTransferPDA,
      fromRoleRegistry: fromRoleRegistryPDA,
      to: new PublicKey(recipientWallet),
      toRoleRegistry: toRoleRegistryPDA,
      from: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([wallet])
    .rpc();

  console.log("Transfer initiated:", tx);
};
```

---

## 📊 Resumen de Validaciones

| Instrucción | Validación | Ubicación | Error |
|-------------|-----------|-----------|-------|
| `initialize` | N/A | Program init | - |
| `register_role` | Role registry vacío | register_role.rs:37 | `RoleAlreadyValidated` |
| `validate_role` | `authority == config.authority` | validate_role.rs:9 | `UnauthorizedAuthority` |
| `create_token` | Role es Producer/Factory | create_token.rs:45 | `InvalidCreatorRole` |
| `initiate_transfer` | Camino (from, to) válido | initiate_transfer.rs:68 | `InvalidTransferPath` |
| `accept_transfer` | to == pending.to | accept_transfer.rs | - |

---

## 🔗 Archivos Relacionados

```
traza/programs/traza/src/
├── state/
│   ├── program_config.rs      ← Define authority
│   ├── role_registry.rs        ← Define Role enum
│   └── ...
├── instructions/
│   ├── initialize.rs
│   ├── register_role.rs        ← Solicitar rol
│   ├── validate_role.rs        ← Validar rol (autoridad)
│   ├── create_token.rs         ← Check role == Producer|Factory
│   ├── initiate_transfer.rs    ← Check transfer path
│   └── accept_transfer.rs
├── error.rs                    ← Error codes
└── lib.rs                      ← Entry point
```

---

**Última actualización:** 2026-02-26
**Versión:** 1.0
