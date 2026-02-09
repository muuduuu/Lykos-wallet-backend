import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/register', async (request, reply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input', details: body.error.flatten() });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(body.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        password: hashed,
        name: body.data.name,
      },
    });

    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '7d' }
    );

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  });

  fastify.post('/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    const user = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (!user || !(await bcrypt.compare(body.data.password, user.password))) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '7d' }
    );

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  });

  fastify.get('/auth/me', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId } = (request as { user: { userId: string } }).user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    return reply.send(user);
  });
}
