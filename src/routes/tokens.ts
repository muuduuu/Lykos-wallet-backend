import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPublicClient, createWalletClient as createViemWalletClient, http } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { polygon, base, arbitrum, mainnet, sepolia, optimism } from 'viem/chains';
import type { Chain } from 'viem';
import { config } from '../config.js';
import { erc20Abi } from '../lib/abis.js';
import { decrypt } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';

const chains: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  137: polygon,
  8453: base,
  42161: arbitrum,
  11155111: sepolia,
};

function getClient(chainId: number) {
  const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
  const chain = chains[chainId];
  if (!rpcUrl || !chain) return null;
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export async function tokenRoutes(fastify: FastifyInstance) {
  // Get ERC-20 token balance
  fastify.get('/:chainId/balance', async (request, reply) => {
    const params = z.object({ chainId: z.coerce.number(), address: z.string(), tokenAddress: z.string() }).safeParse({
      ...(request.params as object),
      ...(request.query as object),
    });
    if (!params.success) return reply.status(400).send({ error: 'Invalid params' });

    const { chainId, address, tokenAddress } = params.data;
    const client = getClient(chainId);
    if (!client) return reply.status(400).send({ error: 'Unsupported chain' });

    try {
      const [balance, decimals, symbol, name] = await Promise.all([
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        }),
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'decimals',
        }).catch(() => 18),
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'symbol',
        }).catch(() => '???'),
        client.readContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'name',
        }).catch(() => 'Unknown'),
      ]);

      return reply.send({
        balance: balance.toString(),
        decimals,
        symbol,
        name,
        formatted: formatUnits(balance, decimals),
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Failed to fetch balance' });
    }
  });

  // Get multiple ERC-20 token balances for an address
  fastify.post('/:chainId/balances', async (request, reply) => {
    const params = z.object({
      chainId: z.coerce.number(),
      address: z.string(),
      tokenAddresses: z.array(z.string()),
    }).safeParse({ ...(request.params as object), ...(request.body as object) });
    if (!params.success) return reply.status(400).send({ error: 'Invalid params' });

    const { chainId, address, tokenAddresses } = params.data;
    const client = getClient(chainId);
    if (!client) return reply.status(400).send({ error: 'Unsupported chain' });

    try {
      const results = await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          try {
            const [balance, decimals, symbol] = await Promise.all([
              client!.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
              }),
              client!.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'decimals',
              }).catch(() => 18),
              client!.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'symbol',
              }).catch(() => '???'),
            ]);
            return {
              tokenAddress,
              balance: balance.toString(),
              decimals,
              symbol,
              formatted: formatUnits(balance, decimals),
            };
          } catch {
            return { tokenAddress, balance: '0', decimals: 18, symbol: '???', formatted: '0', error: true };
          }
        })
      );
      return reply.send({ tokens: results });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Failed to fetch balances' });
    }
  });

  // Transfer ERC-20 token (requires auth)
  fastify.post('/:chainId/transfer', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = z.object({
      walletId: z.string(),
      password: z.string(),
      tokenAddress: z.string(),
      to: z.string(),
      amount: z.string(),
    }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid input' });

    const chainId = parseInt((request.params as { chainId: string }).chainId, 10);
    const rpcUrl = config.rpcUrls[chainId as keyof typeof config.rpcUrls];
    const chain = chains[chainId];
    if (!rpcUrl || !chain) return reply.status(400).send({ error: 'Unsupported chain' });

    const { userId } = (request as { user: { userId: string } }).user;
    const wallet = await prisma.wallet.findFirst({
      where: { id: body.data.walletId, userId },
    });
    if (!wallet) return reply.status(404).send({ error: 'Wallet not found' });

    try {
      const decrypted = decrypt(wallet.encryptedKey, body.data.password, wallet.salt);
      const { mnemonicToAccount, privateKeyToAccount } = await import('viem/accounts');

      let account;
      if (decrypted.startsWith('0x') && decrypted.length === 66) {
        account = privateKeyToAccount(decrypted as `0x${string}`);
      } else {
        account = mnemonicToAccount(decrypted);
      }

      const walletClient = createViemWalletClient({
        account,
        chain,
        transport: http(rpcUrl),
      });

      const publicClient = createPublicClient({
        chain,
        transport: http(rpcUrl),
      });

      const decimals = await publicClient.readContract({
        address: body.data.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals',
      });
      const value = parseUnits(body.data.amount, decimals);

      const hash = await walletClient.writeContract({
        address: body.data.tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [body.data.to as `0x${string}`, value],
      });

      return reply.send({ hash });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Transfer failed' });
    }
  });
}
