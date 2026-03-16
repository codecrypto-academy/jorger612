# Pasos para Ejecutar el Proyecto academic_sol

Guía de los pasos para ejecutar el proyecto de Certificación Académica Digital (academic_sol) tras la migración.

---

## 1. Verificar compilación del programa

```bash
cd academic_sol
anchor build
```

- Si hay errores de compilación, corregirlos antes de seguir.
- El build genera `target/deploy/academic_sol.so` y `target/idl/academic_sol.json`.

---

## 2. Iniciar el validador local

```bash
solana-test-validator --ledger test-ledger
```

- Esperar hasta ver `✓ Validator startup complete`.
- Mantener esta terminal abierta.

---

## 3. Desplegar el programa

```bash
cd academic_sol
anchor deploy
```

- Anotar el **Program ID** que se muestre.
- Si cambia respecto al anterior (`27w7DWngggMpAEERYrin3rKKkcyaLFvV5VmvP2nEKFys`), habrá que actualizar referencias.

---

## 4. Actualizar configuración del proyecto

| Archivo | Qué actualizar |
|---------|----------------|
| `academic_sol/Anchor.toml` | `[programs.localnet] academic_sol = "NUEVO_PROGRAM_ID"` |
| `web/lib/solana/constants.ts` | `PROGRAM_ID = new PublicKey("NUEVO_PROGRAM_ID")` |
| `web/types/` | Copiar el IDL: `cp academic_sol/target/idl/academic_sol.json web/types/` y actualizar imports en el código que use el IDL |

---

## 5. Ejecutar tests del programa

```bash
cd academic_sol
anchor test
```

- Si algún test falla, revisar la lógica del programa o los tests.
- Los tests suelen levantar un validador temporal; si usas uno propio, puede que tengas que ajustar la configuración.

---

## 6. Instalar dependencias y arrancar la web

```bash
cd web
npm install
npm run dev
```

- Si hay errores de importación (IDL, tipos, PDAs), corregirlos.
- La app debería estar en `http://localhost:3000`.

---

## 7. Configurar la wallet (Backpack)

1. Conectar Backpack a **Custom RPC** → `http://localhost:8899`.
2. Obtener SOL de prueba:
   ```bash
   solana airdrop 10 TU_DIRECCION_PUBLICA
   ```

---

## 8. Flujo funcional básico

1. **Inicializar el programa**
   - Conectar wallet del authority.
   - Ir a la ruta de inicialización (ej. `/dashboard/authority/initialize` o equivalente).
   - Ejecutar `initialize`.

2. **Registrar institución**
   - Conectar wallet del authority.
   - Registrar una institución con `register_institution`.

3. **Emitir certificado**
   - Conectar wallet de la institución.
   - Ir al formulario de emisión.
   - Emitir un certificado con `issue_credential`.

4. **Verificar certificado**
   - Ir a `/verify`.
   - Introducir ID o hash del certificado.
   - Comprobar que se muestra como válido.

5. **Revocar certificado**
   - Desde el panel de institución, revocar un certificado.
   - Volver a `/verify` y comprobar que aparece como revocado.

---

## 9. Checklist de validación

- [ ] `anchor build` sin errores
- [ ] `anchor deploy` correcto
- [ ] `anchor test` pasando
- [ ] Web arranca sin errores
- [ ] Wallet conectada y con SOL
- [ ] Inicialización del programa correcta
- [ ] Registro de institución correcto
- [ ] Emisión de certificado correcta
- [ ] Verificación en `/verify` correcta
- [ ] Revocación y verificación posterior correctas
- [ ] El programa y la carpeta se llaman `academic_sol`

---

## 10. Posibles problemas

| Problema | Acción |
|----------|--------|
| Program ID distinto | Actualizar `Anchor.toml`, `constants.ts` y cualquier referencia al ID antiguo |
| IDL no encontrado | Copiar `academic_sol/target/idl/academic_sol.json` a `web/types/` y ajustar imports |
| Errores de tipos en web | Regenerar tipos desde el IDL o actualizar manualmente |
| "Account not found" | Comprobar que el programa está desplegado y que se usan las PDAs correctas |
| Validador reiniciado | Volver a ejecutar `anchor deploy` |

---

## Orden recomendado

```
1. cd academic_sol && anchor build
2. solana-test-validator (Terminal 1)
3. cd academic_sol && anchor deploy
4. Actualizar Program ID en academic_sol/Anchor.toml y web/lib/solana/constants.ts
5. cp academic_sol/target/idl/academic_sol.json web/types/
6. cd academic_sol && anchor test
7. cd web && npm install && npm run dev (Terminal 2)
8. Configurar Backpack + airdrop
9. Probar flujo: initialize → register_institution → issue_credential → verify → revoke
```
