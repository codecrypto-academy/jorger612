# ⚡ Quick Start - Traza en 15 minutos

Guía rápida para estudiantes que quieren correr el proyecto **YA**.

## 📋 Requisitos Previos (5 min)

### 1. Instalar Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### 2. Instalar Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="/home/usuario/.local/share/solana/install/active_release/bin:$PATH"
```

### 3. Instalar Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
```

### 4. Instalar Node.js 18+
```bash
# Recomendado: usar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install 18
nvm use 18
```

### 5. Descargar Backpack
Ve a [backpack.app](https://www.backpack.app/) e instala la extensión

---

## 🚀 Correr el Proyecto (10 min)

### Terminal 1: Validador Local

```bash
cd solana_trazabilidad
solana-test-validator --ledger test-ledger
```

Espera hasta ver:
```
✓ Validator startup complete
```

### Terminal 2: Compilar y Desplegar Programa

```bash
cd solana_trazabilidad/traza
anchor build
anchor deploy
```

Anota el **Program ID** que ves (ej: `27w7DWngggMpAEERYrin3rKKkcyaLFvV5VmvP2nEKFys`)

### Terminal 3: Correr App Web

```bash
cd solana_trazabilidad/web
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## 🔗 Configurar Backpack (2 min)

### Opción A: Localhost (Misma Máquina)

1. Abre la extensión **Backpack**
2. Crea/importa una wallet
3. Haz clic en el botón de red (arriba)
4. Selecciona **Custom RPC** o **Agregar Red**
5. Ingresa:
   - **Name**: Localnet
   - **RPC URL**: `http://localhost:8899`
6. Haz clic en guardar
7. **Abre Backpack**, ahora debe mostrar tus fondos

### Opción B: Si Localhost no Funciona (Usar ngrok)

Si `http://localhost:8899` no funciona desde tu navegador:

```bash
# 1. Instalar ngrok (una sola vez)
# En macOS:
brew install ngrok

# En Linux/Windows: descarga desde https://ngrok.com/download

# 2. Crear un túnel a tu validador
ngrok http 8899
```

Verás algo como:
```
Forwarding: https://1a2b3c4d5e6f.ngrok.io -> http://localhost:8899
```

**En Backpack, usa la URL de ngrok:**
- **RPC URL**: `https://1a2b3c4d5e6f.ngrok.io` (copia la tuya)

---

**¿Cuándo usar ngrok?**
- ✅ Si Backpack/navegador está en otra máquina
- ✅ Si usas VPN o red diferente
- ❌ Si todo está en tu máquina (usa localhost)

---

## 💰 Obtener SOL

En **Terminal 1 (donde corre el validador)** abre una nueva pestaña o nueva terminal:

```bash
# Obtener tu dirección pública de Backpack
# (La ves en la extensión, algo como: 9B5X6wrjCYstBgq2n6Bhyzcn91ztYWqJ7FSVqwNAv7fs)

solana airdrop 10 TU_DIRECCION_PUBLICA
```

**Backpack se actualizará automáticamente en segundos.** ✅

---

## ✅ Verificar Todo Funciona

1. **Abre http://localhost:3000**
2. Haz clic en "Conectar Wallet" (arriba a la derecha)
3. Backpack te pide permiso → Autoriza
4. Deberías ver tu dirección conectada
5. Ahora puedes:
   - Registrar un rol
   - Ver el dashboard
   - Crear tokens (si eres Producer)

---

## 🔀 Cambiar entre Redes

### Cambiar CLI a Devnet

```bash
solana config set --url https://api.devnet.solana.com

# Pedir SOL
solana airdrop 2

# Desplegar
cd traza
anchor deploy
```

### Cambiar Backpack

Haz clic en el nombre de la red (arriba) y selecciona **Devnet**

---

## 📚 ¿Qué Sigue?

- Lee el **[README completo](./README.md)** para entender todo el sistema
- Lee **[traza/README.md](./traza/README.md)** para detalles técnicos del programa
- Explora el código:
  - `traza/programs/traza/src/lib.rs` - Instrucciones
  - `web/app/dashboard/` - Interfaces por rol

---

## 🐛 Si Algo Falla

### "Validador no inicia"
```bash
rm -rf test-ledger
solana-test-validator --ledger test-ledger
```

### "Program not found"
```bash
# Asegúrate que está desplegado
solana address  # Debe haber fondos
anchor deploy
```

### "Backpack no se conecta"
1. Recarga la página (F5)
2. Abre Backpack y verifica que tengas saldo
3. Intenta de nuevo

### "No tengo SOL"
```bash
solana airdrop 10 $(solana address)
```

---

## 🎯 Resumen de Comandos

```bash
# Terminal 1: Validador
solana-test-validator --ledger test-ledger

# Terminal 2: Programa
cd traza && anchor build && anchor deploy

# Terminal 3: Web
cd web && npm install && npm run dev

# Extras
solana airdrop 10  # Pedir SOL
solana balance     # Ver saldo
solana config get  # Ver config
```

---

## 🚨 Emergencias

**"Todo se rompió, empiezo de nuevo"**

```bash
# Limpiar todo
rm -rf solana_trazabilidad/test-ledger
rm -rf solana_trazabilidad/traza/target
rm -rf solana_trazabilidad/web/node_modules
rm -rf solana_trazabilidad/web/.next

# Empezar de nuevo desde el principio
# (Sigue los pasos de "Correr el Proyecto")
```

---

## 📖 Referencias Rápidas

- **Backpack**: https://www.backpack.app
- **Faucet** (Devnet/Testnet): https://faucet.solana.com
- **Docs Solana**: https://docs.solana.com
- **Docs Anchor**: https://www.anchor-lang.com

---

**¿Listo? ¡Abre 3 terminales y sigue los pasos!** 🚀
