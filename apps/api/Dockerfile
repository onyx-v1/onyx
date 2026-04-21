# ── Stage 1: Builder ──────────────────────────────────────────────────────────
# Installs ALL deps (dev+prod) and builds everything. This layer is thrown away.
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first (layer cache — only reinstalls when deps change)
COPY package.json package-lock.json ./
COPY packages/types/package.json     ./packages/types/
COPY packages/tsconfig/package.json  ./packages/tsconfig/
COPY apps/api/package.json           ./apps/api/
COPY apps/web/package.json           ./apps/web/

ENV NODE_ENV=development
RUN npm ci --workspaces --include-workspace-root

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# Build web frontend
WORKDIR /app/apps/web
ENV VITE_API_URL=/api
ENV VITE_WS_URL=/
RUN npm run build

# Build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx tsc -p tsconfig.json
RUN test -f /app/apps/api/dist/main.js && echo "BUILD OK" || (echo "BUILD FAILED" && exit 1)

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
# Lean production image — no source, no dev tools, no build cache.
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Re-copy only what's needed to run
COPY package.json package-lock.json ./
COPY packages/types/package.json    ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/api/package.json          ./apps/api/
COPY apps/web/package.json          ./apps/web/

# Production deps only — much smaller than full install
ENV NODE_ENV=production
RUN npm ci --workspaces --include-workspace-root --omit=dev

# Copy compiled API
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
COPY --from=builder /app/apps/api/prisma       ./apps/api/prisma

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma

# Copy built frontend into API static folder
COPY --from=builder /app/apps/web/dist         ./apps/api/client

# Install ts-node globally so `prisma db seed` works (seed.ts uses ts-node)
RUN npm install -g ts-node tsconfig-paths typescript

WORKDIR /app/apps/api

EXPOSE 3000
ENV NODE_ENV=production

# Seed is non-fatal (|| true) — safe on already-seeded DBs
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (npx prisma db seed || echo '⚠ Seed skipped') && node dist/main"]
