FROM node:20-slim

# Install OpenSSL required by Prisma binary engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace config first (for dependency resolution)
COPY package.json package-lock.json ./

# Copy package manifests for all workspaces
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies from the monorepo root
RUN npm ci --workspaces --include-workspace-root

# Copy all source files
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build the API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main"]
