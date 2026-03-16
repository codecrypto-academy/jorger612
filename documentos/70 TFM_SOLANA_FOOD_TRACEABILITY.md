# TFM 1: Trazabilidad Alimentaria con Blockchain - Adaptado a Solana

## Sistema de Trazabilidad para Cadenas Alimentarias desde Origen hasta Exportación

**Máster en Blockchain · Trabajo Final de Máster**
**Implementado en Solana usando Rust y Anchor**

---

## Índice de Contenidos

1. Descripción del Proyecto TFM para Solana
2. Contexto del Sector Alimentario
3. Problemas Reales a Resolver
4. Aspectos Clave del TFM
5. Componentes Recomendados del MVP (Solana)
6. Proyecto de Referencia: GrainChain
7. Datos del Proyecto GrainChain
8. Ventajas de Usar Solana vs EVM
9. Cómo Inspirarse sin Copiar

---

## 1. Descripción del Proyecto TFM para Solana

**Título provisional:** "Sistema Solana para la Trazabilidad Alimentaria desde Origen hasta Exportación"

El estudiante deberá diseñar y construir un sistema completo de trazabilidad alimentaria usando **Solana blockchain**. El objetivo es crear un MVP (Producto Mínimo Viable) que permita registrar y verificar cada etapa de la cadena alimentaria, desde la producción hasta la exportación o venta final.

### Por qué Solana para Trazabilidad Alimentaria

| Característica | Solana | EVM (Ethereum) | Hyperledger |
|---|---|---|---|
| **Velocidad (TPS)** | 65,000+ | 15-30 | 3,500+ |
| **Costo por transacción** | $0.00025 | $5-50 | Gratuito (privado) |
| **Finalidad** | Instant (~400ms) | 12+ segundos | Instant |
| **Escalabilidad** | Excelente | Limitada | Privada |
| **Smart Contracts** | Rust (Anchor) | Solidity | Go/Java |
| **Ideal para** | ✅ Registro masivo de eventos | ❌ Costoso para alto volumen | ✅ Empresas privadas |

**Conclusión:** Solana es ideal para aplicaciones de trazabilidad que generan muchos eventos (cosecha, pesaje, temperatura, movimiento, etc.)

### Objetivo Formativo

Desarrollar un MVP funcional en Solana que permita registrar y verificar las siguientes etapas:

- **Producción:** registro del origen, finca, lote, fecha de cosecha
- **Procesamiento:** transformación del producto (secado, tostado, empaquetado)
- **Transporte:** movimientos logísticos entre ubicaciones
- **Almacenamiento:** registro en silos, bodegas o centros de distribución
- **Exportación/Venta:** entrega al comprador final o exportador

### Resultado Esperado

Un sistema que permita visualizar en un dashboard la historia completa del lote alimentario, garantizando:

- **Integridad:** Los datos no pueden ser alterados una vez registrados (on-chain)
- **Transparencia:** Cualquier actor autorizado puede consultar el historial
- **Verificabilidad:** Certificados y documentos pueden ser validados on-chain
- **Bajo costo:** Transacciones muy económicas (~$0.0025 por evento)

---

## 2. Contexto del Sector Alimentario

La trazabilidad alimentaria es uno de los campos donde más impacto ha tenido blockchain en los últimos años. La certificación de origen, el control de lotes y la prevención de adulteraciones son fundamentales para:

- Garantizar la seguridad alimentaria
- Cumplir con regulaciones sanitarias internacionales
- Facilitar exportaciones con documentación verificable
- Generar confianza en consumidores y compradores
- Permitir el retiro rápido de productos en caso de alertas sanitarias

### Productos Aplicables

Este tipo de sistema se puede aplicar a múltiples productos:

| **Agrícolas** | **Pecuarios** | **Marinos** |
| --- | --- | --- |
| Café | Carne | Pesca |
| Cacao | Pollo | Mariscos |
| Granos | Lácteos | Acuicultura |
| Frutas | Huevos |  |
| Verduras | Miel |  |
| Vino |  |  |
| Aceite de oliva |  |  |

---

## 3. Problemas Reales a Resolver

Los sistemas tradicionales de trazabilidad alimentaria presentan múltiples deficiencias que blockchain puede resolver:

### Fraude Alimentario
Productos mezclados, adulterados o con origen falso. Según estimaciones, el fraude alimentario representa pérdidas de hasta 40 mil millones de dólares anuales a nivel global.

### Falta de Transparencia
Imposibilidad de verificar el origen real de los productos, especialmente en exportaciones donde intervienen múltiples intermediarios.

### Documentación Manual y Dispersa
Certificados en papel que se pierden, se falsifican o no están disponibles cuando se necesitan. Cada actor mantiene sus propios registros sin sincronización.

### Pérdida o Falsificación de Certificados
Certificados sanitarios, de calidad o de comercio justo que pueden ser alterados o duplicados sin forma de verificación efectiva.

### Retiros de Mercado Ineficientes
En caso de alerta sanitaria, es imposible seguir un lote específico y retirarlo rápidamente del mercado. Esto resulta en retiros masivos innecesarios y pérdidas económicas.

### Pagos Lentos o Injustos
Los productores suelen recibir pagos tardíos o por debajo del valor real de su producción, sin transparencia en el proceso de liquidación.

**Solana permite resolver estos problemas a fracción del costo de otras redes.**

---

## 4. Aspectos Clave a Tener en Cuenta en el TFM

Un trabajo final de máster robusto en trazabilidad alimentaria con Solana debe cubrir los siguientes aspectos técnicos y funcionales:

### 1. Identificación Única del Lote

Cada lote debe tener un identificador único e inmutable. En Solana, esto se logra mediante:

- **Keypair como identificador:** Generar un nuevo Keypair para cada lote
- **PDA (Program Derived Address):** Derivar PDAs a partir de datos del lote
- **NFT (Solana SPL Token):** Usar NFTs para representar lotes (más caro pero visual)

**Recomendado para MVP:** Usar Keypairs derivados (`["batch", productor, lote_number]`)

### 2. Eventos de la Cadena Alimentaria

Definir claramente los eventos críticos que deben registrarse on-chain:

```
Cosecha → Almacenamiento → Procesamiento → Transporte → Empaquetado → Exportación
```

Cada evento debe incluir:
- **timestamp:** Cuándo ocurrió
- **ubicación:** Dónde (latitud/longitud o descripción)
- **actor responsable:** Quién registró el evento
- **estado del lote:** Situación actual
- **metadata:** Detalles adicionales (temperatura, humedad, fotos, etc.)

### 3. Certificaciones

Incorporar certificados verificables:

- **Sanidad:** Control de calidad, análisis de laboratorio
- **Calidad:** Grado del producto, clasificación
- **Origen:** Certificación geográfica
- **Comercio justo / Sostenibilidad**

En Solana, estos se almacenan como datos on-chain con hash del documento en IPFS.

### 4. Roles y Permisos

Definir claramente los actores y sus permisos:

| Rol | Puede crear lotes | Puede registrar eventos | Puede emitir certificados | Acceso |
|---|---|---|---|---|
| **Productor** | ✅ | ✅ | ❌ | Propios lotes |
| **Procesador** | ❌ | ✅ | ❌ | Lotes asignados |
| **Transportista** | ❌ | ✅ | ❌ | Lotes en tránsito |
| **Autoridad** | ❌ | ❌ | ✅ | Todos |
| **Auditor** | ❌ | ❌ | ❌ | Solo lectura |

### 5. Auditoría Inmutable

Todo cambio debe quedar registrado de forma permanente. Los eventos de Solana son inmutables y permanecen en el blockchain.

```rust
// Cada acción emite un evento que no puede ser modificado
emit!(BatchCreated {
    batch_id: batch.id,
    creator: ctx.accounts.creator.key(),
    product: batch.product.clone(),
    origin: batch.origin.clone(),
});
```

### 6. Dashboard Visual

La interfaz de usuario es fundamental. Debe mostrar:

- **Timeline del ciclo de vida del lote**
- **Mapa de ubicaciones** (con geolocalización)
- **Certificados adjuntos** (links a IPFS)
- **Estado actual del lote**
- **Actores involucrados**

---

## 5. Componentes Recomendados del MVP para Solana

### 5.1. Estructura de Datos (Rust/Anchor)

En lugar de Solidity, usamos Rust con Anchor framework:

```rust
// Definición de enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum BatchStatus {
    Created,
    InProcessing,
    InTransit,
    QualityCheck,
    Exported,
    Delivered,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum ActorRole {
    Producer,
    Processor,
    Transporter,
    Exporter,
    Authority,
    Auditor,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CertificateStatus {
    Valid,
    Expired,
    Revoked,
}

// Struct principal: Lote
#[account]
pub struct Batch {
    pub id: u64,                        // ID único del lote
    pub creator: Pubkey,                // Productor que creó el lote
    pub product: String,                // "Café Arábica", "Cacao", etc. (max 64 chars)
    pub origin: String,                 // Finca/ubicación de origen (max 128 chars)
    pub quantity: u64,                  // Cantidad en kg o unidades
    pub date_created: i64,              // Timestamp Unix
    pub status: BatchStatus,            // Estado actual
    pub event_count: u32,               // Número de eventos registrados
    pub certificate_count: u32,         // Número de certificados
    pub bump: u8,                       // Bump para PDA derivation
}

// Evento del lote
#[account]
pub struct BatchEvent {
    pub id: u64,                        // ID único del evento
    pub batch_id: u64,                  // A qué lote pertenece
    pub event_type: String,             // "Cosecha", "Secado", "Transporte", etc.
    pub actor: Pubkey,                  // Quién registró el evento
    pub location: String,               // Ubicación (max 256 chars)
    pub timestamp: i64,                 // Timestamp Unix
    pub metadata: String,               // JSON con detalles (max 1024 chars)
    pub bump: u8,
}

// Certificado
#[account]
pub struct Certificate {
    pub id: u64,                        // ID único del certificado
    pub batch_id: u64,                  // Lote al que pertenece
    pub certificate_type: String,       // "Sanitario", "Calidad", "Origen"
    pub issuer: String,                 // Entidad que emite (max 128 chars)
    pub document_hash: String,          // Hash IPFS o SHA256 del PDF
    pub issued_date: i64,               // Timestamp Unix
    pub expiry_date: i64,               // Timestamp Unix (0 si no expira)
    pub status: CertificateStatus,      // Estado actual
    pub bump: u8,
}

// Registro de Actor
#[account]
pub struct Actor {
    pub address: Pubkey,                // Dirección Solana
    pub name: String,                   // Nombre de la entidad (max 128 chars)
    pub role: ActorRole,                // Rol en la cadena
    pub location: String,               // Ubicación (ciudad, país, etc.)
    pub is_active: bool,                // Si está activo
    pub created_at: i64,                // Timestamp Unix
    pub bump: u8,
}

// Configuración global del programa
#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,              // Admin del sistema
    pub next_batch_id: u64,             // Contador para IDs de lotes
    pub next_event_id: u64,             // Contador para IDs de eventos
    pub next_certificate_id: u64,       // Contador para IDs de certificados
    pub bump: u8,
}
```

### 5.2. Estructura de PDAs (Program Derived Addresses)

En Solana, usamos PDAs en lugar de mappings:

```rust
// Batch PDA
const ["batch", producer, batch_id] → Batch account

// Event PDA
const ["event", batch_id, event_number] → BatchEvent account

// Certificate PDA
const ["certificate", batch_id, cert_number] → Certificate account

// Actor PDA
const ["actor", actor_address] → Actor account

// Program Config PDA
const ["config"] → ProgramConfig account
```

### 5.3. Instrucciones (Instructions) Principales

```rust
// Inicializar el sistema
pub fn initialize(ctx: Context<Initialize>) -> Result<()> { }

// Registrar un nuevo actor
pub fn register_actor(
    ctx: Context<RegisterActor>,
    name: String,
    role: ActorRole,
    location: String,
) -> Result<()> { }

// Crear un lote (solo Producer)
pub fn create_batch(
    ctx: Context<CreateBatch>,
    product: String,
    origin: String,
    quantity: u64,
) -> Result<()> { }

// Registrar un evento en un lote
pub fn record_event(
    ctx: Context<RecordEvent>,
    batch_id: u64,
    event_type: String,
    location: String,
    metadata: String,
) -> Result<()> { }

// Actualizar estado del lote
pub fn update_batch_status(
    ctx: Context<UpdateBatchStatus>,
    batch_id: u64,
    new_status: BatchStatus,
) -> Result<()> { }

// Emitir certificado (solo Authority)
pub fn issue_certificate(
    ctx: Context<IssueCertificate>,
    batch_id: u64,
    cert_type: String,
    issuer: String,
    document_hash: String,
    expiry_date: i64,
) -> Result<()> { }

// Revocar certificado
pub fn revoke_certificate(
    ctx: Context<RevokeCertificate>,
    certificate_id: u64,
) -> Result<()> { }

// Obtener historial completo de un lote
pub fn get_batch_timeline(
    ctx: Context<GetBatchTimeline>,
    batch_id: u64,
) -> Result<Vec<BatchEvent>> { }
```

### 5.4. Eventos Emitidos (Events)

```rust
#[event]
pub struct BatchCreated {
    pub batch_id: u64,
    pub creator: Pubkey,
    pub product: String,
    pub origin: String,
    pub timestamp: i64,
}

#[event]
pub struct BatchEventRecorded {
    pub event_id: u64,
    pub batch_id: u64,
    pub event_type: String,
    pub actor: Pubkey,
    pub location: String,
    pub timestamp: i64,
}

#[event]
pub struct BatchStatusChanged {
    pub batch_id: u64,
    pub new_status: BatchStatus,
    pub timestamp: i64,
}

#[event]
pub struct CertificateIssued {
    pub certificate_id: u64,
    pub batch_id: u64,
    pub certificate_type: String,
    pub issuer: String,
    pub timestamp: i64,
}

#[event]
pub struct CertificateRevoked {
    pub certificate_id: u64,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct ActorRegistered {
    pub actor_address: Pubkey,
    pub name: String,
    pub role: ActorRole,
    pub timestamp: i64,
}
```

### 5.5. Modelo de Datos JSON (para almacenamiento off-chain)

```json
{
  "batchId": "BATCH-001",
  "product": "Café Arábica",
  "origin": "Finca El Roble, Colombia",
  "quantity": 1000,
  "unit": "kg",
  "creator": "4kZ7cBaDJrXj5rKLjvPBiR7K8XpPZy8Y3vJ5mK2p",
  "timeline": [
    {
      "eventId": "EVT-001",
      "eventType": "Cosecha",
      "timestamp": 1710002212,
      "location": "Finca El Roble, 4.5°N 75.2°W",
      "actor": "4kZ7cBaDJrXj5rKLjvPBiR7K8XpPZy8Y3vJ5mK2p",
      "metadata": {
        "temperature": "22°C",
        "humidity": "65%",
        "weight": "1000 kg",
        "notes": "Cosecha manual, granos de calidad premium"
      }
    },
    {
      "eventId": "EVT-002",
      "eventType": "Secado",
      "timestamp": 1710102212,
      "location": "Procesadora ABC, Colombia",
      "actor": "7mX9nZ2dF5gH3jK1pL8qR6sT4uV0wX2yZ",
      "metadata": {
        "duration_hours": 48,
        "temperature": "60°C",
        "humidity": "12%",
        "quality_grade": "A"
      }
    }
  ],
  "certificates": [
    {
      "certId": "CERT-001",
      "type": "Certificado Sanitario",
      "issuer": "Ministerio de Agricultura",
      "documentHash": "Qm7f3R8n2K9mL5pQ1sT6uV9wX3yZ7aB4cD1eF5gH",
      "issuedDate": "2024-03-10",
      "expiryDate": "2025-03-10",
      "status": "Valid"
    }
  ],
  "status": "Exported",
  "lastUpdate": 1710202212
}
```

### 5.6. Tests Recomendados (Anchor)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::prelude::*;

    #[test]
    async fn test_initialize() {
        // Inicializar el programa
    }

    #[test]
    async fn test_register_actor_producer() {
        // Registrar un productor
    }

    #[test]
    async fn test_register_actor_processor() {
        // Registrar un procesador
    }

    #[test]
    async fn test_create_batch_by_producer() {
        // Crear un lote como productor
    }

    #[test]
    async fn test_create_batch_fails_for_non_producer() {
        // Verificar que no-productores no pueden crear lotes
    }

    #[test]
    async fn test_record_harvest_event() {
        // Registrar evento de cosecha
    }

    #[test]
    async fn test_record_processing_event() {
        // Registrar evento de procesamiento
    }

    #[test]
    async fn test_record_transport_event() {
        // Registrar evento de transporte
    }

    #[test]
    async fn test_update_batch_status() {
        // Actualizar estado del lote
    }

    #[test]
    async fn test_issue_certificate_by_authority() {
        // Emitir certificado (solo Authority)
    }

    #[test]
    async fn test_issue_certificate_fails_for_non_authority() {
        // Verificar que no-autoridades no pueden emitir certificados
    }

    #[test]
    async fn test_revoke_certificate() {
        // Revocar certificado
    }

    #[test]
    async fn test_verify_valid_certificate() {
        // Verificar certificado válido
    }

    #[test]
    async fn test_verify_revoked_certificate() {
        // Verificar certificado revocado
    }

    #[test]
    async fn test_verify_expired_certificate() {
        // Verificar certificado expirado
    }

    #[test]
    async fn test_complete_supply_chain_flow() {
        // Flujo completo: crear lote → eventos → certificados → exportación
    }

    #[test]
    async fn test_coffee_bean_to_export_flow() {
        // Flujo específico de café desde cosecha hasta exportación
    }

    #[test]
    async fn test_batch_timeline_immutability() {
        // Verificar que el timeline no puede ser modificado
    }

    #[test]
    async fn test_cost_efficiency() {
        // Verificar que Solana mantiene costos bajos por evento
    }
}
```

### 5.7. Estructura del Proyecto

```
food-traceability-solana/
├── programs/
│   └── food_traceability/
│       ├── src/
│       │   ├── lib.rs              # Punto de entrada principal
│       │   ├── instructions/       # Cada instrucción en un archivo
│       │   │   ├── initialize.rs
│       │   │   ├── register_actor.rs
│       │   │   ├── create_batch.rs
│       │   │   ├── record_event.rs
│       │   │   ├── update_status.rs
│       │   │   ├── issue_certificate.rs
│       │   │   ├── revoke_certificate.rs
│       │   │   └── mod.rs
│       │   ├── state.rs            # Estructuras de datos (Account structs)
│       │   ├── error.rs            # Errores personalizados
│       │   └── events.rs           # Definición de eventos
│       ├── Cargo.toml
│       └── Anchor.toml
├── tests/
│   └── food_traceability.ts        # Tests en TypeScript
├── app/                             # Frontend (React/Next.js)
│   ├── pages/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

---

## 6. Proyecto de Referencia: GrainChain

### 6.1. ¿Qué es GrainChain?

GrainChain es una plataforma de trazabilidad agrícola que conecta productores, acopiadores, procesadores y exportadores usando smart contracts y pagos digitales integrados. Permite digitalizar completamente la cadena de suministro de productos agrícolas, especialmente granos, café y cacao.

### 6.2. Enlaces Oficiales

- 🌐 **Sitio web:** [https://www.grainchain.io](https://www.grainchain.io/)
- 🐦 **Twitter/X:** [https://x.com/GrainChainIO](https://x.com/GrainChainIO)

### 6.3. Problema que Resuelve

GrainChain aborda múltiples problemas críticos del sector agrícola:

- **Pagos lentos o injustos al productor:** Los agricultores reciben pagos con retrasos de semanas o meses
- **Falta de datos unificados:** Cada actor mantiene registros separados sin sincronización
- **Disputas por calidad o peso:** Sin registro digital verificable de mediciones
- **Escasa trazabilidad:** Imposibilidad de seguir un lote desde el silo hasta la exportación

### 6.4. Cómo lo Resuelve

La solución de GrainChain incluye:

- **Lotes con ID único:** Cada cosecha recibe un identificador digital inmutable
- **Registros on-chain:** Producción, procesos y calidad se registran en blockchain
- **Smart contracts para pagos:** Pagos automáticos según condiciones predefinidas
- **Dashboard unificado:** Productores y compradores ven el mismo registro de datos
- **IoT integrado:** Básculas y sensores capturan datos de peso y calidad automáticamente

---

## 7. Datos del Proyecto GrainChain

### 7.1. Países Latinoamericanos donde Opera

GrainChain tiene presencia directa en:

- **México:** Digitalización de cadenas de maíz, sorgo y granos
- **Honduras:** Trazabilidad de café y cacao con cooperativas locales
- **Costa Rica:** Pilotos con productores de café
- **Guatemala:** Expansiones exploratorias vinculadas al café

### 7.2. Datos Económicos y de Escala

Información financiera y operativa de GrainChain:

- **Financiación acumulada:** 40-43 millones de dólares en varias rondas
- **Ronda más reciente:** 29 millones de dólares en 2023 para expansión
- **Volumen procesado:** Más de 22.500 millones de libras de commodities
- **Participantes activos:** Más de 18.000 usuarios en la plataforma
- **Productos soportados:** 24 tipos de materias primas agrícolas

---

## 8. Ventajas de Usar Solana vs EVM

### Comparación Técnica

| Aspecto | Solana | Ethereum/Polygon | Hyperledger |
|---|---|---|---|
| **Costo por evento** | $0.00025 | $5-100 | Gratuito (privado) |
| **Velocidad** | 400ms | 12+ segundos | Instant (privado) |
| **TPS (eventos/sec)** | 65,000 | 15-30 | 3,500+ |
| **Almacenamiento** | On-chain | On-chain | Privado |
| **Lenguaje** | Rust (seguro) | Solidity (propenso a bugs) | Go/Java |
| **Ecosistema** | Creciente | Maduro | Empresarial |

### Caso de Uso: Registro Masivo de Eventos

Para un sistema de trazabilidad alimentaria que genera **10,000 eventos diarios**:

**En Solana:**
```
10,000 eventos × $0.00025 = $2.50 por día
= $912.50 por año
```

**En Ethereum:**
```
10,000 eventos × $10 = $100,000 por día
= $36,500,000 por año
```

**Conclusión:** Solana es **40,000x más económico** para aplicaciones de alto volumen.

### Por qué Elegir Solana para Trazabilidad Alimentaria

✅ **Escalabilidad:** Miliones de eventos diarios sin congestión
✅ **Bajo costo:** Cada evento cuesta fracciones de centavo
✅ **Instant finality:** Cambios se registran inmediatamente
✅ **Lenguaje seguro:** Rust en lugar de Solidity
✅ **Ecosistema creciente:** Herramientas y librerías actualizadas
✅ **Datos públicos:** Auditoría y transparencia garantizada

---

## 9. Cómo Inspirarse sin Copiar

**IMPORTANTE:** El objetivo de este TFM NO es copiar GrainChain, sino usar su modelo como inspiración para crear tu propia versión en Solana, adaptada a un producto alimentario específico.

### 9.1. Lo que DEBES Hacer

- **Elegir tu propio producto:** No tiene que ser café o grano. Puede ser cacao, frutas, aceite de oliva, vino, pesca, carne, etc.
- **Adaptar el flujo:** Los eventos de un lote de café son diferentes a los de un lote de pesca o aceite de oliva
- **Definir tu propio modelo de datos:** Qué información específica necesitas registrar para TU producto
- **Identificar tus actores:** Quiénes son los participantes en TU cadena de suministro
- **Diseñar tu propia UI/UX:** El dashboard debe reflejar las necesidades de tu caso de uso
- **Innovar con Solana:** Aprovechar la velocidad y bajo costo de Solana para características que EVM no permite

### 9.2. Lo que NO DEBES Hacer

- ❌ Copiar el código de GrainChain (no es open source)
- ❌ Usar exactamente los mismos nombres de funciones y variables
- ❌ Replicar su modelo de negocio sin adaptación
- ❌ Presentar tu TFM como "GrainChain pero en Solana"

### 9.3. Ejemplos de Adaptación Original

**Caso original (GrainChain):**
```
Trazabilidad de café: Finca → Silo → Procesadora → Exportador → Puerto
```

**Tu adaptación ejemplo 1 (Aceite de oliva - original):**
```
Trazabilidad de aceite de oliva:
Olivar → Almazara → Envasado → Distribuidor → Retail → Consumidor
Eventos: Cosecha, Almacenamiento, Prensado, Filtrado, Envasado, Transporte, Venta
```

**Tu adaptación ejemplo 2 (Pesca - original):**
```
Trazabilidad de pesca:
Barco → Puerto de descarga → Subasta → Procesadora → Distribuidor → Supermercado
Eventos: Captura, Descarga, Congelado, Procesamiento, Empaque, Transporte
```

**Tu adaptación ejemplo 3 (Chocolate - original):**
```
Trazabilidad de chocolate:
Plantación de Cacao → Fermentación → Secado → Exportación → Fabrica → Envasado
Eventos: Cosecha, Fermentación, Secado, Almacenamiento, Transporte, Procesamiento, Envasado
```

### 9.4. Características Únicas para Solana

Aprovecha las ventajas de Solana para innovar:

1. **Sensores en tiempo real:** Con Solana's bajo costo, puedes registrar datos de sensores cada minuto
2. **Pagos automáticos:** Usa SPL Tokens para pagos instantáneos al productor cuando se registra calidad
3. **NFTs por lote:** Crea un NFT único para cada lote que pueda transferirse entre actores
4. **Auditoría en vivo:** Dashboard con actualización en tiempo real de cambios
5. **DAO de verificadores:** Sistema descentralizado de certificadores con votación

---

## Próximos Pasos para tu TFM

1. **Elige tu producto alimentario**
2. **Define los eventos específicos** de tu cadena
3. **Identifica los actores** en tu caso de uso
4. **Diseña tu modelo de datos** en Rust/Anchor
5. **Implementa el smart contract**
6. **Crea tests exhaustivos**
7. **Desarrolla el frontend** (Dashboard)
8. **Despliega en Devnet**
9. **Escribe la memoria del TFM**

---

**¡Éxito en tu trabajo final de máster con Solana!** 🚀
