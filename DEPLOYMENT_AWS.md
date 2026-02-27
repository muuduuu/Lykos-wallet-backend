# Lykos Wallet — AWS Production Deployment

Launch checklist and step-by-step AWS setup for Lykos Wallet.

---

## Pre-launch checklist

- [ ] **Secrets ready**: `JWT_SECRET` (e.g. `openssl rand -base64 32`), strong `POSTGRES_PASSWORD`
- [ ] **Domain**: DNS pointed to your ALB or EC2 (e.g. `wallet.yourdomain.com`)
- [ ] **RPC**: At least one RPC URL (e.g. Alchemy/QuickNode) for `ETHEREUM_RPC_URL`
- [ ] **CORS**: Set `CORS_ORIGIN=https://wallet.yourdomain.com` (no trailing slash)

---

## Option A: Single EC2 + Docker Compose (fastest for launch)

One EC2 runs app + Postgres in Docker. Good for launch; move to RDS later if needed.

### 1. Create EC2 instance

- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: `t3.small` (2 vCPU, 2 GB RAM) or `t3.medium` for more headroom
- **Storage**: 20–30 GB gp3
- **Security group** (create or use existing):
  - Inbound: **22** (SSH), **80** (HTTP), **443** (HTTPS) from `0.0.0.0/0` (or restrict 80/443 to your IP for testing)
- **Key pair**: Create/download and save the `.pem` file

### 2. Connect and install Docker

```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
# Log out and back in, or: newgrp docker
```

### 3. Clone repo and set env

```bash
git clone https://github.com/YOUR_ORG/Lykos-wallet-backend.git
cd Lykos-wallet-backend
```

Create `.env` in project root:

```env
# Required
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<output-of-openssl-rand-base64-32>
CORS_ORIGIN=https://wallet.yourdomain.com

# RPC (use your Alchemy/QuickNode key)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_API_KEY=YOUR_KEY
```

### 4. Run with Docker Compose

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f   # verify no errors
```

- App: `http://<EC2-PUBLIC-IP>`
- Health: `http://<EC2-PUBLIC-IP>/api/health` (via nginx proxy) or `http://<EC2-PUBLIC-IP>:3000/health`

### 5. HTTPS with ALB + ACM (recommended)

1. **Request certificate** in AWS Certificate Manager (ACM), region same as EC2:  
   - Request public certificate for `wallet.yourdomain.com`
2. **Application Load Balancer**:
   - Scheme: internet-facing, same VPC as EC2
   - Listeners: **443** → HTTPS, attach ACM certificate; **80** → redirect to 443
   - Target group: protocol HTTP, port **80**, targets = your EC2 instance
3. **Security group**: Allow ALB security group to EC2 on port 80 (and 3000 if you want direct API access).
4. **DNS**: Point `wallet.yourdomain.com` (CNAME or A/alias) to the ALB DNS name.
5. **CORS**: Ensure `.env` has `CORS_ORIGIN=https://wallet.yourdomain.com` and restart:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --force-recreate backend
   ```

---

## Option B: EC2 + RDS (PostgreSQL)

Use managed RDS for the database; run only backend + frontend on EC2.

### 1. Create RDS PostgreSQL

- Engine: PostgreSQL 15
- Template: Dev/Test or Production
- Instance: e.g. `db.t3.micro` (dev) or `db.t3.small` (prod)
- Storage: 20 GB gp3
- **Database name**: `lykos_prod`
- **Master username**: `lykos`
- **Master password**: store securely (e.g. Secrets Manager)
- **VPC**: Same as EC2
- **Public access**: No (EC2 and RDS in same VPC)
- **Security group**: Allow **5432** from EC2 security group (or same SG as EC2)

Note the **RDS endpoint** (e.g. `lykos.xxxx.us-east-1.rds.amazonaws.com`).

### 2. EC2: app only (no Postgres in Docker)

- Create EC2 as in Option A; install Docker.
- Create `.env` **without** running Postgres in compose:

```env
# Database — use RDS endpoint
DATABASE_URL=postgresql://lykos:YOUR_RDS_PASSWORD@lykos.xxxx.us-east-1.rds.amazonaws.com:5432/lykos_prod

JWT_SECRET=<openssl-rand-base64-32>
CORS_ORIGIN=https://wallet.yourdomain.com

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ALCHEMY_API_KEY=YOUR_KEY
```

Use a **custom compose** that has no `postgres` service and uses `DATABASE_URL` from env.

Create `docker-compose.aws.yml`:

```yaml
services:
  backend:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
      ETHEREUM_RPC_URL: ${ETHEREUM_RPC_URL:-}
      SEPOLIA_RPC_URL: ${SEPOLIA_RPC_URL:-}
      ALCHEMY_API_KEY: ${ALCHEMY_API_KEY:-}
    ports:
      - "3000:3000"

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: /api
    depends_on:
      - backend
    ports:
      - "80:80"
```

Run:

```bash
docker compose -f docker-compose.aws.yml up -d
```

### 3. Run migrations on RDS (one-time)

Backend runs `prisma migrate deploy` on startup. If RDS is **empty**, migrations apply automatically. If you already created tables (e.g. via `db push`), either use a fresh RDS database or [baseline](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baselining) and then use migrations.

---

## Production env vars (reference)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (RDS or postgres container) |
| `JWT_SECRET` | Yes | Strong random secret (e.g. `openssl rand -base64 32`) |
| `CORS_ORIGIN` | Yes | Exact frontend origin, e.g. `https://wallet.yourdomain.com` |
| `POSTGRES_PASSWORD` | Yes (Option A) | Used only when Postgres runs in Docker |
| `ETHEREUM_RPC_URL` | Recommended | Mainnet RPC (Alchemy, QuickNode, etc.) |
| `SEPOLIA_RPC_URL` | Optional | Testnet |
| `ALCHEMY_API_KEY` | Optional | Enables multiple chains + NFT indexing |

---

## Post-deploy checks

- [ ] `https://wallet.yourdomain.com` loads the app
- [ ] `https://wallet.yourdomain.com/api/health` returns `{"status":"ok"}`
- [ ] Sign up / Log in works
- [ ] Create wallet, view balance, send (testnet if possible)
- [ ] Check CloudWatch (or `docker compose logs`) for errors

---

## Troubleshooting

- **502 Bad Gateway**: Backend not up or nginx can’t reach it. Check `docker compose logs backend` and that port 3000 is listening.
- **CORS errors**: Set `CORS_ORIGIN` to the exact URL (scheme + host, no path). Restart backend after changing.
- **Database connection failed**: Check security group (EC2 → RDS 5432), and that `DATABASE_URL` uses the RDS endpoint and correct password.
- **Migrations fail**: Ensure DB is empty for first deploy, or baseline existing DB before using `prisma migrate deploy`.

---

## Quick reference: generate secrets

```bash
# JWT secret
openssl rand -base64 32

# Postgres password (Option A)
openssl rand -base64 24
```

Good luck with the launch.
