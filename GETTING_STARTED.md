# Getting Started - Full Stack Setup

This guide will help you set up and run both the frontend and backend together.

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for database, Redis, Vault)
- npm or pnpm

## Quick Start

### Step 1: Backend Setup

```bash
# Install backend dependencies
npm install

# Start infrastructure (PostgreSQL, Redis, Vault)
docker-compose -f docker-compose.dev.yml up -d

# Setup database
npm run db:generate
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

### Step 2: Frontend Setup

```bash
# Install frontend dependencies
npm run frontend:install
```

### Step 3: Configure Environment

**Backend** - Copy and edit `.env.example` to `.env`:
```bash
cp .env.example .env
# Edit .env with your configuration
```

**Frontend** - Copy and edit `frontend/.env.example` to `frontend/.env`:
```bash
cd frontend
cp .env.example .env
# Default values should work for development
```

### Step 4: Run Both Services

**Option 1: Run Together (Recommended)**
```bash
# From root directory - starts both frontend and backend
npm run dev:full
```

**Option 2: Run Separately**

Terminal 1 - Backend:
```bash
npm run dev:all
```

Terminal 2 - Frontend:
```bash
npm run frontend:dev
```

### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## What's Running

### Backend Services
- API Gateway: http://localhost:3000
- ID Service: http://localhost:3001
- G0 Security Service: http://localhost:3002
- Paymaster Service: http://localhost:3003
- Alias Service: http://localhost:3004
- Recovery Service: http://localhost:3005

### Frontend
- Vite Dev Server: http://localhost:5173

### Infrastructure
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Vault: http://localhost:8200

## First Use

1. Open http://localhost:5173 in your browser
2. On the login page, you can:
   - Click "Continue with Email" to login (email is optional)
   - Click "Setup Passkey (WebAuthn)" to set up WebAuthn authentication
3. After authentication, you'll be redirected to the wallet dashboard
4. Create wallets, view transactions, and interact with the wallet

## Troubleshooting

### Port Already in Use

If a port is already in use:
- Backend ports: 3000-3005
- Frontend port: 5173
- Change ports in `.env` files if needed

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart infrastructure
docker-compose -f docker-compose.dev.yml restart

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres
```

### Frontend Can't Connect to Backend

1. Verify backend is running: `curl http://localhost:3000/health`
2. Check `VITE_API_URL` in `frontend/.env` matches backend URL
3. Check CORS configuration in `src/api-gateway/index.ts`
4. Check browser console for errors

### CORS Errors

If you see CORS errors in the browser:
1. Verify backend is running
2. Check `VITE_API_URL` in frontend `.env`
3. Verify CORS origins in `src/api-gateway/index.ts` include `http://localhost:5173`

## Development Workflow

1. **Backend Changes**: Backend uses `tsx watch` for hot reload
2. **Frontend Changes**: Frontend uses Vite HMR for instant updates
3. **Database Changes**: Run `npm run db:migrate` after schema changes

## Next Steps

- Read [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for integration details
- Check [README.md](./README.md) for backend documentation
- See [frontend/README.md](./frontend/README.md) for frontend documentation

## Production Deployment

For production deployment, see:
- [PRODUCTION.md](./PRODUCTION.md) - Backend deployment guide
- [frontend/README.md](./frontend/README.md) - Frontend build and deployment
