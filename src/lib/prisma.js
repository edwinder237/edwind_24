import { PrismaClient } from '@prisma/client';
import { softDeleteMiddleware } from './prisma/softDelete.js';

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  const client = new PrismaClient();
  client.$use(softDeleteMiddleware);
  globalForPrisma.prisma = client;
}

const prisma = globalForPrisma.prisma;

export default prisma;
