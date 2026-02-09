# Lykos Wallet – Run & Deploy

Full crypto wallet: create/import HD wallets, view balance, send ETH on Ethereum and Sepolia.

## Quick start (local)

### 1. Install and env

```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env
```

Edit `.env`: set `JWT_SECRET` (min 32 chars) and `DATABASE_URL`.  
If using Docker for Postgres (below), use port **5433** in `DATABASE_URL`:
`postgresql://lykos:devpassword@localhost:5433/lykos_dev`

### 2. Database (choose one)

**Option A – Docker Postgres + Redis**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Then:

```bash
npx prisma generate
npx prisma db push
```

**Option B – Local Postgres**

Create DB `lykos_dev`, user `lykos`, then:

```bash
npx prisma generate
npx prisma db push
```

### 3. Run backend and frontend

**Terminal 1 – API (port 3000)**

```bash
npm run dev
```

**Terminal 2 – Frontend (port 5173)**

```bash
npm run frontend:dev
```

Or both with infra:

```bash
npm run dev:full
```

Open **http://localhost:5173** – register, create or import a wallet, then send/receive ETH.

---

## Deploy with Docker

Single image (backend + frontend) + Postgres:

```bash
# Build and run
docker-compose up -d

# App: http://localhost:3000
```

Set env for production:

- `JWT_SECRET` – long random secret (min 32 chars)
- `POSTGRES_PASSWORD` – Postgres password

---

## What works (real wallet behavior)

- **HD wallet**: BIP-39 mnemonic, BIP-44 path `m/44'/60'/0'/0/0`
- **Create wallet**: New mnemonic, encrypted with your password, stored on server
- **Import wallet**: Paste 12/24 words, encrypt with password
- **Balance**: Live ETH balance via RPC (Ethereum + Sepolia)
- **Send**: Sign and broadcast real tx (native ETH); gas reserved automatically
- **Receive**: Show address and QR; any send to that address is received on-chain
- **History**: Outgoing transactions stored and linked to Etherscan/Sepolia explorer

Chains: **Ethereum (1)** and **Sepolia (11155111)**.  
RPC: defaults to public endpoints; set `ETHEREUM_RPC_URL` and `SEPOLIA_RPC_URL` in `.env` for your own node or Infura/Alchemy.
