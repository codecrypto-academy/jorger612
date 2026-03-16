# Plan de limpieza de código — Proyecto Certificación Académica

Este documento describe el análisis de limpieza del proyecto. El proyecto principal es **academic_sol** (certificación académica). Existen restos del proyecto **traza** (trazabilidad supply chain) que ya no se utilizan.

---

## 1. Proyecto traza (carpeta completa)

**Ubicación:** `/traza/`

**Descripción:** Programa Solana separado para trazabilidad de supply chain (roles, tokens, transferencias). No forma parte del flujo actual de academic_sol.

**Acción sugerida:** Eliminar la carpeta `/traza/` si no se planea mantener o reutilizar el programa traza.

---

## 2. Componentes de layout no usados

| Archivo | Motivo |
|---------|--------|
| `web/components/layout/Header.tsx` | Usa `useRole` (traza). No importado en ningún layout. El dashboard usa su propio header inline. |
| `web/components/layout/Sidebar.tsx` | Usa `useRole` (traza). No importado en ningún layout. El dashboard no usa sidebar. |

**Acción sugerida:** Eliminar ambos archivos.

---

## 3. Componentes de token y transferencia (traza)

| Archivo | Motivo |
|---------|--------|
| `web/components/token/TokenCard.tsx` | Usa `useTokens` (traza). No importado en ningún componente de la app. |
| `web/components/token/TokenBalanceCard.tsx` | Usa `useTokenBalances` (traza). No importado. |
| `web/components/transfer/TransferForm.tsx` | Importa `initiateTransfer` de `instructions.ts`, que **no existe** en academic_sol. Código roto y no usado. |

**Acción sugerida:** Eliminar los tres archivos.

---

## 4. Hooks de traza (no usados)

| Archivo | Motivo |
|---------|--------|
| `web/lib/hooks/useRole.ts` | Usa `getRoleRegistryPDA`, `getPendingRolePDA` (no existen en `pda.ts` de academic_sol). Solo traza. |
| `web/lib/hooks/useTokens.ts` | Usa `Traza`, `traceToken`. Solo traza. |
| `web/lib/hooks/useTokenBalances.ts` | Usa `traceToken`. Solo traza. |
| `web/lib/hooks/useTokensByRole.ts` | Usa `Traza`. Solo traza. |
| `web/lib/hooks/useTransfers.ts` | Usa `pendingTransfer`. Solo traza. |
| `web/lib/hooks/usePendingRoles.ts` | Usa `pendingRoleRegistration`. Solo traza. |
| `web/lib/hooks/useValidatedRoles.ts` | Usa `roleRegistry`. Solo traza. |

| `web/lib/hooks/useIsMounted.ts` | No importado en ningún componente. Solo referenciado en docs de hidratación. |

**Nota:** `web/lib/hooks/useDashboardRole.ts` **sí se usa** y debe mantenerse.

**Acción sugerida:** Eliminar los 8 hooks listados.

---

## 5. Tipos y IDL de traza

| Archivo | Motivo |
|---------|--------|
| `web/types/traza.ts` | IDL de traza. No usado por la app. |
| `web/types/traza.json` | JSON del IDL de traza. No usado. |

**Acción sugerida:** Eliminar ambos archivos.

---

## 6. Utilidades de formato y validación (traza)

| Archivo | Usado por |
|---------|-----------|
| `web/lib/utils/format.ts` | TokenCard, TokenBalanceCard, TransferForm, Header (todos traza). |
| `web/lib/utils/validation.ts` | TransferForm (traza). isValidSolanaAddress podría usarse en academic_sol pero actualmente no se usa. |

**Acción sugerida:** Eliminar ambos. Si en el futuro se necesitan `formatAddress` o `isValidSolanaAddress`, se pueden extraer de nuevo o crear versiones mínimas.

---

## 7. Componentes comunes no usados

| Archivo | Motivo |
|---------|--------|
| `web/components/common/LoadingSpinner.tsx` | No importado en ningún componente de la app. |
| `web/components/common/Card.tsx` | No importado en ningún componente de la app. |
| `web/components/common/ClientOnly.tsx` | No importado. Antes se usaba para hidratación; ahora el layout no lo usa. |
| `web/components/common/ErrorMessage.tsx` | No importado en ningún componente de la app. |

**Acción sugerida:** Eliminar los cuatro archivos o conservarlos si se planea usarlos en próximas features.

---

## 8. Páginas placeholder solo con redirección

| Archivo | Comportamiento |
|---------|----------------|
| `web/app/register-role/page.tsx` | Redirige a `/dashboard`. Mensaje: "El sistema de roles ha sido reemplazado por el de instituciones." |
| `web/app/dashboard/authority/validate-roles/page.tsx` | Redirige a `/dashboard`. Mensaje similar. |

**Nota:** `Sidebar.tsx` (no usado) enlaza a estas rutas. Si se elimina Sidebar, no hay enlaces desde la app. Las URLs pueden seguir existiendo por si alguien las tiene guardadas.

**Acción sugerida:** Eliminar ambas páginas o mantenerlas como redirecciones simples si se quiere preservar URLs legacy.

---

## 9. Dependencias npm

| Dependencia | Usado por |
|-------------|-----------|
| `clsx` | Solo `Sidebar.tsx` (no usado). |
| `date-fns` | Solo `TokenCard.tsx` y `format.ts` (ambos traza). |

**Acción sugerida:** Eliminar `clsx` y `date-fns` de `package.json` si se eliminan los componentes y utilidades relacionados.

---

## 10. Documentación y logs

**Acción sugerida:** Mover **todos** los archivos de documentación a una carpeta llamada `documentos` ubicada en la raíz del proyecto (`/documentos/`).

### Archivos de documentación en la raíz

| Archivo | Descripción |
|---------|-------------|
| `manual.md` | Manual del proyecto. |
| `inicio.md` | Documento de inicio. |
| `prompt_migracion.md` | Prompt de migración. |
| `investigacion.md` | Documento de investigación. |
| `VALIDACION_AUTORIDAD_Y_ROLES.md` | Validación de autoridad y roles. |
| `10 DOCUMENTATION_INDEX.md` | Índice de documentación. |
| `20 INSTRUCCIONES DE ENTREGA.md` | Instrucciones de entrega. |
| `30 NGROK_SETUP.md` | Configuración de Ngrok. |
| `40 QUICK_START.md` | Guía de inicio rápido. |
| `50 README.md` | README principal. |
| `60 TFM_SOLANA_ACADEMIC_CERTIFICATES.md` | TFM certificados académicos. |
| `70 TFM_SOLANA_FOOD_TRACEABILITY.md` | TFM trazabilidad alimentaria. |
| `80 TFM_SOLANA_INDUSTRIAL_TRACEABILITY.md` | TFM trazabilidad industrial. |
| `90 TFM_SOLANA_LOGISTICS_TRACEABILITY.md` | TFM trazabilidad logística. |
| `95 TFM_SOLANA_RENEWABLE_ENERGY.md` | TFM energía renovable. |

### Archivos de documentación en `web/`

| Archivo | Descripción |
|---------|-------------|
| `web/FIXES_COMPLETED.md` | Documentación de fixes realizados. |
| `web/DEBUGGING.md` | Guía de debugging (traza). |
| `web/ENUM_NORMALIZATION_FIXES.md` | Fixes de enum. |
| `web/QUICK_START_ES.md` | Guía de inicio rápido (traza). |
| `web/QUICK_FIX_REFERENCE.md` | Referencia de fixes. |
| `web/HYDRATION_FIX.md` | Fixes de hidratación. |
| `web/HYDRATION_FIXED.md` | Fixes de hidratación. |
| `web/FINAL_HYDRATION_FIX.md` | Fixes de hidratación. |
| `web/README.md` | README de la web. |

### Archivos de texto

| Archivo | Descripción |
|---------|-------------|
| `web/2026-02-20-implement-the-following-plan.txt` | Plan de implementación traza. |
| `web/2026-02-21-this-session-is-being-continued-from-a-previous-co.txt` | Continuación de sesión. |

### Otros archivos de documentación (si aplica)

| Archivo | Descripción |
|---------|-------------|
| `academic_sol/README.md` | README del programa academic_sol. |
| `traza/README.md` | README del programa traza. |
| `traza/programs/traza/src/state/retrospectiva.md` | Retrospectiva dentro de traza. |

**Nota:** Una vez haya terminado de ejecutarse toda la limpieza, el archivo `limpieza.md` se moverá también a `documentos/`. **Será el último archivo en moverse** a `documentos/`.

---

## 11. Datos de test y logs

| Ubicación | Descripción |
|-----------|-------------|
| `academic_sol/test-ledger/` | Logs y datos del validador local de tests. |
| `web/.next/` | Carpeta de build de Next.js. |

**Acción sugerida:** Añadir `test-ledger/` y `.next/` a `.gitignore` si no están ya. No eliminar manualmente; son generados.

---

## 12. Resumen de archivos a eliminar (por prioridad)

### Alta prioridad (código muerto / traza)

- `web/components/layout/Header.tsx`
- `web/components/layout/Sidebar.tsx`
- `web/components/token/TokenCard.tsx`
- `web/components/token/TokenBalanceCard.tsx`
- `web/components/transfer/TransferForm.tsx`
- `web/lib/hooks/useRole.ts`
- `web/lib/hooks/useTokens.ts`
- `web/lib/hooks/useTokenBalances.ts`
- `web/lib/hooks/useTokensByRole.ts`
- `web/lib/hooks/useTransfers.ts`
- `web/lib/hooks/usePendingRoles.ts`
- `web/lib/hooks/useValidatedRoles.ts`
- `web/lib/hooks/useIsMounted.ts`
- `web/types/traza.ts`
- `web/types/traza.json`
- `web/lib/utils/format.ts`
- `web/lib/utils/validation.ts`
- `traza/` (carpeta completa)

### Media prioridad (componentes comunes no usados)

- `web/components/common/LoadingSpinner.tsx`
- `web/components/common/Card.tsx`
- `web/components/common/ClientOnly.tsx`
- `web/components/common/ErrorMessage.tsx`

### Baja prioridad (páginas placeholder)

- `web/app/register-role/page.tsx`
- `web/app/dashboard/authority/validate-roles/page.tsx`

### Dependencias (tras eliminar código)

- `clsx`
- `date-fns`

### Documentación

- **Mover todos los archivos de documentación** a la carpeta `documentos/` en la raíz del proyecto (ver sección 10).
- **Al finalizar la limpieza:** Mover `limpieza.md` a `documentos/` — será el último archivo en moverse.

---

## 13. Archivos que SÍ se usan (no eliminar)

- `web/lib/hooks/useDashboardRole.ts`
- `web/lib/utils/pda.ts`
- `web/lib/utils/credential.ts`
- `web/lib/utils/pinata.ts`
- `web/lib/solana/instructions.ts`
- `web/lib/solana/credentials.ts`
- `web/lib/solana/constants.ts`
- `web/lib/context/ProgramProvider.tsx`
- `web/lib/context/WalletProvider.tsx`
- `web/components/JsonLdPopup.tsx`
- `web/components/WalletChangeDetector.tsx`
- `web/types/academic_sol.ts` / `academic_sol.json`

---

## 14. Próximos pasos

1. Revisar este documento.
2. Indicar qué secciones aplicar (todas, solo alta prioridad, etc.).
3. **Documentación:** Crear la carpeta `documentos/` en la raíz del proyecto y mover allí todos los archivos de documentación listados en la sección 10.
4. Ejecutar la limpieza según las instrucciones que indiques.
5. Ejecutar `npm run build` y tests para validar que todo sigue funcionando.
6. **Paso final:** Mover `limpieza.md` a `documentos/`. Este será el último archivo en moverse a `documentos/`.
