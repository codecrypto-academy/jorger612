# Prompt de Migración: Traza → Certificación Académica Digital

**Objetivo:** Transformar el proyecto actual (sistema de trazabilidad de cadena de suministro) en el sistema de emisión y verificación de certificados académicos descrito en **60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md**.

---

## Contexto para el Agente/Desarrollador

Tienes un proyecto Solana con:
- **traza**: Programa Anchor en Rust para trazabilidad de productos (roles: Producer, Factory, Retailer, Consumer; tokens, transferencias en escrow).
- **web**: Aplicación Next.js para gestionar roles, crear tokens y transferir entre actores.

Debes convertirlo en un **sistema de certificación académica digital** llamado **`academic_sol`** que permita:
- Registrar instituciones (universidades)
- Emitir certificados (diplomas, badges, transcripciones)
- Verificar certificados on-chain
- Revocar y re-emitir certificados

**Documento de referencia obligatorio:** `60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md`

---

## Fase 1: Programa Solana (Anchor)

### 1.1 Crear nuevo programa `academic_sol`

**Importante:** El programa debe llamarse `academic_sol` (no traza ni academic_credentials).

1. Crear carpeta `programs/academic_sol/` (o renombrar/refactorizar la carpeta `traza` actual).
2. Actualizar `Anchor.toml` con el nombre del programa: `academic_sol`.
3. Actualizar `Cargo.toml` y dependencias.

### 1.2 Definir estructuras de estado (state)

Implementar las siguientes cuentas según la especificación del documento TFM:

**Credential:**
```rust
#[account]
pub struct Credential {
    pub id: u64,
    pub issuer: Pubkey,                 // Universidad (Institution)
    pub recipient: Pubkey,              // Estudiante
    pub credential_type: String,        // "Diploma", "Badge", "Certificate"
    pub program_name: String,           // "Máster en Blockchain"
    pub issue_date: i64,
    pub expiry_date: i64,               // 0 si no expira
    pub document_hash: String,          // SHA256 del JSON-LD
    pub status: CredentialStatus,       // Valid, Revoked, Expired
    pub public_key_issuer: String,      // Para verificar firma
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CredentialStatus {
    Valid,
    Revoked,
    Expired,
}
```

**Institution:**
```rust
#[account]
pub struct Institution {
    pub address: Pubkey,
    pub name: String,
    pub location: String,
    pub public_key: String,
    pub is_verified: bool,
    pub created_at: i64,
    pub bump: u8,
}
```

**RevocationList:**
```rust
#[account]
pub struct RevocationList {
    pub id: u64,
    pub institution: Pubkey,
    pub revoked_credential_ids: Vec<u64>,
    pub last_updated: i64,
    pub bump: u8,
}
```

Definir tamaños máximos para Strings y Vec según límites de Solana. Usar seeds apropiados para PDAs (ej: `["credential", institution, id]`, `["institution", address]`, `["revocation_list", institution]`).

### 1.3 Implementar instrucciones

| Instrucción | Descripción | Cuentas principales |
|-------------|-------------|----------------------|
| `initialize` | Inicializar config del programa (authority) | ProgramConfig, authority |
| `register_institution` | Registrar una universidad/institución | Institution (PDA), authority/signer |
| `issue_credential` | Emitir un certificado | Credential (PDA), Institution, recipient |
| `verify_credential` | Verificar si un certificado es válido (lectura) | Credential, RevocationList |
| `revoke_credential` | Revocar un certificado | Credential, Institution, RevocationList |
| `reissue_credential` | Re-emitir certificado (nueva versión) | Credential (nuevo), Credential (antiguo), Institution |
| `update_revocation_list` | Actualizar lista de revocados | RevocationList, Institution |

### 1.4 Implementar eventos

```rust
#[event]
pub struct CredentialIssued {
    pub credential_id: u64,
    pub issuer: Pubkey,
    pub recipient: Pubkey,
    pub program_name: String,
    pub issue_date: i64,
    pub document_hash: String,
}

#[event]
pub struct CredentialRevoked {
    pub credential_id: u64,
    pub issuer: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}
```

### 1.5 Eliminar del programa actual

- Todas las cuentas: TraceToken, TokenBalance, PendingTransfer, RoleRegistry, PendingRoleRegistration (mantener ProgramConfig si aplica).
- Todas las instrucciones: register_role, validate_role, create_token, initiate_transfer, accept_transfer.
- Enums: Role (Producer, Factory, Retailer, Consumer), TokenStatus.

---

## Fase 2: Formato JSON-LD del Certificado

### 2.1 Estructura del diploma (Open Badges)

El certificado debe generarse como JSON con esta estructura (o compatible):

```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "solana:credential-{id}",
  "recipient": {
    "type": "email",
    "identity": "estudiante@example.com"
  },
  "badge": {
    "name": "Máster en Blockchain",
    "description": "Completó exitosamente el programa de Máster",
    "issuer": {
      "name": "Universidad Tecnológica",
      "id": "{institution_pubkey}"
    }
  },
  "issuedOn": "2025-06-15T10:30:00Z",
  "verification": {
    "type": "SolanaSignature",
    "publicKey": "{institution_public_key}"
  }
}
```

### 2.2 Flujo de emisión

1. Generar el JSON del certificado en el frontend (o backend).
2. Calcular SHA256 del JSON → `document_hash`.
3. Firmar el hash (opcional, según diseño).
4. Llamar a `issue_credential` pasando `document_hash`, `credential_type`, `program_name`, `recipient`, etc.
5. El estudiante puede almacenar el JSON completo off-chain; on-chain solo el hash y metadatos.

---

## Fase 3: Aplicación Web (Next.js)

### 3.1 Cambios de branding y contenido

- Título: "Solana Trazabilidad" → "Certificación Académica Digital" (o similar).
- Descripción: De cadena de suministro a emisión/verificación de certificados.
- Eliminar referencias a Producer, Factory, Retailer, Consumer.

### 3.2 Nueva estructura de páginas

| Ruta | Propósito |
|------|-----------|
| `/` | Landing: presentación del sistema de certificación académica |
| `/verify` | **Página pública**: Verificador de certificados (input: credential_id o hash, mostrar validez) |
| `/dashboard/institution/*` | Panel para instituciones: registrar, emitir certificados, revocar |
| `/dashboard/student/*` | Panel para estudiantes: ver mis certificados |
| `/register-institution` | Solicitar registro como institución (si hay flujo de aprobación) |

### 3.3 Componentes a crear

- **CredentialVerifier**: Componente para verificar un certificado por ID o hash. Consultar on-chain y mostrar: válido/revocado/expirado, datos del certificado.
- **CredentialCard**: Tarjeta que muestra un certificado (program_name, credential_type, issue_date, status).
- **IssueCredentialForm**: Formulario para que una institución emita un certificado (recipient, program_name, credential_type, etc.).
- **RevocationListManager**: Gestión de revocaciones (para instituciones).

### 3.4 Componentes a eliminar o reemplazar

- **TransferForm**: No aplica.
- **TokenCard**, **TokenBalanceCard**: Reemplazar por CredentialCard.
- Flujos de Producer/Factory/Retailer/Consumer: Eliminar.
- **RegisterRole**: Reemplazar por RegisterInstitution (si aplica).

### 3.5 Hooks a crear/modificar

- `useInstitution`: Obtener datos de la institución conectada.
- `useCredentials`: Obtener certificados emitidos o recibidos por el usuario.
- `useCredentialVerification`: Verificar un certificado por ID/hash.
- Eliminar: useTransfers, usePendingRoles (en su forma actual), useTokenBalances (si no aplica).

### 3.6 Instrucciones TypeScript (lib/solana/instructions.ts)

Reemplazar las funciones actuales por:

- `registerInstitution(program, authority, name, location, publicKey)`
- `issueCredential(program, institution, recipient, credentialType, programName, documentHash, ...)`
- `verifyCredential(program, credentialId)` → retorna estado
- `revokeCredential(program, institution, credentialId, reason)`
- `reissueCredential(program, institution, oldCredentialId, newDocumentHash, ...)`

### 3.7 PDAs (lib/utils/pda.ts)

Actualizar para las nuevas cuentas:

- `getCredentialPDA(institution, credentialId)`
- `getInstitutionPDA(address)` o similar
- `getRevocationListPDA(institution)`
- Eliminar: getTraceTokenPDA, getPendingTransferPDA, getTokenBalancePDA, getRoleRegistryPDA, getPendingRolePDA (o adaptar si Institution usa patrón similar).

---

## Fase 4: Tests

### 4.1 Tests del programa (Anchor)

- Test: `initialize` crea ProgramConfig.
- Test: `register_institution` crea Institution.
- Test: `issue_credential` crea Credential con status Valid.
- Test: `verify_credential` retorna true para certificado válido.
- Test: `revoke_credential` cambia status a Revoked.
- Test: `verify_credential` retorna false para certificado revocado.
- Test: `reissue_credential` crea nuevo certificado y opcionalmente invalida el anterior.

### 4.2 Tests E2E (opcional)

- Flujo: Institución emite certificado → Estudiante lo ve → Verificador lo valida.
- Flujo: Institución revoca → Verificador ve revocado.

---

## Fase 5: Documentación y Limpieza

1. Actualizar **README.md** del proyecto con la nueva descripción (certificación académica).
2. Crear **academic_sol/README.md** (o actualizar si se renombró desde traza) con la documentación del programa.
3. Actualizar **10 DOCUMENTATION_INDEX.md** si es necesario.
4. Eliminar archivos obsoletos (referencias a trazabilidad de productos).
5. Copiar el IDL generado a `web/types/`: `cp academic_sol/target/idl/academic_sol.json web/types/` y actualizar imports.

---

## Criterios de Éxito

- [ ] El programa `academic_sol` compila y pasa todos los tests.
- [ ] Se pueden registrar instituciones.
- [ ] Se pueden emitir certificados con document_hash.
- [ ] La página `/verify` permite verificar un certificado por ID.
- [ ] Se pueden revocar certificados y la verificación refleja el estado.
- [ ] El formato JSON-LD del certificado cumple con la especificación del TFM.
- [ ] La aplicación web no contiene referencias a Producer, Factory, Retailer, Consumer ni a transferencias de tokens de trazabilidad.
- [ ] El programa y la carpeta se llaman `academic_sol` (no traza ni academic_credentials).

---

## Notas Adicionales

- **Coste por certificado en Solana:** ~$0.00025 (vs $5-50 en EVM). Ideal para emisión masiva.
- **Verificación:** Debe ser rápida (~400ms) consultando on-chain.
- **Referencia del TFM:** Blockcerts (sistema abierto de credenciales).
- Si existe **ACADEMIC_CERTIFICATES_ANCHOR_GUIDE.md**, seguir sus detalles técnicos. Si no, usar este prompt y el documento 60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md como fuente de verdad.
