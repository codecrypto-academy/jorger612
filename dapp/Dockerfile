# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build-time: mismo contrato/RPC que en la raíz .env (pasados por docker-compose build args).
# API_REWRITE_TARGET debe ser el hostname del servicio api dentro de Docker.
ARG API_REWRITE_TARGET=http://api:3007
ARG RPC_URL=http://localhost:8545
ARG CHAIN_ID=1337
ARG CONTRACT_ADDRESS=
ARG CONTRACT_OWNER_ADDRESS=
ARG CONTRACT_DEPLOY_BLOCK=0

ENV API_REWRITE_TARGET=${API_REWRITE_TARGET}
ENV RPC_URL=${RPC_URL}
ENV CHAIN_ID=${CHAIN_ID}
ENV CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
ENV CONTRACT_OWNER_ADDRESS=${CONTRACT_OWNER_ADDRESS}
ENV CONTRACT_DEPLOY_BLOCK=${CONTRACT_DEPLOY_BLOCK}
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_RPC_URL=${RPC_URL}
ENV NEXT_PUBLIC_CHAIN_ID=${CHAIN_ID}
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
ENV NEXT_PUBLIC_CONTRACT_OWNER_ADDRESS=${CONTRACT_OWNER_ADDRESS}
ENV NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK=${CONTRACT_DEPLOY_BLOCK}

RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3006
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3006

CMD ["node", "server.js"]
