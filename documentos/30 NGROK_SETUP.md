# 🌐 Usar ngrok - Acceder a Localnet desde Otra Red

Guía completa para usar **ngrok** cuando `localhost:8899` no funciona.

## ¿Cuándo Necesito ngrok?

| Situación | ¿Necesito ngrok? |
|-----------|-----------------|
| Todo en mi máquina (CLI + Backpack) | ❌ No |
| Validador en mi máquina, Backpack en otra máquina | ✅ Sí |
| Validador remoto (servidor), Backpack en mi PC | ✅ Sí |
| Usando VPN o proxy | ✅ Sí |
| Varias máquinas en red diferente | ✅ Sí |

---

## 📥 Instalar ngrok

### macOS
```bash
brew install ngrok
```

### Linux
```bash
# Descargar
curl -LO https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip

# Descomprimir
unzip ngrok-v3-stable-linux-amd64.zip

# Instalar
sudo mv ngrok /usr/local/bin/
```

### Windows
1. Descarga desde [ngrok.com/download](https://ngrok.com/download)
2. Descomprimir el .zip
3. Agregar a PATH (opcional)

### Verificar instalación
```bash
ngrok --version
```

---

## 🚀 Crear un Túnel a Localnet

### Paso 1: Asegurate que el validador esté corriendo

En tu máquina con el validador:
```bash
solana-test-validator --ledger test-ledger
```

### Paso 2: Crear el túnel ngrok

En una **nueva terminal** en la MISMA máquina donde corre el validador:

```bash
ngrok http 8899
```

Verás algo como:

```
Session Status                online
Account                       [tu email]
Version                       3.3.0
Region                        us-california
Forwarding                    https://1a2b3c4d5e6f.ngrok.io -> http://127.0.0.1:8899
Forwarding                    http://1a2b3c4d5e6f.ngrok.io -> http://127.0.0.1:8899

Web Interface                 http://127.0.0.1:4040
```

### Paso 3: Copiar la URL de ngrok

**La URL es**: `https://1a2b3c4d5e6f.ngrok.io` (copia la tuya)

---

## 🔗 Usar la URL en Backpack

### En Backpack (otra máquina)

1. Abre la extensión Backpack
2. Haz clic en el nombre de la red (arriba)
3. Selecciona **"Custom RPC"** o **"Agregar Red"**
4. Ingresa:
   - **Name**: Localnet (o lo que quieras)
   - **RPC URL**: `https://1a2b3c4d5e6f.ngrok.io`
5. Guarda

**El saldo debería aparecer en 5-10 segundos** ✅

---

## 💰 Pedir SOL (desde máquina con validador)

```bash
# En la máquina con el validador, en una terminal nueva

# Obtén tu dirección pública de Backpack
# (La ves en la extensión)

solana airdrop 10 TU_DIRECCION_PUBLICA
```

**Backpack se actualizará automáticamente** ⚡

---

## 🌐 Usar la URL en la App Web

Si la app web también está en otra máquina:

### 1. Cambiar el endpoint en la app web

En `web/app/layout.tsx` (o donde se configure el provider):

```typescript
// ❌ Antes (localhost)
const endpoint = "http://localhost:8899";

// ✅ Después (ngrok)
const endpoint = "https://1a2b3c4d5e6f.ngrok.io";
```

### 2. Reiniciar la app web
```bash
npm run dev
```

---

## 🔍 Monitores y Debug con ngrok

### Ver Peticiones HTTP

ngrok tiene una interfaz web en `http://localhost:4040`

1. Abre [http://localhost:4040](http://localhost:4040) en tu navegador
2. Verás todas las peticiones entre Backpack y tu validador
3. Útil para debuggear problemas de conexión

---

## ⚙️ Configuración Avanzada

### Cambiar Región de ngrok

ngrok elige la región automáticamente. Para forzar una región:

```bash
ngrok http 8899 --region us  # Estados Unidos
ngrok http 8899 --region eu  # Europa
ngrok http 8899 --region ap  # Asia-Pacífico
```

### Túnel más rápido

```bash
ngrok http 8899 --bind-tls false  # Usa HTTP (más rápido, menos seguro)
```

### Múltiples puertos simultáneamente

```bash
ngrok http 8899 3000  # Validador + Next.js
```

---

## 🐛 Troubleshooting ngrok

### "Error: too many connections"

ngrok tiene límite de conexiones en plan gratuito. Soluciones:
```bash
# 1. Crear cuenta en ngrok.com
# 2. Autenticarse
ngrok config add-authtoken TU_TOKEN

# 3. Reintentar
ngrok http 8899
```

### "Timeout" o conexión lenta

```bash
# Intentar con región diferente
ngrok http 8899 --region eu

# O ver si hay problemas de red
ping ngrok.io
```

### "Connection refused"

```bash
# Verifica que el validador esté corriendo
solana-test-validator --ledger test-ledger

# Verifica que esté en puerto 8899
solana config get
```

### La URL caduca cada vez que reinicio ngrok

**Es normal.** Cada vez que corres `ngrok http 8899` te da una URL nueva.

**Solución**: Paga por ngrok pro para URLs estáticas, o crea un script:

```bash
#!/bin/bash
# save_ngrok_url.sh

echo "Iniciando ngrok..."
ngrok http 8899 &

sleep 2

echo "URL de ngrok:"
curl http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4
```

---

## 📊 Arquitectura con ngrok

```
┌─────────────────────────────────┐
│ Máquina A (Desarrollador)       │
├─────────────────────────────────┤
│                                 │
│  solana-test-validator          │
│  :8899                          │
│        ↑                        │
│        └─ ngrok tunnel          │
│           https://xxxxx.ngrok.io│
│                                 │
└──────────────┬──────────────────┘
               │
         [Internet]
               │
┌──────────────▼──────────────────┐
│ Máquina B (Otra red)            │
├─────────────────────────────────┤
│                                 │
│  Backpack Wallet                │
│  App Web (localhost:3000)       │
│                                 │
│  Conectados a:                  │
│  https://xxxxx.ngrok.io         │
│                                 │
└─────────────────────────────────┘
```

---

## 🎯 Caso de Uso Real: Laboratorio

**Situación**: Tienes un servidor con Solana en el laboratorio, quieres que estudiantes se conecten desde sus PCs.

### En el Servidor del Laboratorio

```bash
# Terminal 1: Validador
solana-test-validator --ledger test-ledger

# Terminal 2: ngrok
ngrok http 8899

# Compartir URL con estudiantes (ej: https://abc123.ngrok.io)
```

### En la PC del Estudiante

```bash
# Opción A: Cambiar CLI
solana config set --url https://abc123.ngrok.io
solana airdrop 10

# Opción B: En Backpack
# Custom RPC: https://abc123.ngrok.io

# Opción C: En app web
# Cambiar endpoint a https://abc123.ngrok.io
```

**¡Todos conectados al mismo validador!** 🎉

---

## ✅ Checklist ngrok

- [ ] ngrok instalado: `ngrok --version`
- [ ] Validador corriendo: `solana-test-validator`
- [ ] Túnel activo: `ngrok http 8899`
- [ ] URL copiada (ej: `https://1a2b3c4d5e6f.ngrok.io`)
- [ ] Backpack configurado con URL de ngrok
- [ ] App web apunta a URL de ngrok
- [ ] Saldo visible en Backpack
- [ ] Transacciones funcionan

---

## 📚 Más Información

- **ngrok Docs**: https://ngrok.com/docs
- **Pricing**: https://ngrok.com/pricing (gratuito y pago)
- **Tutorial**: https://ngrok.com/docs/getting-started

---

**¿Preguntas? Revisa los logs de ngrok o contacta al profesor.** 💬
