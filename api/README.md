# API RBAC - Árbol de Permisos

API de consumo del sistema RBAC para obtener el árbol de permisos (usuario, rol, menús) por `address` y `login`.

## Requisitos

- Node.js 18+
- Anvil (o nodo Ethereum) en `http://localhost:8545` con el contrato SecurityManager desplegado

## Instalación

```bash
cd api
npm install
cp .env.example .env   # Opcional: ajustar RPC y CONTRACT_ADDRESS
```

## Inicio

```bash
npm run dev    # Con --watch
# o
npm start
```

Por defecto escucha en `http://localhost:3001`.

## Endpoint

### POST /permissions/tree

**Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "login": "admin"
}
```

**Respuestas:**

| Condición | HTTP | JSON |
|-----------|------|------|
| Todo válido | 200 | `{ usuario, rol, menu }` |
| Cuenta no registrada | 401 | `{ "error": 800, "message": "cuenta no registrada" }` |
| Usuario/rol inactivo | 403 | `{ "error": 801, "message": "Usuario sin funcionalidades Activas" }` |
| Usuario no encontrado | 404 | `{ "error": 404, "message": "usuario no encontrado" }` |

**Ejemplo de éxito (200):**
```json
{
  "usuario": { "id": 1, "login": "admin", "nombre": "Administrador" },
  "rol": { "id": 1, "nombre": "Admin" },
  "menu": [
    { "id": "1", "label": "Dashboard", "allowed": true },
    { "id": "2", "label": "Reportes", "allowed": true }
  ]
}
```

## Variables de entorno

| Variable | Default |
|----------|---------|
| RPC_URL | http://localhost:8545 |
| CONTRACT_ADDRESS | 0x5FbDB2315678afecb367f032d93F642f64180aa3 |
| PORT | 3001 |
