# Onyx — First-Time Setup Script
# Run this from the d:\Onyx directory in PowerShell or Windows Terminal
# Prerequisites: Node.js 20+, PostgreSQL running

Write-Host "`n🪨 Onyx Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Step 1: Install dependencies
Write-Host "`n[1/5] Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Copy .env files
Write-Host "`n[2/5] Creating .env files..." -ForegroundColor Yellow
if (-not (Test-Path "apps\api\.env")) {
    Copy-Item "apps\api\.env.example" "apps\api\.env"
    Write-Host "  ✅ Created apps/api/.env" -ForegroundColor Green
    Write-Host "  ⚠️  EDIT apps/api/.env and set your DATABASE_URL before continuing!" -ForegroundColor Red
    Write-Host "  Press Enter after editing the .env file..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "  ✅ apps/api/.env already exists" -ForegroundColor Green
}

if (-not (Test-Path "apps\web\.env")) {
    Copy-Item "apps\web\.env.example" "apps\web\.env"
    Write-Host "  ✅ Created apps/web/.env" -ForegroundColor Green
}

# Step 3: Generate Prisma client
Write-Host "`n[3/5] Generating Prisma client..." -ForegroundColor Yellow
Set-Location apps\api
npx prisma generate
Set-Location ..\..

# Step 4: Run database migration
Write-Host "`n[4/5] Running database migration..." -ForegroundColor Yellow
Set-Location apps\api
npx prisma migrate dev --name init
Set-Location ..\..

# Step 5: Seed database
Write-Host "`n[5/5] Seeding database (admin + default channels)..." -ForegroundColor Yellow
Set-Location apps\api
npx ts-node -r tsconfig-paths/register prisma/seed.ts
Set-Location ..\..

Write-Host "`n🚀 Setup complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Now run:  npm run dev" -ForegroundColor Cyan
Write-Host "  → API:  http://localhost:3000" -ForegroundColor DarkGray
Write-Host "  → Web:  http://localhost:5173" -ForegroundColor DarkGray
Write-Host "  → Login with User ID: knull_onyx`n" -ForegroundColor DarkGray
