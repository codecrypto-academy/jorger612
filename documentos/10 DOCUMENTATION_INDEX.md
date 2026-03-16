# 📚 Índice de Documentación - Traza en Solana

Guía de navegación por toda la documentación del proyecto.

---

## 🎯 ¿Qué Quieres Hacer?

### 1️⃣ **"Quiero empezar AHORA"**
→ Ve a **[QUICK_START.md](./40%20QUICK_START.md)** (15 minutos)
- Setup rápido en 3 terminales
- Primeras transacciones
- Prueba del sistema completo

### 2️⃣ **"Necesito una guía completa del proyecto"**
→ Ve a **[README.md](./50%20README.md)** (documentación principal)
- Descripción del proyecto
- Requisitos previos
- Setup paso a paso
- Flujo de desarrollo
- Gestión de roles (12 KB detallados)
- Uso de Devnet y Testnet
- Troubleshooting completo
- Guía de referencia rápida

### 3️⃣ **"Tengo problemas con localhost o red remota"**
→ Ve a **[NGROK_SETUP.md](./30%20NGROK_SETUP.md)**
- Cuándo necesitas ngrok
- Instalación en Mac/Linux/Windows
- Crear túneles a localnet
- Casos de uso: laboratorio compartido
- Troubleshooting de ngrok

### 4️⃣ **"Estoy haciendo mi TFM: Trazabilidad Alimentaria"**
→ Ve a **[TFM_SOLANA_FOOD_TRACEABILITY.md](./70%20TFM_SOLANA_FOOD_TRACEABILITY.md)**
- Descripción completa del TFM
- Contexto del sector alimentario
- Problemas a resolver
- Componentes MVP en Solana
- **Comparativa Solana vs EVM vs Hyperledger**
- Referencia real: GrainChain
- Cómo adaptar sin copiar
- Ideas para productos alimentarios

### 5️⃣ **"Necesito implementar trazabilidad alimentaria en Solana"**
→ Referencia el proyecto **[traza/](./traza/README.md)** como ejemplo de implementación
- Estructura del proyecto Anchor
- Todas las estructuras de datos
- Implementación de instrucciones
- Gestión de PDAs
- Tests completos
- Detalles en: **[traza/README.md](./traza/README.md)**

### 6️⃣ **"Estoy haciendo otro TFM (Logística, Industrial, Académico o Energía)"**
→ Consulta **[Sección "TFMs Disponibles"](#tfms-disponibles)** (ver abajo)
- TFM Trazabilidad Logística
- TFM Trazabilidad Industrial
- TFM Certificación Académica
- TFM Energía Renovable y Certificados Verdes

### 7️⃣ **"Quiero entender cómo funciona el programa Traza actual"**
→ Ve a **[traza/README.md](./traza/README.md)**
- Detalles técnicos de PDAs
- Instrucciones del programa
- Cuentas y sus campos
- Flujo de trazabilidad
- Tests

---

## 🎓 TFMs Disponibles

Este proyecto incluye 5 Trabajos Finales de Máster (TFM) adaptados a Solana, cada uno con su documentación completa:

| TFM | Documento | Guía Técnica | Dominio | Referencia |
|-----|-----------|--------------|---------|-----------|
| 🍎 Trazabilidad Alimentaria | [TFM_SOLANA_FOOD_TRACEABILITY.md](./70%20TFM_SOLANA_FOOD_TRACEABILITY.md) | Ver [traza/README.md](./traza/README.md) | Sector alimentario | GrainChain |
| 🚚 Trazabilidad Logística | [TFM_SOLANA_LOGISTICS_TRACEABILITY.md](./90%20TFM_SOLANA_LOGISTICS_TRACEABILITY.md) | Ver [traza/README.md](./traza/README.md) | Logística + IoT | Chronicled/SUKU |
| 🏭 Trazabilidad Industrial | [TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md](./80%20TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md) | Próximamente | Industria/Certificaciones | TimberChain |
| 🎓 Certificación Académica | [TFM_SOLANA_ACADEMIC_CERTIFICATES.md](./60%20TFM_SOLANA_ACADEMIC_CERTIFICATES.md) | Próximamente | Educación/Credenciales | Blockcerts |
| ⚡ Energía Renovable | [TFM_SOLANA_RENEWABLE_ENERGY.md](./95%20TFM_SOLANA_RENEWABLE_ENERGY.md) | Próximamente | Energía/Tokenización | Power Ledger |

**Nota:** Los TFM 1 y 2 tienen ejemplos de implementación en el proyecto [traza/](./traza/README.md). Los TFM 3, 4 y 5 incluyen documentación teórica completa y guías técnicas en desarrollo.

---

## 📖 Estructura Jerárquica

```
ÍNDICE (estás aquí)
│
├─ 🚀 EMPEZAR RÁPIDO (15 min)
│  ├─ QUICK_START.md
│  └─ NGROK_SETUP.md
│
├─ 📚 DOCUMENTACIÓN COMPLETA
│  ├─ README.md
│  │  ├─ Descripción general
│  │  ├─ Setup y configuración
│  │  ├─ Backpack Wallet
│  │  ├─ Devnet/Testnet
│  │  ├─ Gestión de Roles (detallado)
│  │  ├─ Workflow de desarrollo
│  │  └─ Troubleshooting
│  │
│  ├─ traza/README.md
│  │  ├─ PDAs y cálculos
│  │  ├─ Instrucciones
│  │  ├─ Consultas
│  │  └─ Tests
│  │
│  └─ [Este archivo] DOCUMENTATION_INDEX.md
│
├─ 🎓 TRABAJOS FINALES DE MÁSTER (TFM)
│  │
│  ├─ 🍎 TFM 1: TRAZABILIDAD ALIMENTARIA
│  │  └─ TFM_SOLANA_FOOD_TRACEABILITY.md
│  │     ├─ Descripción del proyecto
│  │     ├─ Análisis de problemas
│  │     ├─ MVP en Solana
│  │     ├─ Comparativa blockchains
│  │     ├─ Referencia: GrainChain
│  │     └─ Cómo inspirarse
│  │
│  ├─ 🚚 TFM 2: TRAZABILIDAD LOGÍSTICA
│  │  └─ TFM_SOLANA_LOGISTICS_TRACEABILITY.md
│  │     ├─ Descripción del proyecto
│  │     ├─ Análisis de problemas
│  │     ├─ MVP con monitoreo IoT
│  │     ├─ Comparativa blockchains
│  │     ├─ Referencias: Chronicled, SUKU
│  │     └─ Cómo inspirarse
│  │
│  ├─ 🏭 TFM 3: TRAZABILIDAD INDUSTRIAL Y CERTIFICACIONES
│  │  └─ TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md
│  │     ├─ Descripción del proyecto
│  │     ├─ Análisis de problemas
│  │     ├─ MVP en Solana
│  │     ├─ Certificaciones (ISO, EUDR)
│  │     ├─ Caso de uso: Forestal, Textil, Metalúrgico
│  │     └─ Cómo inspirarse
│  │
│  ├─ 🎓 TFM 4: CERTIFICACIÓN ACADÉMICA DIGITAL
│  │  └─ TFM_SOLANA_ACADEMIC_CERTIFICATES.md
│  │     ├─ Descripción del proyecto
│  │     ├─ Análisis de problemas
│  │     ├─ MVP en Solana
│  │     ├─ Credenciales JSON-LD
│  │     ├─ Referencia: Blockcerts
│  │     └─ Cómo inspirarse
│  │
│  └─ ⚡ TFM 5: ENERGÍA RENOVABLE Y CERTIFICADOS VERDES
│     └─ TFM_SOLANA_RENEWABLE_ENERGY.md
│        ├─ Descripción del proyecto
│        ├─ Análisis de problemas
│        ├─ MVP con tokenización
│        ├─ P2P energy trading
│        ├─ Referencia: Power Ledger
│        └─ Cómo inspirarse
│
└─ 🔧 CÓDIGO FUENTE
   ├─ traza/
   │  ├─ programs/traza/src/
   │  │  ├─ lib.rs
   │  │  ├─ state.rs
   │  │  ├─ instructions/
   │  │  └─ error.rs
   │  ├─ tests/
   │  └─ Anchor.toml
   │
   └─ web/
      ├─ app/
      ├─ components/
      ├─ lib/
      └─ types/
```

---

## 🎓 Flujos de Estudio Recomendados

### Flujo 1: Estudiante Nuevo (0-2 semanas)

```
1. QUICK_START.md (15 min)
   ↓
2. README.md - Secciones principales (1 hora)
   ↓
3. Ejecutar el código en Localnet (30 min)
   ↓
4. README.md - Sección de Gestión de Roles (1 hora)
   ↓
5. Desplegar en Devnet (30 min)
   ↓
6. Explorar el código de traza/ (2 horas)
```

**Tiempo total:** ~5-6 horas

---

### Flujo 2: Estudiante de TFM - Trazabilidad Alimentaria (4-8 semanas)

```
1. QUICK_START.md (15 min)
   ↓
2. TFM_SOLANA_FOOD_TRACEABILITY.md - Secciones 1-4 (2 horas)
   ↓
3. Ejecutar el proyecto Traza para entender el patrón (1 hora)
   ↓
4. TFM_SOLANA_FOOD_TRACEABILITY.md - Secciones 5-9 (2 horas)
   ↓
5. FOOD_TRACEABILITY_ANCHOR_GUIDE.md - Setup (1 hora)
   ↓
6. Implementar tus propios structs (4-6 horas)
   ↓
7. Implementar instrucciones (8-10 horas)
   ↓
8. Escribir tests (4-6 horas)
   ↓
9. Crear frontend (4-6 horas)
   ↓
10. Escribir memoria TFM (4-6 horas)
```

**Tiempo total:** 30-50 horas (4-8 semanas)

---

### Flujo 3: Entorno de Laboratorio/Clase (1 semana)

```
Día 1: Setup
- QUICK_START.md
- Todos conectados a Localnet

Día 2: Entender Roles
- README.md - Gestión de Roles
- Registrar roles
- Crear tokens

Día 3: Eventos y Transferencias
- README.md - Workflow
- Registrar eventos
- Transferencias

Día 4: Devnet y Trabajo en Equipo
- NGROK_SETUP.md (si es necesario)
- Desplegar en Devnet
- Trabajo colaborativo

Día 5: Proyecto
- Los estudiantes eligen dominio
- Empiezan su TFM preferido
```

---

### Flujo 4: Estudiante de TFM - Trazabilidad Logística (4-8 semanas)

```
1. QUICK_START.md (15 min)
   ↓
2. TFM_SOLANA_LOGISTICS_TRACEABILITY.md - Secciones 1-4 (2 horas)
   ↓
3. Ejecutar el proyecto Traza para entender el patrón (1 hora)
   ↓
4. TFM_SOLANA_LOGISTICS_TRACEABILITY.md - Secciones 5-9 (2 horas)
   ↓
5. LOGISTICS_TRACEABILITY_ANCHOR_GUIDE.md - Setup (1 hora)
   ↓
6. Implementar structs con IoT (4-6 horas)
   ↓
7. Implementar instrucciones (8-10 horas)
   ↓
8. Escribir tests (4-6 horas)
   ↓
9. Crear frontend (4-6 horas)
   ↓
10. Escribir memoria TFM (4-6 horas)
```

**Tiempo total:** 30-50 horas (4-8 semanas)

---

### Flujo 5: Estudiante de TFM - Trazabilidad Industrial (4-8 semanas)

```
1. QUICK_START.md (15 min)
   ↓
2. TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md - Lectura (3 horas)
   ↓
3. Ejecutar el proyecto Traza (1 hora)
   ↓
4. Elegir contexto (Forestal, Textil, Metalúrgico, etc.) (30 min)
   ↓
5. Diseñar structs específicos (4-6 horas)
   ↓
6. Implementar instrucciones (8-10 horas)
   ↓
7. Integración de certificaciones (4-6 horas)
   ↓
8. Escribir tests (4-6 horas)
   ↓
9. Crear frontend (4-6 horas)
   ↓
10. Escribir memoria TFM (4-6 horas)
```

**Tiempo total:** 35-55 horas (4-8 semanas)

---

### Flujo 6: Estudiante de TFM - Certificación Académica (4-8 semanas)

```
1. QUICK_START.md (15 min)
   ↓
2. TFM_SOLANA_ACADEMIC_CERTIFICATES.md - Lectura (3 horas)
   ↓
3. Ejecutar el proyecto Traza (1 hora)
   ↓
4. Entender credenciales JSON-LD (2 horas)
   ↓
5. Diseñar structs para credenciales (4-6 horas)
   ↓
6. Implementar instrucciones (8-10 horas)
   ↓
7. Sistema de revocación (4-6 horas)
   ↓
8. Escribir tests (4-6 horas)
   ↓
9. Crear frontend (4-6 horas)
   ↓
10. Escribir memoria TFM (4-6 horas)
```

**Tiempo total:** 35-55 horas (4-8 semanas)

---

### Flujo 7: Estudiante de TFM - Energía Renovable (4-8 semanas)

```
1. QUICK_START.md (15 min)
   ↓
2. TFM_SOLANA_RENEWABLE_ENERGY.md - Lectura (3 horas)
   ↓
3. Ejecutar el proyecto Traza (1 hora)
   ↓
4. Entender tokenización (2 horas)
   ↓
5. Diseñar EnergyToken y structs (4-6 horas)
   ↓
6. Implementar instrucciones (8-10 horas)
   ↓
7. P2P energy trading (4-6 horas)
   ↓
8. Escribir tests (4-6 horas)
   ↓
9. Crear frontend (4-6 horas)
   ↓
10. Escribir memoria TFM (4-6 horas)
```

**Tiempo total:** 35-55 horas (4-8 semanas)

---

## 🔍 Búsqueda Rápida por Tema

### Instalación y Setup
- **Primeros pasos:** QUICK_START.md
- **Setup completo:** README.md - Sección "Setup Inicial"
- **Requisitos previos:** README.md - Sección "Requisitos Previos"
- **Backpack:** README.md - Sección "Usar la Aplicación"

### Redes (Localnet/Devnet/Testnet)
- **Cambiar entre redes:** README.md - Sección "Usar Devnet o Testnet"
- **Faucet:** README.md - Sección "Obtener SOL"
- **Guía de referencia rápida:** README.md - Sección "Guía de Referencia Rápida"

### Gestión de Roles
- **Completo:** README.md - Sección "Gestión de Roles - Guía Detallada" (12 KB)
- **Código TypeScript:** README.md - Sección "Implementación en el Código"
- **Panel de Admin:** README.md - Sección "Panel de Administración"
- **Transiciones:** README.md - Sección "Transiciones Válidas"

### Problemas y Soluciones
- **General:** README.md - Sección "Troubleshooting"
- **Backpack:** README.md - Sección "La app web no conecta con Backpack"
- **ngrok:** NGROK_SETUP.md - Sección "Troubleshooting"
- **Devnet/Testnet:** README.md - Sección "Troubleshooting: Redes Públicas"

### TFM y Educación

#### TFM 1: Trazabilidad Alimentaria
- **Descripción del TFM:** TFM_SOLANA_FOOD_TRACEABILITY.md - Sección 1
- **Problema a resolver:** TFM_SOLANA_FOOD_TRACEABILITY.md - Sección 3
- **MVP y componentes:** TFM_SOLANA_FOOD_TRACEABILITY.md - Sección 5
- **Ejemplo de implementación:** [traza/README.md](./traza/README.md)

#### TFM 2: Trazabilidad Logística
- **Descripción del TFM:** TFM_SOLANA_LOGISTICS_TRACEABILITY.md - Sección 1
- **Monitoreo IoT:** TFM_SOLANA_LOGISTICS_TRACEABILITY.md - Sección 4
- **Detección de anomalías:** TFM_SOLANA_LOGISTICS_TRACEABILITY.md - Sección 6
- **Ejemplo de implementación:** [traza/README.md](./traza/README.md)

#### TFM 3: Trazabilidad Industrial
- **Descripción del TFM:** TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md - Sección 1
- **Contextos industriales:** TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md - Sección 2
- **Certificaciones:** TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md - Sección 4
- **MVP y componentes:** TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md - Sección 5

#### TFM 4: Certificación Académica Digital
- **Descripción del TFM:** TFM_SOLANA_ACADEMIC_CERTIFICATES.md - Sección 1
- **Problemas de diplomas falsificados:** TFM_SOLANA_ACADEMIC_CERTIFICATES.md - Sección 3
- **Credenciales JSON-LD:** TFM_SOLANA_ACADEMIC_CERTIFICATES.md - Sección 5
- **Comparativa con Blockcerts:** TFM_SOLANA_ACADEMIC_CERTIFICATES.md - Sección 7

#### TFM 5: Energía Renovable
- **Descripción del TFM:** TFM_SOLANA_RENEWABLE_ENERGY.md - Sección 1
- **Certificados verdes:** TFM_SOLANA_RENEWABLE_ENERGY.md - Sección 3
- **Tokenización (1 token = 1 kWh):** TFM_SOLANA_RENEWABLE_ENERGY.md - Sección 5
- **P2P energy trading:** TFM_SOLANA_RENEWABLE_ENERGY.md - Sección 7

### Detalles Técnicos
- **PDAs:** traza/README.md - Sección "PDAs"
- **Instrucciones:** traza/README.md - Sección "Instrucciones"
- **Consultas:** traza/README.md - Sección "Consultas"
- **Validación de Autoridad y Roles:** [VALIDACION_AUTORIDAD_Y_ROLES.md](./VALIDACION_AUTORIDAD_Y_ROLES.md)
- **Matriz de Permisos:** VALIDACION_AUTORIDAD_Y_ROLES.md - Sección "Matriz de Permisos"
- **Mejoras de Seguridad:** VALIDACION_AUTORIDAD_Y_ROLES.md - Sección "Mejoras Recomendadas"

### Comparativas y Análisis
- **Solana vs EVM:** TFM_SOLANA_FOOD_TRACEABILITY.md - Sección 8
- **Caso de uso: GrainChain:** TFM_SOLANA_FOOD_TRACEABILITY.md - Sección 6-7
- **Ventajas de Solana:** TFM_SOLANA_FOOD_TRACEABILITY.md - Sección 8

---

## 📊 Tamaño de Documentos

| Documento | Tamaño | Tipo | Descripción |
|-----------|--------|------|-------------|
| README.md | 50 KB | Guía completa | Documentación principal del proyecto Traza |
| QUICK_START.md | 5 KB | Getting started | Setup en 15 minutos |
| NGROK_SETUP.md | 7.2 KB | Técnico (networking) | Túneles remotos para Solana |
| INSTRUCCIONES DE ENTREGA.md | 8.1 KB | Educacional | Guía de entrega de proyectos |
| VALIDACION_AUTORIDAD_Y_ROLES.md | 16 KB | Técnico (seguridad) | Validación de propietario y roles |
| DOCUMENTATION_INDEX.md | Este archivo | Índice | Navegación de toda la documentación |
| **TFM 1: TRAZABILIDAD ALIMENTARIA** | | | |
| TFM_SOLANA_FOOD_TRACEABILITY.md | 28 KB | Educacional (TFM) | Teoría y análisis |
| **TFM 2: TRAZABILIDAD LOGÍSTICA** | | | |
| TFM_SOLANA_LOGISTICS_TRACEABILITY.md | 25 KB | Educacional (TFM) | Teoría, IoT y monitoreo |
| **TFM 3: TRAZABILIDAD INDUSTRIAL** | | | |
| TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md | 18 KB | Educacional (TFM) | Teoría y certificaciones |
| **TFM 4: CERTIFICACIÓN ACADÉMICA** | | | |
| TFM_SOLANA_ACADEMIC_CERTIFICATES.md | 18 KB | Educacional (TFM) | Credenciales digitales y JSON-LD |
| **TFM 5: ENERGÍA RENOVABLE** | | | |
| TFM_SOLANA_RENEWABLE_ENERGY.md | 18 KB | Educacional (TFM) | Tokenización y P2P trading |
| **EJEMPLO DE IMPLEMENTACIÓN** | | | |
| traza/README.md | 11.8 KB | Técnico (smart contract) | Referencia para implementar TFMs 1 y 2 |

**Total: ~204 KB de documentación educativa y técnica + ejemplos de código en traza/**

---

## 🔗 Enlaces Externos Referenciados

### Herramientas
- [Backpack Wallet](https://www.backpack.app/) - Wallet recomendada
- [ngrok](https://ngrok.com/) - Túneles remotos
- [Solana Faucet](https://faucet.solana.com) - Obtener SOL en Devnet/Testnet

### Documentación Oficial
- [Solana Docs](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Web3.js](https://solana-labs.github.io/solana-web3.js/)

### Proyectos de Referencia
- [GrainChain](https://www.grainchain.io/) - Trazabilidad agrícola (referencia)
- [GrainChain Twitter](https://x.com/GrainChainIO)

---

## 💡 Tips de Navegación

1. **"No sé por dónde empezar"**
   → QUICK_START.md (15 min) → README.md

2. **"Estoy atascado/as"**
   → README.md - Sección Troubleshooting

3. **"Necesito código de ejemplo"**
   → [traza/README.md](./traza/README.md) (ejemplo completo con Rust/Anchor)

4. **"Quiero aprender sobre TFM de Alimentación"**
   → TFM_SOLANA_FOOD_TRACEABILITY.md

5. **"Quiero aprender sobre TFM de Logística"**
   → TFM_SOLANA_LOGISTICS_TRACEABILITY.md

6. **"Quiero aprender sobre TFM de Industria"**
   → TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md

7. **"Quiero aprender sobre TFM de Certificación Académica"**
   → TFM_SOLANA_ACADEMIC_CERTIFICATES.md

8. **"Quiero aprender sobre TFM de Energía Renovable"**
   → TFM_SOLANA_RENEWABLE_ENERGY.md

9. **"Me falla la conexión a red"**
   → NGROK_SETUP.md

10. **"Quiero entender el proyecto actual"**
    → traza/README.md

---

## 📝 Cómo Contribuir a la Documentación

Si encuentras errores o tienes sugerencias:

1. Crea un issue en GitHub
2. Propón cambios (pull request)
3. Contacta al profesor/instructor

---

**¡Bienvenido al proyecto Traza en Solana!** 🚀

Selecciona un documento arriba basándote en tu nivel y objetivo.
