import { PrismaClient } from '@prisma/client'

// PrismaClient est attaché au scope global en développement pour éviter
// d'épuiser les connexions de la base de données pendant le rechargement à chaud
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?connection_limit=20&pool_timeout=60",
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;