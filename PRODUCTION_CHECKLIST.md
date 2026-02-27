# Launch day checklist — Lykos Wallet

Use this the day you push to production.

## Before deploy

- [ ] **Secrets**: `JWT_SECRET` and `POSTGRES_PASSWORD` (or RDS password) generated with `openssl rand -base64 32`
- [ ] **CORS**: `CORS_ORIGIN` set to your exact frontend URL, e.g. `https://wallet.yourdomain.com` (no trailing slash)
- [ ] **Database**: Either RDS created (Option B) or use Docker Postgres (Option A)
- [ ] **RPC**: At least `ETHEREUM_RPC_URL` set (Alchemy/QuickNode key)
- [ ] **Domain**: DNS points to your ALB or EC2

## Deploy (Option A — single EC2)

```bash
# On EC2
git pull
# Edit .env: POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGIN, RPC URLs
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

## Deploy (Option B — EC2 + RDS)

```bash
# On EC2, .env has DATABASE_URL (RDS), JWT_SECRET, CORS_ORIGIN
docker compose -f docker-compose.aws.yml up -d --build
docker compose -f docker-compose.aws.yml logs -f
```

## After deploy

- [ ] Open `https://your-domain` — app loads
- [ ] Open `https://your-domain/api/health` — `{"status":"ok"}`
- [ ] Register a test account
- [ ] Log in, create wallet, check balance
- [ ] Check logs for errors: `docker compose -f docker-compose.prod.yml logs backend`

## If something breaks

- **Can’t reach DB**: Check security groups (EC2 → RDS 5432 or local postgres container).
- **CORS errors**: Set `CORS_ORIGIN` exactly (https + domain), restart backend.
- **500 on login/register**: Check backend logs; ensure DATABASE_URL and JWT_SECRET are set.

Full steps: see **DEPLOYMENT_AWS.md**.
