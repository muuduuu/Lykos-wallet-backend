# Extensibility Guide

## Adding New Cryptocurrencies/Chains

### Step 1: Add Chain Configuration

Edit `src/shared/chains/registry.ts`:

```typescript
export const CHAIN_REGISTRY: Record<number, ChainConfig> = {
  // ... existing chains ...
  
  // New chain example
  12345: {
    id: 12345,
    name: 'New Chain',
    network: 'newchain',
    nativeCurrency: { name: 'NEW', symbol: 'NEW', decimals: 18 },
    rpcUrl: process.env.NEWCHAIN_RPC_URL || 'https://rpc.newchain.io',
    blockExplorer: 'https://explorer.newchain.io',
    enabled: true,
    features: {
      erc4337: true, // or false
      bundler: process.env.NEWCHAIN_BUNDLER_URL,
      paymaster: process.env.NEWCHAIN_PAYMASTER_URL,
      entryPoint: '0x...', // ERC-4337 EntryPoint address
    },
  },
};
```

### Step 2: Add Viem Chain

If using viem, add chain definition:

```typescript
// In chainService.ts
import { defineChain } from 'viem';

const newChain = defineChain({
  id: 12345,
  name: 'New Chain',
  network: 'newchain',
  nativeCurrency: { name: 'NEW', symbol: 'NEW', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.newchain.io'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.newchain.io' },
  },
});

// Add to chainMap
ChainService.chainMap.set(12345, newChain);
```

### Step 3: Update Chain Service

The `ChainService` automatically picks up new chains from the registry. No changes needed if using standard EVM interface.

### Step 4: Add Native Tokens

Native tokens are automatically supported. No configuration needed.

### Step 5: Add ERC-20 Tokens

Edit `TOKEN_REGISTRY` in `src/shared/chains/registry.ts`:

```typescript
export const TOKEN_REGISTRY: TokenConfig[] = [
  // ... existing tokens ...
  
  {
    address: '0x...',
    chainId: 12345,
    name: 'New Token',
    symbol: 'NEW',
    decimals: 18,
    type: 'erc20',
    coingeckoId: 'new-token',
  },
];
```

## Supporting Non-EVM Chains

### Create Custom Chain Adapter

If the chain doesn't follow EVM standards, create a custom adapter:

```typescript
// src/shared/chains/adapters/customAdapter.ts
import { ChainAdapter } from '../adapter.js';

export class CustomChainAdapter implements ChainAdapter {
  // Implement all required methods
  getChainId(): number { /* ... */ }
  getPublicClient(): PublicClient { /* ... */ }
  // ... other methods
}
```

Update `ChainAdapterFactory`:

```typescript
static getAdapter(chainId: number, viemChain: Chain): ChainAdapter {
  // Custom chain detection
  if (chainId === CUSTOM_CHAIN_ID) {
    return new CustomChainAdapter(chainId);
  }
  
  // Default EVM adapter
  return new EVMChainAdapter(chainId, viemChain);
}
```

## Adding New Token Standards

### ERC-721 (NFTs)

The token registry already supports ERC-721. Add tokens with `type: 'erc721'`:

```typescript
{
  address: '0x...',
  chainId: 1,
  name: 'Cool NFT',
  symbol: 'COOL',
  decimals: 0,
  type: 'erc721',
}
```

### ERC-1155 (Multi-Token)

Similar to ERC-721, use `type: 'erc1155'`:

```typescript
{
  address: '0x...',
  chainId: 1,
  name: 'Multi Token',
  symbol: 'MT',
  decimals: 0,
  type: 'erc1155',
}
```

### Custom Token Standard

Extend `TokenConfig` interface and add handler in services:

```typescript
// In shared/types.ts
export interface TokenConfig {
  // ... existing fields ...
  type: 'native' | 'erc20' | 'erc721' | 'erc1155' | 'custom';
  customHandler?: string; // Handler identifier
}
```

## Adding New Services

### 1. Create Service Directory

```bash
mkdir -p src/services/new-service
```

### 2. Create Service Entry Point

```typescript
// src/services/new-service/index.ts
import Fastify from 'fastify';
import { config } from '../../shared/config.js';
import { errorHandler } from '../../shared/middleware/errorHandler.js';

const fastify = Fastify();

await fastify.register(cors);
fastify.setErrorHandler(errorHandler);

// Your routes here

const start = async () => {
  await fastify.listen({ 
    port: config.ports.newService,
    host: '0.0.0.0',
  });
};

start();
```

### 3. Add to API Gateway

```typescript
// In src/api-gateway/index.ts
fastify.register(async (fastify) => {
  fastify.all('/new-service/*', async (request, reply) => {
    const url = `http://localhost:${config.ports.newService}${request.url}`;
    return proxyRequest(url, request, reply);
  });
});
```

### 4. Update Configuration

Add port to `src/shared/config.ts`:

```typescript
ports: {
  // ... existing ports ...
  newService: parseInt(process.env.NEW_SERVICE_PORT || '3006'),
},
```

## Adding New API Endpoints

### With Validation

```typescript
import { validateRequest } from '../../shared/middleware/validation.js';
import { z } from 'zod';

const schema = z.object({
  field: z.string(),
  amount: z.string(),
});

fastify.post('/endpoint', {
  preHandler: validateRequest(schema),
}, async (request, reply) => {
  const { field, amount } = request.validated;
  // Handle request
});
```

### With Authentication

```typescript
fastify.post('/protected', {
  preHandler: [fastify.authenticate],
}, async (request, reply) => {
  const user = (request as any).user;
  // Handle request
});
```

## Adding Custom Error Types

```typescript
// In src/shared/errors.ts
export class CustomError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'CUSTOM_ERROR', details);
  }
}
```

## Extending Database Schema

### 1. Update Prisma Schema

```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  // ... fields ...
  createdAt DateTime @default(now())
}
```

### 2. Create Migration

```bash
npm run db:migrate dev --name add_new_model
```

### 3. Regenerate Client

```bash
npm run db:generate
```

## Configuration Management

### Environment Variables

Add to `.env.example`:

```env
NEW_FEATURE_ENABLED=true
NEW_SERVICE_URL=https://...
```

Add to `src/shared/config.ts`:

```typescript
export const config = {
  // ... existing config ...
  newFeature: {
    enabled: process.env.NEW_FEATURE_ENABLED === 'true',
    serviceUrl: process.env.NEW_SERVICE_URL || '',
  },
};
```

## Testing Extensions

### Unit Tests

```typescript
// src/services/new-service/new-service.test.ts
import { describe, it, expect } from 'vitest';

describe('NewService', () => {
  it('should handle requests', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test with actual chain interaction and database.

## Best Practices

1. **Type Safety**: Always use TypeScript types
2. **Validation**: Validate all inputs with Zod
3. **Error Handling**: Use custom error types
4. **Logging**: Log important events
5. **Documentation**: Document new features
6. **Testing**: Write tests for new code
7. **Backward Compatibility**: Maintain API compatibility

## Examples

See `examples/` directory for:
- Custom chain adapter example
- New service example
- Token handler example
- Webhook integration example
