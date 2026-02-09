# Frontend-Backend Integration Guide

## Overview

The frontend and backend are now fully integrated. The frontend runs on port 5173 and communicates with the backend API Gateway on port 3000.

## Architecture

```
┌──────────────┐         ┌──────────────┐
│   Frontend   │  ────>  │ API Gateway  │
│  Port 5173   │  HTTP   │  Port 3000   │
│  (Vite)      │         │  (Fastify)   │
└──────────────┘         └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼───┐  ┌─────▼───┐  ┌─────▼───┐
              │ ID Svc  │  │ Paymstr │  │  G0 Svc │
              │  :3001  │  │  :3003  │  │  :3002  │
              └─────────┘  └─────────┘  └─────────┘
```

## Setup Instructions

### 1. Backend Setup

```bash
# Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# Setup database
npm run db:generate
npm run db:migrate

# Start backend services
npm run dev:all
```

### 2. Frontend Setup

```bash
# Install frontend dependencies
cd frontend
npm install

# Or from root
npm run frontend:install

# Start frontend dev server
npm run dev

# Or from root
npm run frontend:dev
```

### 3. Run Both Together

```bash
# From root directory - starts both frontend and backend
npm run dev:full
```

## API Communication

### Base URL

Frontend uses `VITE_API_URL` from `.env` (defaults to `http://localhost:3000`)

### Authentication

- Frontend stores JWT token in `localStorage`
- Token is automatically added to requests via Axios interceptor
- Token cleared on 401 responses

### API Client

Located at `frontend/src/api/client.ts`:
- Handles all HTTP requests
- Manages authentication tokens
- Provides typed API methods

## CORS Configuration

Backend CORS is configured to allow requests from:
- `http://localhost:5173` (Frontend dev server)
- `http://localhost:3000` (API Gateway)
- `http://127.0.0.1:5173`

To add more origins, update `src/api-gateway/index.ts`:

```typescript
await fastify.register(cors, {
  origin: [
    'http://localhost:5173',
    'https://yourdomain.com', // Add production domain
  ],
  credentials: true,
});
```

## Frontend Routes

- `/login` - Authentication page
- `/` - Wallet dashboard (protected)
- `/wallet/:walletId` - Wallet details (protected)

## State Management

### Auth Store (`authStore.ts`)
- User information
- Authentication token
- Login/logout state

### Wallet Store (`walletStore.ts`)
- List of wallets
- Selected wallet
- Transaction history

## Authentication Flow

1. User visits `/login`
2. Enters email (optional) or sets up WebAuthn
3. Frontend calls `/auth/social-login` or `/auth/webauthn/*`
4. Backend returns user and JWT token
5. Frontend stores token and redirects to dashboard

## API Endpoints Used

### Authentication
- `POST /auth/social-login` - Email login
- `POST /auth/webauthn/register/start` - Start WebAuthn registration
- `POST /auth/webauthn/register/verify` - Verify WebAuthn registration

### Wallets
- `GET /wallets` - Get user wallets
- `GET /wallets/:id/transactions` - Get wallet transactions

### Transactions
- `POST /transactions/send` - Send transaction

## Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3000
VITE_RP_ID=localhost
```

### Backend (`.env`)
See root `.env.example` for all backend configuration.

## Development Workflow

1. **Start Backend First**
   ```bash
   npm run dev:all
   ```

2. **Start Frontend**
   ```bash
   npm run frontend:dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health: http://localhost:3000/health

## Testing Integration

1. Open http://localhost:5173
2. Click "Continue with Email" or "Setup Passkey"
3. After authentication, you'll see the wallet dashboard
4. Create or view wallets
5. Send transactions (if wallets exist)

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Check backend is running on port 3000
2. Verify CORS origins in `src/api-gateway/index.ts`
3. Check `VITE_API_URL` in frontend `.env`

### Authentication Issues

- Clear `localStorage` in browser DevTools
- Check JWT token is being set correctly
- Verify backend authentication endpoints are working

### API Connection Issues

- Verify backend is running: `curl http://localhost:3000/health`
- Check `VITE_API_URL` matches backend URL
- Look at browser Network tab for request details

## Production Deployment

### Frontend Build

```bash
cd frontend
npm run build
```

Serve `dist/` directory with a static file server.

### Backend

Deploy backend following `PRODUCTION.md` guide.

### Environment Configuration

- Set `VITE_API_URL` to production backend URL
- Configure CORS with production frontend domain
- Use HTTPS in production

## Next Steps

- [ ] Add more wallet management features
- [ ] Implement swap functionality
- [ ] Add transaction simulation UI
- [ ] Implement WebAuthn authentication flow
- [ ] Add dark mode toggle
- [ ] Add loading states and error handling improvements
