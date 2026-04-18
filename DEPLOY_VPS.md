# Despliegue en VPS (Docker)

Stack incluido: **MongoDB** (puerto host **27019**), **API** Fastify (**3007**), **dapp** Next.js (**3006**). Besu puede seguir en otro contenedor o en el mismo servidor; solo debe ser alcanzable **desde los contenedores** `api` y (en el build) `dapp` usando la URL que pongas en `RPC_URL` (por ejemplo `http://IP_DEL_VPS:8545` o `http://172.17.0.1:8545` si Besu escucha en el host; si comparte red Docker con Besu, use el nombre del servicio y puerto interno).

## Requisitos en el VPS

- Docker y Docker Compose v2.
- Puertos libres: **3006**, **3007**, **27019** (y firewall abierto si accedes desde fuera).
- Clonar o subir el repositorio completo (`api/`, `dapp/`, `docker-compose.yml`, etc.).

## 1. Variables en la raíz (build de la dapp)

```bash
cp .env.example .env
```

Edite `.env` en la **raíz** con:

| Variable | Descripción |
|----------|-------------|
| `RPC_URL` | HTTP(S) del nodo Besu (ej. `http://IP_INTERNA:8545` o el que use tu red Docker). |
| `CHAIN_ID` | ID de la cadena (ej. `1337`). |
| `CONTRACT_ADDRESS` | Contrato `SecurityManager` desplegado. |
| `CONTRACT_OWNER_ADDRESS` | Wallet owner (misma que en la dapp para permisos). |
| `CONTRACT_DEPLOY_BLOCK` | Bloque aproximado de despliegue (para logs; `0` si no está seguro). |

Estas variables se inyectan **al construir** la imagen de Next; si cambias el contrato o el RPC, vuelva a construir: `docker compose build dapp --no-cache`.

## 2. Variables de la API

```bash
cp api/.env.example api/.env
```

En `api/.env` debe coincidir el **mismo** `RPC_URL`, `CHAIN_ID`, `CONTRACT_ADDRESS` y, si aplica, `CONTRACT_OWNER_ADDRESS` y `CONTRACT_DEPLOY_BLOCK` que en la raíz. **No** hace falta poner `PORT` ni `MONGODB_URI` para Docker: `docker-compose.yml` los fija (**3007** y `mongodb://mongo:27017/rbac_market`).

Si quieres conservar `PORT`/`MONGODB_URI` en el archivo para pruebas locales, está bien; en el contenedor mandan las variables del compose.

## 3. Arranque

Desde la raíz del repo:

```bash
docker compose up -d --build
```

- **Frontend:** `http://IP_DEL_VPS:3006`
- **API (pruebas directas):** `http://IP_DEL_VPS:3007` (ej. `GET /health`, `POST /market/leads`)
- **MongoDB:** `mongodb://IP_DEL_VPS:27019/rbac_market` (solo red confiable; considera firewall o VPN).

El navegador usa la dapp en **3006**; las peticiones a `/api` las reescribe Next hacia el servicio `api:3007` dentro de la red Docker.

## 4. Nginx en el puerto 80 (opcional)

Si más adelante quieres un solo dominio sin puertos, puedes añadir un contenedor Nginx en el mismo host y un `proxy_pass` a `dapp:3006` y `/api/` a `api:3007`. En el repo hay un ejemplo en `nginx/nginx.conf` (upstream ya apunta a **api:3007**). No forma parte del `docker-compose.yml` por defecto.

## 5. Comandos útiles

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f dapp
docker compose down
```

## 6. Datos persistentes

El volumen `mongo_market_data` conserva la base entre reinicios. `docker compose down -v` borraría los datos de Mongo.

## 7. Respaldo offline (`respaldo.md`)

Genera un Markdown con datos on-chain (roles, usuarios, menús, vínculos, cuentas) y, si está configurado, los leads de Mongo (`market_leads`).

**En la máquina donde tengas el repo y `api/.env`** (mismo RPC/contrato que el Besu):

```bash
cd api
npm run respaldo
```

Queda **`api/respaldo.md`** (o la ruta que indiques).

**Otra ruta de salida:**

```bash
node --env-file=.env scripts/respaldo.mjs /ruta/completa/respaldo.md
```

**Dentro del contenedor API** (variables ya inyectadas por Compose; el fichero sale en el contenedor — cópialo al host si hace falta):

```bash
docker compose exec api node scripts/respaldo.mjs /app/respaldo.md
docker compose cp api:/app/respaldo.md ./respaldo.md
```
