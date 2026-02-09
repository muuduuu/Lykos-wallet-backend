import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { mnemonicToAccount, generateMnemonic, privateKeyToAccount, english } from 'viem/accounts';

const createWalletSchema = z.object({
  password: z.string().min(8),
  name: z.string().optional(),
});

const importWalletSchema = z.object({
  mnemonic: z.string().optional(),
  privateKey: z.string().optional(),
  password: z.string().min(8),
  name: z.string().optional(),
}).refine((d) => d.mnemonic || d.privateKey, { message: 'Provide mnemonic or privateKey' });

const unlockSchema = z.object({
  walletId: z.string(),
  password: z.string(),
});

export async function walletRoutes(fastify: FastifyInstance) {
  // Create new wallet
  fastify.post('/wallets/create', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = createWalletSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() });
    }

    const { userId } = (request as { user: { userId: string } }).user;

    const mnemonic = generateMnemonic(english);
    const account = mnemonicToAccount(mnemonic);

    const { encrypted, salt } = encrypt(mnemonic, body.data.password);

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        address: account.address,
        name: body.data.name || 'Main Wallet',
        encryptedKey: encrypted,
        salt,
      },
    });

    return reply.send({
      wallet: {
        id: wallet.id,
        address: wallet.address,
        name: wallet.name,
      },
      mnemonic, // Return once - user must save this!
    });
  });

  // Import wallet
  fastify.post('/wallets/import', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = importWalletSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() });
    }

    const { userId } = (request as { user: { userId: string } }).user;

    let account;
    let toEncrypt: string;

    if (body.data.mnemonic) {
      account = mnemonicToAccount(body.data.mnemonic.trim());
      toEncrypt = body.data.mnemonic.trim();
    } else if (body.data.privateKey) {
      const pk = (body.data.privateKey.startsWith('0x') ? body.data.privateKey : `0x${body.data.privateKey}`) as `0x${string}`;
      account = privateKeyToAccount(pk);
      toEncrypt = pk;
    } else {
      return reply.status(400).send({ error: 'Provide mnemonic or privateKey' });
    }

    const existing = await prisma.wallet.findUnique({
      where: { userId_address: { userId, address: account.address } },
    });
    if (existing) {
      return reply.status(400).send({ error: 'Wallet already imported' });
    }

    const { encrypted, salt } = encrypt(toEncrypt, body.data.password);

    const wallet = await prisma.wallet.create({
      data: {
        userId,
        address: account.address,
        name: body.data.name || 'Imported Wallet',
        encryptedKey: encrypted,
        salt,
      },
    });

    return reply.send({
      wallet: { id: wallet.id, address: wallet.address, name: wallet.name },
    });
  });

  // Unlock wallet (get decrypted key for signing - frontend use)
  fastify.post('/wallets/unlock', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const body = unlockSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    const { userId } = (request as { user: { userId: string } }).user;

    const wallet = await prisma.wallet.findFirst({
      where: { id: body.data.walletId, userId },
    });
    if (!wallet) return reply.status(404).send({ error: 'Wallet not found' });

    try {
      const decrypted = decrypt(wallet.encryptedKey, body.data.password, wallet.salt);
      const isPrivateKey = decrypted.startsWith('0x') && decrypted.length === 66;
      return reply.send({
        address: wallet.address,
        mnemonic: isPrivateKey ? undefined : decrypted,
        privateKey: isPrivateKey ? decrypted : undefined,
      });
    } catch {
      return reply.status(401).send({ error: 'Invalid password' });
    }
  });

  // List wallets
  fastify.get('/wallets', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = (request as { user: { userId: string } }).user;
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true, address: true, name: true, createdAt: true },
    });
    return reply.send({ wallets });
  });

  // Get wallet transactions
  fastify.get('/wallets/:id/transactions', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = (request as { user: { userId: string } }).user;
    const { id } = request.params as { id: string };
    const wallet = await prisma.wallet.findFirst({
      where: { id, userId },
    });
    if (!wallet) return reply.status(404).send({ error: 'Wallet not found' });

    const txs = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reply.send({ transactions: txs });
  });

  // Record transaction (called after successful send)
  fastify.post('/wallets/:id/transactions', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = (request as { user: { userId: string } }).user;
    const { id } = request.params as { id: string };
    const body = z.object({
      hash: z.string(),
      chainId: z.number(),
      type: z.enum(['send', 'receive']),
      from: z.string(),
      to: z.string(),
      value: z.string(),
      tokenSymbol: z.string().optional(),
      tokenAddress: z.string().optional(),
      blockNumber: z.number().optional(),
    }).parse(request.body);

    const wallet = await prisma.wallet.findFirst({
      where: { id, userId },
    });
    if (!wallet) return reply.status(404).send({ error: 'Wallet not found' });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        ...body,
        status: 'confirmed',
      },
    });
    return reply.send({ ok: true });
  });
}
