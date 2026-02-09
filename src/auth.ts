import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerAuth(app: FastifyInstance, jwtSecret: string) {
  await app.register(await import("@fastify/jwt"), {
    secret: jwtSecret,
    sign: { expiresIn: "7d" },
  });
}

export type JWTPayload = { sub: string; email: string };
