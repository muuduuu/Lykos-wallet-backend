import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
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
