# Configuración de Variables de Entorno

## Archivo .env.local

Este proyecto requiere un archivo `.env.local` en la **raíz del proyecto** (misma carpeta que `package.json`) para configurar la dirección del smart contract.

### Pasos para crear el archivo:

1. **Crear el archivo `.env.local`** en la raíz del proyecto:
   ```bash
   touch .env.local
   ```

2. **Agregar la siguiente variable de entorno**:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

### Ubicación del archivo:

El archivo debe estar en la raíz del proyecto `web/`:
```
supply-chain-tracker/
  └── web/
      ├── .env.local          ← Aquí
      ├── package.json
      ├── app/
      └── ...
```

### Variables de Entorno Disponibles:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Dirección del smart contract desplegado | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |

### Importante:

- **No commitear** el archivo `.env.local` al repositorio (ya está en `.gitignore`)
- El prefijo `NEXT_PUBLIC_` es necesario para que la variable esté disponible en el cliente (browser)
- Si no se define la variable, se usará el valor por defecto
- Después de modificar `.env.local`, **reiniciar el servidor de desarrollo**:
  ```bash
  # Detener el servidor (Ctrl+C)
  # Luego reiniciar
  npm run dev
  ```

### Ejemplo de contenido del archivo:

```env
# Smart Contract Address
# Contract address for the Supply Chain Tracker smart contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Verificación:

Para verificar que la variable está configurada correctamente, revisa los logs del servidor al iniciar. Deberías ver el address del contrato sin advertencias.

Si ves el mensaje: `⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS not set in environment variables`, significa que la variable no está configurada.

