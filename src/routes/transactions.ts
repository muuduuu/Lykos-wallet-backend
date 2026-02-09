import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function transactionRoutes(app: FastifyInstance) {
  app.get("/wallets/:id/transactions", { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = (req as { user?: { userId?: string } }).user;
    const userId = user?.userId;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });
    const { id } = req.params as { id: string };
    const w = await prisma.wallet.findFirst({
      where: { id, userId },
    });
    if (!w) return reply.status(404).send({ error: "Wallet not found" });
    const transactions = await prisma.transaction.findMany({
      where: { walletId: w.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        hash: true,
        to: true,
        value: true,
        chainId: true,
        status: true,
        createdAt: true,
      },
    });
    const list = transactions.map((t) => ({
      ...t,
      fromAddress: w.address,
      direction: "out" as const,
    }));
    return reply.send({ transactions: list });
  });
}
