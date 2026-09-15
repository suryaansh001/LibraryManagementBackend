import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Query: ${e.sql} | Params: ${e.params}`);
  }
});

export default prisma;
