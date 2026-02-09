import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPublicClient, createWalletClient, http } from 'viem';
import { polygon, base, arbitrum, mainnet, sepolia, optimism } from 'viem/chains';
import { config } from '../config.js';
import { erc1155Abi } from '../lib/abis.js';
import { decrypt } from '../lib/crypto.js';
import { prisma } from '../lib/prisma.js';
import type { Chain } from 'viem';

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
  return createPublicClient({ chain, transport: http(rpcUrl) });
}

export async function erc1155Routes(fastify: FastifyInstance) {
  // Get ERC-1155 token balance
  fastify.get('/:chainId/balance', async (request, reply) => {
    const params = z.object({
      chainId: z.coerce.number(),
      address: z.string(),
      contractAddress: z.string(),
      tokenId: z.string(),
    }).safeParse({ ...(request.params as object), ...(request.query as object) });
    if (!params.success) return reply.status(400).send({ error: 'Invalid params' });

    const { chainId, address, contractAddress, tokenId } = params.data;
    const client = getClient(chainId);
    if (!client) return reply.status(400).send({ error: 'Unsupported chain' });

    try {
      const balance = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`, BigInt(tokenId)],
      });
      return reply.send({ balance: balance.toString(), tokenId });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Failed to fetch balance' });
    }
  });

  // Transfer ERC-1155 token (requires auth)
  fastify.post('/:chainId/transfer', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = z.object({
      walletId: z.string(),
      password: z.string(),
      contractAddress: z.string(),
      to: z.string(),
      tokenId: z.string(),
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

      const walletClient = createWalletClient({
        account,
        chain,
        transport: http(rpcUrl),
      });

      const hash = await walletClient.writeContract({
        address: body.data.contractAddress as `0x${string}`,
        abi: erc1155Abi,
        functionName: 'safeTransferFrom',
        args: [
          wallet.address as `0x${string}`,
          body.data.to as `0x${string}`,
          BigInt(body.data.tokenId),
          BigInt(body.data.amount),
          '0x' as `0x${string}`,
        ],
      });

      return reply.send({ hash });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Transfer failed' });
    }
  });
}
