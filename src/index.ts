import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { walletRoutes } from './routes/wallets.js';
import { rpcRoutes } from './routes/rpc.js';
import { chainRoutes } from './routes/chains.js';
import { tokenRoutes } from './routes/tokens.js';
import { nftRoutes } from './routes/nfts.js';
import { erc1155Routes } from './routes/erc1155.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

const fastify = Fastify({ logger: true });

fastify.register(helmet, { contentSecurityPolicy: false });
fastify.register(rateLimit, {
  max: config.isProd ? 100 : 1000,
  timeWindow: '1 minute',
});
fastify.register(cors, {
  origin: config.corsOrigins,
  credentials: true,
});
fastify.register(jwt, { secret: config.jwtSecret });

fastify.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Global error handler: log and return 500 with message so we can debug
fastify.setErrorHandler((err, request, reply) => {
  fastify.log.error({ err, url: request.url, method: request.method });
  const message = err?.message || 'Internal Server Error';
  const statusCode = (err as { statusCode?: number })?.statusCode ?? 500;
  return reply.status(statusCode).send({
    error: message,
    ...(config.nodeEnv === 'development' && { stack: (err as Error).stack }),
  });
});

fastify.register(authRoutes);
fastify.register(walletRoutes);
fastify.register(rpcRoutes);
fastify.register(chainRoutes);
fastify.register(tokenRoutes, { prefix: '/tokens' });
fastify.register(nftRoutes, { prefix: '/nfts' });
fastify.register(erc1155Routes, { prefix: '/erc1155' });

fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

async function start() {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Lykos Wallet API running at http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
