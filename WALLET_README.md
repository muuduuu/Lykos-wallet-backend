# Lykos Wallet – Deployable Crypto Wallet

A full **Ethereum wallet** you can run locally or deploy: create/import HD wallets, view balances, and send/receive ETH.

## What’s included

- **Backend (Node + Fastify)**  
  - Auth: register/login with email + password (JWT)  
  - Wallets: create (BIP-39 mnemonic) or import from recovery phrase  
  - Balances: live ETH balance via RPC  
  - Send: sign and broadcast ETH transfers  
  - Mnemonics encrypted at rest (AES-256-GCM)

- **Frontend (React + Vite + Tailwind)**  
  - Sign up / Sign in  
  - Dashboard: list wallets and balances  
  - Create wallet (with recovery phrase backup)  
  - Import wallet (12/24 words)  
  - Per-wallet: Receive (copy address), Send (amount + recipient), Transaction history  

- **Stack**  
  - **Ethereum**: viem (mainnet + Sepolia), HD wallets via `mnemonicToAccount`  
  - **DB**: PostgreSQL (Prisma)  
  - **Optional**: Docker Compose for Postgres (and Redis if you add it later)

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `DATABASE_URL` – PostgreSQL connection (see below if using Docker)
- `JWT_SECRET` – long random string (e.g. 32+ chars)
- `ENCRYPTION_KEY` – long random string (32+ chars) for encrypting mnemonics
- `RPC_URL` – (optional) Ethereum RPC; default uses public mainnet RPC
- `CHAIN_ID` – `1` (mainnet) or `11155111` (Sepolia)

### 2. Database (with Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Then:

```bash
npm run db:generate
npm run db:push
```

(Or `npm run db:migrate` if you prefer migrations.)

> **Note:** This project uses Prisma 5. If you see a "datasource url is no longer supported" error, ensure you're using the project's Prisma: run `npm run db:generate` (not `npx prisma generate`, which may use Prisma 7).

### 3. Run backend + frontend

**Option A – one command (backend + frontend):**

```bash
npm run dev:full
```

**Option B – two terminals:**

```bash
# Terminal 1 – start Postgres first if not already running, then backend
npm run dev

# Terminal 2 – frontend
npm run frontend:dev
```

- Backend: **http://localhost:3000**  
- Frontend: **http://localhost:5173**  
- Health: **http://localhost:3000/health**

### 4. Use the wallet

1. Open **http://localhost:5173**
2. **Sign up** with email + password
3. **Create wallet** → save the 12-word recovery phrase
4. On the dashboard you’ll see balance (ETH) and the wallet address
5. **Receive**: open a wallet → Receive → copy address
6. **Send**: open a wallet → Send → enter recipient address and amount (ETH)

For testing without real funds, set `CHAIN_ID=11155111` and `RPC_URL=https://rpc.sepolia.org` and use Sepolia ETH.

## API (for reference)

- `POST /api/auth/register` – `{ email, password }`
- `POST /api/auth/login` – `{ email, password }`
- `GET /api/auth/me` – requires `Authorization: Bearer <token>`
- `GET /api/wallets` – list wallets (with balance)
- `POST /api/wallets/create` – create wallet (optional body: `{ name }`)
- `POST /api/wallets/import` – `{ mnemonic, name? }`
- `GET /api/wallets/:id` – wallet detail + balance
- `GET /api/wallets/:id/balance`
- `POST /api/wallets/:id/send` – `{ to, valueEth }`
- `GET /api/wallets/:id/transactions`

## Production

- Set strong, unique `JWT_SECRET` and `ENCRYPTION_KEY`
- Use a dedicated PostgreSQL instance and a proper RPC (e.g. Infura/Alchemy)
- Build frontend: `npm run frontend:build` and serve the `frontend/dist` folder (e.g. Nginx/static host)
- Run backend: `npm run build && npm run start` (set `NODE_ENV=production`, `PORT`, etc.)
- Use HTTPS and restrict CORS to your frontend origin

## Security notes

- Recovery phrase is encrypted with `ENCRYPTION_KEY` before storage; keep this key secret and backed up
- In production, consider a dedicated secrets manager (e.g. Vault) for `ENCRYPTION_KEY` and DB credentials
- Never log or expose mnemonics or raw private keys
