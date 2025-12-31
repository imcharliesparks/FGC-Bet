import {
  PrismaClient,
  TransactionType,
  BetType,
  BetSelection,
  BetStatus,
  MatchStatus,
  FightingGame,
} from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

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
