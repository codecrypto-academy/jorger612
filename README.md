# Certificación Académica Digital en Solana

Sistema de emisión y verificación de certificados académicos construido en Solana. Incluye un programa Anchor (Rust) que gestiona instituciones, credenciales y revocaciones, y una aplicación web Next.js para interactuar con el blockchain.

**Repositorio:** [codecrypto-academy/jorger612](https://github.com/codecrypto-academy/jorger612)

---

## Descripción del Proyecto

Sistema descentralizado para emitir, verificar y revocar certificados académicos (diplomas, badges, certificaciones) con las siguientes características:

- **Inmutabilidad:** Los certificados se almacenan on-chain en Solana
- **Verificación pública:** Cualquiera puede verificar un certificado con la dirección del estudiante y el ID
- **JSON-LD:** Formato estándar Open Badges para interoperabilidad
- **IPFS:** Imágenes de certificados almacenadas en Pinata
- **Revocación:** Las instituciones pueden revocar certificados comprometidos
- **Re-emisión:** Soporte para nuevas versiones de certificados

---

## Estructura del Proyecto

```
pfm-rust-solana-2026/
├── academic_sol/           # Programa Solana (Anchor/Rust)
│   ├── programs/
│   │   └── academic_sol/
│   │       └── src/        # Instrucciones y estructuras
│   ├── tests/
│   ├── migrations/
│   └── Anchor.toml
├── web/                    # Aplicación Next.js
│   ├── app/                # Páginas y rutas
│   ├── components/         # Componentes React
│   ├── lib/                # Lógica Solana, hooks, utils
│   └── types/              # IDL y tipos TypeScript
├── documentos/             # Documentación adicional
└── README.md               # Este archivo
```

---

## Requisitos Previos

- **Rust** (1.70+)
- **Solana CLI** (v1.18+)
- **Anchor** (framework Solana)
- **Node.js** (18+)
- **Wallet:** Phantom, Solflare o Backpack

### Instalación de dependencias

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Node.js (recomendado: nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install 18
nvm use 18
```

### Verificar instalación

```bash
rustc --version
solana --version
anchor --version
node --version
```

---

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/codecrypto-academy/jorger612.git
cd jorger612
git checkout pfm-solana-marzo-2026
```

### 2. Iniciar el validador local de Solana

En una **primera terminal**:

```bash
solana-test-validator --ledger test-ledger
```

Espera hasta ver: `✓ Validator startup complete`

### 3. Compilar y desplegar el programa

En una **segunda terminal**:

```bash
cd academic_sol
anchor build
anchor deploy
```

Anota el **Program ID** mostrado. El ID por defecto es `7992aXQLFQBb3MpGJG1tZPq9Ed4owWUK2D4bUiWXsBqQ`.

### 4. Copiar el IDL a la web (si cambió)

```bash
cp target/idl/academic_sol.json ../web/types/
```

### 5. Configurar variables de entorno (opcional)

Para subir imágenes a IPFS (Pinata), crea `web/.env.local`:

```
NEXT_PUBLIC_PINATA_JWT=tu_jwt_de_pinata
```

### 6. Instalar dependencias e iniciar la aplicación web

En una **tercera terminal**:

```bash
cd web
npm install
npm run dev
```

La aplicación estará en **http://localhost:3000**

### 7. Configurar la wallet

1. Instala [Phantom](https://phantom.app/) o [Backpack](https://www.backpack.app/)
2. Configura Custom RPC: `http://localhost:8899` (Localnet)
3. Obtén SOL de prueba: `solana airdrop 10 TU_DIRECCION`

---

## Uso de la Aplicación

### Roles predefinidos (localnet)

| Rol        | Dirección (ejemplo) |
|-----------|----------------------|
| Admin     | 5JBvBxtkyen9f4R8FcxUXhkHtdSBqrwYbW9HCUiJUcKz |
| CodeCrypto| 41BkEjrkrZBAmeZSUejibRC5EvfUwMuQrn6krBxdGriL |
| Estudiante| 3UgMMccpqc6dafbUYbdrEizmrDACizxdEKeWe1ALXqd1 |
| Empleador | 6i5HGzBDV7KxFTgWSyW4YQSJVqnZABwozY3LZfKXXrrh |

### Flujo básico

1. **Admin:** Inicializar programa → Registrar institución (CodeCrypto)
2. **CodeCrypto:** Emitir certificados desde Panel de Institución
3. **Estudiante:** Ver mis certificados en Panel de Estudiante
4. **Verificación:** Cualquiera puede verificar en `/verify` con dirección del estudiante + ID

### Verificar un certificado

1. Ve a **http://localhost:3000/verify**
2. Introduce la **dirección del estudiante** (destinatario)
3. Introduce el **ID del certificado** (ej: 1)
4. Clic en **Verificar**

---

## Ejecutar tests

```bash
cd academic_sol
anchor test
```

---

## Documentación adicional

La carpeta `documentos/` contiene documentación detallada:

- `60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md` - Especificación del TFM
- `40 QUICK_START.md` - Guía rápida
- `20 INSTRUCCIONES DE ENTREGA.md` - Instrucciones de entrega
- `limpieza.md` - Plan de limpieza del proyecto

---

## Tecnologías

- **Blockchain:** Solana
- **Programa:** Rust + Anchor
- **Frontend:** Next.js 16, React 19, TypeScript
- **Wallet:** Solana Wallet Adapter (Phantom, Solflare)
- **Almacenamiento:** IPFS (Pinata) para imágenes

---

## Licencia

Proyecto académico - CodeCrypto Academy
