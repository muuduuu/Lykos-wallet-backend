# Quick Start - Installation Fixed ✅

## ✅ What Was Fixed

The package.json had incorrect package versions:
- `@noble/secp256k1@^1.7.3` → `^1.7.2` (version 1.7.3 doesn't exist)
- `cbor-x@^1.6.2` → `^1.6.0` (version 1.6.2 doesn't exist)

## 🚀 How to Run

### Step 1: Backend Installation (Already Done ✅)
```bash
npm install  # ✅ Already completed
```

### Step 2: Start Infrastructure
```bash
# Start PostgreSQL, Redis, Vault
docker-compose -f docker-compose.dev.yml up -d
```

### Step 3: Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

### Step 4: Start Backend Services
```bash
# Start all backend services
npm run dev:all
```

This will start:
- API Gateway: http://localhost:3000
- ID Service: http://localhost:3001
- G0 Service: http://localhost:3002
- Paymaster Service: http://localhost:3003
- Alias Service: http://localhost:3004
- Recovery Service: http://localhost:3005

### Step 5: Frontend Installation (New Terminal)
```bash
# Install frontend dependencies
npm run frontend:install
```

### Step 6: Start Frontend
```bash
# Start frontend dev server
npm run frontend:dev
```

Frontend will be at: **http://localhost:5173**

## 🎯 Or Run Everything Together

```bash
# Install frontend dependencies first
npm run frontend:install

# Then start everything (backend + frontend)
npm run dev:full
```

## ✅ Verify Installation

1. **Check Backend**: http://localhost:3000/health
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Check Frontend**: http://localhost:5173
   - Should see the login page

## 🔍 Troubleshooting

### If services don't start:

1. **Check Docker is running**:
   ```bash
   docker ps
   ```

2. **Check ports aren't in use**:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3000
   netstat -ano | findstr :5173
   ```

3. **Check database connection**:
   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

4. **Check service logs**:
   - Each service will show logs in its terminal
   - Look for connection errors

## 📝 Next Steps

1. Open http://localhost:5173 in your browser
2. Try logging in (email is optional)
3. Explore the wallet dashboard

All dependencies are now correctly installed! 🎉
