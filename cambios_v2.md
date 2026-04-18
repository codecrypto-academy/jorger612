# Cambios v2 — Formulario Market, MongoDB y despliegue

Este documento describe los cambios añadidos (formulario **Market**, persistencia en **MongoDB**, Docker) y los pasos para reproducir el entorno y probar el flujo de punta a punta.

## Qué se añadió

- **Dapp**
  - Enlace **«Mi Primera Vez»** debajo del texto sobre MetaMask en la pantalla de bienvenida; navega a `/market`.
  - Página **`/market`** con formulario **Market** (estilo alineado al diseño actual, sin usar negro como color de texto; se usan tokens del design system).
  - La ruta `/market` usa el mismo layout tipo **landing** (barra superior sin menú lateral) que la pantalla inicial sin wallet conectada.
  - En desarrollo, **Next.js** reescribe `/api/*` hacia la API (por defecto `http://127.0.0.1:3005`). Puede cambiarse con la variable **`API_REWRITE_TARGET`** en el entorno al construir/ejecutar la dapp.

- **API (Fastify)**
  - Conexión a MongoDB al arrancar (con reintentos para arranque junto a Docker).
  - **`POST /market/leads`**: guarda en la colección **`market_leads`** de la base indicada en la URI (p. ej. `rbac_market`). El cuerpo JSON incluye: `walletAddress`, `email`, y opcionalmente `nombreApellido`, `telefono`, `descripcionAplicacion`. **No** se almacena el campo de confirmación de correo (solo validación en el front).

- **Docker Compose (raíz)**
  - Servicio **`mongo`**: imagen `mongo:7`, puerto **27019** en el host mapeado al **27017** del contenedor, volumen persistente `mongo_market_data`.
  - Servicio **`api`**: variables **`PORT=3005`** y **`MONGODB_URI=mongodb://mongo:27017/rbac_market`** para que coincidan con **nginx** (`api:3005`) y con el servicio `mongo` en la red interna.

- **Nginx**
  - Las peticiones del navegador a **`/api/...`** se proxifican al servicio API **sin** el prefijo `/api` (p. ej. `POST /api/market/leads` → upstream `POST /market/leads`).

---

## Requisitos

- Docker y Docker Compose.
- Node.js 20+ (para ejecutar API y dapp fuera de Docker, si lo desea).

---

## Paso 1: Variables de la API

1. Copie o actualice `api/.env` a partir de `api/.env.example`.
2. Defina al menos:
   - **`PORT`**: en local, el puerto donde escucha Fastify (si usa **3007**, ajuste el rewrite de Next; véase el paso 4).
   - **`MONGODB_URI`**:
     - **Contra Mongo en Docker (puerto publicado 27019):**  
       `mongodb://127.0.0.1:27019/rbac_market`
     - **Dentro de Docker Compose (contenedor `api`):** ya viene fijado en `docker-compose.yml` como  
       `mongodb://mongo:27017/rbac_market` (no hace falta duplicarlo en `.env` para Compose salvo que quiera otro valor).

---

## Paso 2: Levantar MongoDB (y el stack) con Docker

En la raíz del repositorio:

```bash
docker compose up -d mongo
```

Para levantar API, dapp y nginx además de Mongo:

```bash
docker compose up -d --build
```

Compruebe que el contenedor de Mongo está en ejecución y que el puerto **27019** está escuchando en el host (por ejemplo con `docker compose ps`).

---

## Paso 3: API en local (opcional, sin Docker para la API)

Desde el directorio `api/`:

```bash
npm install
npm run dev
```

Asegúrese de que **`MONGODB_URI`** apunta a `mongodb://127.0.0.1:27019/rbac_market` si Mongo corre solo con `docker compose up -d mongo`.

Prueba rápida:

```bash
curl -s -X POST http://127.0.0.1:3005/market/leads \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x0000000000000000000000000000000000000001","email":"test@example.com"}'
```

(Sustituya `3005` por su `PORT` si es distinto.)

---

## Paso 4: Dapp en desarrollo

Desde `dapp/`:

```bash
npm install
npm run dev
```

La dapp suele quedar en **http://localhost:3006**.

- Si la API local **no** está en `127.0.0.1:3005`, defina antes de arrancar Next, por ejemplo:

  ```bash
  export API_REWRITE_TARGET=http://127.0.0.1:3007
  npm run dev
  ```

- **`NEXT_PUBLIC_API_URL`** (por defecto `/api` en la configuración) hace que el navegador llame a rutas relativas `/api/...`, que Next reescribe al backend en desarrollo.

En **producción con nginx**, el navegador sigue usando `/api/market/leads`; nginx envía el tráfico al contenedor `api`.

---

## Paso 5: Probar el formulario Market en el navegador

1. Abra **http://localhost:3006** (o la URL que use).
2. En la pantalla de bienvenida, pulse **«Mi Primera Vez»** o vaya directamente a **/market**.
3. Rellene el formulario (wallet obligatoria; correo y confirmación de correo obligatorios y coincidentes).
4. Tras enviar, debe aparecer el mensaje de confirmación y los datos deben estar en MongoDB en la colección **`market_leads`**.

Para inspeccionar los documentos con `mongosh` contra el puerto publicado:

```bash
mongosh "mongodb://127.0.0.1:27019/rbac_market" --eval 'db.market_leads.find().sort({createdAt:-1}).limit(5)'
```

---

## Resumen de rutas

| Dónde | Ruta / recurso |
|--------|-----------------|
| Navegador (dapp) | `POST /api/market/leads` |
| API Fastify | `POST /market/leads` |
| MongoDB | Base `rbac_market`, colección `market_leads` |

---

## Notas

- El envío de correo al usuario en un plazo de tres días es un **compromiso de proceso** descrito en la interfaz; la implementación actual **solo persiste** el lead en MongoDB. Puede añadirse un worker o integración SMTP en una iteración posterior.
- Si la API en Docker no arranca, revise que **`PORT`** en el contenedor sea **3005** (fijado en `docker-compose` para alinear con nginx) y que Mongo esté accesible con la URI indicada.
