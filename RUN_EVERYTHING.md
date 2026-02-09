# How to Run Everything

## Quick Start (Easiest Method)

### Step 1: Start Docker Containers
```powershell
docker-compose -f docker-compose.dev.yml up -d
```

### Step 2: Setup Database (First Time Only)
```powershell
# Create database and user
docker exec lykos-postgres psql -U postgres -c "CREATE DATABASE lykos_dev;"
docker exec lykos-postgres psql -U postgres -c "CREATE USER lykos WITH PASSWORD 'devpassword';"
docker exec lykos-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE lykos_dev TO lykos;"

# Push schema to database
npm run db:push
```

### Step 3: Run Everything (One Command!)
```powershell
npm run dev:full
```

This runs:
- ✅ Docker containers (PostgreSQL, Redis)
- ✅ Backend services (API Gateway + ID Service)
- ✅ Frontend (React app)

---

## What Runs on Which Ports?

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Alternative: Run Step by Step

If you want more control:

**Terminal 1 - Backend:**
```powershell
npm run dev:minimal
```

**Terminal 2 - Frontend:**
```powershell
npm run frontend:dev
```

---

## Check if Everything is Running

1. **Frontend**: Open http://localhost:5173 in browser
2. **Backend**: Check http://localhost:3000/health
3. **Docker**: Run `docker ps` to see containers
