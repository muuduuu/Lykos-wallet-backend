# Quick Start - Optimized (Light on Resources)

## 🚀 Fastest & Lightest Setup

### Step 1: Start Infrastructure
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Step 2: Setup Database (One Time)
```bash
# Create database manually (Windows PowerShell)
docker exec lykos-postgres psql -U postgres -c "CREATE DATABASE lykos_dev;"
docker exec lykos-postgres psql -U postgres -c "CREATE USER lykos WITH PASSWORD 'devpassword';"
docker exec lykos-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE lykos_dev TO lykos;"

# Then push schema
npm run db:push
```

### Step 3: Run Minimal Services (Recommended)
```bash
# This runs only Gateway + ID Service (lightest)
npm run dev:minimal

# In another terminal, start frontend
npm run frontend:dev
```

## 📊 Resource Usage

**Minimal Setup (dev:minimal)**:
- ~1GB RAM
- 1-1.5 CPU cores
- Only essential services running

**Full Setup (dev:all)**:
- ~2-3GB RAM  
- 2-3 CPU cores
- All 6 microservices

## ⚡ Quick Commands

```bash
# Minimal (lightest)
npm run dev:minimal

# Full stack with frontend (moderate)
npm run dev:full

# Everything (heaviest - only if needed)
npm run dev:full-all
```

## 💡 Tips

1. **Use `dev:minimal`** for most development work
2. **Start services individually** if you only need specific features
3. **Check resource usage**: `docker stats` to monitor containers
4. **Restart Docker** if memory usage gets too high
