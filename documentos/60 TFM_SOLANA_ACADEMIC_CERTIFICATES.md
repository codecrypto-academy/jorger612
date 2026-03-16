# TFM 4: Certificación Académica Digital - Adaptado a Solana

## Sistema de Emisión y Verificación de Certificados Académicos

**Máster en Blockchain · Trabajo Final de Máster**
**Implementado en Solana usando Rust y Anchor**

---

## 1. Descripción del Proyecto TFM para Solana

**Título:** "Sistema de Emisión y Verificación de Certificados Académicos en Blockchain Solana"

Diseñar una plataforma que permita emitir, firmar digitalmente y verificar certificados académicos, boletines, reconocimientos, badges o diplomas. El objetivo es crear un sistema descentralizado donde los certificados sean inmutables, verificables por cualquiera y propiedad del estudiante.

### Objetivo Formativo

Comprender y aplicar:

- **JSON-LD como formato de credencial:** Estructura estándar para certificados digitales
- **Hashing y firmas digitales:** Generación de hash del certificado + firma criptográfica
- **Publicación en Solana:** Anclaje del hash en la blockchain
- **Procesos de revocación:** Mecanismo para invalidar certificados comprometidos
- **Re-emisión:** Capacidad de generar nuevas versiones de certificados

### Ventaja Solana

| Aspecto | Solana | EVM |
|---|---|---|
| **Costo por certificado** | $0.00025 | $5-50 |
| **Emisión masiva** | Económica | Costosa |
| **Verificación** | Rápida (400ms) | Lenta (12+ seg) |
| **Revocación** | Instantánea | Lenta |

**Caso:** Universidad emite 1,000 diplomas
- **Solana:** $0.25 total
- **Ethereum:** $5,000-50,000 total

---

## 2. Contexto del Sector Educativo

Las instituciones educativas emiten millones de certificados al año: diplomas, títulos, certificaciones profesionales, badges de competencias, transcripciones académicas, etc.

### Por qué es Necesaria la Trazabilidad

- **Verificación de títulos:** Empleadores necesitan validar credenciales
- **Portabilidad:** Estudiantes deben poder compartir sus credenciales fácilmente
- **Prevención de fraude:** Títulos falsificados son un problema global
- **Independencia del emisor:** Los estudiantes no deben depender siempre de la universidad
- **Interoperabilidad:** Certificados que funcionan en múltiples plataformas

### Tipos de Certificados

| **Tipo** | **Ejemplos** |
| --- | --- |
| **Diplomas** | Licenciaturas, Maestrías, Doctorados |
| **Certificados** | Cursos, Talleres, Bootcamps |
| **Badges** | Competencias específicas (programación, diseño, etc.) |
| **Transcripciones** | Historial académico completo |
| **Reconocimientos** | Premios, distinciones, menciones honoríficas |
| **Certificaciones profesionales** | PMP, CPA, certificaciones técnicas |

---

## 3. Problemas a Resolver

### Títulos Falsificados
Miles de diplomas falsos se venden en mercados negros. Estudios estiman que el 10-30% de CVs contienen información educativa falsa.

### Verificaciones Manuales Lentas
Las universidades tardan días o semanas en verificar un título. Los RRHH deben contactar manualmente a cada institución.

### Dependencia del Emisor
Si una universidad cierra o cambia su sistema, los estudiantes pierden acceso a sus credenciales.

### Falta de Identidad Digital Estandarizada
Cada país, universidad o plataforma usa su propio formato. No existe interoperabilidad global.

### Certificados Físicos Extraviados
Diplomas en papel que se pierden, se dañan o deben apostillarse para uso internacional.

### Falta de Propiedad del Estudiante
Los certificados "pertenecen" a la universidad, no al estudiante.

---

## 4. Componentes MVP para Solana

### Estructuras de Datos

```rust
#[account]
pub struct Credential {
    pub id: u64,
    pub issuer: Pubkey,                 // Universidad
    pub recipient: Pubkey,               // Estudiante
    pub credential_type: String,         // "Diploma", "Badge", "Certificate"
    pub program_name: String,            // "Máster en Blockchain"
    pub issue_date: i64,
    pub expiry_date: i64,               // 0 si no expira
    pub document_hash: String,          // SHA256 del JSON
    pub status: CredentialStatus,       // Valid, Revoked, Expired
    pub public_key_issuer: String,      // Para verificar firma
    pub bump: u8,
}

#[account]
pub struct Institution {
    pub address: Pubkey,
    pub name: String,                   // "Universidad Tecnológica"
    pub location: String,
    pub public_key: String,             // Para firmar certificados
    pub is_verified: bool,              // Verificado por autoridad
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct RevocationList {
    pub id: u64,
    pub institution: Pubkey,
    pub revoked_credential_ids: Vec<u64>,
    pub last_updated: i64,
    pub bump: u8,
}
```

### Instrucciones Principales

```rust
pub fn register_institution(...) -> Result<()> { }
pub fn issue_credential(...) -> Result<()> { }
pub fn verify_credential(...) -> Result<bool> { }
pub fn revoke_credential(...) -> Result<()> { }
pub fn reissue_credential(...) -> Result<()> { }
pub fn update_revocation_list(...) -> Result<()> { }
```

### Evento de Emisión

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

---

## 5. Formato JSON del Diploma

```json
{
  "@context": "https://w3id.org/openbadges/v2",
  "type": "Assertion",
  "id": "solana:credential-12345",
  "recipient": {
    "type": "email",
    "identity": "estudiante@example.com"
  },
  "badge": {
    "name": "Máster en Blockchain",
    "description": "Completó exitosamente el programa de Máster",
    "issuer": {
      "name": "Universidad Tecnológica",
      "id": "4kZ7cBaDJrXj5rKLjvPBiR7K8XpPZy8Y3vJ5mK2p"
    }
  },
  "issuedOn": "2025-06-15T10:30:00Z",
  "verification": {
    "type": "SolanaSignature",
    "publicKey": "4kZ7cBaDJrXj5rKLjvPBiR7K8XpPZy8Y3vJ5mK2p"
  }
}
```

---

## 6. Proyecto de Referencia: Blockcerts

Sistema abierto para emitir, guardar y verificar credenciales académicas y profesionales.

**Problema:**
- Títulos falsificados
- Verificaciones lentas
- Dependencia de universidades

**Solución:**
- Hashes on-chain
- Verificación instantánea
- Propiedad del estudiante

---

## 7. Casos de Uso para tu TFM

### Opción 1: Diplomas Universitarios
```
Emisión: Universidad emite diploma
Verificación: Empleador verifica on-chain
Revocación: Por fraude académico
```

### Opción 2: Badges de Competencias
```
Cursos online → Completa todos → Badge NFT
Transferible, coleccionable, verificable
```

### Opción 3: Certificaciones Profesionales
```
Examen → Pasa → Certificado on-chain
Renovación automática
```

### Opción 4: Transcripciones Académicas
```
Historial completo de calificaciones
Privacidad: estudiante controla acceso
Verificable por terceros
```

### Opción 5: Reconocimientos Institucionales
```
Premios, distinciones, menciones
Permanente en blockchain
Transferible como honor
```

---

## 8. Ventajas de Solana para Certificados Académicos

✅ **Emisión masiva económica:** Emite millones de certificados sin quebrar economía
✅ **Verificación instantánea:** Verificadores obtienen resultado en 400ms
✅ **Revocación inmediata:** Certificados falsificados pueden revocarse al instante
✅ **Propiedad del estudiante:** El certificado pertenece a quien lo posee
✅ **Interoperabilidad:** Estándar abierto, cualquiera puede verificar

---

## 9. Estructura del Proyecto

```
academic-credentials-solana/
├── programs/
│   └── academic_credentials/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   ├── state.rs
│       │   └── events.rs
│       └── Anchor.toml
├── tests/
├── app/ (Verificador web)
│   ├── components/CredentialVerifier.tsx
│   └── pages/verify
└── README.md
```

---

## Implementación (Consulta ACADEMIC_CERTIFICATES_ANCHOR_GUIDE.md)

Para detalles técnicos completos, código Rust/Anchor, y frontend del verificador.

---

**¡Éxito en tu TFM de Certificados Académicos con Solana!** 🚀
