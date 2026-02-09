import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createPublicClient, createWalletClient, http } from 'viem';
import { polygon, base, arbitrum, mainnet, sepolia, optimism } from 'viem/chains';
import { config } from '../config.js';
import { erc721Abi } from '../lib/abis.js';
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
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

async function resolveMetadata<T = unknown>(uri: string): Promise<T | null> {
  try {
    // Handle data:application/json;base64,... (inline JSON)
    if (uri.startsWith('data:application/json')) {
      const base64 = uri.replace(/^data:application\/json;base64,/, '');
      return JSON.parse(Buffer.from(base64, 'base64').toString()) as T;
    }
    if (uri.startsWith('data:application/json,')) {
      return JSON.parse(decodeURIComponent(uri.replace(/^data:application\/json,/, ''))) as T;
    }
    // HTTP/IPFS
    const url = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    const res = await fetch(url);
    return res.ok ? (res.json() as Promise<T>) : null;
  } catch {
    return null;
  }
}

const ALCHEMY_NFT_CHAINS: Record<number, string> = {
  1: 'eth-mainnet',
  10: 'opt-mainnet',
  137: 'polygon-mainnet',
  8453: 'base-mainnet',
  42161: 'arb-mainnet',
  11155111: 'eth-sepolia',
};

export async function nftRoutes(fastify: FastifyInstance) {
  // Get ALL NFTs for address (Alchemy API - one place, all collections)
  fastify.get('/:chainId/all', async (request, reply) => {
    const params = z.object({
      chainId: z.coerce.number(),
      address: z.string(),
      pageSize: z.coerce.number().optional().default(100),
      pageKey: z.string().optional(),
    }).safeParse({ ...(request.params as object), ...(request.query as object) });
    if (!params.success) return reply.status(400).send({ error: 'Invalid params' });

    const { chainId, address, pageSize, pageKey } = params.data;
    const apiKey = config.alchemyApiKey;
    const alchemyChain = ALCHEMY_NFT_CHAINS[chainId];

    if (!apiKey || !alchemyChain) {
      return reply.status(400).send({
        error: 'All-NFTs view requires ALCHEMY_API_KEY in .env. Add your free key from alchemy.com',
        fallback: 'Use "Search by contract" below to view NFTs per collection',
      });
    }

    try {
      const url = new URL(`https://${alchemyChain}.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner`);
      url.searchParams.set('owner', address);
      url.searchParams.set('pageSize', String(pageSize));
      if (pageKey) url.searchParams.set('pageKey', pageKey);
      url.searchParams.set('excludeFilters[]', 'SPAM');
      url.searchParams.set('excludeFilters[]', 'AIRDROPS');

      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.text();
        fastify.log.error({ status: res.status, err });
        return reply.status(res.status).send({ error: 'NFT API request failed', details: err });
      }

      const data = (await res.json()) as {
        ownedNfts?: Array<{
          contract: { address: string; name?: string };
          tokenId: string;
          name?: string;
          description?: string;
          image?: { cachedUrl?: string; originalUrl?: string };
          media?: Array<{ gateway?: string; raw?: string }>;
        }>;
        pageKey?: string;
        totalCount?: number;
      };

      const nfts = (data.ownedNfts || []).map((n) => ({
        contractAddress: n.contract?.address,
        contractName: n.contract?.name || null,
        tokenId: n.tokenId,
        name: n.name || `#${n.tokenId}`,
        description: n.description || null,
        image: n.image?.cachedUrl || n.image?.originalUrl || n.media?.[0]?.gateway || null,
      }));

      return reply.send({
        nfts,
        pageKey: data.pageKey || null,
        totalCount: data.totalCount ?? nfts.length,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Failed to fetch NFTs' });
    }
  });

  // Get ERC-721 NFTs owned by address (single contract - fallback)
  fastify.get('/:chainId/owned', async (request, reply) => {
    const params = z.object({
      chainId: z.coerce.number(),
      address: z.string(),
      contractAddress: z.string(),
      limit: z.coerce.number().optional().default(50),
    }).safeParse({ ...(request.params as object), ...(request.query as object) });
    if (!params.success) return reply.status(400).send({ error: 'Invalid params' });

    const { chainId, address, contractAddress, limit } = params.data;
    const client = getClient(chainId);
    if (!client) return reply.status(400).send({ error: 'Unsupported chain' });

    try {
      const balance = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      const count = Number(balance);
      const tokenIds: string[] = [];
      for (let i = 0; i < Math.min(count, limit); i++) {
        const id = await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: erc721Abi,
          functionName: 'tokenOfOwnerByIndex',
          args: [address as `0x${string}`, BigInt(i)],
        });
        tokenIds.push(id.toString());
      }

      const nfts = await Promise.all(
        tokenIds.map(async (tokenId) => {
          let tokenURI = '';
          try {
            tokenURI = await client.readContract({
              address: contractAddress as `0x${string}`,
              abi: erc721Abi,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
            });
          } catch {
            tokenURI = '';
          }

          let metadata: { name?: string; description?: string; image?: string } | null = null;
          if (tokenURI) {
            metadata = await resolveMetadata(tokenURI);
            if (metadata?.image && typeof metadata.image === 'string') {
              const img = metadata.image;
              if (img.startsWith('ipfs://')) metadata.image = img.replace('ipfs://', 'https://ipfs.io/ipfs/');
              else if (img.startsWith('data:')) metadata.image = img; // inline base64
            }
          }

          return {
            tokenId,
            tokenURI,
            name: metadata?.name || `#${tokenId}`,
            description: metadata?.description || '',
            image: metadata?.image || null,
          };
        })
      );

      return reply.send({
        contractAddress,
        total: count,
        nfts,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Failed to fetch NFTs' });
    }
  });

  // Get NFT metadata by contract + tokenId
  fastify.get('/:chainId/metadata', async (request, reply) => {
    const params = z.object({
      chainId: z.coerce.number(),
      contractAddress: z.string(),
      tokenId: z.string(),
    }).safeParse({ ...(request.params as object), ...(request.query as object) });
    if (!params.success) return reply.status(400).send({ error: 'Invalid params' });

    const { chainId, contractAddress, tokenId } = params.data;
    const client = getClient(chainId);
    if (!client) return reply.status(400).send({ error: 'Unsupported chain' });

    try {
      const tokenURI = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)],
      });

      const metadata = await resolveMetadata<{ name?: string; description?: string; image?: string }>(tokenURI);
      const image = metadata?.image
        ? (metadata.image as string).replace('ipfs://', 'https://ipfs.io/ipfs/')
        : null;

      return reply.send({
        tokenId,
        tokenURI,
        name: metadata?.name || `#${tokenId}`,
        description: metadata?.description || '',
        image,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Failed to fetch metadata' });
    }
  });

  // Transfer ERC-721 NFT (requires auth)
  fastify.post('/:chainId/transfer', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = z.object({
      walletId: z.string(),
      password: z.string(),
      contractAddress: z.string(),
      to: z.string(),
      tokenId: z.string(),
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
        abi: erc721Abi,
        functionName: 'safeTransferFrom',
        args: [
          wallet.address as `0x${string}`,
          body.data.to as `0x${string}`,
          BigInt(body.data.tokenId),
        ],
      });

      return reply.send({ hash });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Transfer failed' });
    }
  });
}
