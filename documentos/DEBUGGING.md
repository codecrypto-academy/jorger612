# Guía de Debugging - Pending Role Requests

## Problema: No se ven las solicitudes de rol pendiente

### Checklist de Diagnóstico

#### 1. **Verificar que el programa esté inicializado**
```bash
# En la terminal de localnet, checa los logs
# Deberías ver que se ejecutó la instrucción `initialize`
```

- [ ] ¿Viste el botón "Initializar" en `/dashboard/authority/initialize`?
- [ ] ¿Ejecutaste el inicializar y viste una transacción exitosa?

#### 2. **Verificar que existan solicitudes de rol pendiente**

Abre la consola del navegador (F12) en la página `/dashboard/authority/validate-roles` y busca:

```
"Pending roles accounts:"
```

- [ ] ¿Ves este log?
- [ ] ¿Hay algo en el array después del log?

#### 3. **Verificar que se esté creando una PendingRoleRegistration**

**Pasos a probar:**

1. Abre otra pestaña del navegador
2. Ve a `/register-role`
3. Conecta con una **wallet diferente** (o crea una nueva en Phantom)
4. Selecciona un rol (por ejemplo, "Producer")
5. Haz click en "Request Role"
6. Verifica que la transacción sea exitosa en Solana

**En la consola del navegador (F12):**
- [ ] ¿Ves el error que se reporta?
- [ ] ¿Dice "Pending role already exists"? (significa que ya intentó registrar)

#### 4. **Verificar PDAs correctamente**

Añade este test a la consola del navegador:

```javascript
// Copia esto en la consola del navegador y ejecuta
const { PublicKey } = await import("@solana/web3.js");
const PROGRAM_ID = new PublicKey("27w7DWngggMpAEERYrin3rKKkcyaLFvV5VmvP2nEKFys");
const walletPK = new PublicKey("TU_WALLET_AQUI"); // Reemplaza con tu wallet

const [pendingRolePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("pending_role"), walletPK.toBuffer()],
  PROGRAM_ID
);

console.log("Pending Role PDA:", pendingRolePDA.toString());
```

#### 5. **Verificar que el hook `usePendingRoles` se ejecute**

En la página de validación, abre F12 y deberías ver:

```
Pending roles accounts: [...]
Formatted pending roles: [...]
```

- [ ] ¿Ves estos logs?
- [ ] ¿Cuántos elementos hay en el array?

### Soluciones Comunes

#### Problema: "Error fetching pending roles"
**Solución:**
1. Verifica que el programa esté inicializado
2. Verifica que no haya errores en la consola del navegador
3. Intenta hacer click en "Refresh"

#### Problema: No ves ningún log en la consola
**Solución:**
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Actualiza la página (Ctrl+R)
4. Vuelve a ver los logs

#### Problema: "pending_role is not a valid account"
**Solución:**
1. Verifica que el PDAsea correcto
2. Asegúrate que `program.account.pendingRoleRegistration` existe
3. Verifica que el IDL se importó correctamente

### Test End-to-End Recomendado

1. **Authority inicializa el programa**
   ```
   /dashboard/authority/initialize → Click "Initialize Program"
   ```

2. **Usuario crea solicitud de rol**
   ```
   /register-role → Selecciona un rol → Click "Request Role"
   ```

3. **Authority valida la solicitud**
   ```
   /dashboard/authority/validate-roles → Verifica que se muestre
   ```

4. **Verifica que el rol fue validado**
   ```
   /dashboard → Deberías ver el rol asignado
   ```

### Logs Adicionales para Debugging

Si necesitas ver más detalles, puedes añadir esto temporalmente:

```typescript
// En usePendingRoles.ts, línea ~30
const accounts = await program.account.pendingRoleRegistration.all();

console.log("Raw account data:", {
  count: accounts.length,
  accounts: accounts.map((a) => ({
    pda: a.publicKey.toString(),
    wallet: a.account.wallet.toString(),
    role: a.account.requestedRole,
    timestamp: a.account.createdAt,
  })),
});
```

### Contacto para más ayuda

Si aún no funciona, proporciona:
1. Screenshots de la consola (F12)
2. El estado de la red (¿localnet corriendo?)
3. ¿Qué rol intentaste crear?
4. ¿Qué error exacto ves?
