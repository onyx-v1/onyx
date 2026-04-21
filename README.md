# Onyx — README

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (running locally or remote)

---

## Step 1 — Configure the database

Open `apps/api/.env` and set your PostgreSQL connection string:

```
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/onyx
```

For a local PostgreSQL with default settings:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/onyx
```

Create the database first if it doesn't exist:
```sql
CREATE DATABASE onyx;
```

---

## Step 2 — Run setup (open PowerShell in d:\Onyx)

```powershell
# Install all dependencies
npm install

# Generate Prisma client
cd apps/api
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed: creates admin + default channels
npx ts-node -r tsconfig-paths/register prisma/seed.ts

cd ../..
```

---

## Step 3 — Start the dev servers

Open **two separate terminals** in `d:\Onyx`:

**Terminal 1 — API:**
```powershell
cd apps/api
npm run dev
```

**Terminal 2 — Web:**
```powershell
cd apps/web
npm run dev
```

Then open: **http://localhost:5173**

Log in with User ID: `knull_onyx`

---

## Project Structure

```
onyx/
├── apps/
│   ├── api/          NestJS backend (port 3000)
│   └── web/          React + Vite frontend (port 5173)
├── packages/
│   └── types/        Shared TypeScript types
└── turbo.json        Monorepo pipeline
```

## Admin Panel

After logging in as `knull_onyx`, click the **🛡️ shield icon** in the sidebar to open the Admin Panel.

From there you can:
- Create users (username + display name)
- Delete users
- Create channels (text or voice)
- Delete channels

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL |
| Real-time | Socket.IO |
| Voice | WebRTC (P2P mesh) |
| Auth | JWT + Refresh Tokens |
