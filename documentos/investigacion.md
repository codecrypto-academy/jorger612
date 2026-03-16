# Investigación del Proyecto: Traza + Web

**Fecha:** 3 de marzo de 2026  
**Objetivo:** Análisis del proyecto actual (traza + web) y comparativa con el documento TFM de Certificación Académica Digital.

---

## 1. Resumen Ejecutivo

El proyecto actual es un **sistema de trazabilidad de cadena de suministro** construido sobre Solana. Consta de dos componentes principales:

- **traza**: Programa Anchor (Rust) que gestiona roles, tokens de trazabilidad y transferencias entre actores de la cadena de suministro.
- **web**: Aplicación Next.js que permite a los usuarios interactuar con el programa (registrar roles, crear tokens, transferir).

El documento **60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md** describe un **sistema de emisión y verificación de certificados académicos** en Solana, con credenciales digitales, revocación y verificación on-chain.

---

## 2. Estructura del Proyecto Actual

### 2.1 Árbol de Directorios

```
pfm-rust-solana-2026/
├── traza/                          # Programa Solana (Anchor)
│   ├── programs/traza/
│   │   └── src/
│   │       ├── lib.rs              # Punto de entrada, instrucciones
│   │       ├── error.rs           # Errores personalizados
│   │       └── state/
│   │           ├── mod.rs
│   │           ├── program_config.rs
│   │           ├── role_registry.rs
│   │           ├── pending_role.rs
│   │           ├── trace_token.rs
│   │           ├── pending_transfer.rs
│   │           └── token_balance.rs
│   ├── tests/traza.ts
│   ├── migrations/deploy.ts
│   ├── Anchor.toml
│   └── Cargo.toml
│
├── web/                            # Aplicación Next.js
│   ├── app/
│   │   ├── page.tsx                # Landing
│   │   ├── register-role/          # Registro de roles
│   │   ├── dashboard/
│   │   │   ├── authority/          # Inicializar, validar roles
│   │   │   ├── producer/           # Crear tokens, transferencias
│   │   │   ├── factory/            # Crear tokens (con source), transferencias
│   │   │   ├── retailer/           # Mis tokens, transferencias
│   │   │   └── consumer/           # Mis tokens, transferencias
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/Header.tsx, Sidebar.tsx
│   │   ├── token/TokenCard.tsx, TokenBalanceCard.tsx
│   │   ├── transfer/TransferForm.tsx
│   │   └── common/
│   ├── lib/
│   │   ├── context/WalletProvider.tsx, ProgramProvider.tsx
│   │   ├── hooks/useRole.ts, useTokens.ts, useTransfers.ts, etc.
│   │   ├── solana/instructions.ts, constants.ts
│   │   └── utils/pda.ts, format.ts, validation.ts
│   └── types/traza.ts              # IDL generado
│
└── Documentación (50 README.md, 60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md, etc.)
```

### 2.2 Tecnologías Utilizadas

| Componente | Tecnología |
|------------|------------|
| Programa Solana | Rust, Anchor 0.32.1 |
| Frontend | Next.js (App Router), React |
| Wallet | @solana/wallet-adapter-react |
| Cliente Solana | @coral-xyz/anchor, @solana/web3.js |
| Fuentes | Geist, Geist Mono |

---

## 3. Análisis del Programa Traza (Rust/Anchor)

### 3.1 Cuentas (State)

| Cuenta | Seeds | Descripción |
|--------|-------|-------------|
| **ProgramConfig** | `["config"]` | Config global: authority, bump, initialized |
| **RoleRegistry** | `["role_registry", wallet]` | Rol validado de cada wallet |
| **PendingRoleRegistration** | `["pending_role", wallet]` | Solicitud de rol pendiente |
| **TraceToken** | `["trace_token", mint]` | Token de trazabilidad (producto/lote) |
| **TokenBalance** | `["token_balance", mint, owner]` | Balance de token por propietario |
| **PendingTransfer** | `["pending_transfer", mint, from, to]` | Transferencia en escrow |

### 3.2 Estructuras de Datos Principales

**TraceToken:**
- `mint`, `creator`, `creator_role`, `total_supply`, `status`, `source_tokens`, `metadata`, `created_at`, `bump`

**RoleRegistry:**
- `wallet`, `role`, `bump`, `validated_at`

**Role (enum):** Producer, Factory, Retailer, Consumer

### 3.3 Instrucciones

| Instrucción | Descripción | Quién |
|-------------|-------------|-------|
| `initialize` | Inicializa el programa | Authority |
| `register_role` | Solicita un rol | Usuario |
| `validate_role` | Aprueba solicitud de rol | Authority |
| `create_token` | Crea token de trazabilidad | Producer/Factory |
| `initiate_transfer` | Inicia transferencia (escrow) | Emisor |
| `accept_transfer` | Acepta transferencia | Receptor |

### 3.4 Flujo de Transferencias

```
Producer → Factory → Retailer → Consumer
```

Solo estas transiciones son válidas. La Factory debe referenciar tokens del Producer al crear nuevos tokens.

---

## 4. Análisis de la Aplicación Web

### 4.1 Páginas y Rutas

| Ruta | Propósito |
|------|-----------|
| `/` | Landing, Supply Chain Journey, CTA |
| `/register-role` | Solicitar rol (Producer, Factory, Retailer, Consumer) |
| `/dashboard` | Redirige según rol |
| `/dashboard/authority/initialize` | Inicializar programa |
| `/dashboard/authority/validate-roles` | Validar solicitudes de rol |
| `/dashboard/producer/*` | Crear tokens, mis tokens, transferencias |
| `/dashboard/factory/*` | Crear tokens (con source), mis tokens, transferencias |
| `/dashboard/retailer/*` | Mis tokens, transferencias |
| `/dashboard/consumer/*` | Mis tokens, transferencias |

### 4.2 Hooks y Contextos

- **WalletProvider**: Conexión a wallet Solana
- **ProgramProvider**: Instancia del programa Anchor
- **useRole**: Rol del usuario, si tiene pendiente, si es authority
- **useTokens**, **useTokenBalances**: Tokens creados y balances
- **useTransfers**, **usePendingRoles**: Transferencias y roles pendientes

### 4.3 Integración con Solana

- **instructions.ts**: Funciones para `registerRole`, `validateRole`, `initializeProgram`, `createToken`, `initiateTransfer`, `acceptTransfer`
- **pda.ts**: Cálculo de PDAs (config, role_registry, pending_role, trace_token, pending_transfer, token_balance)
- **constants.ts**: Program ID, cluster

---

## 5. Comparativa: Proyecto Actual vs TFM Certificación Académica

### 5.1 Dominio de Negocio

| Aspecto | Proyecto Actual (Traza) | TFM Certificación Académica |
|---------|--------------------------|-----------------------------|
| **Dominio** | Cadena de suministro (productos) | Educación (certificados académicos) |
| **Actores** | Producer, Factory, Retailer, Consumer | Universidad (emisor), Estudiante (recipiente), Verificador |
| **Objeto principal** | Token de trazabilidad (producto/lote) | Credencial (diploma, badge, certificado) |
| **Flujo** | Transferencias entre roles | Emisión → Verificación → (Revocación/Re-emisión) |

### 5.2 Estructuras de Datos

| Proyecto Actual | TFM Certificación Académica |
|----------------|----------------------------|
| **TraceToken** (mint, creator, metadata, source_tokens, status) | **Credential** (id, issuer, recipient, credential_type, program_name, document_hash, status, public_key_issuer) |
| **RoleRegistry** (wallet, role) | **Institution** (address, name, location, public_key, is_verified) |
| **TokenBalance** (owner, balance) | No equivalente directo (certificados no son fungibles por cantidad) |
| **PendingTransfer** (escrow) | No equivalente (no hay transferencias entre roles) |
| **RevocationList** | No existe actualmente | **RevocationList** (institution, revoked_credential_ids) |

### 5.3 Instrucciones

| Proyecto Actual | TFM Certificación Académica |
|----------------|----------------------------|
| `initialize` | Similar (config) |
| `register_role` | **register_institution** (registrar universidad) |
| `validate_role` | Verificación de institución |
| `create_token` | **issue_credential** (emitir certificado) |
| `initiate_transfer` + `accept_transfer` | No aplica (certificados no se transfieren entre roles) |
| — | **verify_credential** (verificar certificado) |
| — | **revoke_credential** (revocar) |
| — | **reissue_credential** (re-emitir) |
| — | **update_revocation_list** |

### 5.4 Formato de Credencial

El TFM especifica un formato JSON-LD (Open Badges) para el diploma:

```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "solana:credential-12345",
  "recipient": { "type": "email", "identity": "estudiante@example.com" },
  "badge": { "name": "Máster en Blockchain", "issuer": {...} },
  "issuedOn": "2025-06-15T10:30:00Z",
  "verification": { "type": "SolanaSignature", "publicKey": "..." }
}
```

El hash de este JSON se almacena on-chain en `document_hash`.

### 5.5 Estructura de Proyecto Esperada (TFM)

```
academic-credentials-solana/
├── programs/academic_credentials/
│   └── src/
│       ├── lib.rs
│       ├── instructions/
│       ├── state.rs
│       └── events.rs
├── tests/
├── app/ (Verificador web)
│   ├── components/CredentialVerifier.tsx
│   └── pages/verify
└── README.md
```

---

## 6. Gaps y Cambios Necesarios para la Migración

### 6.1 Programa Solana (traza → academic_credentials)

| Cambio | Descripción |
|--------|-------------|
| **Renombrar programa** | `traza` → `academic_credentials` |
| **Nuevas cuentas** | Credential, Institution, RevocationList |
| **Eliminar cuentas** | TraceToken, TokenBalance, PendingTransfer, RoleRegistry (como tal), PendingRoleRegistration |
| **Nuevas instrucciones** | register_institution, issue_credential, verify_credential, revoke_credential, reissue_credential, update_revocation_list |
| **Eliminar instrucciones** | register_role, validate_role, create_token, initiate_transfer, accept_transfer |
| **Eventos** | CredentialIssued, CredentialRevoked |
| **Estado Credential** | Valid, Revoked, Expired |

### 6.2 Aplicación Web

| Cambio | Descripción |
|--------|-------------|
| **Nuevo dominio** | De "Supply Chain" a "Certificados Académicos" |
| **Nuevas páginas** | `/verify` (verificador público), dashboard para instituciones (emitir), dashboard para estudiantes (mis certificados) |
| **Eliminar** | Flujo Producer→Factory→Retailer→Consumer, TransferForm, lógica de escrow |
| **Nuevos componentes** | CredentialVerifier, formulario de emisión, lista de certificados del estudiante |
| **Integración JSON-LD** | Generar y hashear credenciales en formato Open Badges |

### 6.3 Elementos Reutilizables

- **WalletProvider**, **ProgramProvider**: Reutilizables
- **initialize** (como patrón): Similar para config
- **PDAs**: Patrón de seeds aplicable (credential por id, institution por address, etc.)
- **Next.js + Anchor**: Stack tecnológico compatible
- **Validación de authority**: Concepto similar (solo authority/institution puede emitir/revocar)

---

## 7. Conclusiones

1. **El proyecto actual es un sistema de trazabilidad de cadena de suministro**, no de certificación académica. La migración implica un **cambio de dominio completo**.

2. **La arquitectura base (Anchor + Next.js + wallet)** es reutilizable, pero la **lógica de negocio** debe reescribirse casi por completo.

3. **Estructuras clave a crear**: Credential, Institution, RevocationList. **Estructuras a eliminar**: TraceToken, TokenBalance, PendingTransfer, RoleRegistry (en su forma actual).

4. **El flujo de transferencias** (Producer→Factory→Retailer→Consumer) no tiene equivalente en certificación académica. En su lugar: **emisión → verificación → revocación/re-emisión**.

5. **El formato JSON-LD** y el **hash del documento** son elementos nuevos que el proyecto actual no contempla.

6. **La guía ACADEMIC_CERTIFICATES_ANCHOR_GUIDE.md** (referenciada en el TFM) no existe en el repositorio; sería necesario crearla o seguir la especificación del documento 60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md.

---

## 8. Referencias

- **60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md** – Especificación del proyecto objetivo
- **traza/README.md** – Documentación del programa actual
- **50 README.md** – Documentación general del proyecto
- **10 DOCUMENTATION_INDEX.md** – Índice de documentación
