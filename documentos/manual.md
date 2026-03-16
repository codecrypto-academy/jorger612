# Manual de Uso - Certificación Académica Digital (academic_sol)

Guía detallada para usar cada funcionalidad del sistema de emisión y verificación de certificados académicos en Solana.

---

## Requisitos previos

- **Validador local** corriendo: `solana-test-validator --ledger test-ledger`
- **Programa desplegado**: `cd academic_sol && anchor deploy`
- **Web en ejecución**: `cd web && npm run dev`
- **Wallet conectada** (Backpack u otra) configurada en Custom RPC → `http://localhost:8899`
- **SOL en la wallet**: `solana airdrop 10 TU_DIRECCION`

---

## Estructura de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Página de inicio (landing) |
| `/verify` | Verificar certificados (público, no requiere wallet) |
| `/dashboard` | Panel principal (requiere wallet conectada) |
| `/dashboard/authority/initialize` | Inicializar programa (solo authority) |
| `/dashboard/institution` | Panel de institución: emitir, revocar |
| `/dashboard/student` | Mis certificados como estudiante |

---

## 1. Inicializar el programa

**Quién:** La wallet que desplegó el programa (o la primera que ejecute esta acción).

**Dónde:** `/dashboard/authority/initialize` o desde el Dashboard si eres authority.

**Pasos:**
1. Conecta tu wallet.
2. Ve a **Dashboard** → **Inicializar Programa (Authority)**.
3. Haz clic en **"Inicializar Programa"**.
4. Firma la transacción en tu wallet.
5. Espera la confirmación. Verás un mensaje de éxito.

**Qué hace:** Registra tu wallet como **authority** del programa. Solo puede hacerse **una vez**. El authority puede registrar instituciones.

**Nota:** Si no ves la opción "Inicializar Programa" en el Dashboard, es porque el programa ya fue inicializado o tu wallet no es la que debe hacerlo.

---

## 2. Registrar una institución

**Quién:** El authority (la wallet que inicializó el programa).

**Dónde:** `/dashboard/institution`

**Pasos:**
1. Conecta la wallet del **authority**.
2. Ve a **Dashboard** → **Panel de Institución**.
3. En la sección **"2. Registrar Institución"**, haz clic en **"Registrar Mi Wallet como Institución"**.
4. Firma la transacción.

**Qué hace:** Registra tu wallet como institución (universidad) en el sistema. Una vez registrada, podrás emitir certificados.

**Flujo alternativo:** Si el authority quiere registrar a **otra** wallet como institución, debería usar el programa directamente (por ejemplo, desde tests o una herramienta CLI), ya que la interfaz actual registra la wallet conectada.

---

## 3. Emitir un certificado

**Quién:** Una institución registrada.

**Dónde:** `/dashboard/institution`

**Pasos:**
1. Conecta la wallet de la **institución**.
2. Ve a **Panel de Institución**.
3. En la sección **"3. Emitir Certificado"**, rellena:
   - **Dirección del estudiante (recipient):** La dirección pública (Pubkey) de la wallet del estudiante.
   - **Email del estudiante:** Para el JSON-LD del certificado (opcional pero recomendado).
   - **Nombre del programa:** Ej. "Máster en Blockchain", "Curso de Solidity".
   - **Tipo de credencial:** Diploma, Certificate o Badge.
4. Haz clic en **"Emitir Certificado"**.
5. Firma la transacción.

**Qué hace:** Crea un certificado on-chain asociado al estudiante. El certificado recibe un **ID** automático (1, 2, 3... por institución). El hash del documento JSON-LD se almacena en blockchain.

**Importante:** Guarda el **ID del certificado** y la **dirección de la institución** para poder verificar después.

---

## 4. Verificar un certificado

**Quién:** Cualquiera (empleadores, estudiantes, verificadores). **No requiere conectar wallet.**

**Dónde:** `/verify` o desde el enlace "Verificar Certificado" en la página de inicio.

**Pasos:**
1. Ve a **Verificar Certificado** (`/verify`).
2. Introduce:
   - **Dirección de la Institución:** La Pubkey de la wallet de la institución que emitió el certificado (ej. `7992aXQLFQBb3MpGJG1tZPq9Ed4owWUK2D4bUiWXsBqQ`).
   - **ID del Certificado:** El número asignado (1, 2, 3...).
3. Haz clic en **"Verificar"**.
4. Revisa el resultado: **Válido**, **Revocado** o **Expirado**.

**Qué muestra:** Programa, tipo, emisor, fecha de emisión y destinatario del certificado.

---

## 5. Revocar un certificado

**Quién:** La institución que emitió el certificado.

**Dónde:** `/dashboard/institution`

**Pasos:**
1. Conecta la wallet de la **institución**.
2. Ve a **Panel de Institución**.
3. En la sección **"4. Revocar Certificado"**, introduce el **ID del certificado** a revocar.
4. Haz clic en **"Revocar"**.
5. Firma la transacción.

**Qué hace:** Cambia el estado del certificado a **Revocado**. A partir de ese momento, la verificación mostrará "Certificado REVOCADO".

**Casos de uso:** Fraude académico, error en la emisión, solicitud del estudiante, etc.

---

## 6. Ver mis certificados (estudiante)

**Quién:** Cualquier wallet que haya recibido certificados.

**Dónde:** `/dashboard/student`

**Pasos:**
1. Conecta tu wallet (la del estudiante).
2. Ve a **Dashboard** → **Mis Certificados**.
3. Se mostrarán todos los certificados emitidos a tu dirección.

**Qué muestra:** Para cada certificado: nombre del programa, tipo (Diploma/Certificate/Badge), institución emisora, fecha de emisión, ID y estado (Válido/Revocado/Expirado).

---

## Flujo completo recomendado

```
1. Desplegar programa (anchor deploy)
2. Inicializar (authority) → /dashboard/authority/initialize
3. Registrar institución (authority) → /dashboard/institution
4. Emitir certificado (institución) → /dashboard/institution
5. Verificar certificado → /verify (con dirección institución + ID)
6. [Opcional] Revocar certificado → /dashboard/institution
7. [Opcional] Estudiante ve sus certificados → /dashboard/student
```

---

## Datos necesarios para verificar

Para que un tercero verifique un certificado, necesita:

| Dato | Descripción | Dónde obtenerlo |
|------|-------------|-----------------|
| **Dirección de la institución** | Pubkey de la wallet de la universidad | La institución la comparte (ej. en el diploma digital) |
| **ID del certificado** | Número único por institución (1, 2, 3...) | Aparece al emitir o en "Mis Certificados" del estudiante |

---

## Tipos de certificado

| Tipo | Uso típico |
|------|------------|
| **Diploma** | Títulos universitarios, másteres, doctorados |
| **Certificate** | Cursos, talleres, bootcamps |
| **Badge** | Competencias específicas, micro-credenciales |

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| "Account not found" al verificar | Comprueba que la dirección de la institución y el ID sean correctos. |
| No puedo registrar institución | Debes ser el authority. Solo quien inicializó puede registrar. |
| No veo "Inicializar" en el Dashboard | El programa ya fue inicializado o tu wallet no es la autorizada. |
| "Insufficient funds" | Pide SOL: `solana airdrop 10 TU_DIRECCION` |
| La web no conecta | Verifica que Backpack use Custom RPC → `http://localhost:8899` |

---

## Resumen de roles

| Rol | Acciones |
|-----|----------|
| **Authority** | Inicializar programa, registrar instituciones |
| **Institución** | Emitir certificados, revocar certificados |
| **Estudiante** | Ver sus certificados en "Mis Certificados" |
| **Verificador** | Verificar cualquier certificado en `/verify` (sin wallet) |
