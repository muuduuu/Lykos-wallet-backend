import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

export async function chainRoutes(fastify: FastifyInstance) {
  fastify.get('/chains', async (_request, reply) => {
    const chains = Object.entries(config.chains).map(([id, chain]) => ({
      id: parseInt(id, 10),
      name: chain.name,
      symbol: chain.symbol,
      decimals: chain.decimals,
      explorer: chain.explorer,
    }));
    return reply.send({ chains });
  });
}
