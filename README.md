# Lykos Wallet — Full Crypto Wallet

A working, deployable crypto wallet with Ethereum and Sepolia support. Create wallets, send/receive ETH, import via mnemonic or private key.

## Features

- **Wallet creation** — Generate BIP-39 mnemonic with encrypted storage
- **Import wallet** — Via recovery phrase or private key
- **Send ETH** — On Ethereum mainnet and Sepolia testnet
- **Receive** — QR code and shareable address
- **Multi-chain** — Ethereum + Sepolia (Sepolia for testing)
- **Secure storage** — AES-256-GCM encrypted keys, password-protected
- **Auth** — Email/password with JWT

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Docker (optional, for PostgreSQL)

### 2. Setup

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Copy environment
cp .env.example .env

# Edit .env - add your RPC URLs (optional, defaults work for testing)
# Get free keys: alchemy.com or infura.io
```

### 3. Database

**Option A: Docker**

```bash
docker-compose -f docker-compose.dev.yml up -d postgres
# Wait a few seconds for Postgres to start
```

**Option B: Local PostgreSQL**

Create database `lykos_dev` and update `DATABASE_URL` in `.env`.

### 4. Run Migrations

```bash
npm run db:generate
npm run db:push
```

### 5. Start

```bash
# Backend (port 3000)
npm run dev

# In another terminal - Frontend (port 5173)
npm run frontend:dev
```

Or both at once:

```bash
npm run dev:full
```

### 6. Use the Wallet

1. Open http://localhost:5173
2. Sign up with email/password
3. Create a wallet (save your recovery phrase)
4. Get Sepolia testnet ETH from https://sepoliafaucet.com
5. Send and receive

## Project Structure

```
qfa/
├── src/                 # Backend API
│   ├── index.ts         # Fastify server
│   ├── config.ts        # Config
│   ├── lib/             # Crypto, Prisma
│   └── routes/          # Auth, wallets, RPC
├── frontend/            # React + Vite app
│   └── src/
│       ├── api.ts       # API client
│       └── pages/       # Login, Dashboard, Send, Receive
├── prisma/
│   └── schema.prisma    # DB schema
└── docker-compose.*.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register user |
| POST | /auth/login | Login |
| GET | /auth/me | Current user (auth) |
| GET | /wallets | List wallets (auth) |
| POST | /wallets/create | Create wallet (auth) |
| POST | /wallets/import | Import wallet (auth) |
| POST | /wallets/unlock | Unlock for signing (auth) |
| GET | /rpc/:chainId/balance/:address | Get balance |
| GET | /rpc/:chainId/gas | Get gas prices |
| POST | /rpc/:chainId/send | Send raw tx |
| GET | /chains | Supported chains |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | - |
| JWT_SECRET | JWT signing key | dev-secret... |
| ETHEREUM_RPC_URL | Mainnet RPC | eth.llamarpc.com |
| SEPOLIA_RPC_URL | Sepolia RPC | rpc.sepolia.org |
| PORT | API port | 3000 |

## Production Deployment

### Docker

```bash
# Set required env vars
export JWT_SECRET=$(openssl rand -hex 32)
export POSTGRES_PASSWORD=your-secure-password
export ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
export SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

docker-compose -f docker-compose.prod.yml up -d
```

- Backend: http://localhost:3000
- Frontend: http://localhost:80 (proxies /api to backend)

### Manual

1. Build: `npm run build` and `cd frontend && npm run build`
2. Set `NODE_ENV=production`
3. Run migrations: `npx prisma migrate deploy`
4. Start: `node dist/index.js`
5. Serve frontend `dist/` with nginx or similar

## Security Notes

- Store recovery phrases securely; they restore full access
- Use strong passwords for wallet encryption
- In production, use dedicated RPC keys (Alchemy, Infura)
- Rotate JWT_SECRET regularly
- Use HTTPS in production

## License

MIT
