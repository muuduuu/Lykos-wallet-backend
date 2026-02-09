import { FastifyInstance } from 'fastify';
import { createPublicClient, fallback, http } from 'viem';
import { mainnet, sepolia, polygon, base, arbitrum, optimism } from 'viem/chains';
import { config } from '../config.js';

import type { Chain } from 'viem';
const chains: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  137: polygon,
  8453: base,
  42161: arbitrum,
  11155111: sepolia,
};

// Fallback RPC URLs when primary fails (rate limits, downtime)
const ETH_FALLBACK_RPCS = [
  'https://cloudflare-eth.com',
  'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
  'https://eth.llamarpc.com',
  'https://1rpc.io/eth',
];
const getEthTransport = () => {
  const primary = config.rpcUrls[1];
  const urls = primary ? [primary, ...ETH_FALLBACK_RPCS.filter((u) => u !== primary)] : ETH_FALLBACK_RPCS;
  return fallback(urls.map((url) => http(url, { timeout: 8_000 })));
};

export async function rpcRoutes(fastify: FastifyInstance) {
  // Get balance
  fastify.get('/rpc/:chainId/balance/:address', async (request, reply) => {
    const chainId = parseInt((request.params as { chainId: string }).chainId, 10);
    const address = (request.params as { address: string }).address as `0x${string}`;

    const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
    const chain = chains[chainId];
    if (!rpcUrl || !chain) {
      return reply.status(400).send({ error: 'Unsupported chain' });
    }

    try {
      const client = createPublicClient({
        chain,
        transport: chainId === 1 ? getEthTransport() : http(rpcUrl),
      });
      const balance = await client.getBalance({ address });
      return reply.send({ balance: balance.toString(), wei: balance.toString() });
    } catch (err: any) {
      fastify.log.error(err);
      const msg = err?.message || err?.shortMessage || 'Failed to fetch balance';
      return reply.status(500).send({ error: msg });
    }
  });

  // Get gas price
  fastify.get('/rpc/:chainId/gas', async (request, reply) => {
    const chainId = parseInt((request.params as { chainId: string }).chainId, 10);
    const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
    const chain = chains[chainId];
    if (!rpcUrl || !chain) {
      return reply.status(400).send({ error: 'Unsupported chain' });
    }

    try {
      const client = createPublicClient({
        chain,
        transport: chainId === 1 ? getEthTransport() : http(rpcUrl),
      });
      const [gasPrice, block] = await Promise.all([
        client.getGasPrice(),
        client.getBlock(),
      ]);
      return reply.send({
        gasPrice: gasPrice.toString(),
        maxFeePerGas: block?.baseFeePerGas ? (block.baseFeePerGas * BigInt(2)).toString() : gasPrice.toString(),
        maxPriorityFeePerGas: (BigInt(1e9)).toString(), // 1 gwei
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch gas' });
    }
  });

  // Send raw transaction
  fastify.post('/rpc/:chainId/send', async (request, reply) => {
    const chainId = parseInt((request.params as { chainId: string }).chainId, 10);
    const body = request.body as { signedTx: string };
    const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
    if (!rpcUrl || !body?.signedTx) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [body.signedTx],
          id: 1,
        }),
      });
      const data = await res.json() as { error?: { message: string }; result?: string };
      if (data.error) {
        return reply.status(400).send({ error: data.error.message || 'Transaction failed' });
      }
      return reply.send({ hash: data.result });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        error: err?.message || 'Transaction failed',
      });
    }
  });

  // Generic RPC proxy (for eth_call, etc.)
  fastify.post('/rpc/:chainId', async (request, reply) => {
    const chainId = parseInt((request.params as { chainId: string }).chainId, 10);
    const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
    if (!rpcUrl) return reply.status(400).send({ error: 'Unsupported chain' });

    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.body),
      });
      const data = await res.json();
      return reply.send(data);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'RPC request failed' });
    }
  });
}
