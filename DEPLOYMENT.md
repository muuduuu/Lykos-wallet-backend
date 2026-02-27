# Lykos Wallet — Production Deployment Guide

This guide walks you through launching Lykos Wallet to the real world.

---

## Quick Start (Docker Compose)

1. **Create a `.env` file** in the project root:

```env
# Required - use strong values
POSTGRES_PASSWORD=your-secure-postgres-password
JWT_SECRET=your-jwt-secret-min-32-chars

# Your production frontend URL (comma-separated for multiple)
CORS_ORIGIN=https://wallet.yourdomain.com

# RPC URLs (get free keys from QuickNode, Alchemy, or Infura)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

2. **Generate secrets**:

```bash
# JWT secret
openssl rand -base64 32

# Or on Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

3. **Deploy**:

```bash
docker compose -f docker-compose.prod.yml up -d
```

- Frontend: `http://your-server:80`
- Backend API: `http://your-server:3000`
- Health check: `http://your-server:3000/health`

---

## Deployment Options

### Option A: VPS (DigitalOcean, Linode, Vultr, etc.)

1. **Provision a server** (2 GB RAM minimum, Ubuntu 22.04).

2. **Install Docker**:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

3. **Clone the repo** and create `.env` as above.

4. **Run**:

```bash
docker compose -f docker-compose.prod.yml up -d
```

5. **Configure firewall**:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

6. **Set up SSL with Caddy or Nginx** (see [SSL Setup](#ssl-setup) below).

---

### Option B: Railway

1. Create a Railway project and connect your repo.
2. Add a **PostgreSQL** service (auto-provisions DATABASE_URL).
3. Add a **Web Service** for the backend:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && node dist/index.js`
   - Root directory: project root
4. Set environment variables:
   - `JWT_SECRET` (required)
   - `CORS_ORIGIN` = `https://your-frontend.railway.app` or your custom domain
   - `ETHEREUM_RPC_URL`, `SEPOLIA_RPC_URL` (optional)
5. Deploy the frontend separately (Vercel, Netlify, or another Railway service) pointing API to the backend URL.

---

### Option C: Render

1. Create a **PostgreSQL** database on Render.
2. Create a **Web Service**:
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma migrate deploy && node dist/index.js`
3. Add environment variables (same as Railway).
4. Deploy frontend as a **Static Site** and set `VITE_API_URL` to your backend URL.

---

### Option D: Fly.io

1. Install `flyctl` and run `fly launch`.
2. Add Postgres: `fly postgres create`
3. Attach DB: `fly postgres attach <postgres-app-name>`
4. Set secrets: `fly secrets set JWT_SECRET=... CORS_ORIGIN=...`
5. Deploy: `fly deploy`

---

## SSL Setup (for VPS)

### Using Caddy (recommended — auto HTTPS)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-storage-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

```
wallet.yourdomain.com {
    reverse_proxy localhost:80
}
```

```bash
sudo systemctl reload caddy
```

### Using Nginx + Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d wallet.yourdomain.com
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `CORS_ORIGIN` | Yes (prod) | Allowed origins, e.g. `https://wallet.example.com` |
| `POSTGRES_PASSWORD` | Yes (Docker) | Postgres password |
| `ETHEREUM_RPC_URL` | No | Ethereum mainnet RPC (defaults to public) |
| `SEPOLIA_RPC_URL` | No | Sepolia testnet RPC |
| `ALCHEMY_API_KEY` | No | Enables all Alchemy RPCs + NFT indexing |
| `PORT` | No | Backend port (default 3000) |

---

## Post-Deploy Checklist

- [ ] Set strong `JWT_SECRET` and `POSTGRES_PASSWORD`
- [ ] Configure `CORS_ORIGIN` to your frontend URL
- [ ] Add RPC URLs (QuickNode or Alchemy) for reliable chain access
- [ ] Enable HTTPS (Caddy, Nginx+Certbot, or platform-managed)
- [ ] Test registration, login, create wallet, and send
- [ ] Monitor logs: `docker compose -f docker-compose.prod.yml logs -f`

---

## Troubleshooting

**Database connection failed**  
- Ensure `DATABASE_URL` matches your Postgres service.  
- For Docker Compose: use `postgres:5432` as host.

**CORS errors**  
- Add your frontend URL to `CORS_ORIGIN` (comma-separated for multiple).  
- Include protocol: `https://wallet.example.com`.

**Migrations fail**  
- Run `npx prisma migrate deploy` manually if needed.  
- For fresh DB, ensure `prisma/migrations` exists and is committed.

**RPC / balance errors**  
- Add `ETHEREUM_RPC_URL` and `SEPOLIA_RPC_URL` (or `ALCHEMY_API_KEY`).  
- Public RPCs can be rate-limited; use QuickNode or Alchemy for production.
