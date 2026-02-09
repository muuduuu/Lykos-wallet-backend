# Performance Optimization Guide

## Resource Usage Issues

If the application is consuming too many resources, here are the optimizations:

## 1. Docker Resource Limits (✅ Already Applied)

Docker containers now have resource limits:
- **PostgreSQL**: Max 512MB RAM, 0.5 CPU
- **Redis**: Max 256MB RAM, 0.25 CPU

## 2. Run Minimal Services (Recommended for Development)

Instead of running all 6 microservices, run only essential ones:

```bash
# Minimal setup (Gateway + ID Service only)
npm run dev:minimal

# This runs:
# - API Gateway (port 3000)
# - ID Service (port 3001) - handles auth and wallets
```

## 3. Disable Unused Services

If you don't need all services, comment them out in `docker-compose.dev.yml`:

```yaml
# Comment out Vault if not needed
# vault:
#   ...
```

## 4. Optimize Node.js Memory

Set Node.js memory limits:

```bash
# Windows PowerShell
$env:NODE_OPTIONS="--max-old-space-size=1024"

# Then run services
npm run dev:minimal
```

## 5. Use Lighter Development Mode

### Option A: Single Combined Service (Lightest)
Create a single entry point that combines essential services:

```bash
# Just start the API Gateway (it proxies to services)
npm run dev:gateway
```

### Option B: One Service at a Time
Start services individually as needed:

```bash
# Terminal 1
npm run dev:gateway

# Terminal 2 (only if needed)
npm run dev:id

# Terminal 3 (only if needed)
npm run dev:paymaster
```

## 6. Reduce Concurrent Processes

The `concurrently` tool now limits to 3 processes max instead of running all 6.

## 7. Database Optimization

PostgreSQL is configured with:
- Reduced `shared_buffers` (128MB instead of default)
- Lower `max_connections` (50 instead of 100)

## 8. Redis Optimization

Redis configured with:
- Max memory: 256MB
- Memory policy: `allkeys-lru` (evicts least recently used keys)

## 9. Disable File Watching (If Not Needed)

If you're not actively developing, disable file watching:

```bash
# Instead of watch mode, use regular start
tsx src/api-gateway/index.ts
```

## 10. Check System Resources

Monitor resource usage:

```bash
# Check Docker container resources
docker stats lykos-postgres lykos-redis

# Check Node processes
Get-Process node | Select-Object Id,CPU,WorkingSet
```

## Recommended Development Workflow

### For Light Development:
```bash
# 1. Start infrastructure (Docker)
docker-compose -f docker-compose.dev.yml up -d

# 2. Setup database (one time)
npm run db:push

# 3. Start minimal services
npm run dev:minimal
```

### For Full Features:
```bash
# Only when you need all features
npm run dev:all
```

## Additional Tips

1. **Close unused terminals** - Each service runs in its own process
2. **Use Task Manager** - Monitor CPU/RAM usage in Windows Task Manager
3. **Restart Docker** - If containers use too much memory, restart Docker Desktop
4. **Increase Docker RAM** - In Docker Desktop settings, increase available RAM
5. **Use WSL2** - If on Windows, WSL2 can be more efficient than Hyper-V

## Resource Limits Summary

- **PostgreSQL**: 512MB RAM, 0.5 CPU
- **Redis**: 256MB RAM, 0.25 CPU
- **Backend Services**: ~200-300MB each (depends on usage)
- **Frontend**: ~100-200MB

**Total Minimum**: ~1GB RAM, 1 CPU core
**Total Maximum** (all services): ~2-3GB RAM, 2-3 CPU cores
