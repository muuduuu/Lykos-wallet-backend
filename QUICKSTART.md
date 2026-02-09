# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your configuration:
# - Database URL (default works with Docker)
# - Redis URL (default works with Docker)
# - JWT Secret (generate a strong secret)
# - RPC URLs (Infura, Alchemy, etc.)
# - API Keys (Tenderly, Alchemy, etc.)
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Vault
docker-compose -f docker-compose.dev.yml up -d

# Wait a few seconds for services to be ready
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

### 5. Start Development Server

```bash
# Start all services
npm run dev:all

# Or start individually:
npm run dev:gateway    # Port 3000
npm run dev:id         # Port 3001
npm run dev:g0         # Port 3002
npm run dev:paymaster  # Port 3003
npm run dev:alias      # Port 3004
npm run dev:recovery   # Port 3005
```

### 6. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Should return: {"status":"ok","timestamp":"..."}
```

## API Testing

### Create a User and Wallet

1. **Start WebAuthn Registration**:
```bash
curl -X POST http://localhost:3001/auth/webauthn/register/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","email":"test@example.com"}'
```

2. **Complete Registration** (use the response from step 1):
```bash
curl -X POST http://localhost:3001/auth/webauthn/register/verify \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","credential":{...}}'
```

### Get Wallets

```bash
curl http://localhost:3001/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Simulate Transaction

```bash
curl -X POST http://localhost:3002/security/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": {
      "from": "0x...",
      "to": "0x...",
      "value": "1000000000000000000"
    },
    "chainId": 11155111
  }'
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

### Port Already in Use

If a port is already in use, either:
- Stop the service using that port
- Change the port in `.env` file

### Prisma Issues

```bash
# Reset database (WARNING: deletes all data)
npm run db:push -- --force-reset

# Regenerate Prisma client
npm run db:generate
```

## Next Steps

- Read the [README.md](./README.md) for detailed documentation
- Check API endpoints in service files
- Configure production environment variables
- Set up monitoring and logging
