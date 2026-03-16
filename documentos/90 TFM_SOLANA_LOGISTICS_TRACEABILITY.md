# TFM 2: Trazabilidad Logística con Blockchain - Adaptado a Solana

## Plataforma de Trazabilidad Logística para Envíos y Cadena de Suministro

**Máster en Blockchain · Trabajo Final de Máster**
**Implementado en Solana usando Rust y Anchor**

---

## Índice de Contenidos

1. Descripción del Proyecto TFM
2. Contexto del Sector Logístico
3. Problemas Reales a Resolver
4. Aspectos Clave del TFM
5. Componentes Recomendados del MVP (Solana)
6. Proyectos de Referencia: Chronicled y SUKU
7. Datos de los Proyectos
8. Ventajas de Usar Solana para Logística
9. Cómo Inspirarse sin Copiar

---

## 1. Descripción del Proyecto TFM para Solana

**Título provisional:** "Plataforma Solana de Trazabilidad Logística para Envíos y Cadena de Suministro"

El estudiante deberá construir un sistema de trazabilidad logística para monitorizar envíos, paquetes o contenedores a lo largo de toda la cadena de distribución. El objetivo es crear un MVP que permita rastrear cada movimiento del producto desde su origen hasta el destino final, garantizando transparencia y verificabilidad en la blockchain de Solana.

### Por qué Solana para Logística

| Característica | Solana | EVM (Ethereum) | Hyperledger |
|---|---|---|---|
| **Costo por evento de tracking** | $0.00025 | $5-50 | Gratuito (privado) |
| **Eventos por segundo (TPS)** | 65,000 | 15-30 | 3,500+ |
| **Latencia** | 400ms | 12+ segundos | <1 segundo (privado) |
| **Escalabilidad** | Excelente para IoT | Limitada | Privada |
| **Ideal para** | ✅ Miles de eventos/día | ❌ Costoso | ✅ Empresas privadas |

**Ventaja decisiva:** Un envío que registra 10 hitos con sensores IoT:
- **Solana:** $0.0025 por entrega
- **Ethereum:** $50-500 por entrega
- **Solana es 20,000x más económico**

### Objetivo Formativo

Implementar un flujo digital verificable que cubra:

- **Origen:** registro del punto de partida del envío
- **Transportista:** asignación y verificación del responsable
- **Hubs logísticos:** registro de paso por centros intermedios
- **Entrega final:** confirmación de recepción por el destinatario
- **Sensores IoT (opcional):** temperatura, humedad, golpes, apertura de contenedores

### Resultado Esperado

Un panel estilo "tracking DHL/UPS" que muestre movimientos, estados y verificaciones on-chain, junto con smart contracts en Solana para gestionar eventos logísticos de forma automática y verificable a fracción del costo de otras redes.

---

## 2. Contexto del Sector Logístico

La logística global gestiona millones de envíos diarios: medicamentos, piezas industriales, alimentos, dispositivos electrónicos, productos de lujo y más. La trazabilidad logística es fundamental para:

- Certificar el origen de productos sensibles (medicamentos, tecnología)
- Garantizar que un paquete no fue manipulado durante el transporte
- Controlar temperatura en cadena de frío (vacunas, alimentos perecederos)
- Evitar falsificaciones en productos de alto valor
- Cumplir con regulaciones internacionales de transporte

### Tipos de Productos que Requieren Trazabilidad

| **Sector** | **Ejemplos** | **Requisitos Especiales** |
| --- | --- | --- |
| **Farmacéutico** | Medicamentos, vacunas, dispositivos médicos | Control de temperatura, humedad |
| **Alimentario** | Productos refrigerados, carnes, lácteos | Cadena de frío, tiempo máximo |
| **Electrónica** | Componentes, dispositivos, semiconductores | Antiestática, golpes registrados |
| **Lujo** | Relojes, joyas, obras de arte, vinos premium | Certificado de autenticidad |
| **Industrial** | Piezas automotrices, maquinaria, equipos | Verificación de origen |

---

## 3. Problemas Reales a Resolver

### Intermediarios sin Trazabilidad
Múltiples transportistas y hubs logísticos que no reportan correctamente el estado de los envíos o no comparten información entre sí.

**Solución Solana:** Todos los actores registran datos on-chain, visible para todos los interesados.

### Falsificación de Productos
Especialmente crítico en sectores farmacéutico y de lujo. Se estima que el 10% de los medicamentos en países en desarrollo son falsificados.

**Solución Solana:** Certificados inmutables on-chain, verificables por cualquiera.

### Falta de Visibilidad en Tiempo Real
Los compradores no saben dónde está realmente su envío, solo reciben actualizaciones esporádicas.

**Solución Solana:** Eventos registrados cada 400ms en blockchain, visibles inmediatamente.

### IoT Desconectado
Sensores de temperatura, humedad o golpes que generan datos, pero no están integrados con auditoría inmutable.

**Solución Solana:** API para integrar sensores, registrar datos automáticamente por fracción de centavo.

### Registros Modificables
Bases de datos centralizadas donde los registros pueden ser alterados después del hecho.

**Solución Solana:** Datos inmutables on-chain, auditoría imposible de falsificar.

---

## 4. Aspectos Clave a Tener en Cuenta en el TFM

### 1. Estructura de un Envío (Shipment)

Flujo básico:
```
Remitente crea envío
    ↓
Remitente → Transportista (Hub de salida)
    ↓
Hub de salida → Hubs intermedios
    ↓
Hub intermedio → Destinatario
    ↓
Destinatario confirma entrega
```

Cada paso es un **Checkpoint** registrado on-chain.

### 2. Estados del Envío

| Estado | Descripción |
|---|---|
| **Created** | Envío creado, esperando pickup |
| **InTransit** | En movimiento hacia siguiente hub |
| **AtHub** | Llegó a un hub intermedio |
| **OutForDelivery** | En ruta hacia el destinatario final |
| **Delivered** | Entregado confirmado |
| **Returned** | Retornado al remitente |
| **Cancelled** | Cancelado |

### 3. Checkpoints

Eventos críticos a registrar:

- **Pickup:** Salida del origen
- **HubIn:** Llegada a hub logístico
- **HubOut:** Salida de hub logístico
- **Transit:** Movimiento entre ubicaciones
- **DeliveryAttempt:** Intento de entrega
- **Delivered:** Entrega exitosa
- **SensorData:** Lectura de sensores IoT

Cada checkpoint incluye:
- **Timestamp on-chain:** Cuándo ocurrió
- **Location:** Dónde ocurrió
- **Actor:** Quién lo registró
- **Metadata:** Datos adicionales (temperatura, humedad, fotos, firma digital)

### 4. Incidencias

Problemas que pueden ocurrir:

| Tipo | Descripción |
|---|---|
| **Delay** | Retraso significativo |
| **Damage** | Daño detectado |
| **Lost** | Envío perdido |
| **TempViolation** | Temperatura fuera de rango |
| **Unauthorized** | Apertura no autorizada |

### 5. Integración IoT

Sensores opcionales:

- **Temperatura:** crítico para cadena de frío (-20 a +40°C)
- **Humedad:** para productos sensibles (0-100%)
- **Golpes:** acelerómetro detecta caídas o maltrato
- **Apertura:** detectores de puertas/contenedores
- **GPS:** localización (opcional, caro en Solana)

### 6. Roles y Permisos

| Rol | Puede crear envíos | Puede registrar checkpoints | Puede reportar incidencias | Acceso |
|---|---|---|---|---|
| **Sender** | ✅ | ❌ | ✅ | Propios envíos |
| **Carrier** | ❌ | ✅ | ✅ | Envíos asignados |
| **Hub** | ❌ | ✅ | ✅ | Todos |
| **Recipient** | ❌ | ✅ (entrega) | ✅ | Envíos para ellos |
| **Inspector** | ❌ | ❌ | ❌ | Solo lectura |

---

## 5. Componentes Recomendados del MVP para Solana

### 5.1. Estructura de Datos (Rust/Anchor)

```rust
// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum ShipmentStatus {
    Created,
    InTransit,
    AtHub,
    OutForDelivery,
    Delivered,
    Returned,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum ActorRole {
    Sender,
    Carrier,
    Hub,
    Recipient,
    Inspector,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum CheckpointType {
    Pickup,
    HubIn,
    HubOut,
    Transit,
    DeliveryAttempt,
    Delivered,
    SensorData,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum IncidentType {
    Delay,
    Damage,
    Lost,
    TempViolation,
    Unauthorized,
}

// Accounts
#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,
    pub next_shipment_id: u64,
    pub next_checkpoint_id: u64,
    pub next_incident_id: u64,
    pub total_shipments: u64,
    pub total_checkpoints: u64,
    pub total_incidents: u64,
    pub bump: u8,
}

#[account]
pub struct Actor {
    pub address: Pubkey,
    pub name: String,              // max 128 chars
    pub role: ActorRole,
    pub location: String,          // max 256 chars
    pub is_active: bool,
    pub created_at: i64,
    pub shipments_created: u32,
    pub checkpoints_recorded: u32,
    pub bump: u8,
}

#[account]
pub struct Shipment {
    pub id: u64,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub product: String,           // max 64 chars
    pub origin: String,            // max 128 chars
    pub destination: String,       // max 128 chars
    pub date_created: i64,
    pub date_delivered: i64,
    pub status: ShipmentStatus,
    pub checkpoint_count: u32,
    pub incident_count: u32,
    pub requires_cold_chain: bool,
    pub bump: u8,
}

#[account]
pub struct Checkpoint {
    pub id: u64,
    pub shipment_id: u64,
    pub actor: Pubkey,
    pub location: String,          // max 256 chars
    pub checkpoint_type: CheckpointType,
    pub timestamp: i64,
    pub metadata: String,          // JSON, max 2048 chars
    pub temperature: i16,          // Celsius * 10 (para decimales)
    pub humidity: u8,              // Porcentaje 0-100
    pub bump: u8,
}

#[account]
pub struct Incident {
    pub id: u64,
    pub shipment_id: u64,
    pub incident_type: IncidentType,
    pub reporter: Pubkey,
    pub description: String,       // max 256 chars
    pub timestamp: i64,
    pub resolved: bool,
    pub bump: u8,
}
```

### 5.2. Instrucciones Principales

```rust
// Inicializar sistema
pub fn initialize(ctx: Context<Initialize>) -> Result<()> { }

// Registrar actor
pub fn register_actor(
    ctx: Context<RegisterActor>,
    name: String,
    role: ActorRole,
    location: String,
) -> Result<()> { }

// Crear envío
pub fn create_shipment(
    ctx: Context<CreateShipment>,
    shipment_id: u64,
    recipient: Pubkey,
    product: String,
    origin: String,
    destination: String,
    requires_cold_chain: bool,
) -> Result<()> { }

// Registrar checkpoint
pub fn record_checkpoint(
    ctx: Context<RecordCheckpoint>,
    shipment_id: u64,
    checkpoint_id: u64,
    location: String,
    checkpoint_type: CheckpointType,
    metadata: String,
    temperature: i16,
    humidity: u8,
) -> Result<()> { }

// Actualizar estado del envío
pub fn update_shipment_status(
    ctx: Context<UpdateShipmentStatus>,
    shipment_id: u64,
    new_status: ShipmentStatus,
) -> Result<()> { }

// Confirmar entrega
pub fn confirm_delivery(
    ctx: Context<ConfirmDelivery>,
    shipment_id: u64,
) -> Result<()> { }

// Reportar incidencia
pub fn report_incident(
    ctx: Context<ReportIncident>,
    shipment_id: u64,
    incident_id: u64,
    incident_type: IncidentType,
    description: String,
) -> Result<()> { }

// Resolver incidencia
pub fn resolve_incident(
    ctx: Context<ResolveIncident>,
    incident_id: u64,
) -> Result<()> { }

// Verificar cumplimiento de temperatura
pub fn verify_temperature_compliance(
    ctx: Context<VerifyTempCompliance>,
    shipment_id: u64,
) -> Result<bool> { }

// Cancelar envío
pub fn cancel_shipment(
    ctx: Context<CancelShipment>,
    shipment_id: u64,
) -> Result<()> { }
```

### 5.3. Eventos Emitidos

```rust
#[event]
pub struct ShipmentCreated {
    pub shipment_id: u64,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub product: String,
    pub origin: String,
    pub destination: String,
    pub timestamp: i64,
}

#[event]
pub struct CheckpointRecorded {
    pub checkpoint_id: u64,
    pub shipment_id: u64,
    pub location: String,
    pub checkpoint_type: String,
    pub actor: Pubkey,
    pub temperature: i16,
    pub timestamp: i64,
}

#[event]
pub struct ShipmentStatusChanged {
    pub shipment_id: u64,
    pub new_status: String,
    pub timestamp: i64,
}

#[event]
pub struct DeliveryConfirmed {
    pub shipment_id: u64,
    pub recipient: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct IncidentReported {
    pub incident_id: u64,
    pub shipment_id: u64,
    pub incident_type: String,
    pub reporter: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct IncidentResolved {
    pub incident_id: u64,
    pub shipment_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct TempViolationDetected {
    pub shipment_id: u64,
    pub checkpoint_id: u64,
    pub temperature: i16,
    pub max_allowed: i16,
    pub timestamp: i64,
}
```

### 5.4. Modelo de Datos JSON

```json
{
  "shipmentId": "PKG-2024-001",
  "product": "Medicamento refrigerado",
  "origin": "Laboratorio FarmaTech, Miami",
  "destination": "Hospital Central, Bogotá",
  "sender": "4kZ7cBaDJrXj5rKLjvPBiR7K8XpPZy8Y3vJ5mK2p",
  "recipient": "7mX9nZ2dF5gH3jK1pL8qR6sT4uV0wX2yZ9aB3cD",
  "status": "InTransit",
  "requiresColdChain": true,
  "checkpoints": [
    {
      "checkpointId": "CHK-001",
      "type": "Pickup",
      "timestamp": 1710002212,
      "location": "Miami Port Authority",
      "actor": "4kZ7cBaDJrXj5rKLjvPBiR7K8XpPZy8Y3vJ5mK2p",
      "temperature": 4.5,
      "humidity": 45,
      "metadata": {
        "scanned_by": "courier_agent_01",
        "package_condition": "excellent"
      }
    },
    {
      "checkpointId": "CHK-002",
      "type": "HubIn",
      "timestamp": 1710012212,
      "location": "Miami Hub #5",
      "actor": "3jM8kL5nO2pQ9rS6tU1vW4xY7zA0bC3dE",
      "temperature": 4.2,
      "humidity": 48,
      "metadata": {
        "hub_warehouse": "freezer_zone_A",
        "operator": "hub_worker_03"
      }
    }
  ],
  "incidents": [
    {
      "incidentId": "INC-001",
      "type": "TempViolation",
      "timestamp": 1710022212,
      "description": "Temperature dropped to 1.2°C for 15 minutes",
      "reporter": "3jM8kL5nO2pQ9rS6tU1vW4xY7zA0bC3dE",
      "resolved": false
    }
  ]
}
```

### 5.5. Estructura del Proyecto

```
logistics-traceability-solana/
├── programs/
│   └── logistics_traceability/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── instructions/
│       │   │   ├── initialize.rs
│       │   │   ├── register_actor.rs
│       │   │   ├── create_shipment.rs
│       │   │   ├── record_checkpoint.rs
│       │   │   ├── update_status.rs
│       │   │   ├── confirm_delivery.rs
│       │   │   ├── report_incident.rs
│       │   │   ├── resolve_incident.rs
│       │   │   ├── verify_temperature.rs
│       │   │   └── cancel_shipment.rs
│       │   ├── state.rs
│       │   ├── events.rs
│       │   ├── error.rs
│       │   └── mod.rs
│       ├── Cargo.toml
│       └── Anchor.toml
├── tests/
│   └── logistics-traceability.ts
├── app/
│   ├── components/
│   │   ├── ShipmentTracker.tsx
│   │   ├── CheckpointTimeline.tsx
│   │   ├── IncidentAlert.tsx
│   │   └── TempChart.tsx
│   ├── lib/
│   │   └── logistics.ts
│   └── pages/
├── package.json
└── README.md
```

---

## 6. Proyectos de Referencia: Chronicled y SUKU

### 6.1. Chronicled / MediLedger

**¿Qué es?**

Una de las plataformas pioneras en trazabilidad logística usando blockchain para cadenas reguladas, especialmente en el sector farmacéutico y de dispositivos médicos.

**Enlaces:**
- 🌐 [https://www.chronicled.com](https://www.chronicled.com/)

**Problema que resuelve:**
- Fármacos falsificados en la cadena de suministro
- Necesidad de un sistema verificable entre múltiples laboratorios y distribuidores
- Cumplimiento normativo en EE.UU. (Drug Supply Chain Security Act - DSCSA)

**Cómo lo resuelve:**
- Red empresarial (MediLedger) donde laboratorios, distribuidores y otros actores comparten un registro común e inmutable
- Identidad digital descentralizada para empresas
- Verificación de medicamentos y dispositivos
- Sistema de trazabilidad que cumple con regulaciones estrictas

### 6.2. SUKU

**¿Qué es?**

Ecosistema blockchain para supply chain que combina trazabilidad logística con experiencia para el consumidor final e inclusión financiera.

**Enlaces:**
- 🌐 [https://www.suku.world](https://www.suku.world/)
- 🐦 [https://x.com/Suku_world](https://x.com/Suku_world)

**Problema que resuelve:**
- Falta de visibilidad de extremo a extremo en cadenas de suministro complejas
- Riesgo de falsificación en retail
- Desalineación de datos entre múltiples actores
- Inclusión financiera de pequeños proveedores

**Cómo lo resuelve:**
- Herramientas para trazabilidad desde fabricación hasta retail
- Conexión marca-consumidor mediante códigos QR y blockchain
- Experiencias Web3 (NFTs, drops, programas de fidelización)
- Integración con sistemas de pagos (SukuPay)

---

## 7. Datos de los Proyectos

### 7.1. Chronicled - Financiación y Alcance

- **Financiación:** ~36 millones de dólares
- **Tamaño:** Cercano a 100 empleados
- **Foco:** Red MediLedger para sector farmacéutico
- **Países:** EE.UU., México, Colombia, Brasil, Chile

### 7.2. SUKU - Financiación y Operaciones

- **Oficinas:** Silicon Valley, Miami, Atlanta, Uruguay
- **Casos de uso:** Trazabilidad retail (carne en supermercados Cencosud)
- **Blockchain:** Ethereum, Hedera Hashgraph
- **Productos:** Trazabilidad, identidad digital, pagos transfronterizos
- **Países:** Chile, Argentina, Perú, Brasil, Colombia, Guatemala

---

## 8. Ventajas de Usar Solana para Logística

### Comparativa Económica: Registrar 100 Checkpoints por Envío

**Scenario:** 1,000 envíos con 100 checkpoints cada uno = 100,000 eventos/día

| Blockchain | Costo por evento | Costo diario | Costo anual |
|---|---|---|---|
| **Solana** | $0.00025 | $25 | $9,125 |
| **Ethereum** | $10 | $1,000,000 | $365,000,000 |
| **Ratio** | - | **40,000x** | **40,000x** |

### Por Qué Solana es Ideal para Logística

✅ **Escala masiva:** Maneja miles de eventos por segundo sin congestión
✅ **Bajo costo:** Cada checkpoint cuesta fracciones de centavo
✅ **Velocidad:** Confirmación inmediata (400ms) vs 12+ segundos en Ethereum
✅ **IoT-friendly:** Costo tan bajo que sensores pueden registrar cada minuto
✅ **Auditoría completa:** Historial completo inmutable a fracción del costo

### Casos de Uso Únicos en Solana

**Monitoreo IoT en Tiempo Real**
```
Sensor de temperatura → Reporta cada 5 minutos → $0.000025 por lectura
Un mes = 8,640 lecturas = $0.22
En Ethereum: $86,400
```

**Rastreamiento de Múltiples Envíos**
```
1 millón de envíos activos
Cada uno registra 5 eventos diarios
= 5 millones de eventos diarios
Solana: $1,250/día = $456,250/año
Ethereum: $50 millones/día = $18 mil millones/año
```

---

## 9. Cómo Inspirarse sin Copiar

**IMPORTANTE:** El objetivo de este TFM NO es copiar Chronicled o SUKU, sino usar sus modelos como inspiración para crear tu propia versión en Solana, adaptada a un caso logístico específico.

### 9.1. Lo que DEBES Hacer

- **Elegir tu propio caso logístico:** No tiene que ser farmacia o retail
- **Definir tus checkpoints:** Adaptados a TU caso específico
- **Decidir si incluyes IoT:** ¿Necesitas sensores reales o solo eventos?
- **Modelar tu flujo:** Crear tu propio sistema de tracking
- **Innovar con Solana:** Aprovechar el bajo costo para características nuevas

### 9.2. Lo que NO DEBES Hacer

- ❌ Copiar código de Chronicled o SUKU (no es open source)
- ❌ Usar exactamente los mismos nombres de funciones
- ❌ Replicar su modelo de negocio sin adaptación
- ❌ Presentar tu TFM como "Chronicled pero en Solana"

### 9.3. Ejemplos de Adaptación Original

**Caso original (Chronicled):**
```
Trazabilidad farmacéutica:
Laboratorio → Distribuidor → Mayorista → Farmacia
```

**Tu adaptación 1 - Componentes Electrónicos:**
```
Fábrica → Hub regional → Integrador → Cliente final
Eventos: Fabricación, QA, Embalaje, Transporte, Entrega
IoT: Sensores de golpes, humedad
```

**Tu adaptación 2 - Productos de Lujo:**
```
Manufactura → Distribuidor → Boutique → Comprador
Eventos: Creación, Verificación, Transporte, Recepción
NFT: Certificado digital de autenticidad
```

**Tu adaptación 3 - Vacunas/Medicinas:**
```
Laboratorio → Aeropuerto → Distribuidor → Hospital
Eventos: Fabricación, Congelación, Transporte, Recepción, Administración
IoT: Sensores de temperatura, humedad
Alertas: Violación de cadena de frío
```

**Tu adaptación 4 - Relojes de Lujo:**
```
Manufactura suiza → Centro de distribución → Relojería autorizada → Comprador
Eventos: Creación, Inspección, Embalaje, Transporte, Entrega
NFT: Pasaporte digital del reloj
Historial: Todos los propietarios verificables
```

**Tu adaptación 5 - Paquetería Express:**
```
Remitente → Hub local → Centros regionales → Hub destino → Destinatario
Eventos: Pickup, HubIn, HubOut, OutForDelivery, Delivered
Firma digital: Confirmación de entrega
Incidencias: Retrasos, daños, rechazos
```

---

## Ideas de Casos de Uso Innovadores para tu TFM

### Opción 1: Medicamentos con Control de Temperatura y Alertas

**Características:**
- Sensores IoT de temperatura/humedad
- Alertas automáticas si se rompe cadena de frío
- Cumplimiento regulatorio (DSCSA, GDP)
- Notificaciones en blockchain

**Diferencia con EVM:** En Solana, puedes registrar lecturas cada minuto

### Opción 2: Componentes Electrónicos de Alto Valor

**Características:**
- Certificado de autenticidad digital
- Detección de golpes (acelerómetro)
- Verificación de origen para semiconductores
- Prevención de falsificaciones

**Diferencia con EVM:** Costo tan bajo que permite registrar cada movimiento

### Opción 3: Productos de Lujo con NFT

**Características:**
- NFT como pasaporte digital del producto
- Historial de propietarios verificable
- Certificados de autenticidad on-chain
- Transferencia segura entre dueños

**Diferencia con EVM:** Minteo de NFTs a $0.0025 vs $100+

### Opción 4: Alimentos Perecederos

**Características:**
- Control de temperatura/humedad on-chain
- Timeline de transporte transparente
- Certificados sanitarios verificables
- Alertas de caducidad

**Diferencia con EVM:** Monitoreo continuo sin quebrar economía

### Opción 5: Paquetería Express con Firma Digital

**Características:**
- Tracking estilo DHL/UPS pero on-chain
- Confirmación de entregas con firma digital
- Gestión de incidencias (daños, retrasos, rechazos)
- Reembolsos automáticos si hay problemas

**Diferencia con EVM:** Escala masiva (millones de envíos) sin congestión

---

## 10. Estructura de Implementación Recomendada

### Fase 1: Setup (1 semana)
- Crear proyecto Anchor
- Definir enums y accounts
- Implementar instrucciones básicas

### Fase 2: Funcionalidad Core (2-3 semanas)
- Crear/rastrear envíos
- Registrar checkpoints
- Manejo de incidencias

### Fase 3: Testing (1 semana)
- Tests de cada instrucción
- Flujo completo de envío
- Validaciones de temperatura

### Fase 4: Frontend (2-3 semanas)
- Dashboard de tracking
- Timeline visual
- Alertas de incidencias

### Fase 5: Documentación TFM (1-2 semanas)
- Memoria técnica
- Resultados
- Conclusiones

**Tiempo total: 6-10 semanas**

---

## Próximos Pasos

1. **Lee** TFM_SOLANA_LOGISTICS_TRACEABILITY.md completo
2. **Elige** tu caso de uso (farmacia, electrónica, lujo, alimentos, paquetería)
3. **Lee** LOGISTICS_TRACEABILITY_ANCHOR_GUIDE.md para entender implementación
4. **Implementa** tu versión en Solana
5. **Documenta** tu TFM

---

**¡Éxito en tu Trabajo Final de Máster con Solana!** 🚀
