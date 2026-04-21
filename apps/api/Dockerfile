FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
COPY package.json package-lock.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

ENV NODE_ENV=development
RUN npm ci --workspaces --include-workspace-root

# ── Copy source ───────────────────────────────────────────────────────────────
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

# ── Build web frontend ────────────────────────────────────────────────────────
WORKDIR /app/apps/web
ENV VITE_API_URL=/api
ENV VITE_WS_URL=/
RUN npm run build

# ── Build NestJS API ──────────────────────────────────────────────────────────
WORKDIR /app/apps/api
RUN npx prisma generate

# Compile with tsc directly — full control over output
RUN npx tsc -p tsconfig.json

# Verify
RUN test -f /app/apps/api/dist/main.js && echo "BUILD OK" || (echo "BUILD FAILED - listing dist:" && find /app/apps/api -name "*.js" | head -20 && exit 1)

# ── Copy web build into API static folder ─────────────────────────────────────
RUN mkdir -p /app/apps/api/client
RUN cp -r /app/apps/web/dist/. /app/apps/api/client/

EXPOSE 3000

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/main"]
