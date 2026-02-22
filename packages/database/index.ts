import {
  PrismaClient,
  TransactionType,
  BetType,
  BetSelection,
  BetStatus,
  MatchStatus,
  FightingGame,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

export const prisma =
  globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Explicit re-exports to avoid export * on CJS module in bundlers
export {
  PrismaClient,
  TransactionType,
  BetType,
  BetSelection,
  BetStatus,
  MatchStatus,
  FightingGame,
};
export type { Prisma, Transaction, Match, Tournament, Player, OddsSnapshot, Bet, User } from '@prisma/client';
