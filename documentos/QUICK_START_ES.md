# Quick Start - Solana Trazabilidad 🚀

## Flujo Completo Paso a Paso

### 1️⃣ INITIALIZAR PROGRAMA (Solo la primera vez)

**Quién:** La autoridad del programa (tu wallet)
**Dónde:** `http://localhost:3000/dashboard/authority/initialize`
**Qué hacer:**
1. Conecta tu wallet
2. Click en "Initialize Program"
3. Espera la confirmación

**✅ Verificación:**
- La transacción aparece en el navegador sin errores
- En la consola (F12) ves: "Program initialized: <txn_hash>"

---

### 2️⃣ CREAR SOLICITUD DE ROL

**Quién:** Cualquier usuario (con wallet diferente a la authority)
**Dónde:** `http://localhost:3000/register-role`
**Qué hacer:**
1. Conecta una wallet **DIFERENTE** a la authority
2. Selecciona tu rol:
   - Producer (crea tokens)
   - Factory (procesa tokens)
   - Retailer (vende tokens)
   - Consumer (recibe tokens)
3. Click "Request Role"

**✅ Verificación:**
- En F12 Console ves:
  ```
  Registering role: { wallet: "...", role: "producer", roleVariant: {...} }
  Register role transaction: "..."
  ```
- Te redirige a `/dashboard`

---

### 3️⃣ VALIDAR ROL (Authority aprueba)

**Quién:** La authority
**Dónde:** `http://localhost:3000/dashboard/authority/validate-roles`
**Qué hacer:**
1. Vuelve a connectarte como authority
2. En la página deberías ver la solicitud pendiente:
   ```
   📋 [wallet truncado...xyz]
   Requesting: Producer
   ```
3. Click "Validate"

**✅ Verificación:**
- En F12 Console ves:
  ```
  Pending roles accounts: [1 object]
  Formatted pending roles: [1 object]
  ```
- La solicitud desaparece de la lista

---

### 4️⃣ VER DASHBOARD CON ROL ASIGNADO

**Dónde:** `http://localhost:3000/dashboard`
**Qué deberías ver:**
- Tu nombre de wallet
- Badge con tu rol: **Producer**
- Menú dinámico según tu rol

**Para Producer:**
- ➕ Crear Token
- 📦 Mis Tokens
- 📤 Transferencias

---

## 🔍 Debugging Rápido

### "No veo pending role requests"

**Paso 1:** Abre F12 (Developer Tools)
```
F12 → Console
```

**Paso 2:** En `/dashboard/authority/validate-roles`, deberías ver:
```
Pending roles accounts: Array(0)  // ← Aquí dice cuántos hay
Formatted pending roles: []
```

**Paso 3:** Si está vacío:
- ¿Creaste una solicitud de rol con otra wallet?
- Verifica que la transacción de registro fue exitosa
- Intenta crear otra solicitud

**Paso 4:** Si ves el error:
- Copia el error completo
- Verifica que `solana-test-validator` esté corriendo
- Verifica que el programa fue desplegado

---

## 🚨 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Please connect your wallet" | Usa Phantom/Solflare y conéctate a devnet/localnet |
| "Pending role already exists" | Esta wallet ya tiene una solicitud. Usa otra wallet |
| "Metadata exceeds maximum length" | Descripción muy larga (máx 256 caracteres) |
| "Invalid transfer path" | Producer → Factory, Factory → Retailer, Retailer → Consumer |
| No veo mi rol en el badge | Recarga la página (Ctrl+R) |

---

## 📝 Test End-to-End (5 minutos)

```
Terminal 1:
$ solana-test-validator

Terminal 2:
$ cd web && npm run dev
```

**Escenario: Crear un token y transferirlo**

1. **Authority inicializa**
   - Wallet A → /dashboard/authority/initialize
   - ✅ "Program initialized"

2. **Producer se registra**
   - Wallet B → /register-role → "Producer"
   - ✅ "Transaction confirmed"

3. **Authority valida**
   - Wallet A → /dashboard/authority/validate-roles
   - ✅ Ve a Wallet B en la lista
   - ✅ Click "Validate"

4. **Producer crea token**
   - Wallet B → /dashboard/producer/create-token
   - Metadata: "Café Colombiano"
   - Amount: 100
   - ✅ "Token created"

5. **Producer transfiere a Factory**
   - Wallet B → /dashboard/producer/transfers
   - Selecciona token
   - Dirección: Wallet C
   - ✅ "Transfer initiated"

6. **Factory acepta**
   - Wallet C → /dashboard/factory/transfers
   - Tab: "Received"
   - ✅ "Accept Transfer"

---

## 🎯 Próximos Pasos

1. Crea usuarios para cada rol (Producer, Factory, Retailer, Consumer)
2. Ejecuta el flujo completo
3. Verifica en la consola que todo funcione
4. Prueba con transacciones reales

¡Éxito! 🎉
