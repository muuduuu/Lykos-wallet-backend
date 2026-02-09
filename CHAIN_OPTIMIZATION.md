# Chain optimization & cost control

This doc covers how to **reduce RPC and server costs** using QuickNode, Etherscan, and fewer chains.

---

## 1. Use QuickNode for RPC (you have Premium)

**Do not run your own nodes.** Use QuickNode (or Alchemy, Infura) for all RPC.

Set env vars to your **QuickNode HTTPS endpoints**:

```env
# QuickNode: create endpoints per chain in dashboard, then set:
MAINNET_RPC_URL=https://your-mainnet-endpoint.quiknode.pro/...
SEPOLIA_RPC_URL=https://your-sepolia-endpoint.quiknode.pro/...
# Only add RPC URLs for chains you enable (see ENABLED_CHAINS)
POLYGON_RPC_URL=https://...
BASE_RPC_URL=https://...
ARBITRUM_RPC_URL=https://...
OPTIMISM_RPC_URL=https://...
```

Use **only the chains you need**. Unused chains = unused RPC quota.

---

## 2. Limit enabled chains (`ENABLED_CHAINS`)

By default only **Ethereum mainnet (1)** and **Sepolia (11155111)** are enabled.  
All other chains (Polygon, Base, Arbitrum, etc.) are **disabled** unless you add them.

```env
# Default: mainnet + Sepolia
ENABLED_CHAINS=1,11155111

# Add more only if you need them:
ENABLED_CHAINS=1,11155111,137,8453
```

- **Dev/staging:** `1,11155111` (mainnet + Sepolia) is usually enough.
- **Prod:** Enable only chains your app actually uses.
- Disabled chains are excluded from `/api/info` and from send/tx flows.  
  **Server cost:** fewer chains → fewer RPC calls and less logic.

---

## 3. Use Etherscan API for read-only data (optional)

For **tx history, balances, contract reads** you can use **Etherscan-style APIs** instead of RPC.  
That saves QuickNode RPC quota.

```env
ETHERSCAN_API_KEY=YourEtherscanApiKey
```

Get a key: [Etherscan API](https://etherscan.io/apis).  
Etherscan-compatible APIs exist for many chains (Polygonscan, Basescan, etc.).

When `ETHERSCAN_API_KEY` is set, the app can prefer Etherscan for:

- Transaction history by address
- Token balances
- Contract `eth_call`-style reads

RPC remains used for **sending txs**, **gas estimation**, and **broadcast**.

---

## 4. Server cost tips

- **Run minimal services:** Use `dev:minimal`-style setup (gateway + ID + DB + Redis).  
  Turn off paymaster, g0, alias, recovery if you don’t need them.

- **Single instance:** Run API + workers on one box when traffic is low.  
  Scale out only when needed.

- **DB + Redis:** Use managed Postgres and Redis (e.g. Railway, Render, Supabase).  
  Avoid self-hosting DB unless you have ops capacity.

- **No self-hosted nodes:** Always use QuickNode / Alchemy / Infura.  
  Node infra is what tends to make “server cost shit high.”

---

## 5. Quick reference

| Env var            | Purpose                                      |
|--------------------|----------------------------------------------|
| `ENABLED_CHAINS`   | Comma-separated chain IDs. Default `1,11155111`. |
| `MAINNET_RPC_URL`  | QuickNode mainnet (or other provider).       |
| `SEPOLIA_RPC_URL`  | QuickNode Sepolia.                           |
| `ETHERSCAN_API_KEY`| Optional. Use for reads to save RPC.         |

Fewer chains + QuickNode for RPC + Etherscan for reads = **lower cost** and **production-ready** setup.
